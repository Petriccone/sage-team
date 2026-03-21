import { spawn, ChildProcess } from 'child_process';
import { execSync } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export interface DispatcherConfig {
  maxConcurrent: number;
}

export interface SpawnCommandInput {
  systemPrompt: string;
  taskPrompt: string;
  cwd: string;
  maxTurns: number;
}

export interface SpawnCommand {
  command: string;
  args: string[];
  cwd: string;
}

export interface StreamEvent {
  type: string;
  [key: string]: unknown;
}

export interface RunningProcess {
  agentId: string;
  taskId: string;
  process: ChildProcess;
  startedAt: number;
}

const TOOL_STATUS_MAP: Record<string, string> = {
  Edit: 'coding',
  Write: 'coding',
  Bash: 'testing',
  Read: 'reviewing',
  Grep: 'reviewing',
  Glob: 'reviewing',
  Agent: 'dispatching',
};

export class Dispatcher extends EventEmitter {
  private config: DispatcherConfig;
  private running: Map<string, RunningProcess> = new Map();
  private claudePath: string | null = null;

  constructor(config: DispatcherConfig) {
    super();
    this.config = config;
  }

  /** Find the claude executable — cache it for reuse */
  private findClaude(): string {
    if (this.claudePath) return this.claudePath;

    if (process.platform === 'win32') {
      // Prefer native .exe — does NOT need cmd.exe / shell: true
      const fs = require('fs');
      const exePaths = [
        path.join(process.env.USERPROFILE || '', '.local', 'bin', 'claude.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'claude', 'claude.exe'),
      ];
      for (const p of exePaths) {
        if (fs.existsSync(p)) { this.claudePath = p; return this.claudePath; }
      }

      // Fallback: try where command (which uses cmd.exe — may fail in MCP context)
      try {
        const lines = execSync('where claude.exe', { encoding: 'utf-8' }).trim().split('\n');
        const exeLine = lines.find((l: string) => l.trim().endsWith('.exe'));
        if (exeLine) { this.claudePath = exeLine.trim(); return this.claudePath; }
      } catch { /* continue */ }
    }

    // Unix or fallback
    this.claudePath = 'claude';
    return this.claudePath;
  }

  availableSlots(): number {
    return this.config.maxConcurrent - this.running.size;
  }

  runningCount(): number {
    return this.running.size;
  }

  buildCommand(input: SpawnCommandInput): SpawnCommand {
    const args = [
      '--print',
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--system-prompt', input.systemPrompt,
      '--max-turns', String(input.maxTurns),
      input.taskPrompt, // positional argument (last)
    ];

    return {
      command: this.findClaude(),
      args,
      cwd: input.cwd,
    };
  }

  parseStreamEvent(line: string): StreamEvent | null {
    try {
      return JSON.parse(line) as StreamEvent;
    } catch {
      return null;
    }
  }

  toolToStatus(toolName: string): string {
    return TOOL_STATUS_MAP[toolName] || 'thinking';
  }

  /** Extract human-readable detail from a tool_use event */
  extractToolDetail(event: StreamEvent): string {
    const input = event.input as any;
    if (!input) return '';
    const tool = event.tool as string;

    switch (tool) {
      case 'Edit':
      case 'Write':
      case 'Read': {
        const fp = input.file_path || input.path || '';
        const file = fp.split(/[/\\]/).pop() || fp;
        return file ? file : '';
      }
      case 'Bash': {
        const cmd = (input.command || '').slice(0, 80);
        return cmd;
      }
      case 'Grep':
      case 'Glob': {
        return input.pattern || input.glob || '';
      }
      default:
        return '';
    }
  }

  async spawnAgent(
    agentId: string,
    taskId: string,
    systemPrompt: string,
    taskPrompt: string,
    cwd: string,
    maxTurns: number = 50,
  ): Promise<void> {
    if (this.availableSlots() <= 0) {
      throw new Error('No available slots');
    }

    const cmd = this.buildCommand({ systemPrompt, taskPrompt, cwd, maxTurns });

    // Remove CLAUDECODE env var to allow spawning claude from MCP context
    const env = { ...process.env };
    delete (env as any).CLAUDECODE;

    const proc = spawn(cmd.command, cmd.args, {
      cwd: cmd.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    const runningProc: RunningProcess = {
      agentId,
      taskId,
      process: proc,
      startedAt: Date.now(),
    };
    this.running.set(taskId, runningProc);

    let buffer = '';

    proc.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete last line

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = this.parseStreamEvent(line);
        if (!event) continue;

        this.emit('stream-event', { agentId, taskId, event });

        if (event.type === 'tool_use' && event.tool) {
          const status = this.toolToStatus(event.tool as string);
          const detail = this.extractToolDetail(event);
          this.emit('agent-status', { agentId, status, tool: event.tool, detail });
        }

        if (event.type === 'assistant' && event.message) {
          // Claude's text output — narration from the agent
          const msg = event.message as any;
          if (msg.content) {
            const textBlocks = (Array.isArray(msg.content) ? msg.content : [msg.content])
              .filter((b: any) => b.type === 'text' || typeof b === 'string')
              .map((b: any) => typeof b === 'string' ? b : b.text)
              .join('');
            if (textBlocks.length > 0 && textBlocks.length < 500) {
              this.emit('agent-narration', { agentId, taskId, text: textBlocks.slice(0, 200) });
            }
          }
        }

        if (event.type === 'result') {
          this.emit('task-complete', {
            agentId,
            taskId,
            cost: event.cost_usd,
            duration: event.duration_ms,
            turns: event.turns,
            result: typeof event.result === 'string' ? event.result.slice(0, 300) : '',
          });
        }
      }
    });

    let stderrBuffer = '';
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
      this.emit('agent-error', { agentId, taskId, error: chunk.toString() });
    });

    proc.on('exit', (code) => {
      this.running.delete(taskId);
      if (code !== 0) {
        this.emit('agent-failed', { agentId, taskId, exitCode: code, stderr: stderrBuffer.slice(0, 500) });
      }
      this.emit('slot-freed', { availableSlots: this.availableSlots() });
    });
  }

  killAgent(taskId: string): boolean {
    const proc = this.running.get(taskId);
    if (!proc) return false;
    proc.process.kill('SIGTERM');
    this.running.delete(taskId);
    return true;
  }

  killAll(): void {
    for (const [taskId, proc] of this.running) {
      proc.process.kill('SIGTERM');
    }
    this.running.clear();
  }
}
