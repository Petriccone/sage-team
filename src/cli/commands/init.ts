import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/** Detect if current directory is inside a git repository */
function hasGit(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize Sage Team in current directory')
    .option('--api-key <key>', 'Anthropic API key')
    .option('--company-name <name>', 'Company name')
    .option('--autonomy <mode>', 'Autonomy mode: sandbox|direct|supervised')
    .action(async (options) => {
      const sageDir = '.sage-team';

      const configPath = path.join(sageDir, 'config.json');
      if (fs.existsSync(configPath)) {
        console.log('Sage Team already initialized in this directory.');
        return;
      }

      // Create directory structure
      fs.mkdirSync(sageDir, { recursive: true });

      // Auto-detect: sandbox if git available, direct otherwise
      const isGitRepo = hasGit();
      const defaultMode = isGitRepo ? 'sandbox' : 'direct';

      // Build config
      const config = {
        companyName: 'Sage Team',
        mission: 'Build amazing software autonomously',
        model: 'claude-sonnet-4-20250514',
        maxConcurrentAgents: 3,
        autonomyMode: options.autonomy || defaultMode,
        apiKey: '',
      };
      if (options.apiKey) config.apiKey = options.apiKey;
      if (options.companyName) config.companyName = options.companyName;

      // Check env var
      if (!config.apiKey && process.env.ANTHROPIC_API_KEY) {
        config.apiKey = process.env.ANTHROPIC_API_KEY;
      }

      // Write config
      fs.writeFileSync(
        path.join(sageDir, 'config.json'),
        JSON.stringify(config, null, 2)
      );

      // Add to .gitignore only if git exists
      if (isGitRepo) {
        const gitignorePath = '.gitignore';
        const gitignoreEntry = '\n# Sage Team\n.sage-team/\n';
        if (fs.existsSync(gitignorePath)) {
          const content = fs.readFileSync(gitignorePath, 'utf-8');
          if (!content.includes('.sage-team')) {
            fs.appendFileSync(gitignorePath, gitignoreEntry);
          }
        } else {
          fs.writeFileSync(gitignorePath, gitignoreEntry);
        }
      }

      // Create .mcp.json for Claude Code integration
      const mcpPath = '.mcp.json';
      if (!fs.existsSync(mcpPath)) {
        const mcpConfig = {
          mcpServers: {
            'sage-team': {
              command: 'sage-team-mcp',
              args: [],
            },
          },
        };
        fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2));
        console.log('  Claude Code integration: .mcp.json created');
      }

      console.log('Sage Team initialized successfully!');
      console.log(`  Config: ${sageDir}/config.json`);
      console.log(`  Mode: ${config.autonomyMode}`);
      if (config.apiKey || process.env.ANTHROPIC_API_KEY) {
        console.log('  API Key: detected');
      }
      console.log('\n  Ready! Open Claude Code and say: "Start sage team with goal: ..."');
    });
}
