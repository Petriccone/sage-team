import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Canonical skill ID → relative file path mapping.
 * sp- prefix = Superpowers, ag- prefix = Antigravity.
 */
const SP_SKILL_MAP: Record<string, string> = {
  'sp-brainstorming': 'brainstorming/brainstorming.md',
  'sp-tdd-cycle': 'test-driven-development/test-driven-development.md',
  'sp-tdd-red': 'test-driven-development/tdd-workflows/tdd-red.md',
  'sp-tdd-green': 'test-driven-development/tdd-workflows/tdd-green.md',
  'sp-tdd-refactor': 'test-driven-development/tdd-workflows/tdd-refactor.md',
  'sp-systematic-debugging': 'systematic-debugging/systematic-debugging.md',
  'sp-writing-plans': 'writing-plans/writing-plans.md',
  'sp-dispatching-parallel': 'dispatching-parallel-agents/dispatching-parallel-agents.md',
  'sp-verification': 'verification-before-completion/verification-before-completion.md',
  'sp-requesting-review': 'requesting-code-review/requesting-code-review.md',
  'sp-receiving-review': 'receiving-code-review/receiving-code-review.md',
  'sp-finishing-branch': 'finishing-a-development-branch/finishing-a-development-branch.md',
  'sp-subagent-dev': 'subagent-driven-development/subagent-driven-development.md',
  'sp-git-worktrees': 'using-git-worktrees/using-git-worktrees.md',
  'sp-writing-skills': 'writing-skills/writing-skills.md',
};

// Chars-per-token estimate for budget calculations
const CHARS_PER_TOKEN = 4;

export interface LoadedSkill {
  id: string;
  content: string;
  source: 'superpowers' | 'antigravity' | 'built-in';
  tokens: number; // estimated
}

export class SkillLoader {
  private superpowersPath: string | null = null;
  private antigravityPath: string | null = null;

  constructor() {
    this.superpowersPath = this.discoverSuperpowersPath();
    this.antigravityPath = this.discoverAntigravityPath();
  }

  getSuperpowersPath(): string | null {
    return this.superpowersPath;
  }

  getAntigravityPath(): string | null {
    return this.antigravityPath;
  }

  hasMapping(skillId: string): boolean {
    if (skillId.startsWith('sp-')) {
      return skillId in SP_SKILL_MAP;
    }
    if (skillId.startsWith('ag-')) {
      return true; // Antigravity uses convention-based resolution
    }
    return false;
  }

  resolveSkillPath(skillId: string): string | null {
    if (skillId.startsWith('sp-')) {
      const relativePath = SP_SKILL_MAP[skillId];
      if (!relativePath || !this.superpowersPath) return null;
      const fullPath = path.join(this.superpowersPath, relativePath);
      return fs.existsSync(fullPath) ? fullPath : null;
    }

    if (skillId.startsWith('ag-')) {
      if (!this.antigravityPath) return null;
      const name = skillId.slice(3); // remove 'ag-'
      // Convention: ag-{name} → skills/{name}/{name}.md or skills/{name}.md
      const dirPath = path.join(this.antigravityPath, name, `${name}.md`);
      if (fs.existsSync(dirPath)) return dirPath;
      const flatPath = path.join(this.antigravityPath, `${name}.md`);
      if (fs.existsSync(flatPath)) return flatPath;
      return null;
    }

    return null;
  }

  loadSkill(skillId: string): string | null {
    const skillPath = this.resolveSkillPath(skillId);
    if (!skillPath) return null;
    try {
      return fs.readFileSync(skillPath, 'utf-8');
    } catch {
      return null;
    }
  }

  loadSkillsForTask(skillIds: string[], tokenBudget: number): LoadedSkill[] {
    const loaded: LoadedSkill[] = [];
    let remainingBudget = tokenBudget;

    for (const id of skillIds) {
      const content = this.loadSkill(id);
      if (!content) continue;

      const estimatedTokens = Math.ceil(content.length / CHARS_PER_TOKEN);

      if (estimatedTokens > remainingBudget) {
        // Try to fit a truncated version if budget allows at least 1000 tokens
        if (remainingBudget >= 1000) {
          const truncatedContent = content.slice(0, remainingBudget * CHARS_PER_TOKEN);
          loaded.push({
            id,
            content: truncatedContent + '\n\n[... truncated to fit token budget]',
            source: this.getSource(id),
            tokens: remainingBudget,
          });
        }
        break;
      }

      loaded.push({
        id,
        content,
        source: this.getSource(id),
        tokens: estimatedTokens,
      });
      remainingBudget -= estimatedTokens;
    }

    return loaded;
  }

  private getSource(skillId: string): LoadedSkill['source'] {
    if (skillId.startsWith('sp-')) return 'superpowers';
    if (skillId.startsWith('ag-')) return 'antigravity';
    return 'built-in';
  }

  private discoverSuperpowersPath(): string | null {
    const homeDir = os.homedir();
    const searchPaths = [
      // Claude Code plugin cache (most common)
      path.join(homeDir, '.claude', 'plugins', 'cache', 'claude-plugins-official', 'superpowers'),
      // Direct install
      path.join(homeDir, '.superpowers', 'skills'),
      // NPM global
      path.join(homeDir, 'node_modules', 'superpowers', 'skills'),
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        // Check for versioned directories (e.g., 5.0.2/)
        if (searchPath.includes('plugins/cache')) {
          try {
            const versions = fs.readdirSync(searchPath).filter(f =>
              fs.statSync(path.join(searchPath, f)).isDirectory()
            );
            if (versions.length > 0) {
              // Use latest version
              const latest = versions.sort().pop()!;
              const skillsDir = path.join(searchPath, latest, 'skills');
              if (fs.existsSync(skillsDir)) return skillsDir;
            }
          } catch {
            continue;
          }
        }
        return searchPath;
      }
    }

    return null;
  }

  private discoverAntigravityPath(): string | null {
    const homeDir = os.homedir();
    const searchPaths = [
      path.join(homeDir, '.claude', 'plugins', 'cache', 'claude-plugins-official', 'antigravity-awesome-skills'),
      path.join(homeDir, 'antigravity-awesome-skills', 'skills'),
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        // Check for versioned directories
        if (searchPath.includes('plugins/cache')) {
          try {
            const versions = fs.readdirSync(searchPath).filter(f =>
              fs.statSync(path.join(searchPath, f)).isDirectory()
            );
            if (versions.length > 0) {
              const latest = versions.sort().pop()!;
              const skillsDir = path.join(searchPath, latest, 'skills');
              if (fs.existsSync(skillsDir)) return skillsDir;
            }
          } catch {
            continue;
          }
        }
        return searchPath;
      }
    }

    return null;
  }
}
