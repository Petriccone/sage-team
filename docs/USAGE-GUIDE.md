# Sage Team — Usage Guide

A step-by-step guide to running your AI software company.

---

## What is Sage Team?

Sage Team is a **virtual software company** with 11 AI employees. You give it a goal ("Build a REST API for a todo app") and the agents do the real work: they write code, run tests, create branches and PRs. You watch everything happen in real time through an isometric office in your browser.

---

## Step 1: Prerequisites

You need these installed before starting:

| What | How to install | Why |
|------|---------------|-----|
| **Node.js 18+** | [nodejs.org](https://nodejs.org) | Runs the program |
| **Git** | [git-scm.com](https://git-scm.com) | Agents create branches and commits |
| **Claude Code** | `npm i -g @anthropic-ai/claude-code` | Agents use this to write real code |
| **Anthropic API Key** | [console.anthropic.com](https://console.anthropic.com) | Pays for Claude usage |

Verify everything is installed:
```bash
node --version    # must be 18+
git --version     # any version
claude --version  # must be installed
```

---

## Step 2: Install Sage Team

```bash
npm install -g sage-team
```

Or if running from source:
```bash
cd sage-team
npm install
cd src/web && npm install && cd ../..
```

---

## Step 3: Set Up

Go to the **project folder** where you want the agents to work (can be an existing repo or a new folder):

```bash
cd my-project
sage-team init
```

This creates a `.sage-team/` folder with your configuration.

Now add your API key:

```bash
# Option A: environment variable (temporary, lasts for this terminal session)
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option B: save to config (permanent for this project)
sage-team config --api-key sk-ant-your-key-here
```

Check that everything is ready:
```bash
sage-team doctor
```

You should see all green checkmarks.

---

## Step 4: Meet the Team

```bash
sage-team team
```

This shows all 11 agents, their roles, and skills:

| Agent | Role | What they do |
|-------|------|-------------|
| 👑 **Sage** | CEO | Breaks down your goal into tasks and assigns them |
| 🔮 **Nova** | CTO | Reviews architecture and technical decisions |
| 🏛️ **Aria** | Architect | Designs system structure and API patterns |
| ⚡ **Dex** | Senior Dev | Core implementation with TDD |
| 🌊 **Flux** | Full Stack Dev | Frontend + backend, end-to-end features |
| 🔍 **Quinn** | QA Lead | Testing and quality gates |
| ⚙️ **Gage** | DevOps | CI/CD, deployment, infrastructure |
| 📋 **Morgan** | Product Manager | Requirements and prioritization |
| 🎨 **Uma** | UX Designer | UI/UX design and accessibility |
| 🌀 **River** | Scrum Master | Process management, removes blockers |
| 📊 **Atlas** | Data Engineer | Databases and data pipelines |

---

## Step 5: Give a Goal and Watch

```bash
sage-team start --goal "Build a REST API for a task manager with Express and SQLite"
```

What happens next:
1. Your browser opens automatically with the isometric office
2. **Sage (CEO)** analyzes the goal and breaks it into smaller tasks (a sprint)
3. Tasks are assigned to the right agents based on their skills
4. Each agent spawns their own **Claude Code** subprocess and starts working
5. You see everything happening in real time in the browser

If you don't want the browser to open:
```bash
sage-team start --goal "..." --no-browser
# then open http://localhost:3000 manually
```

To use a different port:
```bash
sage-team start --goal "..." --port 8080
```

---

## Step 6: Understanding the Browser UI

```
┌──────────────────────────────────────────────────────┐
│ SAGE TEAM  👑Sage 🔮Nova 🏛️Aria ⚡Dex 🌊Flux ...    │  <- Agent bar (colored dots = status)
├───────────┬──────────────────────┬───────────────────┤
│ Sprint    │                      │ Activity          │
│           │   ISOMETRIC          │                   │
│ ⏳ task 1 │   OFFICE             │ sage: planning..  │
│ 🔨 task 2 │   (PixiJS canvas)    │ dex: coding...   │
│ ✅ task 3 │                      │ quinn: testing.. │
│           │                      │                   │
├───────────┴──────────────────────┴───────────────────┤
│ [Enter a goal for your team...               ] [Go]  │  <- Goal input bar
└──────────────────────────────────────────────────────┘
```

- **Top bar**: All 11 agents with colored status dots (green = coding, blue = reviewing, etc.)
- **Left panel**: Sprint progress — task list with status icons, collapsible
- **Center**: Isometric office with animated agents moving between rooms
- **Right panel**: Live activity feed — messages from agents as they work
- **Bottom bar**: Input for new goals + yellow badges for pending PRs

---

## Step 7: Approve Pull Requests

When an agent finishes a task (in sandbox mode), they create a **Pull Request**.

A yellow badge appears in the bottom bar:
```
[PR: Add user authentication endpoint]
```

Click it to see:
- What was done
- Which agent did it
- The branch name
- Review notes

You decide:
- **Approve & Merge** — accepts the work and merges the code
- **Request Changes** — rejects it and the agent reworks

---

## Step 8: Track Progress

While agents are working, or after they finish:

```bash
# See overall status (completed tasks, in progress, etc.)
sage-team status

# See the activity log
sage-team logs

# See only what Dex did
sage-team logs --agent dex

# See the last 100 events
sage-team logs -n 100
```

---

## Step 9: Resume a Session

Closed the terminal or restarted your computer? No problem. All state is saved in SQLite:

```bash
sage-team resume
```

This loads the last session with all agents, tasks, and PRs from where it left off.

To resume a specific session:
```bash
sage-team resume --session session-abc123
```

---

## Step 10: Advanced Configuration

```bash
# Change the Claude model (cheaper or more powerful)
sage-team config --model claude-sonnet-4-20250514

# Increase concurrent agents (uses more API credits)
sage-team config --max-agents 5

# Change autonomy mode (see table below)
sage-team config --autonomy sandbox

# Name your "company"
sage-team config --company-name "My AI Startup"

# Set a mission statement
sage-team config --mission "Build the best developer tools"

# View current config
sage-team config --show
```

---

## The 3 Autonomy Modes Explained

| Mode | What happens | When to use |
|------|-------------|-------------|
| **sandbox** (default) | Each agent works in an isolated git worktree. Creates a PR. You approve or reject. | Real projects. Safest option. |
| **direct** | Agents commit directly to your branch. No PRs. | Quick prototypes. When you trust the output. |
| **supervised** | Like sandbox, but agents pause and ask permission before risky actions. | When you want full control. |

---

## Quick Reference (cheat sheet)

```bash
sage-team init                          # once per project
sage-team config --api-key sk-ant-...   # once per project
sage-team doctor                        # check if everything is ok
sage-team start --goal "..."            # start working
sage-team status                        # see progress
sage-team logs                          # see what happened
sage-team resume                        # pick up where you left off
Ctrl+C                                  # stop
```

---

## All Commands

| Command | Description |
|---------|------------|
| `sage-team init` | Initialize Sage Team in current directory |
| `sage-team start --goal "..."` | Launch the office and start working on a goal |
| `sage-team start --no-browser` | Start without opening the browser |
| `sage-team start --port 8080` | Use a custom port (default: 3000) |
| `sage-team resume` | Resume the last active session |
| `sage-team resume --session <id>` | Resume a specific session |
| `sage-team status` | Show sprint progress and pending PRs |
| `sage-team config --show` | View current configuration |
| `sage-team config --api-key <key>` | Set your API key |
| `sage-team config --model <model>` | Change the Claude model |
| `sage-team config --max-agents <n>` | Set max concurrent agents |
| `sage-team config --autonomy <mode>` | Set autonomy mode |
| `sage-team team` | Show all 11 agents with roles and skills |
| `sage-team doctor` | Check system health and dependencies |
| `sage-team logs` | View activity log |
| `sage-team logs --agent <id>` | Filter logs by agent |
| `sage-team logs -n <count>` | Limit number of log entries |

---

## Troubleshooting

**"Sage Team not initialized"**
Run `sage-team init` in your project folder first.

**"No API key"**
Run `sage-team config --api-key sk-ant-...` or `export ANTHROPIC_API_KEY=...`

**"Claude Code: Not found"**
Install it globally: `npm i -g @anthropic-ai/claude-code`

**"No active session found"**
Start a new session: `sage-team start --goal "..."`

**Browser doesn't open**
Open `http://localhost:3000` manually (or whatever port you chose).

**Agents seem stuck**
Check `sage-team logs` for errors. Try `sage-team status` to see task states. You can always `Ctrl+C` and `sage-team resume` to restart.
