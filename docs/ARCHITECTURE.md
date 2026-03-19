# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                        CLI (commander)                   │
│                     sage-team start/config/team           │
└────────────┬────────────────────────┬────────────────────┘
             │                        │
             v                        v
┌────────────────────┐    ┌───────────────────────┐
│    Orchestrator     │    │      Dashboard        │
│  (tick loop, events)│───>│  (blessed terminal UI)│
│                     │    │                       │
│  ┌───────────────┐  │    │  ┌─────────────────┐  │
│  │ Agent x11     │  │    │  │ Office Map      │  │
│  │ (state machine│  │    │  │ Agent Panel     │  │
│  │  skills, msgs)│  │    │  │ Sprint Board    │  │
│  └───────────────┘  │    │  │ Chat Log        │  │
│                     │    │  │ Metrics Bar     │  │
│  ┌───────────────┐  │    │  └─────────────────┘  │
│  │ Claude Client │  │    └───────────────────────┘
│  │ (Anthropic SDK│  │
│  │  skill inject)│  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ Playwright    │  │
│  │ Bridge        │  │
│  │ (screenshots) │  │
│  └───────────────┘  │
└─────────────────────┘
             │
             v
┌─────────────────────┐
│   Skill Registry    │
│  27+ protocols from │
│  Superpowers +      │
│  Antigravity        │
└─────────────────────┘
```

## Module Dependency Graph

```
cli.ts
├── engine/orchestrator.ts
│   ├── agents/agent.ts
│   │   ├── types/index.ts
│   │   └── skills/registry.ts
│   ├── agents/personas.ts
│   │   └── types/index.ts
│   ├── engine/claude-client.ts
│   │   ├── types/index.ts
│   │   └── skills/registry.ts
│   └── browser/playwright-bridge.ts
├── visual/dashboard.ts
│   ├── engine/orchestrator.ts
│   ├── visual/office-map.ts
│   └── skills/registry.ts
└── utils/config.ts
```

## Data Flow

### 1. Startup
```
CLI → Config → Orchestrator → [11 Agents initialized] → Dashboard → Render loop
```

### 2. Goal Submission
```
User input → Dashboard → Orchestrator.submitGoal()
  → CEO activates brainstorming skill
  → ClaudeClient.delegate() calls Claude API
  → Claude returns task breakdown (JSON)
  → Orchestrator creates tasks + sprint
  → Tasks assigned to agents by skill match
  → Agents auto-activate required skills
```

### 3. Tick Loop (every 3s)
```
Orchestrator.tick()
  → simulateAutonomousActivity() for each agent
  → simulateTeamInteraction() every 8 ticks
  → simulateSkillActivation() every 12 ticks
  → simulateAutonomousDecision() every 15 ticks
  → emit('tick') event
```

### 4. Dashboard Render (every 500ms, throttled to 400ms min)
```
Dashboard.render()
  → renderOffice() — ASCII map + agent positions
  → renderAgentPanel() — team status or agent detail
  → renderTaskBoard() — sprint tasks by status
  → renderMetricsBar() — bottom status bar
  → screen.render() — blessed terminal update
```

## Event System

All communication between orchestrator and dashboard uses EventEmitter3:

| Event | Data | Source |
|-------|------|--------|
| `agent-status` | from, to status | Agent.setStatus() |
| `agent-move` | position | Agent.moveTo() |
| `agent-message` | ChatMessage | Agent.sendMessage() |
| `task-update` | taskId, status | Orchestrator |
| `skill-activated` | skillId, skillName | Agent.activateSkill() |
| `skill-completed` | skillId, verified, duration | Agent.completeSkill() |
| `autonomous-decision` | decision, outcome | Agent.recordDecision() |
| `system` | message | Orchestrator |
| `tick` | count, metrics | Orchestrator.tick() |

## Memory Management

All data structures are bounded to prevent leaks:

| Structure | Max Size | Pruning Strategy |
|-----------|----------|-----------------|
| `events[]` | 500 | Keep last 300 |
| `agent.messages[]` | 200 | Keep last 150 |
| `agent.activeSkills[]` | 20 completed | Keep running + last 20 |
| `agent.memory[]` | 100 | Sort by importance, keep top 80 |
| `agent.autonomyLog[]` | 200 | Keep last 150 |
| `tasks[]` | 200 | Prune done tasks, keep last 50 |
| `actionLog[]` (browser) | 500 | Keep last 300 |

## Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Language | TypeScript (strict, ES2022) | Type safety + modern features |
| AI | Anthropic SDK (@anthropic-ai/sdk) | Claude API access |
| Terminal UI | blessed + blessed-contrib | Feature-rich terminal rendering |
| Browser | playwright-core + @playwright/mcp | Screenshot and visual tracking |
| CLI | commander | Subcommand parsing |
| Events | eventemitter3 | Lightweight, typed events |
| Config | conf | Persistent user config |
| Styling | chalk + ora | CLI colors and spinners |
