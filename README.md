# Sage Team v3.6

> AI-Powered Autonomous Software Company — 11 agents execute real code via Claude Code, with a PixiJS isometric office visualization and native Claude Code MCP integration.

Sage Team runs a complete AI software company. A **CEO agent** decomposes your goal into a sprint, then **11 specialized agents** execute tasks in parallel using **Claude Code subprocesses** — writing real code, running tests, and creating PRs. Watch it all happen in a **PixiJS isometric office** in your browser.

## What Makes This Different

- **Real Execution** — Agents run Claude Code subprocesses that write, test, and commit actual code
- **Hybrid Engine** — CEO plans via Claude API (fast/cheap), agents execute via Claude Code (powerful)
- **SQLite Persistence** — Full state survives restarts. Resume any session.
- **Skill Injection** — Agent prompts include real skill protocols from Superpowers and Antigravity
- **Isometric Office** — PixiJS 2.5D office with 10 rooms, pixel-art agents that walk around, particle effects
- **Visual Scrum Board** — Live task tracking with To Do / In Progress / Done columns
- **PR Workflow** — Agents create branches, you review and approve/reject PRs in the UI

## Quick Start

### Option A: Inside Claude Code (recommended)

```bash
npm install -g sage-team
cd your-project
claude
```

Inside Claude, just talk naturally:

> "Initialize sage team here"
> "Start the team with the goal: Build a REST API for a todo app"
> "How's the sprint going?"
> "Approve the PR"

Claude Code auto-discovers Sage Team via MCP. Set up the `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "sage-team": {
      "command": "sage-team-mcp",
      "args": []
    }
  }
}
```

### Option B: Standalone CLI

```bash
# Install globally
npm install -g sage-team

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Initialize project
sage-team init

# Launch the office
sage-team start

# Or start with a goal
sage-team start --goal "Build a REST API for a todo app with authentication"
```

## The Team

| Agent | Role | Room | Focus |
|-------|------|------|-------|
| 👑 **Sage** | CEO | CEO Office | Goal decomposition, sprint planning, delegation |
| 🔬 **Nova** | CTO | CTO Office | Architecture review, technical decisions |
| 🏛️ **Aria** | Architect | Arch Lab | System design, API patterns |
| ⚡ **Dex** | Senior Dev | Dev Bullpen | Core implementation, TDD |
| 🌊 **Flux** | Full Stack Dev | Dev Bullpen | Frontend + backend, end-to-end features |
| 🔍 **Quinn** | QA Lead | QA Lab | Testing, quality gates |
| 🚀 **Gage** | DevOps | QA Lab | CI/CD, deployment, infrastructure |
| 📋 **Morgan** | Product Manager | Design Studio | Requirements, prioritization |
| 🎨 **Uma** | UX Designer | Design Studio | UI/UX design, accessibility |
| 🌀 **River** | Scrum Master | Lounge | Process, blocker removal |
| 📊 **Atlas** | Data Engineer | Data Lab | Database, data pipelines |

## Browser UI

```
┌──────────────────────────────────────────────────────┐
│ 👑Sage 🔬Nova 🏛️Aria ⚡Dex 🌊Flux 🔍Quinn ...       │  Agent bar
├───────────┬──────────────────────┬───────────────────┤
│ SCRUM     │                      │ ACTIVITY          │
│ BOARD     │   ISOMETRIC OFFICE   │ FEED              │
│           │   (PixiJS canvas)    │                   │
│ ● Doing   │   Agents walk around │ sage: planning..  │
│   Dex     │   rooms, sit at      │ dex: coding...    │
│   coding  │   desks, visit       │ quinn: testing..  │
│           │   each other         │                   │
│ ● To Do   │                      │                   │
│ ● Done    │                      │                   │
│           │                      │                   │
│ Team      │                      │                   │
│ 👑🔬🏛️⚡🌊│                      │                   │
├───────────┴──────────────────────┴───────────────────┤
│ [Enter a goal for your team...               ] [Go]  │
└──────────────────────────────────────────────────────┘
```

- **Left** — Scrum Board: task columns (In Progress, To Do, Blocked, Done) + team avatars
- **Center** — Isometric office: pixel-art agents wander between 10 rooms with solid walls and doorways
- **Right** — Live activity feed: timestamped events from all agents as they work
- **Bottom** — Goal input + pending PR badges

## MCP Tools (inside Claude Code)

When using Sage Team inside Claude Code, these tools are available:

| Tool | Description |
|------|-------------|
| `sage_team_init` | Initialize Sage Team in current project |
| `sage_team_list` | Show all 11 agents with roles and skills |
| `sage_team_start` | Start a session with a goal |
| `sage_team_status` | Show sprint progress, tasks, and agent statuses |
| `sage_team_doctor` | Check system health (Node, Git, Claude Code, API key) |
| `sage_team_config` | View or update configuration |
| `sage_team_approve_pr` | Approve and merge a pull request |
| `sage_team_reject_pr` | Reject a PR with feedback for rework |

