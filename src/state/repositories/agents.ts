import type { Database } from '../database';
import type { AgentStatus } from '../../types';

// Default agent definitions for initialization
const DEFAULT_AGENTS = [
  { id: 'sage', role: 'ceo', name: 'Sage', room: 'ceo-office', seat: 0 },
  { id: 'nova', role: 'cto', name: 'Nova', room: 'cto-office', seat: 0 },
  { id: 'aria', role: 'architect', name: 'Aria', room: 'arch-lab', seat: 0 },
  { id: 'dex', role: 'dev-senior', name: 'Dex', room: 'dev-bullpen', seat: 0 },
  { id: 'flux', role: 'dev-fullstack', name: 'Flux', room: 'dev-bullpen', seat: 1 },
  { id: 'quinn', role: 'qa-lead', name: 'Quinn', room: 'qa-lab', seat: 0 },
  { id: 'gage', role: 'devops', name: 'Gage', room: 'qa-lab', seat: 1 },
  { id: 'uma', role: 'ux-designer', name: 'Uma', room: 'design-studio', seat: 0 },
  { id: 'morgan', role: 'product-manager', name: 'Morgan', room: 'design-studio', seat: 1 },
  { id: 'river', role: 'scrum-master', name: 'River', room: 'lounge', seat: 0 },
  { id: 'atlas', role: 'data-engineer', name: 'Atlas', room: 'data-lab', seat: 0 },
];

export class AgentsRepo {
  constructor(private db: Database) {}

  initializeForSession(sessionId: string): void {
    const stmt = this.db.raw.prepare(
      'INSERT OR REPLACE INTO agents (id, role, name, status, mood, position_room, position_seat, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertMany = this.db.raw.transaction(() => {
      for (const agent of DEFAULT_AGENTS) {
        stmt.run(agent.id, agent.role, agent.name, 'idle', 'focused', agent.room, agent.seat, sessionId);
      }
    });
    insertMany();
  }

  findBySession(sessionId: string): any[] {
    return this.db.all('SELECT * FROM agents WHERE session_id = ?', sessionId);
  }

  findById(id: string): any | null {
    return this.db.get('SELECT * FROM agents WHERE id = ?', id) || null;
  }

  updateStatus(id: string, status: AgentStatus): void {
    this.db.run(
      'UPDATE agents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      status, id
    );
  }

  updateRoom(id: string, room: string, seat: number | null): void {
    this.db.run(
      'UPDATE agents SET position_room = ?, position_seat = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      room, seat, id
    );
  }

  assignTask(agentId: string, taskId: string): void {
    this.db.run(
      'UPDATE agents SET current_task_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      taskId, 'coding', agentId
    );
  }

  clearTask(agentId: string): void {
    this.db.run(
      'UPDATE agents SET current_task_id = NULL, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      'idle', agentId
    );
  }
}
