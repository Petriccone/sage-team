import { nanoid } from 'nanoid';
import type { Database } from '../database';
import type { PRStatus } from '../../types';

export interface CreatePRInput {
  taskId: string;
  agentId: string;
  branch: string;
  sessionId: string;
}

export class PullRequestsRepo {
  constructor(private db: Database) {}

  create(input: CreatePRInput): { id: string; status: string } {
    const id = `pr-${nanoid(8)}`;
    this.db.run(
      'INSERT INTO pull_requests (id, task_id, agent_id, branch, session_id) VALUES (?, ?, ?, ?, ?)',
      id, input.taskId, input.agentId, input.branch, input.sessionId
    );
    return this.findById(id)!;
  }

  findById(id: string): any | null {
    return this.db.get('SELECT * FROM pull_requests WHERE id = ?', id) || null;
  }

  findPending(sessionId: string): any[] {
    return this.db.all(
      'SELECT * FROM pull_requests WHERE session_id = ? AND status IN (?, ?) ORDER BY created_at ASC',
      sessionId, 'pending_review', 'agent_reviewed'
    );
  }

  findBySession(sessionId: string): any[] {
    return this.db.all(
      'SELECT * FROM pull_requests WHERE session_id = ? ORDER BY created_at DESC',
      sessionId
    );
  }

  updateStatus(id: string, status: PRStatus, extra?: { notes?: string; feedback?: string; mergedBy?: string }): void {
    if (extra?.notes) {
      this.db.run('UPDATE pull_requests SET status = ?, review_notes = ? WHERE id = ?', status, extra.notes, id);
    } else if (extra?.feedback) {
      this.db.run('UPDATE pull_requests SET status = ?, user_feedback = ? WHERE id = ?', status, extra.feedback, id);
    } else if (extra?.mergedBy) {
      this.db.run(
        'UPDATE pull_requests SET status = ?, merged_by = ?, merged_at = CURRENT_TIMESTAMP WHERE id = ?',
        status, extra.mergedBy, id
      );
    } else {
      this.db.run('UPDATE pull_requests SET status = ? WHERE id = ?', status, id);
    }
  }
}
