# Autonomous Agent System — Design Document

**Date:** 2026-03-19
**Status:** Implemented
**Author:** Claude

## Overview

Design for the fully autonomous multi-agent orchestration system where 11 AI agents collaborate without human intervention.

## Agent State Machine

```
States: idle -> thinking -> coding/testing/reviewing/... -> idle
                         -> executing-skill -> idle
                         -> meeting -> idle

Transitions triggered by:
- Task assignment (idle -> thinking)
- Skill activation (any -> executing-skill)
- Task completion (any -> idle)
- Orchestrator tick (random status cycling for realism)
```

## Autonomy Configuration

Each agent has an `AutonomyConfig`:

```typescript
{
  level: 'full',                    // All agents are fully autonomous
  canSelfAssignTasks: boolean,      // Pick up unassigned tasks
  canDelegateToOthers: boolean,     // Send work to other agents
  canCreateSubtasks: boolean,       // Break tasks into subtasks
  canDispatchParallelWork: boolean, // Launch concurrent tasks
  maxConcurrentSkills: number,      // Skill execution limit (2-4)
}
```

## Decision Making

When an agent makes an autonomous decision, it chooses from:

| Type | Description | Who Can |
|------|-------------|---------|
| `work` | Produce output directly | All |
| `delegate` | Send to a more suitable agent | CEO, CTO, Architect |
| `request-help` | Ask for input from specialist | All |
| `report` | Share progress/blockers | All |
| `review` | Review another agent's work | CTO, Senior Dev, QA |
| `brainstorm` | Explore approaches before coding | All |
| `dispatch` | Break into parallel tasks | CEO, Architect |
| `skill-execute` | Activate a skill protocol | All |

## Task Assignment Algorithm

`findBestTaskForAgent()` scores available tasks:
- +10 per matching required skill
- +1-4 for priority (low to critical)
- +5 per skill keyword match in task description

## Goal Processing Flow

1. User submits goal via CLI or dashboard
2. CEO (Sage) activates `sp-brainstorming` skill
3. `ClaudeClient.delegate()` sends goal + team roster to Claude
4. Claude returns JSON with task breakdown and assignments
5. Orchestrator creates tasks, assigns to agents, starts sprint
6. Agents auto-activate required skills for their tasks
7. Tick loop simulates autonomous progress

## Communication

Agents send messages via `sendMessage(to, content, channel)`:
- `to: 'all'` broadcasts to #general
- Direct messages delivered to recipient's `state.messages[]`
- Channels: general, work, announcements, delegation
