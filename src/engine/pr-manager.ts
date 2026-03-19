import { execSync } from 'child_process';

export class PRManager {
  branchName(agentId: string, taskSlug: string): string {
    return `sage/${agentId}/${taskSlug}`;
  }

  slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  worktreePath(agentId: string, taskId: string): string {
    return `.sage-team/worktrees/${agentId}-${taskId}`;
  }

  buildWorktreeAddCommand(agentId: string, taskId: string, taskSlug: string): string {
    const wtPath = this.worktreePath(agentId, taskId);
    const branch = this.branchName(agentId, taskSlug);
    return `git worktree add ${wtPath} -b ${branch}`;
  }

  buildMergeCommands(branch: string, commitMessage: string): string[] {
    return [
      `git merge --squash ${branch}`,
      `git commit -m "${commitMessage}"`,
    ];
  }

  buildCleanupCommands(worktreePath: string, branch: string): string[] {
    return [
      `git worktree remove ${worktreePath} --force`,
      `git branch -d ${branch}`,
    ];
  }

  buildPushCommand(branch: string): string {
    return `git push origin ${branch}`;
  }

  createWorktree(agentId: string, taskId: string, taskSlug: string, cwd: string): string {
    const cmd = this.buildWorktreeAddCommand(agentId, taskId, taskSlug);
    execSync(cmd, { cwd, stdio: 'pipe' });
    return this.worktreePath(agentId, taskId);
  }

  merge(branch: string, commitMessage: string, cwd: string): void {
    const cmds = this.buildMergeCommands(branch, commitMessage);
    for (const cmd of cmds) {
      execSync(cmd, { cwd, stdio: 'pipe' });
    }
  }

  cleanup(worktreePath: string, branch: string, cwd: string): void {
    const cmds = this.buildCleanupCommands(worktreePath, branch);
    for (const cmd of cmds) {
      try {
        execSync(cmd, { cwd, stdio: 'pipe' });
      } catch {
        // Cleanup errors are non-fatal
      }
    }
  }

  push(branch: string, cwd: string): void {
    execSync(this.buildPushCommand(branch), { cwd, stdio: 'pipe' });
  }
}
