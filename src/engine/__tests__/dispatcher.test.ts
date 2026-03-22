import { describe, it, expect } from 'vitest';
import { Dispatcher } from '../dispatcher';

describe('Dispatcher', () => {
  it('should not exceed max concurrent processes', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 2 });
    expect(dispatcher.availableSlots()).toBe(2);
  });

  it('should build correct Claude Code command', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 3 });
    const cmd = dispatcher.buildCommand({
      systemPrompt: 'You are Dex...',
      taskPrompt: 'Build auth middleware',
      cwd: '/tmp/worktree-dex',
      maxTurns: 50,
    });
    // Command is either 'claude', a path to claude.exe, or node (when using cli.js)
    expect(cmd.command).toBeTruthy();
    expect(cmd.args).toContain('--print');
    expect(cmd.args).toContain('--output-format');
    expect(cmd.args).toContain('stream-json');
    expect(cmd.args).toContain('--verbose');
    expect(cmd.args).toContain('--dangerously-skip-permissions');
    expect(cmd.args).toContain('--max-turns');
    expect(cmd.args).toContain('50');
    // Task prompt is positional (last arg)
    expect(cmd.args[cmd.args.length - 1]).toBe('Build auth middleware');
  });

  it('should parse stream-json events from stdout', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 3 });

    const toolUse = '{"type":"tool_use","tool":"Edit","input":{"file":"auth.ts"}}';
    const event1 = dispatcher.parseStreamEvent(toolUse);
    expect(event1?.type).toBe('tool_use');
    expect(event1?.tool).toBe('Edit');

    const result = '{"type":"result","cost_usd":0.042,"duration_ms":12000,"turns":5}';
    const event2 = dispatcher.parseStreamEvent(result);
    expect(event2?.type).toBe('result');
    expect(event2?.cost_usd).toBe(0.042);
  });

  it('should handle invalid JSON lines gracefully', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 3 });
    const event = dispatcher.parseStreamEvent('not json at all');
    expect(event).toBeNull();
  });

  it('should map tool_use events to agent status', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 3 });
    expect(dispatcher.toolToStatus('Edit')).toBe('coding');
    expect(dispatcher.toolToStatus('Write')).toBe('coding');
    expect(dispatcher.toolToStatus('Bash')).toBe('testing');
    expect(dispatcher.toolToStatus('Read')).toBe('reviewing');
    expect(dispatcher.toolToStatus('Grep')).toBe('reviewing');
    expect(dispatcher.toolToStatus('Glob')).toBe('reviewing');
  });

  it('should track running processes count', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 3 });
    expect(dispatcher.runningCount()).toBe(0);
    expect(dispatcher.availableSlots()).toBe(3);
  });
});
