# Orchestrator Pipeline Documentation

## Overview

The Orchestrator is the central engine of Sage Team. It manages agent lifecycle, task dispatch, team interactions, and the simulation tick loop. Think of it as the "conductor" that keeps all 11 autonomous agents working in harmony.

## Pipeline Stages

### 1. Initialization

```
Orchestrator.constructor(config)
    │
    ├── Initialize Claude Client (API key + model)
    ├── Initialize Playwright Bridge (project path)
    ├── Initialize Metrics (zero state)
    ├── Initialize Agents (11 personas → Agent instances)
    │   └── For each agent:
    │       ├── Create Agent from persona
    │       └── Setup event listeners:
    │           ├── status-change → pushEvent
    │           ├── move → pushEvent
    │           ├── message → pushEvent + deliver to recipient
    │           ├── task-completed → metrics + pushEvent
    │           ├── skill-activated → metrics + pushEvent
    │           ├── skill-completed → pushEvent
    │           └── autonomous-decision → metrics + pushEvent
    └── Setup Browser Listeners
        ├── screenshot-taken → pushEvent
        └── navigated → pushEvent
```

### 2. Start

```
Orchestrator.start()
    │
    ├── Set running = true
    ├── Push 'system' event: "Starting up..."
    ├── Move all agents to desks
    └── Start tick interval (every 3 seconds)
```

### 3. Tick Loop

The heart of the simulation. Every 3 seconds:

```
tick()
    │
    ├── For each agent: simulateAutonomousActivity()
    │   │
    │   ├── If agent has currentTask:
    │   │   ├── Cycle through role-specific work statuses (70% chance)
    │   │   ├── Complete running skills if task finishing
    │   │   ├── Complete task (8-12% chance per tick)
    │   │   └── Update metrics (LOC += 20-100)
    │   │
    │   └── If agent is idle:
    │       ├── Set role-appropriate idle activity (25% chance)
    │       └── Self-assign best matching task (50% chance if available)
    │           ├── Score tasks by skill match (10 pts per match)
    │           ├── Score by priority (critical=4, high=3, medium=2, low=1)
    │           ├── Score by description keyword match (5 pts per match)
    │           └── Auto-activate required skills
    │
    ├── Every 8 ticks (~24s): simulateTeamInteraction()
    │   ├── Pick random sender + receiver
    │   └── Generate context-aware message based on:
    │       ├── Sender role (QA, DevOps, CEO, Architect)
    │       └── Active skills
    │
    ├── Every 12 ticks (~36s): simulateSkillActivation()
    │   ├── Find busy agent with no running skills
    │   ├── Auto-detect skill from task context (triggers)
    │   └── Fallback: activate random skill from agent's arsenal
    │
    └── Every 15 ticks (~45s): simulateAutonomousDecision()
        ├── Pick random autonomous agent
        └── Record one of:
            ├── work: Optimizing current implementation
            ├── review: Reviewing recent changes
            ├── report: Sharing progress update
            ├── delegate: Identified subtask for specialist
            └── dispatch: Breaking into parallel tasks
```

### 4. Goal Submission

```
submitGoal(goal: string)
    │
    ├── Get CEO agent
    ├── CEO → status: 'thinking'
    ├── Activate Brainstorming skill
    ├── Push system event
    │
    ├── Claude API: delegate()
    │   ├── Build team list with skills
    │   └── Ask CEO to decompose goal → JSON tasks
    │
    ├── Parse response:
    │   └── For each task in plan:
    │       ├── Create Task object (id, title, priority, skills)
    │       ├── If assignee specified:
    │       │   ├── Assign to agent
    │       │   ├── Auto-activate required skills
    │       │   └── Record delegation decision
    │       └── Add to tasks[]
    │
    ├── Create Sprint (from plan)
    ├── Complete Brainstorming skill
    ├── CEO → status: 'idle'
    ├── Record dispatch decision
    └── CEO broadcasts to team
```

### 5. Agent Action Execution

```
executeAgentAction(agentId)
    │
    ├── Get agent + current task
    ├── Agent → status: 'thinking'
    │
    ├── Claude API: agentThink()
    │   ├── Task context
    │   ├── Team context (all agent statuses + skills)
    │   └── Recent messages (last 10)
    │
    ├── Parse decision JSON:
    │   ├── delegate → send message to target
    │   └── skill-execute → activate skill
    │
    ├── Agent → status: 'coding'
    └── Update LOC metrics
```

## Task Matching Algorithm

When an agent self-assigns a task, the scoring works as:

```
score = 0

// Skill match (most important)
for each requiredSkill in task:
    if agent.skillIds.includes(requiredSkill):
        score += 10

// Priority bonus
score += { critical: 4, high: 3, medium: 2, low: 1 }[task.priority]

// Keyword match
for each agentSkill in agent.skills:
    if (task.title + task.description).includes(agentSkill):
        score += 5

// Best score wins, minimum > 0 required
```

## Event Buffer Management

Events are bounded to prevent memory issues:
- Max 500 events, trimmed to 300 when exceeded
- Agent memory: max 100 entries, sorted by importance, trimmed to 80
- Autonomy log: max 200 entries, trimmed to 150

## Metrics Tracked

| Metric | Updated When |
|--------|-------------|
| `totalTasksCompleted` | Agent completes task |
| `totalLinesOfCode` | Task completion or action execution |
| `sprintVelocity` | Sprint completion |
| `teamMorale` | Initialized at 85% |
| `bugsFound` / `bugsFixed` | QA events |
| `deployments` | DevOps deploys |
| `skillsExecuted` | Skill activation |
| `autonomousDecisions` | Decision recorded |
| `uptime` | Initialized at 99.9% |

## Integration Points

| System | Method | Purpose |
|--------|--------|---------|
| Dashboard | `on('event')` | Render events in real-time |
| Dashboard | `on('tick')` | Trigger re-render |
| Playwright | `connectBrowser()` | Enable visual tracking |
| Playwright | `takeScreenshot()` | Capture progress |
| Claude API | `submitGoal()` | CEO delegation |
| Claude API | `executeAgentAction()` | Agent thinking |
