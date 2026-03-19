import type { Database } from '../database';

export class EventsRepo {
  constructor(private db: Database) {}

  log(type: string, agentId: string | null, data: Record<string, unknown> | null, sessionId: string): void {
    this.db.run(
      'INSERT INTO events (type, agent_id, data, session_id) VALUES (?, ?, ?, ?)',
      type, agentId, data ? JSON.stringify(data) : null, sessionId
    );
  }

  findBySession(sessionId: string, limit: number): any[] {
    return this.db.all(
      'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
      sessionId, limit
    );
  }

  findBySessionSince(sessionId: string, sinceId: number): any[] {
    return this.db.all(
      'SELECT * FROM events WHERE session_id = ? AND id > ? ORDER BY timestamp ASC',
      sessionId, sinceId
    );
  }

  cleanup(sessionId: string, keepCount: number): void {
    this.db.exec(`
      DELETE FROM events WHERE session_id = '${sessionId}' AND id NOT IN (
        SELECT id FROM events WHERE session_id = '${sessionId}' ORDER BY timestamp DESC LIMIT ${keepCount}
      )
    `);
  }
}
