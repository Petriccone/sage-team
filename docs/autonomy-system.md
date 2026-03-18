# Autonomy System Documentation

## Overview

The Autonomy System is what makes Sage Team agents truly autonomous. Instead of waiting for instructions, agents proactively make decisions, self-assign work, delegate to specialists, and dispatch parallel tasks — all guided by confidence scoring and skill matching.

## Autonomy Levels

```typescript
type AutonomyLevel = 'full' | 'supervised' | 'manual';
```

| Level | Description | Current Usage |
|-------|-------------|---------------|
| `full` | Agent acts independently, reports results | All 11 agents |
| `supervised` | Agent proposes, waits for approval | Not currently used |
| `manual` | Agent only acts on explicit instructions | Not currently used |

## Autonomy Configuration

Each agent has an `AutonomyConfig`:

```typescript
interface AutonomyConfig {
  level: AutonomyLevel;
  canSelfAssignTasks: boolean;      // Pick up unassigned tasks
  canDelegateToOthers: boolean;     // Assign work to other agents
  canCreateSubtasks: boolean;       // Break tasks into subtasks
  canRequestCodeReview: boolean;    // Ask for code review
  canDispatchParallelWork: boolean; // Send independent work to multiple agents
  maxConcurrentSkills: number;      // Parallel skill execution limit
  requiresApprovalFor: string[];   // Actions that need human approval
}
```

### Agent Autonomy Matrix

| Agent | Self-Assign | Delegate | Subtasks | Dispatch | Max Skills |
|-------|------------|----------|----------|----------|-----------|
| 👑 Sage (CEO) | ✅ | ✅ | ✅ | ✅ | 3 |
| 🔬 Nova (CTO) | ✅ | ✅ | ✅ | ❌ | 4 |
| 🏛️ Aria (Architect) | ✅ | ✅ | ✅ | ✅ | 3 |
| ⚡ Dex (Sr. Dev) | ✅ | ✅ | ✅ | ❌ | 3 |
| 🌊 Flux (Fullstack) | ✅ | ❌ | ✅ | ❌ | 3 |
| 🔍 Quinn (QA) | ✅ | ❌ | ✅ | ❌ | 2 |
| 🚀 Gage (DevOps) | ✅ | ❌ | ✅ | ❌ | 2 |
| 📋 Morgan (Product) | ✅ | ❌ | ✅ | ❌ | 2 |
| 🎨 Uma (UX) | ✅ | ❌ | ✅ | ❌ | 2 |
| 🌀 River (Scrum) | ✅ | ❌ | ✅ | ❌ | 2 |
| 📊 Atlas (Data) | ✅ | ❌ | ✅ | ❌ | 2 |

## Decision Types

```typescript
interface AgentDecision {
  type: 'work' | 'delegate' | 'request-help' | 'report'
      | 'review' | 'brainstorm' | 'dispatch' | 'skill-execute';
  action: string;        // What the agent is doing
  target?: string;       // Agent ID for delegation/help
  skillId?: string;      // Skill to execute
  reasoning: string;     // Why this action
  confidence: number;    // 0.0 to 1.0
}
```

### Decision Flow

```
Agent Autonomous Tick
    │
    ├── Has current task?
    │   ├── YES → Continue work
    │   │   ├── Cycle through role-specific statuses
    │   │   ├── Check for skill activation
    │   │   └── Check for task completion
    │   │
    │   └── NO → Evaluate options
    │       ├── Self-assign best matching task? (if canSelfAssignTasks)
    │       ├── Idle activity based on role
    │       └── Random movement near desk
    │
    └── Periodic decision (every ~45s):
        ├── work:      Optimize current implementation (conf: 0.85)
        ├── review:    Review recent changes (conf: 0.90)
        ├── report:    Share progress update (conf: 0.95)
        ├── delegate:  Hand off subtask to specialist (conf: 0.80)
        └── dispatch:  Break into parallel tasks (conf: 0.75)
```

## Autonomous Decision Logging

All decisions are logged with outcomes:

```typescript
interface AutonomyLogEntry {
  timestamp: number;
  decision: AgentDecision;
  outcome: 'success' | 'failure' | 'pending';
}
```

**Buffer Management**: Log capped at 200 entries, trimmed to 150 when exceeded.

## Task Self-Assignment

When an agent has no task and `canSelfAssignTasks` is true:

1. Find all unassigned tasks with status `'todo'`
2. Score each task against agent's capabilities:
   - **Skill match**: +10 per matching `requiredSkill`
   - **Priority**: critical=4, high=3, medium=2, low=1
   - **Keyword**: +5 per agent skill found in task title/description
3. Pick highest scoring task (must score > 0)
4. Auto-activate required skills (up to `maxConcurrentSkills`)
5. Broadcast to team: "Picking up [task] — I have the right skills"

## Delegation Protocol

When an agent with `canDelegateToOthers` delegates:

1. Agent identifies subtask better suited for another agent
2. Records decision with target agent ID
3. Sends message to target with task details
4. Outcome tracked as success/failure/pending

### CEO Delegation (Goal Decomposition)

The CEO has special delegation powers via `submitGoal()`:

1. Receives high-level goal
2. Activates Brainstorming skill
3. Calls Claude to decompose into tasks with:
   - Title, description, priority, story points
   - Assignee (matched by skill)
   - Required skills
   - Dependencies
4. Creates Sprint
5. Assigns tasks to agents
6. Auto-activates required skills on each agent

## Dispatch Protocol

Agents with `canDispatchParallelWork` (CEO, Architect) can:

1. Identify independent subtasks
2. Assign to multiple agents simultaneously
3. Each agent works autonomously
4. Results converge back

## Role-Specific Behaviors

### Work Statuses by Role

| Role | Primary Statuses |
|------|-----------------|
| CEO | thinking, planning, meeting, dispatching |
| CTO | thinking, reviewing, coding, security-audit |
| Sr. Dev | coding, testing, debugging, reviewing |
| Fullstack | coding, testing, debugging, researching |
| QA | testing, reviewing, debugging, writing-docs |
| DevOps | deploying, debugging, coding, security-audit |
| Product | thinking, writing-docs, brainstorming, meeting |
| UX | brainstorming, coding, reviewing, researching |
| Architect | thinking, planning, writing-docs, reviewing |
| Scrum | meeting, planning, writing-docs, thinking |
| Data Eng | coding, testing, researching, debugging |

### Idle Activities by Role

| Role | What they do when idle |
|------|----------------------|
| CEO | thinking, meeting, brainstorming |
| CTO | reviewing, researching, security-audit |
| Sr. Dev | reviewing, researching, pair-programming |
| Fullstack | researching, reviewing, coding |
| QA | reviewing, testing, writing-docs |
| DevOps | researching, security-audit, break |
| Product | brainstorming, researching, writing-docs |
| UX | brainstorming, researching, break |
| Architect | researching, writing-docs, reviewing |
| Scrum | meeting, writing-docs, break |
| Data Eng | researching, reviewing, coding |

## Metrics & Observability

The autonomy system tracks:

| Metric | Per-Agent | Global |
|--------|-----------|--------|
| Autonomous decisions | `agent.stats.autonomousDecisions` | `metrics.autonomousDecisions` |
| Delegations made | `agent.stats.delegationsMade` | — |
| Skills executed | `agent.stats.skillsExecuted` | `metrics.skillsExecuted` |
| Tasks completed | `agent.stats.tasksCompleted` | `metrics.totalTasksCompleted` |

All metrics are visible in the Dashboard status bar and agent detail panel.
