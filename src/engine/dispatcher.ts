import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

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

  constructor(config: DispatcherConfig) {
    super();
    this.config = config;
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
      '--system-prompt', input.systemPrompt,
      '--permission-mode', 'bypassPermissions',
      '--max-turns', String(input.maxTurns),
      input.taskPrompt, // positional argument (last)
    ];

    return {
      command: 'claude',
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
    const proc = spawn(cmd.command, cmd.args, {
      cwd: cmd.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env },
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
          this.emit('agent-status', { agentId, status });
        }

        if (event.type === 'result') {
          this.emit('task-complete', {
            agentId,
            taskId,
            cost: event.cost_usd,
            duration: event.duration_ms,
            turns: event.turns,
          });
        }
      }
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      this.emit('agent-error', { agentId, taskId, error: chunk.toString() });
    });

    proc.on('exit', (code) => {
      this.running.delete(taskId);
      if (code !== 0) {
        this.emit('agent-failed', { agentId, taskId, exitCode: code });
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
