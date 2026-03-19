import { Command } from 'commander';
import fs from 'fs';

const CONFIG_PATH = '.sage-team/config.json';

export function configCommand(): Command {
  return new Command('config')
    .description('View or update configuration')
    .option('--show', 'Show current config')
    .option('--api-key <key>', 'Set Anthropic API key')
    .option('--model <model>', 'Set model (e.g. claude-sonnet-4-20250514)')
    .option('--max-agents <n>', 'Set max concurrent agents')
    .option('--autonomy <mode>', 'Set autonomy mode: sandbox|direct|supervised')
    .option('--company-name <name>', 'Set company name')
    .option('--mission <mission>', 'Set company mission')
    .action((options) => {
      if (!fs.existsSync(CONFIG_PATH)) {
        console.error('Sage Team not initialized. Run: sage-team init');
        process.exit(1);
      }

      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

      if (options.show || Object.keys(options).filter(k => k !== 'show').length === 0) {
        const display = { ...config };
        if (display.apiKey) {
          display.apiKey = display.apiKey.slice(0, 10) + '...' + display.apiKey.slice(-4);
        }
        console.log(JSON.stringify(display, null, 2));
        return;
      }

      if (options.apiKey) config.apiKey = options.apiKey;
      if (options.model) config.model = options.model;
      if (options.maxAgents) config.maxConcurrentAgents = parseInt(options.maxAgents);
      if (options.autonomy) config.autonomyMode = options.autonomy;
      if (options.companyName) config.companyName = options.companyName;
      if (options.mission) config.mission = options.mission;

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log('Config updated.');
    });
}