## CLI Commands

```bash
sage-team init                    # Initialize .sage-team/ directory
sage-team start                   # Launch office + browser UI
sage-team start --goal "..."      # Start with an initial goal
sage-team start --no-browser      # Skip opening browser
sage-team start --port 8080       # Custom port (default: 3000)
sage-team resume                  # Resume latest session
sage-team resume --session <id>   # Resume specific session
sage-team config --show           # Show configuration
sage-team config --api-key <key>  # Set API key
sage-team config --model <model>  # Set Claude model
sage-team team                    # Show team roster
sage-team status                  # Show session status
sage-team doctor                  # Check system health
sage-team logs                    # Tail event log
sage-team logs --agent dex -n 50  # Filter by agent
```

## How It Works

```
You submit a goal
        │
        ▼
┌─────────────┐     Claude API
│  CEO (Sage) │────────────────► Decompose into sprint + tasks
└─────────────┘                  with dependencies & assignments
        │
        ▼
┌─────────────┐     Claude Code
│  Dispatcher │────────────────► Spawn subprocesses (max N concurrent)
└─────────────┘                  Each agent gets: identity + skills + task
        │
        ▼
┌─────────────┐
│   Agents    │────────────────► Write code, run tests, commit
│  (parallel) │                  Stream status back via JSONL
└─────────────┘
        │
        ▼
┌─────────────┐
│ PR Manager  │────────────────► Create branch, squash merge on approval
└─────────────┘
        │
        ▼
┌─────────────┐     WebSocket
│   Browser   │◄───────────────── Real-time events, agent positions,
│   (PixiJS)  │                   scrum board, particle effects
└─────────────┘
```

### Execution Modes

- **Sandbox** (default) — Each agent works in a git worktree. PRs require your approval.
- **Direct** — Agents commit directly to the working branch. Fast but risky.
- **Supervised** — Like sandbox, but agents pause and ask before critical operations.

## Architecture

```
sage-team/
├── src/
│   ├── types/              # TypeScript interfaces (Agent, Task, Sprint, etc.)
│   ├── state/
│   │   ├── database.ts     # SQLite with WAL mode, 9 tables
│   │   └── repositories/   # 7 repos (sessions, agents, tasks, sprints, etc.)
│   ├── agents/
│   │   ├── personas.ts     # 11 agent definitions with skills & colors
│   │   └── skills-map.ts   # Agent → skill ID mapping
│   ├── skills/
│   │   └── loader.ts       # Loads Superpowers/Antigravity skill protocols
│   ├── engine/
│   │   ├── ceo-brain.ts    # Goal decomposition via Claude API
│   │   ├── dispatcher.ts   # Claude Code subprocess management
│   │   ├── orchestrator.ts # Central coordinator (tick loop every 5s)
│   │   ├── pr-manager.ts   # Git worktree + branch + merge
│   │   └── prompt-builder.ts # Identity + skills + task prompt assembly
│   ├── cli/
│   │   ├── index.ts        # Commander program with 8 commands
│   │   └── commands/       # init, start, resume, config, team, status, doctor, logs
│   ├── mcp/
│   │   └── server.ts       # MCP server for Claude Code integration
│   ├── server/
│   │   ├── index.ts        # Express + WebSocket server
│   │   └── routes/api.ts   # REST API endpoints
│   └── web/                # Frontend (separate Vite project)
│       └── src/
│           ├── canvas/     # PixiJS isometric office, pixel-art agents, effects
│           ├── hooks/      # useWebSocket, useOffice, usePixiOffice (wandering sim)
│           ├── panels/     # AgentBar, TaskBoard (Scrum), ChatPanel, PRReview, GoalInput
│           └── store.ts    # Zustand state management
├── docs/
│   └── USAGE-GUIDE.md     # Step-by-step usage guide
├── vitest.config.ts        # Test configuration
└── package.json
```

## Configuration

```bash
# API key (required)
export ANTHROPIC_API_KEY=your-key-here

# Or save to config
sage-team config --api-key your-key-here

# Customize
sage-team config --company-name "My AI Company"
sage-team config --model claude-sonnet-4-20250514
sage-team config --max-agents 5
sage-team config --autonomy sandbox
```

## Skill Sources

Agent prompts are injected with real skill protocol content from:

- **[Superpowers](https://github.com/obra/superpowers)** — TDD, brainstorming, debugging, code review, verification
- **[Antigravity](https://github.com/Petriccone/antigravity-awesome-skills)** — TypeScript, React, security, DevOps, databases, and more

Skills are loaded at runtime from your local installations and respect a 30k token budget per agent prompt.

## Prerequisites

- Node.js >= 18
- Git
- [Claude Code](https://claude.ai/claude-code) CLI installed (`npm i -g @anthropic-ai/claude-code`)
- Anthropic API key

## License

MIT
