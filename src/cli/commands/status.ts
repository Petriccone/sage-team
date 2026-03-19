import { Command } from 'commander';
import fs from 'fs';
import { Database } from '../../state/database';
import { SessionsRepo } from '../../state/repositories/sessions';
import { TasksRepo } from '../../state/repositories/tasks';
import { SprintsRepo } from '../../state/repositories/sprints';
import { PullRequestsRepo } from '../../state/repositories/pull-requests';

export function statusCommand(): Command {
  return new Command('status')
    .description('Show sprint progress and pending PRs')
    .action(() => {
      const dbPath = '.sage-team/state.db';
      if (!fs.existsSync(dbPath)) {
        console.log('No active session. Run: sage-team start --goal "..."');
        return;
      }

      const db = new Database(dbPath);
      const sessions = new SessionsRepo(db);
      const tasks = new TasksRepo(db);
      const sprints = new SprintsRepo(db);
      const prs = new PullRequestsRepo(db);

      const session = sessions.findLatestActive();
      if (!session) {
        console.log('No active session.');
        db.close();
        return;
      }

      console.log(`Session: ${session.id}`);
      console.log(`Goal: ${session.goal}`);

      const sprint = sprints.findActive(session.id);
      if (sprint) {
        console.log(`\nSprint: ${sprint.name}`);
      }

      const allTasks = tasks.findBySession(session.id);
      const completed = allTasks.filter((t: any) => t.status === 'completed');
      const inProgress = allTasks.filter((t: any) => t.status === 'in_progress');
      const pending = allTasks.filter((t: any) => t.status === 'pending');
      const failed = allTasks.filter((t: any) => t.status === 'failed');

      console.log(`\nTasks: ${allTasks.length} total`);
      if (completed.length) console.log(`  ✅ ${completed.length} completed`);
      if (inProgress.length) console.log(`  🔄 ${inProgress.length} in progress`);
      if (pending.length) console.log(`  ⏳ ${pending.length} pending`);
      if (failed.length) console.log(`  ❌ ${failed.length} failed`);

      const pendingPRs = prs.findPending(session.id);
      if (pendingPRs.length > 0) {
        console.log(`\nPending PRs: ${pendingPRs.length}`);
        for (const pr of pendingPRs) {
          console.log(`  ${pr.branch} (${pr.status})`);
        }
      }

      db.close();
    });
}
