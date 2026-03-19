import { describe, it, expect } from 'vitest';
import { PRManager } from '../pr-manager';

describe('PRManager', () => {
  it('should generate correct branch name', () => {
    const pm = new PRManager();
    expect(pm.branchName('dex', 'build-auth-middleware')).toBe('sage/dex/build-auth-middleware');
    expect(pm.branchName('flux', 'add-ui-components')).toBe('sage/flux/add-ui-components');
  });

  it('should generate slug from task title', () => {
    const pm = new PRManager();
    expect(pm.slugify('Build Auth Middleware')).toBe('build-auth-middleware');
    expect(pm.slugify('Implement JWT (v2)')).toBe('implement-jwt-v2');
    expect(pm.slugify('Fix bug #123 — urgent!')).toBe('fix-bug-123-urgent');
  });

  it('should build worktree add command', () => {
    const pm = new PRManager();
    const cmd = pm.buildWorktreeAddCommand('dex', 'task-abc', 'build-auth');
    expect(cmd).toContain('git worktree add');
    expect(cmd).toContain('.sage-team/worktrees/dex-task-abc');
    expect(cmd).toContain('sage/dex/build-auth');
  });

  it('should build worktree path', () => {
    const pm = new PRManager();
    expect(pm.worktreePath('dex', 'task-abc')).toBe('.sage-team/worktrees/dex-task-abc');
  });

  it('should build merge command', () => {
    const pm = new PRManager();
    const cmds = pm.buildMergeCommands('sage/dex/build-auth', '[sage:ceo] feat: add auth middleware');
    expect(cmds.length).toBe(2);
    expect(cmds[0]).toContain('git merge --squash');
    expect(cmds[1]).toContain('git commit');
    expect(cmds[1]).toContain('[sage:ceo]');
  });

  it('should build cleanup commands', () => {
    const pm = new PRManager();
    const cmds = pm.buildCleanupCommands('.sage-team/worktrees/dex-task-abc', 'sage/dex/build-auth');
    expect(cmds.length).toBe(2);
    expect(cmds[0]).toContain('git worktree remove');
    expect(cmds[1]).toContain('git branch -d');
  });
});
