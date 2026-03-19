import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { Database } from '../../state/database';
import { Orchestrator } from '../../engine/orchestrator';

export function startCommand(): Command {
  return new Command('start')
    .description('Start Sage Team office and agents')
    .option('--goal <goal>', 'Initial goal to decompose')
    .option('--no-browser', 'Skip opening browser')
    .option('--port <port>', 'Server port', '3000')
    .action(async (options) => {
      const configPath = '.sage-team/config.json';
      if (!fs.existsSync(configPath)) {
        console.error('Sage Team not initialized. Run: sage-team init');
        process.exit(1);
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
        console.error('No API key. Set ANTHROPIC_API_KEY or run: sage-team config --api-key <key>');
        process.exit(1);
      }

      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
      const db = new Database('.sage-team/state.db');
      const orchestrator = new Orchestrator(db, {
        apiKey,
        model: config.model,
        maxConcurrentAgents: config.maxConcurrentAgents,
        autonomyMode: config.autonomyMode,
        companyName: config.companyName,
        mission: config.mission,
      });

      // Start session
      const session = orchestrator.start(options.goal);
      console.log(`Session: ${session.id}`);

      if (options.goal) {
        console.log(`Goal: ${options.goal}`);
        console.log('CEO is decomposing the goal...');
      }

      // Start server (lazy import to avoid loading express when not needed)
      const { createServer } = await import('../../server/index');
      const port = parseInt(options.port);
      const server = createServer(orchestrator, port);

      // Open browser
      if (options.browser !== false) {
        try {
          const open = (await import('open')).default;
          await open(`http://localhost:${port}`);
        } catch {
          console.log(`Open browser: http://localhost:${port}`);
        }
      }

      console.log(`Office running at http://localhost:${port}`);
      console.log('Press Ctrl+C to stop.');

      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\nShutting down...');
        orchestrator.stop();
        db.close();
        process.exit(0);
      });
    });
}
