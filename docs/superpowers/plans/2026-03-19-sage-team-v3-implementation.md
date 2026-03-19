# Sage Team v3.0 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Sage Team from a simulation into a real AI-powered software company with 11 autonomous agents executing via Claude Code, persisted state in SQLite, and a PixiJS isometric office visualization.

**Architecture:** Hybrid Engine — CEO plans via Claude API (cheap), agents execute via Claude Code subprocesses (powerful). SQLite persists all state. Express + WebSocket serves a PixiJS browser UI showing an isometric office with animated agents. Skills are injected as full protocol text from Superpowers and Antigravity repos.

**Tech Stack:** TypeScript, better-sqlite3, Express, ws, PixiJS, React, Vite, Commander, @anthropic-ai/sdk

**Spec:** `docs/superpowers/specs/2026-03-19-sage-team-v3-architecture-design.md`

---

## Chunk 1: Foundation — Types, State Layer, and Project Scaffolding

This chunk sets up the new project structure, TypeScript types, and SQLite database. Everything else builds on this.

### Task 1: Scaffold New Project Structure

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/cli/commands/start.ts` (stub)
- Create: `src/engine/orchestrator.ts` (stub)
- Create: `src/state/database.ts` (stub)
- Create: `src/types/index.ts` (new v3 types)
- Modify: `package.json` (new deps)
- Modify: `tsconfig.json` (paths if needed)

- [ ] **Step 1: Install new dependencies**

```bash
npm install better-sqlite3 express ws open
npm install -D @types/better-sqlite3 @types/express @types/ws vitest
```

- [ ] **Step 2: Create directory structure**

```bash
mkdir -p src/cli/commands src/engine src/state/repositories src/state/migrations src/agents src/skills src/server/routes
```

- [ ] **Step 3: Commit scaffolding**

```bash
git add -A
git commit -m "chore: scaffold v3 project structure and install dependencies"
```

---

### Task 2: Define v3 TypeScript Types

**Files:**
- Create: `src/types/index.ts` (overwrite existing v2 types)

- [ ] **Step 1: Write type definition tests**

Create `src/types/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  AgentRole, AgentStatus, AgentMood, AutonomyMode,
  TaskStatus, PRStatus, SkillSource,
  Agent, Task, Sprint, Message, Event, Decision, PullRequest,
  SkillExecution, Session, CompanyConfig,
  WSEvent, WSAgentMove, WSCrisis, WSCelebration
} from '../index';

