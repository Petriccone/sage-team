# Agent System — Core Documentation

## Agent Lifecycle

```
Persona Definition (personas.ts)
    │
    ▼
Agent Construction
    │ ├── Initialize state (idle, focused, no task)
    │ ├── Set position to desk
    │ └── Empty stats, memory, autonomy log
    │
    ▼
Registration in Orchestrator
    │ ├── Setup event listeners
    │ └── Add to agents Map
    │
    ▼
Start → moveToDesk()
    │
    ▼
Tick Loop (every 3s)
    │ ├── Autonomous activity
    │ ├── Task execution
    │ ├── Skill activation
    │ └── Decision making
    │
    ▼
Stop → stopAutonomy()
```

## State Machine

```
                    ┌──────────────┐
                    │     idle     │◄─── completeTask()
                    └──────┬───────┘
                           │ assignTask()
                    ┌──────▼───────┐
          ┌────────►│   thinking   │◄────────┐
          │         └──────┬───────┘         │
          │                │                  │
    ┌─────┴────┐    ┌──────▼───────┐   ┌─────┴──────┐
    │ reviewing │    │   coding     │   │  planning  │
    └──────────┘    └──────────────┘   └────────────┘
          │                │                  │
    ┌─────┴────┐    ┌──────▼───────┐   ┌─────┴──────┐
    │ testing  │    │  debugging   │   │brainstorming│
    └──────────┘    └──────────────┘   └────────────┘
          │                │                  │
          ▼                ▼                  ▼
    ┌──────────────────────────────────────────────┐
    │           executing-skill                     │
    │  (activated when skill protocol is running)   │
    └──────────────────────────────────────────────┘
```

## 11 Agents Reference

| # | ID | Emoji | Name | Role | Color | Desk (x,y) |
|---|-----|-------|------|------|-------|-------------|
| 1 | sage | 👑 | Sage | CEO | yellow | (25, 3) |
| 2 | nova | 🔬 | Nova | CTO | magenta | (37, 3) |
| 3 | dex | ⚡ | Dex | Sr. Dev | yellow | (11, 7) |
| 4 | flux | 🌊 | Flux | Fullstack | cyan | (11, 11) |
| 5 | quinn | 🔍 | Quinn | QA Lead | green | (40, 7) |
| 6 | gage | 🚀 | Gage | DevOps | red | (40, 11) |
| 7 | morgan | 📋 | Morgan | Product | magenta | (7, 15) |
| 8 | uma | 🎨 | Uma | UX Design | red | (37, 15) |
| 9 | aria | 🏛️ | Aria | Architect | blue | (7, 3) |
| 10 | river | 🌀 | River | Scrum | cyan | (22, 15) |
| 11 | atlas | 📊 | Atlas | Data Eng | blue | (47, 3) |

## Memory System

Agents have a key-value memory store:
- **remember(key, value, importance)**: Store memory
- **recall(key)**: Retrieve memory
- **Bounded**: Max 100 entries, sorted by importance, trimmed to 80

## Communication

Agents communicate via messages:
- **sendMessage(to, content, channel)**: Send to specific agent or 'all'
- **Channels**: general, work, announcements, delegation
- Messages delivered to recipient's state and emitted as events
