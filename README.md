# 🏢 Sage Team

> AI-Powered Autonomous Software Company — Watch your AI team build software in real-time.

Sage Team is a globally-installable CLI tool that simulates a complete software company staffed by **11 autonomous AI agents**, each with unique personalities, skills, and roles. Powered by **Claude** (Anthropic), it features a **real-time 2D terminal dashboard** where you can watch agents collaborate, code, review, and deploy — just like a real team.

## ✨ What Makes This Different

- **2D Visual Office** — Real-time ASCII office floor plan showing agents moving, working, and interacting
- **11 Autonomous Agents** — Each with distinct personality, skills, and decision-making
- **Real Company Structure** — CEO, CTO, developers, QA, DevOps, PM, designer, architect, data engineer, scrum master
- **Live Team Chat** — Watch agents communicate, delegate, and collaborate
- **Sprint Board** — Agile workflow with tasks, assignments, and progress tracking
- **Agent Metrics** — Track tasks completed, lines written, reviews done, bugs fixed
- **Powered by Claude** — Uses Anthropic's Claude API for intelligent agent behavior

## 🚀 Quick Start

```bash
# Install globally
npm install -g sage-team

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Launch the visual office!
sage-team start

# Or with an initial goal
sage-team start --goal "Build a REST API for a todo app with authentication"
```

## 👥 The Team

| Agent | Role | Specialty |
|-------|------|-----------|
| 👑 **Sage** | CEO | Strategy, delegation, vision |
| 🔬 **Nova** | CTO | Architecture, tech decisions |
| ⚡ **Dex** | Senior Dev | TypeScript, testing, code review |
| 🌊 **Flux** | Full Stack | React, APIs, databases |
| 🔍 **Quinn** | QA Lead | Testing, automation, quality |
| 🚀 **Gage** | DevOps | CI/CD, deployment, infrastructure |
| 📋 **Morgan** | Product Manager | Specs, prioritization, roadmap |
| 🎨 **Uma** | UX Designer | UI/UX, accessibility, design systems |
| 🏛️ **Aria** | Architect | System design, patterns, scalability |
| 🌀 **River** | Scrum Master | Agile, facilitation, team health |
| 📊 **Atlas** | Data Engineer | Databases, analytics, data pipelines |

## 🖥️ Visual Dashboard

The 2D office dashboard shows:

```
╔══════════════════════════════════════════════════╗
║  ┌─ARCHITECT─┐  ┌──CEO───┐  ┌───CTO───┐  ┌DATA┐║
║  │ 🏛️  Aria │  │ 👑Sage │  │ 🔬 Nova │  │📊  │║
║  └───────────┘  └────────┘  └─────────┘  └Atlas┘║
║                                                  ║
║  ┌─SR.DEV──┐                 ┌──QA───┐          ║
║  │ ⚡  Dex │                 │ 🔍Quinn│          ║
║  └─────────┘                 └────────┘          ║
║                                                  ║
║  ┌─FULLSTK─┐  ░░░░░░░░░░░░  ┌─DEVOPS─┐         ║
║  │ 🌊 Flux │  ░MEETING RM░  │ 🚀Gage │         ║
║  └─────────┘  ░░░░░░░░░░░░  └────────┘         ║
╚══════════════════════════════════════════════════╝
```

**Keybindings:**
- `q` — Quit
- `Tab` — Focus goal input
- `1-9` — Select agent for details
- `0` — Deselect agent
- `g` — Focus goal input

## 📦 Commands

```bash
sage-team start              # Launch visual office
sage-team start --no-visual  # CLI-only mode
sage-team start --goal "..." # Start with a goal
sage-team config --show      # Show configuration
sage-team config --api-key X # Set API key
sage-team config --model X   # Set Claude model
sage-team team               # Show team roster
sage-team team --agent dex   # Show agent details
sage-team doctor             # System health check
```

## ⚙️ Configuration

```bash
# Environment variable (recommended)
export ANTHROPIC_API_KEY=your-key-here

# Or save to config
sage-team config --api-key your-key-here

# Customize
sage-team config --company-name "My AI Company"
sage-team config --model claude-sonnet-4-20250514
```

## 🏗️ Architecture

```
sage-team/
├── src/
│   ├── agents/          # Agent system (personas, state, autonomy)
│   ├── engine/          # Orchestration, Claude API client
│   ├── visual/          # 2D dashboard, office map, animations
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Configuration, helpers
│   ├── cli.ts           # CLI entry point
│   └── index.ts         # Public API
```

## 🤝 Programmatic Usage

```typescript
import { Orchestrator, getConfig } from 'sage-team';

const config = getConfig();
const orchestrator = new Orchestrator(config);

await orchestrator.start();
await orchestrator.submitGoal('Build a user authentication system');

// Listen to events
orchestrator.on('event', (event) => {
  console.log(event.type, event.data);
});
```

## 📄 License

MIT — Based on concepts from [AIOS God Mode Template](https://github.com/gutomec/aios-god-mode-template) by Synkra AIOS.