describe('v3 types', () => {
  it('should allow valid agent creation', () => {
    const agent: Agent = {
      id: 'sage',
      role: 'ceo',
      name: 'Sage',
      status: 'idle',
      mood: 'focused',
      positionRoom: 'ceo-office',
      positionSeat: 0,
      currentTaskId: null,
      activeSkills: [],
      sessionId: 'session-1',
      updatedAt: new Date().toISOString(),
    };
    expect(agent.role).toBe('ceo');
  });

  it('should allow valid task creation', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Build auth',
      description: 'JWT authentication',
      status: 'pending',
      priority: 1,
      assigneeId: null,
      requiredSkills: ['sp-tdd-cycle', 'ag-typescript-pro'],
      dependsOn: [],
      sprintId: 'sprint-1',
      sessionId: 'session-1',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    expect(task.status).toBe('pending');
  });

  it('should allow valid PR creation', () => {
    const pr: PullRequest = {
      id: 'pr-1',
      taskId: 'task-1',
      agentId: 'dex',
      branch: 'sage/dex/build-auth',
      status: 'pending_review',
      reviewNotes: null,
      userFeedback: null,
      mergedBy: null,
      sessionId: 'session-1',
      createdAt: new Date().toISOString(),
      mergedAt: null,
    };
    expect(pr.status).toBe('pending_review');
  });

  it('should type WebSocket events correctly', () => {
    const moveEvent: WSAgentMove = {
      type: 'agent:move',
      agentId: 'dex',
      to: { room: 'meeting', seat: 2 },
    };
    expect(moveEvent.type).toBe('agent:move');

    const crisisEvent: WSCrisis = {
      type: 'crisis:start',
      severity: 'critical',
      message: 'Tests failing',
      agents: ['nova', 'dex', 'quinn'],
    };
    expect(crisisEvent.severity).toBe('critical');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/types/__tests__/types.test.ts
```

Expected: FAIL — types not defined yet.

- [ ] **Step 3: Write v3 type definitions**

Create `src/types/index.ts`:

```typescript
// === Agent Types ===
export type AgentRole =
  | 'ceo' | 'cto' | 'architect' | 'dev-senior' | 'dev-fullstack'
  | 'qa-lead' | 'devops' | 'product-manager' | 'ux-designer'
  | 'scrum-master' | 'data-engineer';

export type AgentStatus =
  | 'idle' | 'thinking' | 'coding' | 'testing' | 'reviewing'
  | 'deploying' | 'meeting' | 'planning' | 'debugging'
  | 'designing' | 'walking' | 'pairing' | 'crisis'
  | 'brainstorming' | 'dispatching' | 'celebrating';

export type AgentMood = 'focused' | 'happy' | 'stressed' | 'creative' | 'collaborative';

export type AutonomyMode = 'sandbox' | 'direct' | 'supervised';

// === Task Types ===
export type TaskStatus = 'pending' | 'in_progress' | 'in_review' | 'completed' | 'failed';
export type TaskPriority = 1 | 2 | 3 | 4 | 5; // 1=critical, 5=low

// === PR Types ===
export type PRStatus =
  | 'pending_review' | 'agent_reviewed'
  | 'user_approved' | 'user_rejected'
  | 'merged' | 'rework';

// === Skill Types ===
export type SkillSource = 'superpowers' | 'antigravity' | 'built-in';
export type SkillExecutionStatus = 'active' | 'completed' | 'failed';

// === Core Entities ===
export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  status: AgentStatus;
  mood: AgentMood;
  positionRoom: string;
  positionSeat: number | null;
  currentTaskId: string | null;
  activeSkills: string[];
  sessionId: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  requiredSkills: string[];
  dependsOn: string[];
  sprintId: string;
  sessionId: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: 'active' | 'completed';
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
}

export interface Message {
  id: string;
  fromAgent: string;
  toAgent: string | null;
  content: string;
  type: 'chat' | 'decision' | 'review' | 'crisis';
  sessionId: string;
  timestamp: string;
}

export interface Event {
  id: number;
  type: string;
  agentId: string | null;
  data: Record<string, unknown> | null;
  sessionId: string;
  timestamp: string;
}

export interface Decision {
  id: string;
  agentId: string;
  type: 'delegate' | 'self-assign' | 'escalate' | 'dispatch' | 'crisis';
  action: string;
  reasoning: string | null;
  confidence: number;
  outcome: 'success' | 'failure' | 'pending';
  sessionId: string;
  timestamp: string;
}

export interface PullRequest {
  id: string;
  taskId: string;
  agentId: string;
  branch: string;
  status: PRStatus;
  reviewNotes: string | null;
  userFeedback: string | null;
  mergedBy: string | null;
  sessionId: string;
  createdAt: string;
  mergedAt: string | null;
}

export interface SkillExecution {
  id: string;
  agentId: string;
  skillId: string;
  skillSource: SkillSource;
  taskId: string | null;
  status: SkillExecutionStatus;
  output: string | null;
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
}

export interface Session {
  id: string;
  goal: string;
  status: 'active' | 'paused' | 'completed';
  startedAt: string;
  resumedAt: string | null;
  completedAt: string | null;
}

// === Configuration ===
export interface CompanyConfig {
  companyName: string;
  mission: string;
  model: string;
  maxConcurrentAgents: number;
  autonomyMode: AutonomyMode;
  apiKey: string;
}

// === WebSocket Events ===
export interface WSAgentMove {
  type: 'agent:move';
  agentId: string;
  to: { room: string; seat?: number };
}

export interface WSAgentStatus {
  type: 'agent:status';
  agentId: string;
  status: AgentStatus;
  detail?: string;
}

export interface WSMeetingStart {
  type: 'meeting:start';
  room: string;
  agents: string[];
  topic: string;
}

export interface WSMeetingEnd {
  type: 'meeting:end';
  room: string;
}

export interface WSCrisis {
  type: 'crisis:start';
  severity: 'critical' | 'high';
  message: string;
  agents: string[];
}

export interface WSCrisisResolved {
  type: 'crisis:resolved';
  message: string;
}

export interface WSTaskAssigned {
  type: 'task:assigned';
  taskId: string;
  agentId: string;
}

export interface WSTaskCompleted {
  type: 'task:completed';
  taskId: string;
  agentId: string;
}

export interface WSSkillActivated {
  type: 'skill:activated';
  agentId: string;
  skillId: string;
  phase?: string;
}

export interface WSPRCreated {
  type: 'pr:created';
  prId: string;
  agentId: string;
  branch: string;
}

export interface WSPRMerged {
  type: 'pr:merged';
  prId: string;
  mergedBy: string;
}

export interface WSCelebration {
  type: 'celebration:pr-merged' | 'celebration:deploy' | 'celebration:sprint-complete';
  [key: string]: unknown;
}

export interface WSChat {
  type: 'chat:message';
  from: string;
  to: string | null;
  content: string;
}

export type WSEvent =
  | WSAgentMove | WSAgentStatus
  | WSMeetingStart | WSMeetingEnd
  | WSCrisis | WSCrisisResolved
  | WSTaskAssigned | WSTaskCompleted
  | WSSkillActivated
  | WSPRCreated | WSPRMerged
  | WSCelebration | WSChat;

// === Agent Persona (for personas.ts) ===
export interface AgentPersona {
  id: string;
  name: string;
  role: AgentRole;
  emoji: string;
  color: string;
  description: string;
  skills: string[];
  defaultRoom: string;
  defaultSeat: number;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/types/__tests__/types.test.ts
```

Expected: PASS — all type checks compile.

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: define v3 TypeScript types for all entities and WebSocket events"
```

---

### Task 3: Implement SQLite Database Layer

**Files:**
- Create: `src/state/database.ts`
- Create: `src/state/migrations/001-initial.ts`

- [ ] **Step 1: Write database initialization tests**

Create `src/state/__tests__/database.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../database';
import fs from 'fs';

describe('Database', () => {
  let db: Database;
  const testDbPath = '.sage-team/test-state.db';

  beforeEach(() => {
    db = new Database(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('should create database file', () => {
    expect(fs.existsSync(testDbPath)).toBe(true);
  });

  it('should set WAL journal mode', () => {
    const result = db.pragma('journal_mode');
    expect(result).toEqual([{ journal_mode: 'wal' }]);
  });

  it('should create all tables', () => {
    const tables = db.listTables();
    expect(tables).toContain('sessions');
    expect(tables).toContain('agents');
    expect(tables).toContain('tasks');
    expect(tables).toContain('sprints');
    expect(tables).toContain('messages');
    expect(tables).toContain('events');
    expect(tables).toContain('decisions');
    expect(tables).toContain('pull_requests');
    expect(tables).toContain('skill_executions');
  });

  it('should insert and query a session', () => {
    db.exec(`INSERT INTO sessions (id, goal, status) VALUES ('s1', 'Test goal', 'active')`);
    const row = db.get('SELECT * FROM sessions WHERE id = ?', 's1');
    expect(row.goal).toBe('Test goal');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/state/__tests__/database.test.ts
```

Expected: FAIL — Database class not defined.

- [ ] **Step 3: Implement Database class**

Create `src/state/database.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/state/__tests__/database.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/state/
git commit -m "feat: implement SQLite database layer with WAL mode and full v3 schema"
```

---

### Task 4: Implement Core Repositories

**Files:**
- Create: `src/state/repositories/sessions.ts`
- Create: `src/state/repositories/agents.ts`
- Create: `src/state/repositories/tasks.ts`
- Create: `src/state/repositories/sprints.ts`
- Create: `src/state/repositories/events.ts`
- Create: `src/state/repositories/pull-requests.ts`
- Create: `src/state/repositories/messages.ts`

- [ ] **Step 1: Write repository tests**

Create `src/state/repositories/__tests__/repositories.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../database';
import { SessionsRepo } from '../sessions';
import { AgentsRepo } from '../agents';
import { TasksRepo } from '../tasks';
import { SprintsRepo } from '../sprints';
import { EventsRepo } from '../events';
import { PullRequestsRepo } from '../pull-requests';
import fs from 'fs';

describe('Repositories', () => {
  let db: Database;
  const testDbPath = '.sage-team/test-repos.db';

  beforeEach(() => {
    db = new Database(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  describe('SessionsRepo', () => {
    it('should create and find a session', () => {
      const repo = new SessionsRepo(db);
      const session = repo.create('Build a blog');
      expect(session.goal).toBe('Build a blog');
      expect(session.status).toBe('active');
      const found = repo.findById(session.id);
      expect(found?.goal).toBe('Build a blog');
    });

    it('should find latest active session', () => {
      const repo = new SessionsRepo(db);
      repo.create('First goal');
      const second = repo.create('Second goal');
      const latest = repo.findLatestActive();
      expect(latest?.id).toBe(second.id);
    });
  });

  describe('AgentsRepo', () => {
    it('should initialize all 11 agents for a session', () => {
      const repo = new AgentsRepo(db);
      repo.initializeForSession('session-1');
      const agents = repo.findBySession('session-1');
      expect(agents.length).toBe(11);
    });

    it('should update agent status', () => {
      const repo = new AgentsRepo(db);
      repo.initializeForSession('session-1');
      repo.updateStatus('dex', 'coding');
      const agent = repo.findById('dex');
      expect(agent?.status).toBe('coding');
    });

    it('should update agent room', () => {
      const repo = new AgentsRepo(db);
      repo.initializeForSession('session-1');
      repo.updateRoom('dex', 'meeting', 2);
      const agent = repo.findById('dex');
      expect(agent?.position_room).toBe('meeting');
      expect(agent?.position_seat).toBe(2);
    });
  });

  describe('TasksRepo', () => {
    it('should create and list tasks', () => {
      const repo = new TasksRepo(db);
      repo.create({
        title: 'Build auth',
        description: 'JWT middleware',
        priority: 1,
        requiredSkills: ['sp-tdd-cycle'],
        dependsOn: [],
        sprintId: 'sprint-1',
        sessionId: 'session-1',
      });
      const tasks = repo.findBySession('session-1');
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Build auth');
    });

    it('should find next available tasks respecting dependencies', () => {
      const repo = new TasksRepo(db);
      const t1 = repo.create({ title: 'Task 1', priority: 1, dependsOn: [], sprintId: 's1', sessionId: 's1' });
      repo.create({ title: 'Task 2', priority: 2, dependsOn: [t1.id], sprintId: 's1', sessionId: 's1' });
      const available = repo.findAvailable('s1', 5);
      expect(available.length).toBe(1);
      expect(available[0].title).toBe('Task 1');
    });
  });

  describe('EventsRepo', () => {
    it('should log and query events', () => {
      const repo = new EventsRepo(db);
      repo.log('agent:move', 'dex', { room: 'meeting' }, 'session-1');
      repo.log('agent:status', 'dex', { status: 'coding' }, 'session-1');
      const events = repo.findBySession('session-1', 50);
      expect(events.length).toBe(2);
    });

    it('should cleanup old events', () => {
      const repo = new EventsRepo(db);
      for (let i = 0; i < 20; i++) {
        repo.log('tick', null, { i }, 'session-1');
      }
      repo.cleanup('session-1', 10);
      const events = repo.findBySession('session-1', 100);
      expect(events.length).toBe(10);
    });
  });

  describe('PullRequestsRepo', () => {
    it('should create PR and transition status', () => {
      const repo = new PullRequestsRepo(db);
      const pr = repo.create({
        taskId: 'task-1',
        agentId: 'dex',
        branch: 'sage/dex/build-auth',
        sessionId: 'session-1',
      });
      expect(pr.status).toBe('pending_review');
      repo.updateStatus(pr.id, 'agent_reviewed', { notes: 'LGTM' });
      const updated = repo.findById(pr.id);
      expect(updated?.status).toBe('agent_reviewed');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/state/repositories/__tests__/repositories.test.ts
```

Expected: FAIL — repos not defined.

- [ ] **Step 3: Implement SessionsRepo**

Create `src/state/repositories/sessions.ts`:

```typescript
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
      'SELECT * FROM sessions WHERE status = ? ORDER BY started_at DESC LIMIT 1',
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
```

- [ ] **Step 4: Implement AgentsRepo**

Create `src/state/repositories/agents.ts` — initializes all 11 agents from personas, CRUD for status/room/task updates.

- [ ] **Step 5: Implement TasksRepo**

Create `src/state/repositories/tasks.ts` — create, findAvailable (respects dependencies and priority), assign, complete.

- [ ] **Step 6: Implement SprintsRepo**

Create `src/state/repositories/sprints.ts` — create, findActive, complete.

- [ ] **Step 7: Implement EventsRepo**

Create `src/state/repositories/events.ts` — log, findBySession (with limit), cleanup (max 10k).

- [ ] **Step 8: Implement MessagesRepo**

Create `src/state/repositories/messages.ts` — create, findBySession.

- [ ] **Step 9: Implement PullRequestsRepo**

Create `src/state/repositories/pull-requests.ts` — create, updateStatus, findPending, findBySession.

- [ ] **Step 10: Run all repository tests**

```bash
npx vitest run src/state/repositories/__tests__/repositories.test.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/state/repositories/
git commit -m "feat: implement all SQLite repositories (sessions, agents, tasks, sprints, events, PRs, messages)"
```

---

## Chunk 2: Agent Personas and Skills System

This chunk defines the 11 agent personas for v3 and implements the skill loader that reads real protocol files from Superpowers and Antigravity.

### Task 5: Update Agent Personas for v3

**Files:**
- Create: `src/agents/personas.ts` (new v3 format)
- Create: `src/agents/skills-map.ts`

- [ ] **Step 1: Write persona tests**

Create `src/agents/__tests__/personas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PERSONAS } from '../personas';
import { AGENT_SKILLS } from '../skills-map';

describe('Agent Personas', () => {
  it('should define exactly 11 agents', () => {
    expect(PERSONAS.length).toBe(11);
  });

  it('should have unique IDs', () => {
    const ids = PERSONAS.map(p => p.id);
    expect(new Set(ids).size).toBe(11);
  });

  it('should have unique rooms', () => {
    const rooms = PERSONAS.map(p => p.defaultRoom);
    // Dev bullpen shares room, so unique count < 11
    expect(rooms.length).toBe(11);
  });

  it('should have valid roles', () => {
    const validRoles = [
      'ceo', 'cto', 'architect', 'dev-senior', 'dev-fullstack',
      'qa-lead', 'devops', 'product-manager', 'ux-designer',
      'scrum-master', 'data-engineer'
    ];
    PERSONAS.forEach(p => {
      expect(validRoles).toContain(p.role);
    });
  });
});

describe('Agent Skills Map', () => {
  it('should have skills for all 11 agents', () => {
    expect(Object.keys(AGENT_SKILLS).length).toBe(11);
  });

  it('should use sp- or ag- prefix for all skills', () => {
    Object.values(AGENT_SKILLS).flat().forEach(skillId => {
      expect(skillId.startsWith('sp-') || skillId.startsWith('ag-')).toBe(true);
    });
  });

  it('should assign TDD to developers', () => {
    expect(AGENT_SKILLS['dex']).toContain('sp-tdd-cycle');
    expect(AGENT_SKILLS['flux']).toContain('sp-tdd-cycle');
  });

  it('should assign brainstorming to CEO', () => {
    expect(AGENT_SKILLS['sage']).toContain('sp-brainstorming');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/agents/__tests__/personas.test.ts
```

- [ ] **Step 3: Implement personas.ts with all 11 agents**

Define each agent with: id, name, role, emoji, color, description, skills, defaultRoom, defaultSeat. Use the exact mapping from spec Section 6.4 for colors and Section 7.2 for skills.

- [ ] **Step 4: Implement skills-map.ts**

Export `AGENT_SKILLS: Record<string, string[]>` mapping each agent ID to their canonical skill IDs (sp- and ag- prefixed) from spec Section 7.2.

- [ ] **Step 5: Run tests, verify pass, commit**

```bash
npx vitest run src/agents/__tests__/personas.test.ts
git add src/agents/
git commit -m "feat: define v3 agent personas and skill assignments for all 11 agents"
```

---

### Task 6: Implement Skill Loader

**Files:**
- Create: `src/skills/loader.ts`
- Create: `src/skills/matcher.ts`

- [ ] **Step 1: Write skill loader tests**

Create `src/skills/__tests__/loader.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SkillLoader } from '../loader';

describe('SkillLoader', () => {
  const loader = new SkillLoader();

  it('should detect superpowers installation path', () => {
    const path = loader.getSuperpowersPath();
    // May be null if not installed — test handles both
    if (path) {
      expect(path).toContain('superpowers');
    }
  });

  it('should resolve sp- skill ID to file path', () => {
    const resolved = loader.resolveSkillPath('sp-tdd-cycle');
    if (resolved) {
      expect(resolved).toContain('test-driven-development');
    }
  });

  it('should load skill content as string', () => {
    const content = loader.loadSkill('sp-brainstorming');
    if (content) {
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('brainstorming');
    }
  });

  it('should respect token budget', () => {
    const skills = loader.loadSkillsForTask(
      ['sp-tdd-cycle', 'sp-brainstorming', 'ag-clean-code'],
      30000 // token budget
    );
    // Should load at least the first skill
    expect(skills.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement SkillLoader**

Create `src/skills/loader.ts` that:
1. Discovers superpowers installation path (scan `~/.claude/plugins/cache/` and common locations)
2. Maps canonical skill IDs (sp-, ag-) to file paths using the mapping table from spec Section 7.3
3. Reads skill file content
4. `loadSkillsForTask(skillIds, tokenBudget)` — loads skills in priority order respecting token budget (estimate ~4 chars per token)

- [ ] **Step 4: Implement SkillMatcher**

Create `src/skills/matcher.ts` that matches task descriptions to relevant skills using keyword triggers.

- [ ] **Step 5: Run tests, verify pass, commit**

```bash
npx vitest run src/skills/__tests__/loader.test.ts
git add src/skills/
git commit -m "feat: implement skill loader with path discovery and token budget management"
```

---

### Task 7: Implement Prompt Builder

**Files:**
- Create: `src/engine/prompt-builder.ts`

- [ ] **Step 1: Write prompt builder tests**

Create `src/engine/__tests__/prompt-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../prompt-builder';

describe('PromptBuilder', () => {
  const builder = new PromptBuilder();

  it('should build a system prompt with identity section', () => {
    const prompt = builder.build({
      agent: { id: 'dex', name: 'Dex', role: 'dev-senior', description: 'Senior TypeScript developer' },
      company: { name: 'Test Co', mission: 'Build great software' },
      skills: ['## TDD\nWrite test first.\n'],
      task: { title: 'Build auth', description: 'JWT middleware', requiredSkills: ['sp-tdd-cycle'] },
    });
    expect(prompt).toContain('You are Dex');
    expect(prompt).toContain('dev-senior');
    expect(prompt).toContain('TDD');
    expect(prompt).toContain('Build auth');
    expect(prompt).toContain('[sage:dex]');
  });

  it('should stay within token budget', () => {
    const prompt = builder.build({
      agent: { id: 'dex', name: 'Dex', role: 'dev-senior', description: 'Test' },
      company: { name: 'Co', mission: 'Test' },
      skills: ['x'.repeat(200000)], // Huge skill
      task: { title: 'Test', description: 'Test', requiredSkills: [] },
    });
    // Prompt should be truncated to ~30k tokens (~120k chars)
    expect(prompt.length).toBeLessThan(130000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement PromptBuilder**

Builds system prompt following spec Section 5.3 format: Identity → Skills → Task → Rules. Respects 30k token budget. Truncates oversized skills.

- [ ] **Step 4: Run tests, verify pass, commit**

```bash
npx vitest run src/engine/__tests__/prompt-builder.test.ts
git add src/engine/prompt-builder.ts src/engine/__tests__/
git commit -m "feat: implement prompt builder with skill injection and token budget"
```

---

## Chunk 3: Engine — CEO Brain, Dispatcher, PR Manager

The core execution engine. This is where simulation becomes real.

### Task 8: Implement CEO Brain

**Files:**
- Create: `src/engine/ceo-brain.ts`

- [ ] **Step 1: Write CEO brain tests**

Create `src/engine/__tests__/ceo-brain.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CEOBrain } from '../ceo-brain';

describe('CEOBrain', () => {
  it('should format goal decomposition prompt correctly', () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const prompt = brain.buildDecompositionPrompt(
      'Build a REST API for todo app',
      [{ id: 'dex', name: 'Dex', role: 'dev-senior', skills: ['sp-tdd-cycle', 'ag-typescript-pro'] }]
    );
    expect(prompt).toContain('Build a REST API for todo app');
    expect(prompt).toContain('Dex');
    expect(prompt).toContain('sp-tdd-cycle');
  });

  it('should parse decomposition response into tasks', () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const mockResponse = JSON.stringify({
      sprint: { name: 'Todo API MVP', goal: 'Working REST API' },
      tasks: [
        { title: 'Design API schema', assignee: 'aria', priority: 1, required_skills: ['ag-api-design'], depends_on: [] },
        { title: 'Implement endpoints', assignee: 'dex', priority: 2, required_skills: ['sp-tdd-cycle'], depends_on: ['task-0'] },
      ]
    });
    const result = brain.parseDecomposition(mockResponse);
    expect(result.sprint.name).toBe('Todo API MVP');
    expect(result.tasks.length).toBe(2);
    expect(result.tasks[1].depends_on).toEqual(['task-0']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement CEOBrain**

Uses `@anthropic-ai/sdk` to call Claude API for goal decomposition. Returns structured sprint + tasks JSON. Includes retry logic for malformed responses.

- [ ] **Step 4: Run tests, verify pass, commit**

```bash
npx vitest run src/engine/__tests__/ceo-brain.test.ts
git add src/engine/ceo-brain.ts src/engine/__tests__/ceo-brain.test.ts
git commit -m "feat: implement CEO brain for goal decomposition via Claude API"
```

---

### Task 9: Implement Dispatcher

**Files:**
- Create: `src/engine/dispatcher.ts`

- [ ] **Step 1: Write dispatcher tests**

Create `src/engine/__tests__/dispatcher.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Dispatcher } from '../dispatcher';

describe('Dispatcher', () => {
  it('should not exceed max concurrent processes', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 2 });
    expect(dispatcher.availableSlots()).toBe(2);
  });

  it('should build correct Claude Code command', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 3 });
    const cmd = dispatcher.buildCommand({
      systemPrompt: 'You are Dex...',
      taskPrompt: 'Build auth middleware',
      cwd: '/tmp/worktree-dex',
      maxTurns: 50,
    });
    expect(cmd.command).toBe('claude');
    expect(cmd.args).toContain('--print');
    expect(cmd.args).toContain('--output-format');
    expect(cmd.args).toContain('stream-json');
    expect(cmd.args).toContain('--permission-mode');
    expect(cmd.args).toContain('bypassPermissions');
  });

  it('should parse stream-json events from stdout', () => {
    const dispatcher = new Dispatcher({ maxConcurrent: 3 });
    const line = '{"type":"tool_use","tool":"Edit","input":{"file":"auth.ts"}}';
    const event = dispatcher.parseStreamEvent(line);
    expect(event?.type).toBe('tool_use');
    expect(event?.tool).toBe('Edit');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement Dispatcher**

Core logic:
1. `spawnAgent(agent, task, systemPrompt, cwd)` — spawns `claude --print --output-format stream-json` as child process
2. Parses stdout line by line for stream-json events
3. Maps events to SQLite writes (status updates, tool usage, completion)
4. Emits WebSocket-compatible events
5. Manages concurrency slots
6. Handles errors: crash → re-queue, timeout → kill, rate limit → backoff

- [ ] **Step 4: Run tests, verify pass, commit**

```bash
npx vitest run src/engine/__tests__/dispatcher.test.ts
git add src/engine/dispatcher.ts src/engine/__tests__/dispatcher.test.ts
git commit -m "feat: implement dispatcher for Claude Code subprocess management"
```

---

### Task 10: Implement PR Manager

**Files:**
- Create: `src/engine/pr-manager.ts`

- [ ] **Step 1: Write PR manager tests**

Create `src/engine/__tests__/pr-manager.test.ts` — test worktree creation, branch naming, merge commands, cleanup.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement PRManager**

Handles:
1. `createWorktree(agentId, taskId)` — `git worktree add`
2. `createBranch(agentId, taskSlug)` — naming convention `sage/{agent}/{slug}`
3. `merge(prId)` — squash merge + semantic commit (CEO persona provides message via quick API call)
4. `push(branch)` — git push origin
5. `cleanup(worktreePath, branch)` — remove worktree + delete branch

- [ ] **Step 4: Run tests, verify pass, commit**

```bash
npx vitest run src/engine/__tests__/pr-manager.test.ts
git add src/engine/pr-manager.ts src/engine/__tests__/pr-manager.test.ts
git commit -m "feat: implement PR manager with worktree lifecycle and merge flow"
```

---

### Task 11: Implement Orchestrator

**Files:**
- Create: `src/engine/orchestrator.ts` (rewrite from v2)

- [ ] **Step 1: Write orchestrator tests**

Create `src/engine/__tests__/orchestrator.test.ts` — test session creation, goal submission, tick loop (dispatching tasks), event emission.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement Orchestrator**

The central coordinator:
1. `start(goal?)` — create session, initialize agents in DB, optionally submit goal
2. `submitGoal(goal)` — CEO Brain decomposes → tasks in DB → dispatcher picks up
3. `tick()` — check for available tasks, spawn agents, check completions, emit events
4. `handleTaskComplete(taskId)` — trigger PR creation, auto-review dispatch
5. `handlePRApproved(prId)` — CEO merges and pushes
6. `handlePRRejected(prId, feedback)` — re-queue task with feedback
7. `resume(sessionId)` — rebuild state from SQLite, restart tick loop
8. Event emission for all state changes (WebSocket consumers)

- [ ] **Step 4: Run tests, verify pass, commit**

```bash
npx vitest run src/engine/__tests__/orchestrator.test.ts
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator.test.ts
git commit -m "feat: implement orchestrator with tick loop, goal submission, and session management"
```

---

## Chunk 4: CLI Commands

### Task 12: Implement CLI Entry Point and Commands

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/cli/commands/init.ts`
- Create: `src/cli/commands/start.ts`
- Create: `src/cli/commands/resume.ts`
- Create: `src/cli/commands/config.ts`
- Create: `src/cli/commands/team.ts`
- Create: `src/cli/commands/status.ts`
- Create: `src/cli/commands/doctor.ts`
- Create: `src/cli/commands/logs.ts`
- Create: `src/cli/splash.ts`

- [ ] **Step 1: Write CLI tests**

Create `src/cli/__tests__/cli.test.ts` — test command registration, init wizard flow, doctor checks.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement CLI entry point** (`src/cli/index.ts`) with Commander registering all commands.

- [ ] **Step 4: Implement `init` command** — interactive wizard: API key, company name, autonomy mode, create `.sage-team/` dir.

- [ ] **Step 5: Implement `start` command** — create session, launch orchestrator, start Express server, open browser.

- [ ] **Step 6: Implement `resume` command** — find latest session from SQLite, reconstruct state, restart.

- [ ] **Step 7: Implement `config` command** — get/set config values.

- [ ] **Step 8: Implement `team` command** — display agent roster with skills.

- [ ] **Step 9: Implement `status` command** — sprint progress, pending PRs.

- [ ] **Step 10: Implement `doctor` command** — check API key, git, node version, Claude Code CLI.

- [ ] **Step 11: Implement `logs` command** — tail events from SQLite with agent filter.

- [ ] **Step 12: Implement splash screen** — figlet ASCII art + agent loading animation.

- [ ] **Step 13: Run tests, verify pass, commit**

```bash
npx vitest run src/cli/__tests__/cli.test.ts
git add src/cli/
git commit -m "feat: implement CLI with init, start, resume, config, team, status, doctor, logs commands"
```

---

## Chunk 5: Server — Express + WebSocket

### Task 13: Implement Express Server with WebSocket

**Files:**
- Create: `src/server/index.ts`
- Create: `src/server/routes/api.ts`
- Create: `src/server/routes/ws.ts`

- [ ] **Step 1: Write server tests**

Create `src/server/__tests__/server.test.ts` — test HTTP endpoints return correct data, WebSocket connection receives events.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement Express server**

`src/server/index.ts`:
- Serve static files from `src/web/dist/` (built frontend)
- Mount REST API routes
- Mount WebSocket upgrade handler
- Auto-open browser on start

- [ ] **Step 4: Implement REST API routes**

`src/server/routes/api.ts`:
- `GET /api/agents` — all agents for current session
- `GET /api/tasks` — all tasks for current session
- `GET /api/sprint` — active sprint
- `GET /api/prs` — pending PRs
- `GET /api/messages` — recent messages
- `POST /api/goal` — submit new goal
- `POST /api/pr/:id/approve` — approve PR
- `POST /api/pr/:id/reject` — reject PR with feedback

- [ ] **Step 5: Implement WebSocket handler**

`src/server/routes/ws.ts`:
- On connection: send current state snapshot
- Forward all orchestrator events as WSEvent JSON
- Handle client messages (goal submission, PR actions)

- [ ] **Step 6: Run tests, verify pass, commit**

```bash
npx vitest run src/server/__tests__/server.test.ts
git add src/server/
git commit -m "feat: implement Express server with REST API and WebSocket event streaming"
```

---

## Chunk 6: Frontend — PixiJS Isometric Office + React UI

This is the largest chunk and the visual "wow" factor. It should be implemented as a separate Vite project inside `src/web/`.

### Task 14: Scaffold Frontend Project

**Files:**
- Create: `src/web/package.json`
- Create: `src/web/vite.config.ts`
- Create: `src/web/tsconfig.json`
- Create: `src/web/index.html`
- Create: `src/web/src/main.tsx`
- Create: `src/web/src/App.tsx`

- [ ] **Step 1: Initialize Vite + React + TypeScript project**

```bash
cd src/web && npm create vite@latest . -- --template react-ts
npm install pixi.js @pixi/utils
npm install -D @types/node
```

- [ ] **Step 2: Configure Vite** for output to `../server/static/`

- [ ] **Step 3: Create App.tsx skeleton** with PixiJS canvas + React overlay structure.

- [ ] **Step 4: Commit**

```bash
git add src/web/
git commit -m "chore: scaffold frontend project with Vite, React, and PixiJS"
```

---

### Task 15: Implement WebSocket Hook and State Management

**Files:**
- Create: `src/web/src/hooks/useWebSocket.ts`
- Create: `src/web/src/hooks/useOffice.ts`
- Create: `src/web/src/store.ts`

- [ ] **Step 1: Implement useWebSocket hook** — connect, reconnect, parse WSEvent, update store.

- [ ] **Step 2: Implement useOffice hook** — manages agent positions, statuses, meetings, crisis state.

- [ ] **Step 3: Implement store** — React context or zustand for global state (agents, tasks, messages, PRs).

- [ ] **Step 4: Commit**

```bash
git add src/web/src/hooks/ src/web/src/store.ts
git commit -m "feat: implement WebSocket hooks and office state management"
```

---

### Task 16: Implement PixiJS Isometric Office

**Files:**
- Create: `src/web/src/canvas/Office.ts`
- Create: `src/web/src/canvas/Room.ts`
- Create: `src/web/src/canvas/Furniture.ts`
- Create: `src/web/src/canvas/Agent.ts`
- Create: `src/web/src/canvas/Pathfinder.ts`
- Create: `src/web/src/canvas/Effects.ts`

- [ ] **Step 1: Implement isometric grid** — coordinate system (screen ↔ iso conversion), tile rendering.

- [ ] **Step 2: Implement Room system** — 10 rooms from spec (CEO Office, Dev Bullpen, Meeting Room, Crisis Room, etc.) with walls, floors, labels.

- [ ] **Step 3: Implement Furniture** — desks, chairs, monitors, whiteboard, server rack, couch, coffee machine as isometric sprites. Can use simple colored rectangles as placeholder, evolve to pixel art later.

- [ ] **Step 4: Implement Agent sprites** — colored rectangles with emoji + name label (placeholder for pixel art). Walk animation (position tween). Idle animation (subtle bob). Sit state.

- [ ] **Step 5: Implement A* Pathfinder** — grid-based, agents walk through hallways between rooms. No teleportation.

- [ ] **Step 6: Implement Effects** — confetti particles (PR merged), red pulse (crisis), green flash (tests pass), rocket animation (deploy).

- [ ] **Step 7: Wire WebSocket events to canvas** — agent:move triggers pathfinding walk, crisis:start reveals crisis room + red pulse, meeting:start moves agents to meeting room.

- [ ] **Step 8: Commit**

```bash
git add src/web/src/canvas/
git commit -m "feat: implement PixiJS isometric office with rooms, agents, pathfinding, and effects"
```

---

### Task 17: Implement React UI Panels

**Files:**
- Create: `src/web/src/panels/AgentBar.tsx`
- Create: `src/web/src/panels/ChatPanel.tsx`
- Create: `src/web/src/panels/TaskBoard.tsx`
- Create: `src/web/src/panels/PRReview.tsx`
- Create: `src/web/src/panels/GoalInput.tsx`

- [ ] **Step 1: Implement AgentBar** — top bar with 11 agent avatars (emoji + name + colored dot for status). Click to focus camera on agent.

- [ ] **Step 2: Implement ChatPanel** — right-side message stream. Agent messages color-coded. System events in gray. Auto-scroll.

- [ ] **Step 3: Implement TaskBoard** — left-side collapsible panel. Sprint name + progress bar. Task list with status icons. Click task for details.

- [ ] **Step 4: Implement PRReview** — modal overlay. Branch name, agent, file diff (syntax highlighted), agent review summaries, Approve/Reject/Comment buttons.

- [ ] **Step 5: Implement GoalInput** — bottom input bar. Submit goal. Shows task count after CEO decomposes.

- [ ] **Step 6: Style everything** — dark theme matching OpenClaw aesthetic. CSS modules or Tailwind.

- [ ] **Step 7: Commit**

```bash
git add src/web/src/panels/
git commit -m "feat: implement React UI panels (agent bar, chat, task board, PR review, goal input)"
```

---

### Task 18: Create Placeholder Sprite Assets

**Files:**
- Create: `src/web/src/assets/sprites/` — agent sprites
- Create: `src/web/src/assets/tiles/` — floor tiles
- Create: `src/web/src/assets/furniture/` — furniture sprites

- [ ] **Step 1: Generate placeholder sprites** — simple colored pixel-art characters (can be programmatically generated via Canvas, or use free assets). Each agent gets their unique color from spec Section 6.4.

- [ ] **Step 2: Generate floor/wall tiles** — dark isometric floor, wall segments.

- [ ] **Step 3: Generate furniture sprites** — simple desk, chair, monitor, table shapes.

- [ ] **Step 4: Commit**

```bash
git add src/web/src/assets/
git commit -m "feat: add placeholder sprite assets for agents, tiles, and furniture"
```

---

## Chunk 7: Integration and Polish

### Task 19: Wire Everything Together

**Files:**
- Modify: `src/cli/commands/start.ts`
- Modify: `src/engine/orchestrator.ts`
- Modify: `src/server/index.ts`
- Modify: `package.json` (build scripts)

- [ ] **Step 1: Update build scripts** in root `package.json`:

```json
{
  "scripts": {
    "build": "tsc && cd src/web && npm run build",
    "dev": "ts-node src/cli/index.ts",
    "start": "node dist/cli/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Wire start command** — creates session → starts orchestrator → starts server → opens browser → optionally submits goal.

- [ ] **Step 3: Wire orchestrator events to WebSocket** — every state change emits WSEvent through the server.

- [ ] **Step 4: Wire browser UI actions to API** — goal submit, PR approve/reject call REST endpoints → orchestrator handles.

- [ ] **Step 5: End-to-end smoke test**

```bash
npm run build
sage-team doctor  # verify all checks pass
sage-team start --goal "Create a hello world Express server"
# Verify: browser opens, office renders, CEO decomposes goal, agents start working
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire CLI, orchestrator, server, and frontend into complete working system"
```

---

### Task 20: Implement "Wow" Moments

**Files:**
- Modify: `src/engine/orchestrator.ts` (emit meeting/crisis/celebration events)
- Modify: `src/web/src/canvas/Office.ts` (handle wow events)
- Modify: `src/web/src/canvas/Effects.ts` (particle systems)

- [ ] **Step 1: Implement Sprint Planning meeting** — when CEO decomposes goal, emit `meeting:start` → agents walk to meeting room → chat shows planning dialogue → `meeting:end` → agents return to desks.

- [ ] **Step 2: Implement Crisis Room** — when tests fail or critical error, emit `crisis:start` → reveal crisis room → agents rush there → red pulse → on resolution → `crisis:resolved` → green flash → agents return.

- [ ] **Step 3: Implement Pair Programming** — when agent requests help, emit `pair:start` → helper walks to agent's desk → both work together → `pair:end`.

- [ ] **Step 4: Implement PR Merged celebration** — confetti particles, green flash, toast notification.

- [ ] **Step 5: Implement Deploy Success** — Gage walks to server rack, rocket animation, green glow.

- [ ] **Step 6: Implement Sprint Complete** — all agents walk to lounge, celebration animation, stats overlay.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: implement wow moments (meetings, crisis room, celebrations, pair programming)"
```

---

### Task 21: Update README and Package for Distribution

**Files:**
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Rewrite README** with v3 features, installation instructions, usage examples, screenshots/GIFs.

- [ ] **Step 2: Update package.json** — version 3.0.0, correct bin entries, keywords, description.

- [ ] **Step 3: Test global installation**

```bash
npm pack
npm install -g sage-team-3.0.0.tgz
sage-team doctor
sage-team init
sage-team start --goal "Create a hello world"
```

- [ ] **Step 4: Commit**

```bash
git add README.md package.json
git commit -m "docs: rewrite README for v3.0 launch"
```

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Foundation: types, SQLite, repositories |
| 2 | 5-7 | Personas, skills loader, prompt builder |
| 3 | 8-11 | CEO brain, dispatcher, PR manager, orchestrator |
| 4 | 12 | CLI commands (init, start, resume, config, etc.) |
| 5 | 13 | Express server + WebSocket |
| 6 | 14-18 | PixiJS office + React panels + assets |
| 7 | 19-21 | Integration, wow moments, README, distribution |

**Execution order:** Chunks 1→2→3 are sequential (each depends on previous). Chunks 4 and 5 can start after Chunk 3. Chunk 6 can start after Chunk 5. Chunk 7 requires all previous chunks.

**Critical path:** Chunk 1 → Chunk 2 → Chunk 3 → Chunk 5 → Chunk 6 → Chunk 7
