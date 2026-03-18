# Sage Team — Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        CLI Layer                          │
│                     (Commander.js)                        │
│   start │ config │ team │ doctor │ screenshot │ report    │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    Orchestrator Engine                     │
│              (EventEmitter3, Tick Loop: 3s)               │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ Task Mgmt   │  │ Agent Mgmt  │  │ Sprint Mgmt      │ │
│  │ dispatch    │  │ 11 agents   │  │ goals → sprints   │ │
│  │ assignment  │  │ autonomy    │  │ velocity tracking │ │
│  │ completion  │  │ decisions   │  │ story points      │ │
│  └─────────────┘  └─────────────┘  └──────────────────┘ │
└───┬───────────────────┬──────────────────────┬───────────┘
    │                   │                      │
┌───▼───────┐  ┌───────▼──────────┐  ┌────────▼──────────┐
│  Claude   │  │  Skill Engine    │  │  Playwright MCP   │
│  Client   │  │  27+ protocols   │  │  Screenshots      │
│  API      │  │  verification    │  │  Navigation       │
│           │  │  trigger match   │  │  Visual tracking   │
└───────────┘  └──────────────────┘  └───────────────────┘
                         │
              ┌──────────▼──────────┐
              │    Visual Layer     │
              │  ┌───────────────┐  │
              │  │ Dashboard     │  │
              │  │ (Blessed TUI) │  │
              │  ├───────────────┤  │
              │  │ Office Map    │  │
              │  │ (ASCII 52x17) │  │
              │  ├───────────────┤  │
              │  │ Splash Screen │  │
              │  │ (Figlet/Chalk)│  │
              │  └───────────────┘  │
              └─────────────────────┘
```

## Component Details

### 1. CLI Layer (`src/cli.ts`)

Entry point using Commander.js. Available commands:

| Command | Description |
|---------|-------------|
| `start` | Launch office simulation (visual or CLI mode) |
| `config` | Manage API key, model, company settings |
| `team` | Show agent roster, departments, skill counts |
| `doctor` | System health check (Node, API, Playwright) |
| `screenshot` | Capture URL via Playwright |
| `report` | Generate visual progress report |

### 2. Orchestrator Engine (`src/engine/orchestrator.ts`)

The central conductor. Responsibilities:

- **Agent Lifecycle**: Initializes 11 agents from persona definitions
- **Tick Loop**: 3-second interval drives all simulation activity
- **Task Management**: CEO decomposes goals → tasks → agent assignments
- **Event Bus**: All agent actions emit events consumed by Dashboard
- **Metrics**: Tracks tasks, LOC, skills, decisions, deployments

**Tick Schedule:**
- Every tick: Simulate autonomous agent activity
- Every 8 ticks (~24s): Team interactions
- Every 12 ticks (~36s): Skill activations
- Every 15 ticks (~45s): Autonomous decisions

### 3. Agent System (`src/agents/`)

Each agent has:
- **Persona**: Role, skills, desk position, autonomy config
- **State**: Status, mood, current task, active skills, messages, memory
- **Autonomy**: Self-assign, delegate, dispatch, decision logging
- **Skills**: Activate, execute, complete, verify protocols

**Autonomy Capabilities by Role:**

| Capability | CEO | CTO | Devs | QA | DevOps | PM/UX | Scrum |
|-----------|-----|-----|------|-----|--------|-------|-------|
| Self-assign | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delegate | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dispatch parallel | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Max concurrent skills | 3 | 4 | 3 | 2 | 2 | 2 | 2 |

### 4. Claude Client (`src/engine/claude-client.ts`)

Wraps the Anthropic SDK. Methods:

| Method | Purpose |
|--------|---------|
| `chat()` | General conversation with skill-aware system prompt |
| `agentThink()` | Agent decides next action given task + team context |
| `autonomousDecide()` | Autonomous decision-making with full context |
| `executeSkill()` | Run skill protocol with verification |
| `delegate()` | CEO goal → task breakdown with skill matching |
| `codeReview()` | Review code against quality/security standards |

### 5. Skill Engine (`src/skills/registry.ts`)

27+ skill protocols organized by source:

- **Superpowers** (7): TDD, Brainstorming, Debugging, Plans, Dispatch, Verification, Code Review
- **Antigravity** (18): Clean Code, TypeScript, React, Security, Docker, CI/CD, etc.
- **Built-in** (2): Browser Automation, Visual Progress Tracking

Key functions: `getSkillById()`, `getSkillsByRole()`, `getSkillsByTrigger()`, `buildSkillContext()`

### 6. Playwright Bridge (`src/browser/playwright-bridge.ts`)

MCP Playwright integration for:
- Screenshot capture with timestamps and agent attribution
- URL navigation and page interaction
- Visual progress report generation
- Screenshot history management

### 7. Visual Layer (`src/visual/`)

Terminal UI using Blessed library:

- **Dashboard**: 60/40 split — office map + panels (team, sprint, chat, metrics)
- **Office Map**: 52×17 ASCII grid with 13 rooms, agent positions, animations
- **Splash**: Figlet ASCII art, progress bars, status messages

## Data Flow

```
User Goal → CEO (Brainstorming Skill) → Claude API
                    ↓
            Task Breakdown (JSON)
                    ↓
         Agent Assignment (skill match scoring)
                    ↓
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
  Agent A         Agent B         Agent C
  (coding)        (testing)       (deploying)
    │               │               │
    ▼               ▼               ▼
  Events ────→ Orchestrator ────→ Dashboard
  (status,      (aggregation,     (render,
   messages,     metrics,          animate,
   skills)       events)           display)
```

## Event System

All agent activity flows through the event bus:

| Event | Data | Trigger |
|-------|------|---------|
| `agent-status` | from, to | Status change |
| `agent-move` | position | Movement |
| `agent-message` | message | Chat |
| `task-update` | taskId, status | Task lifecycle |
| `skill-activated` | skillId, name | Skill start |
| `skill-completed` | skillId, verified, duration | Skill end |
| `autonomous-decision` | decision, outcome | Agent decision |
| `system` | message | System events |
