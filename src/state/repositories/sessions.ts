import { nanoid } from 'nanoid';
import type { Database } from '../database';
import type { Session } from '../../types';

export class SessionsRepo {
  constructor(private db: Database) {}

  create(goal: string): Session {
    const id = `session-${nanoid(8)}`;
    this.db.run(
      'INSERT INTO sessions (id, goal, status) VALUES (?, ?, ?)',
      id, goal, 'active'
    );
    return this.findById(id)!;
  }

  findById(id: string): Session | null {
    const row = this.db.get('SELECT * FROM sessions WHERE id = ?', id);
    return row ? this.mapRow(row) : null;
  }

  findLatestActive(): Session | null {
    const row = this.db.get(
      'SELECT * FROM sessions WHERE status = ? ORDER BY started_at DESC, rowid DESC LIMIT 1',
      'active'
    );
    return row ? this.mapRow(row) : null;
  }

  updateStatus(id: string, status: Session['status']): void {
    this.db.run('UPDATE sessions SET status = ? WHERE id = ?', status, id);
  }

  resume(id: string): void {
    this.db.run(
      'UPDATE sessions SET status = ?, resumed_at = CURRENT_TIMESTAMP WHERE id = ?',
      'active', id
    );
  }

  private mapRow(row: any): Session {
    return {
      id: row.id,
      goal: row.goal,
      status: row.status,
      startedAt: row.started_at,
      resumedAt: row.resumed_at,
      completedAt: row.completed_at,
    };
  }
}
