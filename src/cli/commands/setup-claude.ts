import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import os from 'os';

export function setupClaudeCommand(): Command {
  return new Command('setup-claude')
    .description('Configure sage-team MCP server globally for Claude Code')
    .option('--remove', 'Remove sage-team from global Claude Code config')
    .action(async (options) => {
      const mcpPath = path.join(os.homedir(), '.mcp.json');

      if (options.remove) {
        if (!fs.existsSync(mcpPath)) {
          console.log('No ~/.mcp.json found. Nothing to remove.');
          return;
        }

        const existing = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
        if (existing.mcpServers?.['sage-team']) {
          delete existing.mcpServers['sage-team'];

          // Remove file if no servers left
          if (Object.keys(existing.mcpServers).length === 0) {
            fs.unlinkSync(mcpPath);
            console.log('Removed ~/.mcp.json (no other MCP servers configured).');
          } else {
            fs.writeFileSync(mcpPath, JSON.stringify(existing, null, 2) + '\n');
            console.log('Removed sage-team from ~/.mcp.json.');
          }
        } else {
          console.log('sage-team not found in ~/.mcp.json. Nothing to remove.');
        }
        return;
      }

      // Read or create .mcp.json
      let config: Record<string, any> = { mcpServers: {} };
      if (fs.existsSync(mcpPath)) {
        try {
          config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
          if (!config.mcpServers) config.mcpServers = {};
        } catch {
          console.error(`Error: ~/.mcp.json exists but is not valid JSON.`);
          console.error('Please fix it manually or delete it and re-run this command.');
          process.exit(1);
        }
      }

      // Check if already configured
      if (config.mcpServers['sage-team']) {
        console.log('sage-team is already configured in ~/.mcp.json.');
        console.log('Restart Claude Code to pick up changes.');
        return;
      }

      // Add sage-team MCP server
      config.mcpServers['sage-team'] = {
        command: 'sage-team-mcp',
        args: [],
      };

      fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2) + '\n');

      console.log('sage-team MCP server configured globally!');
      console.log(`  Config: ${mcpPath}`);
      console.log('');
      console.log('Next steps:');
      console.log('  1. Restart Claude Code');
      console.log('  2. Approve the sage-team MCP server when prompted');
      console.log('  3. Say: "Start sage team with goal: ..."');
    });
}
