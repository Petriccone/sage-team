import { Command } from 'commander';
import fs from 'fs';
import { Database } from '../../state/database';
import { SessionsRepo } from '../../state/repositories/sessions';
import { Orchestrator } from '../../engine/orchestrator';

export function resumeCommand(): Command {
  return new Command('resume')
    .description('Resume the last active session')
    .option('--session <id>', 'Specific session ID to resume')
    .option('--port <port>', 'Server port', '3000')
    .action(async (options) => {
      const configPath = '.sage-team/config.json';
      if (!fs.existsSync(configPath)) {
        console.error('Sage Team not initialized. Run: sage-team init');
        process.exit(1);
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
      const db = new Database('.sage-team/state.db');

      // Find session to resume
      let sessionId = options.session;
      if (!sessionId) {
        const repo = new SessionsRepo(db);
        const latest = repo.findLatestActive();
        if (!latest) {
          console.error('No active session found. Run: sage-team start --goal "..."');
          db.close();
          process.exit(1);
        }
        sessionId = latest.id;
      }

      const orchestrator = new Orchestrator(db, {
        apiKey,
        model: config.model,
        maxConcurrentAgents: config.maxConcurrentAgents,
        autonomyMode: config.autonomyMode,
        companyName: config.companyName,
        mission: config.mission,
      });

      const success = orchestrator.resume(sessionId);
      if (!success) {
        console.error(`Session ${sessionId} not found.`);
        db.close();
        process.exit(1);
      }

      const agents = orchestrator.getAgents();
      const tasks = orchestrator.getTasks();
      const pendingPRs = orchestrator.getPendingPRs();

      console.log(`Resuming session ${sessionId}...`);
      console.log(`  Agents: ${agents.length}`);
      console.log(`  Tasks: ${tasks.length} (${tasks.filter((t: any) => t.status === 'completed').length} completed)`);
      if (pendingPRs.length > 0) {
        console.log(`  Pending PRs: ${pendingPRs.length}`);
      }

      // Start server
      const { createServer } = await import('../../server/index');
      const port = parseInt(options.port);
      await createServer(orchestrator, port);

      console.log(`Office running at http://localhost:${port}`);

      process.on('SIGINT', () => {
        orchestrator.stop();
        db.close();
        process.exit(0);
      });
    });
}
