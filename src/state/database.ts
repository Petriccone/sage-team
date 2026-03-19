import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resumed_at DATETIME,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  mood TEXT NOT NULL DEFAULT 'focused',
  position_room TEXT NOT NULL,
  position_seat INTEGER,
  current_task_id TEXT,
  active_skills TEXT DEFAULT '[]',
  session_id TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  session_id TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 3,
  assignee_id TEXT,
  required_skills TEXT DEFAULT '[]',
  depends_on TEXT DEFAULT '[]',
  sprint_id TEXT,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_agent TEXT NOT NULL,
  to_agent TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'chat',
  session_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  agent_id TEXT,
  data TEXT,
  session_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  reasoning TEXT,
  confidence REAL,
  outcome TEXT DEFAULT 'pending',
  session_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pull_requests (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  review_notes TEXT,
  user_feedback TEXT,
  merged_by TEXT,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  merged_at DATETIME
);

CREATE TABLE IF NOT EXISTS skill_executions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  skill_source TEXT NOT NULL,
  task_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  output TEXT,
  session_id TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_events_session_ts ON events(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_agents_session ON agents(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, session_id);
CREATE INDEX IF NOT EXISTS idx_prs_status ON pull_requests(status, session_id);
`;

export class Database {
  private db: BetterSqlite3.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new BetterSqlite3(dbPath);

    // Performance pragmas
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');

    // Create schema
    this.db.exec(SCHEMA);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  get(sql: string, ...params: unknown[]): any {
    return this.db.prepare(sql).get(...params);
  }

  all(sql: string, ...params: unknown[]): any[] {
    return this.db.prepare(sql).all(...params);
  }

  run(sql: string, ...params: unknown[]): BetterSqlite3.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  pragma(pragma: string): any {
    return this.db.pragma(pragma);
  }

  listTables(): string[] {
    const rows = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string }[];
    return rows.map(r => r.name);
  }

  close(): void {
    this.db.close();
  }

  get raw(): BetterSqlite3.Database {
    return this.db;
  }
}
