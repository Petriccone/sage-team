import { nanoid } from 'nanoid';
import type { Database } from '../database';
import type { TaskStatus, TaskPriority } from '../../types';

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: number;
  requiredSkills?: string[];
  dependsOn: string[];
  sprintId: string;
  sessionId: string;
  assigneeId?: string;
}

export class TasksRepo {
  constructor(private db: Database) {}

  create(input: CreateTaskInput): { id: string; title: string } {
    const id = `task-${nanoid(8)}`;
    this.db.run(
      `INSERT INTO tasks (id, title, description, priority, required_skills, depends_on, sprint_id, session_id, assignee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.title,
      input.description || null,
      input.priority,
      JSON.stringify(input.requiredSkills || []),
      JSON.stringify(input.dependsOn),
      input.sprintId,
      input.sessionId,
      input.assigneeId || null
    );
    return { id, title: input.title };
  }

  findBySession(sessionId: string): any[] {
    return this.db.all('SELECT * FROM tasks WHERE session_id = ?', sessionId);
  }

  findById(id: string): any | null {
    return this.db.get('SELECT * FROM tasks WHERE id = ?', id) || null;
  }

  findAvailable(sessionId: string, limit: number): any[] {
    // Get all pending tasks for the session
    const pendingTasks = this.db.all(
      'SELECT * FROM tasks WHERE session_id = ? AND status = ? ORDER BY priority ASC',
      sessionId, 'pending'
    );

    // Get all completed task IDs for dependency checking
    const completedIds = new Set(
      this.db.all(
        'SELECT id FROM tasks WHERE session_id = ? AND status = ?',
        sessionId, 'completed'
      ).map((r: any) => r.id)
    );

    // Filter: only tasks whose dependencies are all completed
    const available = pendingTasks.filter((task: any) => {
      const deps: string[] = JSON.parse(task.depends_on || '[]');
      return deps.every(depId => completedIds.has(depId));
    });

    return available.slice(0, limit);
  }

  updateStatus(id: string, status: TaskStatus): void {
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    this.db.run(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
      status, completedAt, id
    );
  }

  assign(id: string, agentId: string): void {
    this.db.run(
      'UPDATE tasks SET assignee_id = ?, status = ? WHERE id = ?',
      agentId, 'in_progress', id
    );
  }
}
