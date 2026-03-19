# Sage Team v3.0 — Architecture Design Spec

> **Status:** Draft
> **Date:** 2026-03-19
> **Author:** Aria (Architect Agent) + Human
> **Approved sections:** All 6 sections approved during brainstorming

---

## 1. Vision & Goals

Sage Team is an **installable AI-powered software company**. Users install it, give a goal, and a team of 11 autonomous AI agents designs, codes, tests, reviews, and deploys real software — not simulations.

### Target Audience (Progressive)

1. **Phase 1:** Developers and indie hackers — multiply productivity
2. **Phase 2:** Startups and small teams — AI team extension
3. **Phase 3:** Non-technical users — describe idea, receive software

### Business Model

- 100% open-source (MIT)
- User provides their own Anthropic API key
- Future monetization via cloud/hosted version

### Success Criteria (v1.0 — "Wow" Release)

- Polished isometric 2D office visualization (OpenClaw-style)
- 5-6 agents executing real work in parallel
- Visible agent movement, meetings, crisis room, celebrations
- Demo-worthy experience that can go viral
- Sandbox mode (git worktrees) + direct mode
- Resume sessions across restarts

---

## 2. Architecture Overview — Hybrid Engine

```
┌───────────────────────────────────────────────────┐
│  sage-team CLI (TypeScript)                        │
│                                                    │
│  ┌──────────────┐    ┌──────────────────────────┐ │
│  │ Orchestrator  │    │  State Layer (SQLite)     │ │
│  │               │    │  • agents, tasks, sprints │ │
│  │  ┌──────────┐│    │  • messages, events       │ │
│  │  │CEO Brain ││    │  • decisions, PRs          │ │
│  │  │(API call)││    │  • sessions, skills        │ │
│  │  └────┬─────┘│    └──────────────────────────┘ │
│  └───────┼──────┘                                  │
│     ┌────┼──────────┬──────────┐                   │
│  ┌──┴───────┐ ┌─────┴────┐ ┌──┴────────┐          │
│  │CC Process│ │CC Process│ │CC Process │          │
│  │Dex (Dev) │ │Quinn(QA) │ │Gage (Ops)│          │
│  │worktree  │ │worktree  │ │direct    │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Express Server (localhost)                    │ │
│  │    ↕ WebSocket                                │ │
│  │ Browser: PixiJS Isometric Office + React UI   │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Execution engine | Claude Code subprocess | Leverages existing tools (Read, Write, Edit, Bash) — no reinvention |
| Planning engine | Claude API direct (Sonnet/Haiku) | Cheap and fast for decomposition, no subprocess overhead |
| State persistence | SQLite | Atomic, queryable, zero setup, single file |
| Isolation | Git worktrees | Native git isolation, no container overhead |
| Visualization | PixiJS + React in browser | Isometric 2D pixel art, impossible in terminal |
| Communication | WebSocket | Real-time events from orchestrator to browser |
| Skills | Real protocol injection | Full skill file content injected into Claude Code system prompt |

---

## 3. State Layer (SQLite)

Single file: `.sage-team/state.db`

### Schema

```sql
-- Core tables
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resumed_at DATETIME,
  completed_at DATETIME
);

CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  mood TEXT NOT NULL DEFAULT 'focused',
  position_room TEXT NOT NULL,
  position_seat INTEGER,
  current_task_id TEXT REFERENCES tasks(id),
  active_skills TEXT, -- JSON array of skill IDs
  session_id TEXT REFERENCES sessions(id),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, in_review, completed, failed
  priority INTEGER NOT NULL DEFAULT 3, -- 1=critical, 5=low
  assignee_id TEXT REFERENCES agents(id),
  required_skills TEXT, -- JSON array of skill IDs
  depends_on TEXT, -- JSON array of task IDs
  sprint_id TEXT REFERENCES sprints(id),
  session_id TEXT REFERENCES sessions(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE sprints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  session_id TEXT REFERENCES sessions(id),
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  from_agent TEXT NOT NULL,
  to_agent TEXT, -- NULL = broadcast to all
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'chat', -- chat, decision, review, crisis
  session_id TEXT REFERENCES sessions(id),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  agent_id TEXT,
  data TEXT, -- JSON payload
  session_id TEXT REFERENCES sessions(id),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  type TEXT NOT NULL, -- delegate, self-assign, escalate, dispatch, crisis
  action TEXT NOT NULL,
  reasoning TEXT,
  confidence REAL, -- 0.0 to 1.0
  outcome TEXT, -- success, failure, pending
  session_id TEXT REFERENCES sessions(id),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pull_requests (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  -- pending_review → agent_reviewed → user_approved/user_rejected → merged/rework
  review_notes TEXT, -- JSON: agent reviews
  user_feedback TEXT,
  merged_by TEXT, -- always CEO
  session_id TEXT REFERENCES sessions(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  merged_at DATETIME
);

CREATE TABLE skill_executions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  skill_id TEXT NOT NULL,
  skill_source TEXT NOT NULL, -- superpowers, antigravity
  task_id TEXT REFERENCES tasks(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, failed
  output TEXT,
  session_id TEXT REFERENCES sessions(id),
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Indexes for dashboard polling
CREATE INDEX idx_events_session_ts ON events(session_id, timestamp);
CREATE INDEX idx_agents_session ON agents(session_id);
CREATE INDEX idx_tasks_status ON tasks(status, session_id);
CREATE INDEX idx_prs_status ON pull_requests(status, session_id);

-- Performance & concurrency pragmas (set on connection open)
-- PRAGMA journal_mode=WAL;       -- Write-Ahead Logging for concurrent reads/writes
-- PRAGMA busy_timeout=5000;      -- Wait up to 5s on lock contention
-- PRAGMA synchronous=NORMAL;     -- Balance durability vs performance
-- PRAGMA cache_size=-64000;      -- 64MB cache

-- Event cleanup: keep max 10,000 events per session
-- DELETE FROM events WHERE session_id = ? AND id NOT IN (
--   SELECT id FROM events WHERE session_id = ? ORDER BY timestamp DESC LIMIT 10000
-- );
```

---

## 4. Orchestration Layer

### 4.1 CEO Brain (Planning)

Uses Claude API directly (Sonnet for complex goals, Haiku for simple decomposition).

```
User submits goal
       ↓
CEO Brain receives goal
       ↓
Calls Claude API with:
  - Company context (name, mission, team roster)
  - Current sprint state (if resuming)
  - Agent capabilities and skill inventories
  - Goal text
       ↓
Returns structured JSON:
  {
    sprint: { name, goal },
    tasks: [
      {
        title, description, priority,
        assignee: "dex",
        required_skills: ["sp-tdd", "ag-typescript-pro"],
        depends_on: ["task-1"]
      }
    ]
  }
       ↓
Orchestrator writes to SQLite
       ↓
Dispatcher begins execution
```

### 4.2 Dispatcher

TypeScript process that manages Claude Code subprocesses.

```typescript
// Pseudocode
class Dispatcher {
  maxConcurrent: number; // default 3, configurable

  async tick() {
    const available = this.maxConcurrent - this.runningProcesses.length;
    if (available <= 0) return;

    const tasks = await db.getNextAvailableTasks(available);
    for (const task of tasks) {
      const agent = await db.getAgent(task.assignee_id);
      const skills = await this.loadSkillProtocols(task.required_skills);
      this.spawnAgent(agent, task, skills);
    }
  }

  spawnAgent(agent, task, skills) {
    // 1. Create worktree (if sandbox mode)
    // 2. Build system prompt (persona + skills + task)
    // 3. Spawn: claude --system-prompt "..." --prompt "..." --cwd worktree
    // 4. Stream stdout → parse events → write to SQLite
    // 5. On complete → create PR branch → status = pending_review
  }
}
```

### 4.3 Task Dependencies

Tasks execute in dependency order. The dispatcher only picks tasks whose dependencies are all completed.

```
Architecture design (Aria) ──→ Database schema (Atlas) ──→ API routes (Dex)
                               └──→ UI components (Flux) ──→ E2E tests (Quinn)
                                                             └──→ Deploy (Gage)
```

### 4.4 Autonomy Modes

| Mode | Behavior | Use case |
|------|----------|----------|
| `sandbox` | Each agent works in isolated git worktree. Output becomes PR branch. User must approve before CEO merges. | Default. Safe. Review everything. |
| `direct` | Agents edit repo directly. Auto-commit with `[sage:agent-name]` prefix. | Trusted workflows, experienced users. |
| `supervised` | Like direct, but pauses before each commit asking user approval in browser UI. | Middle ground. |

---

## 5. Execution Layer

### 5.1 Agent Lifecycle

```
IDLE → ASSIGNED → WORKING → REVIEW → DONE
  ↑                  ↓         ↓
  └──── REWORK ←─────┘    (user rejected)
```

### 5.2 Claude Code Subprocess

Each execution agent is a Claude Code process spawned via `child_process.spawn`:

```bash
# Non-interactive mode with --print, stream-json for structured output
cd /path/to/worktree && claude \
  --print \
  --output-format stream-json \
  --system-prompt "$(cat agent-prompt.md)" \
  --permission-mode bypassPermissions \
  --max-turns 50 \
  "Execute this task: {task.description}"
```

**Key flags:**
- `--print` — Non-interactive mode (required for subprocess usage)
- `--output-format stream-json` — Structured JSON event stream on stdout
- `--permission-mode bypassPermissions` — No interactive approval prompts
- `--max-turns 50` — Prevent runaway agents (configurable per task complexity)
- Working directory set via subprocess `cwd` option (not a CLI flag)
- Prompt is a positional argument (not `--prompt`)

### 5.2.1 Subprocess Output Parsing

Claude Code with `--output-format stream-json` emits one JSON object per line:

```jsonl
{"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
{"type":"tool_use","tool":"Edit","input":{...}}
{"type":"tool_result","output":"..."}
{"type":"result","cost_usd":0.042,"duration_ms":12000,"turns":5}
```

The dispatcher parses this stream to:
- Detect `tool_use` events → update agent status in SQLite ("coding", "testing", etc.)
- Detect `tool_result` events → log file changes, command outputs
- Detect `result` event → task completed, record cost
- Detect errors/timeouts → mark task as failed, re-queue if retries remain

### 5.2.2 Error Recovery

| Failure | Response |
|---------|----------|
| Subprocess crash | Re-queue task with error context. Max 2 retries. |
| API rate limit (429) | Exponential backoff: 30s, 60s, 120s. Reduce concurrent agents. |
| Token budget exceeded | Pause task, notify user via WebSocket. |
| Subprocess timeout | Kill process, re-queue with simplified prompt. |
| Agent goes off-task | Detected via output parsing — kill and re-queue with stricter prompt. |
| Partial work (crash mid-commit) | Worktree preserves state. Resume from worktree on retry. |

### 5.3 System Prompt Injection

Each agent receives a system prompt built from:

```markdown
# Identity
You are {agent.name}, {agent.role} at {company.name}.
{agent.persona_description}

# Active Skills
The following skill protocols are ACTIVE for this task. Follow them exactly.
Only task-relevant skills are injected (max 3 per task to stay within token budget).

## {skill.name} (from {skill.source})
{skill.full_protocol_content}

### Verification Steps
{skill.verification_steps}

# Current Task
Title: {task.title}
Description: {task.description}
Required skills: {task.required_skills}
Dependencies completed: {resolved_dependencies_summary}

# Rules
- Work ONLY on the assigned task
- Follow ALL active skill protocols exactly
- Commit with message: [sage:{agent.id}] {semantic description}
- Do NOT push — CEO handles all push operations
- Run tests before marking complete
```

**System prompt token budget:** Max 30,000 tokens per agent prompt. The prompt builder:
1. Always includes: Identity + Task + Rules (~2,000 tokens)
2. Injects task-required skills first (highest priority)
3. Fills remaining budget with agent's general skills by relevance
4. If a single skill exceeds 10,000 tokens, inject a condensed version (protocol steps only, no examples)

### 5.4 Skill Protocol Injection

Skills are injected as full text, not summaries:

```typescript
async loadSkillProtocols(skillIds: string[]): Promise<string> {
  let protocols = '';
  for (const id of skillIds) {
    if (id.startsWith('sp-')) {
      // Read from superpowers installation
      const content = await readSkillFile(`superpowers/skills/${skillMap[id]}`);
      protocols += `\n## ${id}\n${content}\n`;
    } else if (id.startsWith('ag-')) {
      // Read from antigravity-awesome-skills
      const content = await readSkillFile(`antigravity/skills/${skillMap[id]}`);
      protocols += `\n## ${id}\n${content}\n`;
    }
  }
  return protocols;
}
```

### 5.5 PR Flow

```
Agent completes task in worktree
       ↓
Creates branch: sage/{agent-id}/{task-slug}
       ↓
Writes PR record to SQLite (status: pending_review)
       ↓
Auto-review triggered:
  - Quinn (QA): runs tests, checks coverage
  - Nova (CTO): reviews security, patterns, architecture
       ↓
PR status → agent_reviewed
Review notes stored in SQLite
       ↓
Browser UI shows PR review panel:
  - Diff viewer
  - Agent review summaries
  - [Approve] [Reject] [Comment] buttons
       ↓
User approves → PR status → user_approved
       ↓
CEO (Sage) receives approval:
  1. Squash merge branch into main
  2. Semantic commit message
  3. Push to remote
  4. PR status → merged
  5. Celebration event emitted → confetti in office
       ↓
User rejects → PR status → user_rejected
  - User feedback stored
  - Task re-queued with feedback context
  - Original agent receives rework assignment
```

**CEO Merge Mechanism:** The CEO "merge + push" is executed by the **PR Manager** (TypeScript code in the orchestrator), not by a Claude Code subprocess. The PR Manager runs git commands directly:
1. `git merge --squash sage/{agent}/{task-slug}`
2. `git commit -m "[sage:ceo] {semantic message based on task title}"`
3. `git push origin {branch}`
4. Cleanup: `git worktree remove` + `git branch -d`

The CEO persona provides the semantic context (commit message, merge strategy) via a quick Claude API call, but the actual git operations are deterministic code — no LLM in the loop for destructive operations.

### 5.6 Worktree Lifecycle

```
Task assigned to agent (sandbox mode)
       ↓
Create worktree:
  git worktree add .sage-team/worktrees/{agent-id}-{task-id} -b sage/{agent-id}/{task-slug}
  Base: current HEAD of main branch
       ↓
Agent works in worktree (Claude Code subprocess cwd = worktree path)
       ↓
On task complete: agent commits in worktree branch
       ↓
On PR merge: orchestrator squash-merges branch into main
       ↓
Cleanup: git worktree remove + git branch -d
       ↓
On session resume with stale worktrees:
  - Check for uncommitted changes → preserve, notify user
  - Check for committed but unmerged → restore as pending PR
  - Check for orphaned worktrees → clean up
```

**Limits:** Max 5 concurrent worktrees (git recommendation). Dispatcher respects this limit in sandbox mode.

### 5.7 Auto-Review Dispatch

When a PR is created, reviews are dispatched as lightweight tasks:
- Quinn (QA) review: spawns Claude Code subprocess in the worktree (read-only — only runs tests, no edits)
- Nova (CTO) review: spawns Claude Code subprocess (read-only — reviews code, writes review notes)
- Reviews do NOT consume a regular concurrency slot — they use a separate review queue (max 2 concurrent reviews)
- Reviews are non-blocking: if Quinn/Nova are busy with their own tasks, reviews queue until a slot opens
- Review output is a structured JSON verdict written to SQLite (approve/request-changes + notes)

---

## 6. Visual Layer — The Living Office

### 6.1 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Server | Express.js | Serve static + WebSocket |
| Renderer | PixiJS | Isometric 2D canvas rendering |
| UI Overlay | React | Panels, modals, input, chat |
| Communication | WebSocket | Real-time orchestrator → browser |
| Sprites | Custom pixel art | Agent characters, furniture, effects |
| Pathfinding | A* on grid | Agent movement between rooms |

### 6.2 Office Layout (Isometric)

```
┌────────────┬────────────┬────────────┐
│ CTO Office │ CEO Office │ Arch Lab   │
│ (Nova 🔬)  │ (Sage 👑)  │ (Aria 🏛️)  │
├────────────┼────────────┤────────────┤
│ Dev Bullpen│  Meeting   │  QA Lab    │
│(Dex⚡Flux🌊)│   Room     │(Quinn🔍Gage🚀)│
├────────────┼────────────┼────────────┤
│ Design     │  Lounge    │ Data Lab   │
│ (Uma 🎨)   │ (River 🌀)  │ (Atlas 📊) │
├────────────┴────────────┴────────────┤
│         🚨 CRISIS ROOM 🚨            │
│    (hidden — revealed on crisis)     │
└──────────────────────────────────────┘
```

### 6.3 Rendering Layers

| Layer (bottom → top) | Content |
|----------------------|---------|
| Floor | Isometric tile grid, dark theme |
| Walls | Room dividers, doors, windows |
| Furniture | Desks, chairs, monitors, whiteboard, server rack, coffee machine, couch |
| Agents | Pixel-art sprites with walk cycle animations |
| Labels | Floating name + emoji + status badge above each agent |
| Effects | Confetti, red flash, rocket, green glow, particles |
| UI | React overlay: agent bar, chat, task board, PR review, goal input |

### 6.4 Agent Sprites

Each agent has a unique color and spritesheet:

| Agent | Color | Emoji |
|-------|-------|-------|
| Sage | Gold / Royal | 👑 |
| Nova | Red / Crimson | 🔬 |
| Dex | Green / Emerald | ⚡ |
| Flux | Blue / Ocean | 🌊 |
| Quinn | Orange / Fire | 🔍 |
| Gage | Teal / Rocket | 🚀 |
| Morgan | Pink / Rose | 📋 |
| Uma | Purple / Violet | 🎨 |
| Aria | Lavender | 🏛️ |
| River | Cyan / Aqua | 🌀 |
| Atlas | Steel / Silver | 📊 |

Spritesheet per agent:
- 4 directions (up, down, left, right)
- 3 states (idle: 2 frames, walk: 4 frames, sit: 2 frames)
- Total: 4 × (2+4+2) = 32 frames per agent

### 6.5 Movement System

- Office grid mapped to isometric coordinates
- A* pathfinding for agent navigation between rooms
- Agents walk through hallways (no teleportation)
- Walk speed: normal (2 tiles/sec), urgent/crisis (4 tiles/sec)
- Agents respect doors and hallway paths

### 6.6 "Wow" Moments

#### Meeting Convened
- CEO calls meeting → event: `meeting:start`
- Each invited agent stands up from desk
- Walks through hallway to Meeting Room
- Sits around the table (assigned seats)
- Chat panel shows real conversation
- Badge "MEETING" appears on room
- Other agents continue working at desks

#### Crisis Room Activated
- Critical event detected (tests failing, security vulnerability, build broken)
- Event: `crisis:start` with severity and involved agents
- Crisis Room wall "opens" (hidden room revealed with animation)
- Screen border pulses red
- Relevant agents stop work → walk urgently (2x speed) to Crisis Room
- Office background dims
- "🚨 CRITICAL" badge flashes
- Chat shows debugging dialogue
- On resolution: green flash, agents return to desks, room closes

#### Pair Programming
- Agent requests help → walks to partner's desk
- Two sprites at same desk
- Both show `[>>_]` coding status
- Thought bubbles alternate between them
- Chat shows code discussion

#### PR Merged
- User approves → CEO merges
- Confetti particles explode from agent's position
- Green flash across office
- Toast notification: "✅ PR #3 merged by Sage"
- Agent does brief celebration animation

#### Deploy Success
- Gage walks to server rack (special furniture item)
- Progress bar animation on rack
- Rocket animation rises from rack
- Brief green glow across office
- Toast: "🚀 Deployed to production"

#### Sprint Complete
- Last task closes → event: `sprint:complete`
- All agents walk to Lounge
- Celebration animation (jump + confetti)
- Stats overlay appears: tasks completed, lines changed, tests passed, PRs merged
- Brief musical tone (optional, configurable)

### 6.7 WebSocket Events

```typescript
// Movement
{ type: 'agent:move', agentId: string, to: { room: string, seat?: number } }
{ type: 'agent:status', agentId: string, status: string, detail?: string }

// Collaboration
{ type: 'meeting:start', room: string, agents: string[], topic: string }
{ type: 'meeting:end', room: string }
{ type: 'pair:start', agents: [string, string], desk: string }
{ type: 'pair:end', agents: [string, string] }

// Crisis
{ type: 'crisis:start', severity: 'critical'|'high', message: string, agents: string[] }
{ type: 'crisis:resolved', message: string }

// Work
{ type: 'task:assigned', taskId: string, agentId: string }
{ type: 'task:completed', taskId: string, agentId: string }
{ type: 'skill:activated', agentId: string, skillId: string, phase?: string }
{ type: 'skill:completed', agentId: string, skillId: string }

// PR Flow
{ type: 'pr:created', prId: string, agentId: string, branch: string }
{ type: 'pr:reviewed', prId: string, reviews: { agentId: string, verdict: string }[] }
{ type: 'pr:user-approved', prId: string }
{ type: 'pr:merged', prId: string, mergedBy: 'sage' }

// Celebrations
{ type: 'celebration:pr-merged', prId: string, agentId: string }
{ type: 'celebration:deploy', environment: string }
{ type: 'celebration:sprint-complete', stats: object }

// Chat
{ type: 'chat:message', from: string, to: string|null, content: string }
```

### 6.8 Browser UI Panels (React)

**Top Bar:** Agent avatars in a row. Each shows emoji, name, colored dot (status), active skill badge. Click to focus camera on agent.

**Chat Panel (right):** Real-time message stream. Agent messages color-coded. System events in gray. Meeting transcripts indented.

**Task Board (collapsible left):** Sprint name + progress bar. Task list with status icons (⏳ pending, 🔄 in progress, 👀 in review, ✅ done). Click task to see details + assigned agent.

**PR Review Modal:** Opens when PR is pending user review. Shows: branch name, agent, file diff, agent review summaries (Quinn QA, Nova CTO), action buttons (Approve, Reject, Comment).

**Goal Input (bottom):** Text input to submit new goals. Shows estimation after CEO analyzes (task count, agents involved). Confirm button to start execution.

---

## 7. Skills System

### 7.1 Skill Sources

| Source | Repository | Type | Count |
|--------|-----------|------|-------|
| Superpowers | github.com/obra/superpowers | Workflow discipline (TDD, debugging, planning) | 12 |
| Antigravity | github.com/Petriccone/antigravity-awesome-skills | Technical expertise (React, Docker, SQL) | 25+ |
| Built-in | Sage Team internal | Browser automation, visual tracking | 2 |

### 7.2 Agent × Skill Mapping

#### 👑 Sage (CEO)
- `brainstorming` (Superpowers) — Design gate: NO code until approved
- `writing-plans` (Superpowers) — 2-5 min bite-sized tasks
- `dispatching-parallel-agents` (Superpowers) — One agent per domain
- `verification-before-completion` (Superpowers) — Fresh evidence required
- `product-strategy` (Antigravity) — Market analysis, RICE prioritization

#### 🔬 Nova (CTO)
- `requesting-code-review` (Superpowers) — Dispatch reviewer with context
- `receiving-code-review` (Superpowers) — Evaluate and implement feedback
- `security-audit` (Antigravity) — OWASP Top 10, threat modeling
- `api-design-principles` (Antigravity) — REST conventions, error handling
- `architecture` (Antigravity) — System design, scalability patterns
- `monitoring-observability` (Antigravity) — Logs, metrics, traces, SLOs

#### ⚡ Dex (Sr. Developer)
- `tdd-workflows-tdd-cycle` (Superpowers) — Iron Law: test first
- `tdd-workflows-tdd-red` (Superpowers) — Write minimal failing test
- `tdd-workflows-tdd-green` (Superpowers) — Write minimal passing code
- `tdd-workflows-tdd-refactor` (Superpowers) — Refactor with green bar
- `systematic-debugging` (Superpowers) — 4-phase root cause analysis
- `clean-code` (Antigravity) — SOLID, small functions, meaningful names
- `typescript-pro` (Antigravity) — Generics, strict mode, advanced patterns
- `auth-patterns` (Antigravity) — JWT, OAuth 2.0, RBAC, MFA

#### 🌊 Flux (Fullstack)
- `tdd-workflows-tdd-cycle` (Superpowers) — TDD discipline
- `finishing-a-development-branch` (Superpowers) — Merge, PR, cleanup
- `react-patterns` (Antigravity) — Hooks, server components, state
- `nextjs-best-practices` (Antigravity) — App Router, RSC, ISR
- `tailwind-design-system` (Antigravity) — Design tokens, components
- `frontend-design` (Antigravity) — Layout, responsive, visual hierarchy

#### 🔍 Quinn (QA Lead)
- `verification-before-completion` (Superpowers) — Fresh evidence gates
- `systematic-debugging` (Superpowers) — Root cause analysis
- `testing-patterns` (Antigravity) — Unit, integration, E2E, mocking
- `playwright-skill` (Antigravity) — Browser automation, visual testing
- `e2e-testing` (Antigravity) — Full user flow validation
- `accessibility-compliance` (Antigravity) — WCAG 2.1, ARIA, keyboard

#### 🚀 Gage (DevOps)
- `using-git-worktrees` (Superpowers) — Isolated worktrees with safety
- `docker-expert` (Antigravity) — Multi-stage builds, optimization
- `kubernetes-architect` (Antigravity) — K8s deploy, services, Helm
- `terraform-skill` (Antigravity) — IaC, modules, state management
- `cicd-automation` (Antigravity) — GitHub Actions, quality gates
- `github-actions-templates` (Antigravity) — Pipeline templates

#### 📋 Morgan (Product Manager)
- `brainstorming` (Superpowers) — Structured ideation with gates
- `writing-plans` (Superpowers) — Task decomposition
- `product-manager-toolkit` (Antigravity) — PRDs, RICE, roadmaps
- `analytics-tracking` (Antigravity) — Event tracking, metrics

#### 🎨 Uma (UX Designer)
- `brainstorming` (Superpowers) — Visual companion for mockups
- `ui-ux-designer` (Antigravity) — Research, prototyping, usability
- `accessibility-compliance` (Antigravity) — WCAG audit, screen readers
- `tailwind-design-system` (Antigravity) — Design tokens, library
- `frontend-design` (Antigravity) — Layout systems, responsive

#### 🏛️ Aria (Architect)
- `writing-plans` (Superpowers) — Architecture → implementation plan
- `subagent-driven-development` (Superpowers) — Fresh subagent per task
- `architecture` (Antigravity) — System design, DDD, microservices
- `api-design-principles` (Antigravity) — REST/GraphQL design
- `database-design` (Antigravity) — Schema, indexing, normalization
- `microservices-patterns` (Antigravity) — Service boundaries, events

#### 🌀 River (Scrum Master)
- `dispatching-parallel-agents` (Superpowers) — Coordinate parallel work
- `verification-before-completion` (Superpowers) — Sprint review evidence
- `agile-scrum` (Antigravity) — Sprint planning, retros, velocity
- `team-collaboration-standup-notes` (Antigravity) — Standup facilitation

#### 📊 Atlas (Data Engineer)
- `tdd-workflows-tdd-cycle` (Superpowers) — Test-driven data development
- `database-design` (Antigravity) — Schema, normalization, indexes
- `postgresql` (Antigravity) — PG optimization, RLS policies
- `sql-pro` (Antigravity) — Query optimization, CTEs, window functions
- `data-engineering-data-pipeline` (Antigravity) — ETL/ELT, streaming
- `ai-ml` (Antigravity) — RAG, embeddings, model integration

### 7.3 Canonical Skill IDs and File Mapping

All skill IDs use a prefix convention: `sp-` for Superpowers, `ag-` for Antigravity.

**Superpowers skill ID → file path:**

| Skill ID | File path (relative to superpowers/skills/) |
|----------|---------------------------------------------|
| `sp-brainstorming` | `brainstorming/brainstorming.md` |
| `sp-tdd-cycle` | `test-driven-development/test-driven-development.md` |
| `sp-tdd-red` | `test-driven-development/tdd-workflows/tdd-red.md` |
| `sp-tdd-green` | `test-driven-development/tdd-workflows/tdd-green.md` |
| `sp-tdd-refactor` | `test-driven-development/tdd-workflows/tdd-refactor.md` |
| `sp-systematic-debugging` | `systematic-debugging/systematic-debugging.md` |
| `sp-writing-plans` | `writing-plans/writing-plans.md` |
| `sp-dispatching-parallel` | `dispatching-parallel-agents/dispatching-parallel-agents.md` |
| `sp-verification` | `verification-before-completion/verification-before-completion.md` |
| `sp-requesting-review` | `requesting-code-review/requesting-code-review.md` |
| `sp-receiving-review` | `receiving-code-review/receiving-code-review.md` |
| `sp-finishing-branch` | `finishing-a-development-branch/finishing-a-development-branch.md` |
| `sp-subagent-dev` | `subagent-driven-development/subagent-driven-development.md` |
| `sp-git-worktrees` | `using-git-worktrees/using-git-worktrees.md` |
| `sp-writing-skills` | `writing-skills/writing-skills.md` |

**Antigravity skill ID → file path:** Resolved by convention: `ag-{name}` → `skills/{name}/{name}.md` or `skills/{name}.md`.

The `skill-loader.ts` maintains this map and resolves IDs to absolute file paths at runtime based on detected installation directories.

### 7.4 Skill Injection Mechanism

Skills are NOT labels or summaries. The **full protocol text** from the skill file is injected into the Claude Code system prompt.

```
System prompt = Agent persona + Active skill protocols + Task context + Rules
```

The orchestrator:
1. Reads required_skills from the task
2. Loads full skill file content from installed superpowers/antigravity directories
3. Concatenates into system prompt
4. Passes to Claude Code subprocess via --system-prompt

### 7.4 Skill Visualization

When an agent activates a skill, the office shows:
- **Thought bubble** above agent with skill icon
- **Status badge** changes: `[TDD 🔴]` → `[TDD 🟢]` → `[TDD 🔄]`
- **Activity log** entry: `"⚡ Dex activated TDD Red Phase on auth.middleware.ts"`
- **Collaborative skills** trigger movement (code review → walk to partner's desk)

---

## 8. CLI & User Experience

### 8.1 Installation

```bash
npm install -g sage-team
sage-team init    # Interactive setup wizard
```

The `init` wizard:
1. Checks for `ANTHROPIC_API_KEY` (env var or prompt)
2. Asks: company name, mission (or defaults)
3. Asks: autonomy mode (sandbox / direct / supervised)
4. Creates `.sage-team/` directory (state.db, config.json, worktrees/)
5. Adds `.sage-team/` to `.gitignore`
6. Shows splash screen with team roster

### 8.2 Commands

```bash
# Core
sage-team start                              # Launch office + agents
sage-team start --goal "Build a REST API"    # With initial goal
sage-team resume                             # Resume last session

# Configuration
sage-team config --show
sage-team config --api-key <key>
sage-team config --model claude-sonnet-4-20250514
sage-team config --max-agents 5
sage-team config --autonomy sandbox|direct|supervised
sage-team config --company-name "My Company"
sage-team config --mission "Build amazing things"

# Information
sage-team team                    # Show roster + current status
sage-team team --agent dex        # Agent details + skills
sage-team status                  # Sprint progress, PRs pending

# Debug
sage-team doctor                  # Health check (API key, git, node, deps)
sage-team logs                    # Tail activity log
sage-team logs --agent dex        # Filter by agent
```

### 8.3 Resume (Killer Feature)

```bash
$ sage-team resume

Resuming session from 2026-03-18...
Goal: "Build authentication system"
Progress: 5/7 tasks complete

Pending PRs:
  PR #5 sage/flux/auth-ui — awaiting your review

Remaining tasks:
  ⏳ E2E auth tests (Quinn)
  ⏳ Deploy staging (Gage)

Launching office...
```

SQLite preserves everything — resume reconstructs full state and continues.

### 8.4 First Run Experience

```bash
$ sage-team start --goal "Create a Next.js blog with auth and markdown posts"
```

1. Splash screen with ASCII art + agent roster loading animation
2. Browser opens with isometric office — all agents at their desks
3. CEO (Sage) stands up, thought bubble appears: "Analyzing goal..."
4. CEO walks to whiteboard, planning animation
5. Tasks appear on Task Board panel
6. CEO walks to Meeting Room, calls Sprint Planning
7. Agents walk to meeting room one by one
8. Chat shows planning dialogue
9. Meeting ends, agents return to desks and start working
10. Real Claude Code processes begin executing
11. User watches agents code, test, review in real-time

---

## 9. Project Structure (Target)

```
sage-team/
├── src/
│   ├── cli/
│   │   ├── index.ts              # Commander CLI entry point
│   │   ├── commands/
│   │   │   ├── start.ts          # Start office + orchestrator
│   │   │   ├── resume.ts         # Resume session
│   │   │   ├── init.ts           # Setup wizard
│   │   │   ├── config.ts         # Configuration management
│   │   │   ├── team.ts           # Team roster display
│   │   │   ├── status.ts         # Sprint/PR status
│   │   │   ├── doctor.ts         # Health check
│   │   │   └── logs.ts           # Activity log viewer
│   │   └── splash.ts             # Splash screen animation
│   │
│   ├── engine/
│   │   ├── orchestrator.ts       # Main orchestration loop
│   │   ├── ceo-brain.ts          # CEO planning via Claude API
│   │   ├── dispatcher.ts         # Claude Code subprocess manager
│   │   ├── skill-loader.ts       # Load skill protocols from files
│   │   ├── prompt-builder.ts     # Build agent system prompts
│   │   └── pr-manager.ts         # PR lifecycle management
│   │
│   ├── state/
│   │   ├── database.ts           # SQLite setup + migrations
│   │   ├── repositories/
│   │   │   ├── agents.ts         # Agent CRUD
│   │   │   ├── tasks.ts          # Task CRUD
│   │   │   ├── sprints.ts        # Sprint CRUD
│   │   │   ├── messages.ts       # Message CRUD
│   │   │   ├── events.ts         # Event log
│   │   │   ├── decisions.ts      # Decision records
│   │   │   ├── pull-requests.ts  # PR lifecycle
│   │   │   ├── sessions.ts       # Session management
│   │   │   └── skill-executions.ts
│   │   └── migrations/           # Schema versioning
│   │
│   ├── agents/
│   │   ├── personas.ts           # 11 agent definitions
│   │   ├── skills-map.ts         # Agent → skill assignments
│   │   └── autonomy.ts           # Autonomy mode logic
│   │
│   ├── skills/
│   │   ├── registry.ts           # Skill catalog + metadata
│   │   ├── loader.ts             # Read skill files from disk
│   │   └── matcher.ts            # Match tasks → skills → agents
│   │
│   ├── server/
│   │   ├── index.ts              # Express + WebSocket server
│   │   ├── routes/
│   │   │   ├── api.ts            # REST API for browser UI
│   │   │   └── ws.ts             # WebSocket event stream
│   │   └── static/               # Built frontend assets
│   │
│   ├── web/                      # Frontend (separate build)
│   │   ├── src/
│   │   │   ├── App.tsx           # React root
│   │   │   ├── canvas/
│   │   │   │   ├── Office.ts     # PixiJS isometric office
│   │   │   │   ├── Agent.ts      # Agent sprite + animation
│   │   │   │   ├── Furniture.ts  # Desk, chair, whiteboard sprites
│   │   │   │   ├── Room.ts       # Room boundaries + labels
│   │   │   │   ├── Pathfinder.ts # A* grid navigation
│   │   │   │   └── Effects.ts    # Confetti, flash, rocket particles
│   │   │   ├── panels/
│   │   │   │   ├── AgentBar.tsx  # Top bar with agent avatars
│   │   │   │   ├── ChatPanel.tsx # Right-side message stream
│   │   │   │   ├── TaskBoard.tsx # Left-side sprint tasks
│   │   │   │   ├── PRReview.tsx  # PR review modal
│   │   │   │   └── GoalInput.tsx # Bottom goal submission
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   └── useOffice.ts
│   │   │   └── assets/
│   │   │       ├── sprites/      # Agent spritesheets (PNG)
│   │   │       ├── tiles/        # Floor + wall tiles
│   │   │       └── furniture/    # Desk, chair, etc.
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── types/
│       └── index.ts              # Shared TypeScript types
│
├── .sage-team/                   # Created per-project (gitignored)
│   ├── state.db                  # SQLite database
│   ├── config.json               # Local config
│   └── worktrees/                # Git worktrees for sandbox mode
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 10. Dependencies (Target)

### Core
- `@anthropic-ai/sdk` — Claude API for CEO brain
- `better-sqlite3` — SQLite driver (sync, fast, no ORM overhead)
- `commander` — CLI framework
- `express` — HTTP server for browser UI
- `ws` — WebSocket server
- `nanoid` — ID generation
- `open` — Auto-open browser
- `conf` — Global config storage
- `chalk` + `ora` + `figlet` + `boxen` — CLI aesthetics

### Frontend (web/)
- `pixi.js` — 2D rendering engine (isometric office)
- `react` + `react-dom` — UI overlay panels
- `vite` — Frontend build tool

### Dev
- `typescript` — Type safety
- `vitest` — Testing
- `@playwright/test` — E2E testing

---

## 11. Migration Path (v2 → v3)

### Keep
- Agent personas (src/agents/personas.ts) — enhance, don't rewrite
- Skill registry structure (src/skills/registry.ts) — extend with real loading
- CLI command structure (commander) — add new commands
- Type definitions (src/types/index.ts) — extend

### Replace
- `blessed` dashboard → PixiJS browser UI
- In-memory state → SQLite
- Simulated execution → Claude Code subprocesses
- Fake events → Real WebSocket events
- `@playwright/mcp` for screenshots → PixiJS canvas for visualization

### New
- Express + WebSocket server
- Dispatcher (Claude Code subprocess manager)
- CEO Brain (API-based planning)
- PR Manager (review flow)
- Skill Loader (read real skill files)
- Frontend app (PixiJS + React)
- Session resume capability
- Git worktree management

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Goal** | High-level objective submitted by user (e.g., "Build a blog") |
| **Sprint** | Collection of tasks decomposed from a goal |
| **Task** | Atomic unit of work assigned to one agent |
| **Skill** | Protocol/workflow injected into agent's system prompt |
| **PR** | Pull request — branch created by agent, reviewed by team + user, merged by CEO |
| **Crisis** | Critical event that triggers emergency response (crisis room) |
| **Worktree** | Isolated git working directory for sandbox mode |
| **Session** | Persistent state from start to goal completion (survives restarts) |
