import { nanoid } from 'nanoid';
import type { Database } from '../database';

export interface CreateMessageInput {
  fromAgent: string;
  toAgent: string | null;
  content: string;
  type: 'chat' | 'decision' | 'review' | 'crisis';
  sessionId: string;
}

export class MessagesRepo {
  constructor(private db: Database) {}

  create(input: CreateMessageInput): void {
    const id = `msg-${nanoid(8)}`;
    this.db.run(
      'INSERT INTO messages (id, from_agent, to_agent, content, type, session_id) VALUES (?, ?, ?, ?, ?, ?)',
      id, input.fromAgent, input.toAgent, input.content, input.type, input.sessionId
    );
  }

  findBySession(sessionId: string, limit: number): any[] {
    return this.db.all(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
      sessionId, limit
    );
  }
}
