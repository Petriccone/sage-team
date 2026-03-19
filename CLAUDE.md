# Sage Team — Project Instructions

## Overview

Sage Team is an AI-powered autonomous software company simulator. It orchestrates 11 Claude-powered agents working together in a 2D terminal-based office visualization.

## Project Structure

```
sage-team/
├── src/
│   ├── agents/           # Agent class + 11 persona definitions
│   │   ├── agent.ts      # Agent state machine, skills, autonomy
│   │   └── personas.ts   # 11 agent configs with roles, skills, prompts
│   ├── engine/           # Core orchestration engine
│   │   ├── orchestrator.ts   # Main loop, task dispatch, event system
│   │   └── claude-client.ts  # Anthropic SDK wrapper with skill injection
│   ├── skills/           # Skill protocol registry
│   │   └── registry.ts   # 27+ skills from Superpowers + Antigravity
│   ├── browser/          # Playwright integration
│   │   └── playwright-bridge.ts  # Screenshots, navigation, visual tracking
│   ├── visual/           # Terminal UI components
│   │   ├── dashboard.ts  # Main 2D dashboard (blessed)
│   │   ├── office-map.ts # ASCII office layout + status animations
│   │   └── splash.ts     # CLI splash screens
│   ├── types/            # TypeScript interfaces
│   │   └── index.ts      # All type definitions
│   ├── utils/
│   │   └── config.ts     # Config management (conf library)
│   ├── cli.ts            # CLI entry point (commander)
│   └── index.ts          # Public API exports
├── docs/                 # Documentation and screenshots
├── tests/                # Test files
├── .mcp.json             # MCP Playwright server config
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Commands

```bash
npm run build           # Compile TypeScript
npm run dev             # Run with ts-node
npm start               # Run compiled version

sage-team start         # Launch visual office
sage-team start --no-visual  # CLI-only mode
sage-team start --goal "..." # Start with initial goal
sage-team config --show      # Show configuration
sage-team team               # Show team roster
sage-team team --agent dex   # Agent details
sage-team screenshot <url>   # Capture URL screenshot
sage-team report             # Visual progress report
sage-team doctor             # System health check
```

## Key Concepts

### Agents
Each agent has: persona (role, skills, system prompt), autonomy config (can delegate, dispatch, self-assign), desk position on the 2D map, and a state machine for status/mood/task tracking.

### Skills
Skills are structured protocols injected into agent system prompts. Sources:
- **Superpowers** (7 skills): TDD, Brainstorming, Debugging, Plans, Dispatch, Verification, Code Review
- **Antigravity** (18+ skills): Clean Code, TypeScript, React, Security, Docker, CI/CD, etc.
- **Built-in** (2 skills): Browser Automation, Visual Progress Tracking

### Orchestrator
The orchestrator runs a tick loop (3s interval) that simulates agent activities, team interactions, skill activations, and autonomous decisions. Events are emitted for the dashboard to render.

### Dashboard
Uses `blessed` library for a 2D terminal UI. Renders: office map with agent positions, team status panel, sprint board, chat log, input box. Renders at ~2fps with throttling.

## Development Guidelines

- TypeScript strict mode, ES2022 target, CommonJS output
- All agent status animations must be ASCII-only (no emojis) for terminal alignment
- Keep bounded arrays (events: 500, messages: 200, skills: 20, tasks: 200)
- Dashboard renders are throttled to prevent terminal freeze
- Error handling in tick loop — individual agent errors don't crash simulation
- Skill context is injected into system prompts, not hardcoded in responses

## Environment

- Node.js >= 18
- Requires `ANTHROPIC_API_KEY` environment variable
- Chromium auto-installed via postinstall for Playwright
- MCP Playwright configured in `.mcp.json`

## Testing

```bash
npm test                # Run test suite
npm run test:watch      # Watch mode
```

## Architecture Decisions

1. **blessed over web UI**: Terminal-native for zero-dependency visual experience
2. **Simulation over real AI calls in tick loop**: Tick loop simulates activity; real Claude calls only on goal submission and explicit agent actions
3. **Skill injection via system prompts**: Skills are context, not function calls
4. **Event-driven architecture**: EventEmitter3 decouples orchestrator from dashboard
5. **Bounded data structures**: All arrays have max sizes to prevent memory leaks
