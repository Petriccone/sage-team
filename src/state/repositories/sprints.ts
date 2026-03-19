import { nanoid } from 'nanoid';
import type { Database } from '../database';

export interface CreateSprintInput {
  name: string;
  goal?: string;
  sessionId: string;
}

export class SprintsRepo {
  constructor(private db: Database) {}

  create(input: CreateSprintInput): { id: string; name: string; status: string } {
    const id = `sprint-${nanoid(8)}`;
    this.db.run(
      'INSERT INTO sprints (id, name, goal, session_id) VALUES (?, ?, ?, ?)',
      id, input.name, input.goal || null, input.sessionId
    );
    return this.findById(id)!;
  }

  findById(id: string): any | null {
    return this.db.get('SELECT * FROM sprints WHERE id = ?', id) || null;
  }

  findActive(sessionId: string): any | null {
    return this.db.get(
      'SELECT * FROM sprints WHERE session_id = ? AND status = ? ORDER BY started_at DESC LIMIT 1',
      sessionId, 'active'
    ) || null;
  }

  complete(id: string): void {
    this.db.run(
      'UPDATE sprints SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
      'completed', id
    );
  }
}
