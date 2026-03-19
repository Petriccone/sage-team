import { Command } from 'commander';
import fs from 'fs';
import { Database } from '../../state/database';
import { SessionsRepo } from '../../state/repositories/sessions';
import { EventsRepo } from '../../state/repositories/events';

export function logsCommand(): Command {
  return new Command('logs')
    .description('View activity log')
    .option('--agent <id>', 'Filter by agent ID')
    .option('-n, --lines <n>', 'Number of events', '50')
    .action((options) => {
      const dbPath = '.sage-team/state.db';
      if (!fs.existsSync(dbPath)) {
        console.log('No session data. Run: sage-team start --goal "..."');
        return;
      }

      const db = new Database(dbPath);
      const sessions = new SessionsRepo(db);
      const events = new EventsRepo(db);

      const session = sessions.findLatestActive();
      if (!session) {
        console.log('No active session.');
        db.close();
        return;
      }

      const limit = parseInt(options.lines);
      let allEvents = events.findBySession(session.id, limit);

      if (options.agent) {
        allEvents = allEvents.filter((e: any) => e.agent_id === options.agent);
      }

      if (allEvents.length === 0) {
        console.log('No events found.');
      } else {
        for (const event of allEvents.reverse()) {
          const agent = event.agent_id ? `[${event.agent_id}]` : '[system]';
          const data = event.data ? JSON.parse(event.data) : {};
          const msg = data.message || data.status || event.type;
          console.log(`${event.timestamp} ${agent} ${msg}`);
        }
      }

      db.close();
    });
}
