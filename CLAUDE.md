# CLAUDE.md — Sage Team Project Guide

> This file helps Claude (and other AI assistants) understand the Sage Team project.

## What is Sage Team?

Sage Team is a CLI tool that simulates an AI-powered autonomous software company. It runs 11 fully autonomous agents (each powered by Claude) with a real-time 2D terminal dashboard, 27+ skill protocols, and MCP Playwright integration for visual tracking.

## Tech Stack

- **Language**: TypeScript (strict mode, ES2022)
- **Runtime**: Node.js >= 18
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Terminal UI**: Blessed + Blessed-Contrib
- **Browser Automation**: Playwright-core + `@playwright/mcp`
- **CLI Framework**: Commander.js
- **State**: EventEmitter3, Conf (config store)

## Project Structure

```
src/
├── agents/
│   ├── agent.ts          # Agent class: status, skills, movement, memory, autonomy
│   └── personas.ts       # 11 agent definitions with skills, desks, autonomy configs
├── engine/
│   ├── orchestrator.ts   # Main engine: ticks, task dispatch, team interactions
│   └── claude-client.ts  # Claude API: delegation, agent thinking, skill execution
├── skills/
│   └── registry.ts       # 27+ skill protocols (Superpowers + Antigravity)
├── browser/
│   └── playwright-bridge.ts  # MCP Playwright: screenshots, navigation, reports
├── visual/
│   ├── dashboard.ts      # Blessed terminal UI: office map, panels, keybindings
│   ├── office-map.ts     # ASCII office layout, room coordinates, animations
│   └── splash.ts         # Splash screen, progress bars, status messages
├── types/
│   └── index.ts          # All TypeScript interfaces and type definitions
├── utils/
│   └── config.ts         # Configuration management (Conf store)
├── cli.ts                # CLI entry point (Commander.js)
└── index.ts              # Public API exports
```

## Key Concepts

### Agents
11 autonomous agents, each with a role, emoji, color, desk position, skill IDs, and autonomy config. See `src/agents/personas.ts`.

### Skills
27+ structured protocols from Superpowers and Antigravity. Each skill has triggers, applicable roles, a protocol (markdown), and verification steps. See `src/skills/registry.ts`.

### Orchestrator
The main engine runs a 3-second tick loop that simulates agent activity, team interactions, skill activations, and autonomous decisions. See `src/engine/orchestrator.ts`.

### Dashboard
Terminal-based Blessed UI showing office floor plan (left), team status, sprint board, and chat (right). See `src/visual/dashboard.ts`.

## Build & Run

```bash
npm install          # Installs deps + Chromium
npm run build        # TypeScript → dist/
npm run dev          # Run with ts-node
npm start            # Run compiled
sage-team start      # Launch visual office
sage-team doctor     # Health check
```

## Key Commands

```bash
sage-team start --goal "Build a REST API"    # Start with goal
sage-team start --no-visual                  # CLI-only mode
sage-team team --agent dex                   # Agent details
sage-team screenshot <url>                   # Visual capture
sage-team config --show                      # Show config
```

## Environment Variables

- `ANTHROPIC_API_KEY` (required) — Claude API key

## Important Patterns

- **Event-driven**: Orchestrator emits events, Dashboard listens and renders
- **Skill-aware prompts**: Agent system prompts include skill protocols
- **Autonomous decisions**: Agents self-assign, delegate, dispatch parallel work
- **Tick-based simulation**: 3s interval drives all agent activity
- **Bounded buffers**: Events capped at 500, memory at 100, autonomy log at 200

## Testing

```bash
npm test             # Run test suite
```

## Conventions

- TypeScript strict mode always
- Interfaces in `src/types/index.ts`
- Agent IDs are lowercase: `sage`, `nova`, `dex`, `flux`, `quinn`, `gage`, `morgan`, `uma`, `aria`, `river`, `atlas`
- Skill IDs prefixed: `sp-` (Superpowers), `ag-` (Antigravity), `bi-` (Built-in)
- Colors use Blessed tags: `{color-fg}text{/color-fg}`
