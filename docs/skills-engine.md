# Skills Engine Documentation

## Overview

The Skills Engine is the core system that gives Sage Team agents their "superpowers" — structured protocols that guide agent behavior through proven methodologies. Each skill is a detailed protocol that gets injected into the agent's Claude system prompt.

## Architecture

```
┌──────────────────────────────────────────┐
│           Skill Registry                  │
│        (src/skills/registry.ts)           │
│                                           │
│  ┌─────────────┐  ┌──────────────────┐   │
│  │ Superpowers  │  │ Antigravity      │   │
│  │ (7 skills)   │  │ (18 skills)      │   │
│  └─────────────┘  └──────────────────┘   │
│  ┌─────────────┐                          │
│  │ Built-in    │                          │
│  │ (2 skills)  │                          │
│  └─────────────┘                          │
└────────────┬─────────────────────────────┘
             │
    ┌────────▼────────┐
    │ Skill Matching  │
    │ (by role, by    │
    │  trigger, by ID)│
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Agent Prompt    │
    │ Injection       │
    │ (system prompt  │
    │  + protocol)    │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Execution &     │
    │ Verification    │
    └─────────────────┘
```

## Skill Definition Interface

```typescript
interface SkillDefinition {
  id: string;              // Unique ID (e.g., 'sp-tdd', 'ag-clean-code')
  name: string;            // Display name
  category: SkillCategory; // One of 12 categories
  description: string;     // Short description
  triggers: string[];      // Keywords that auto-activate this skill
  applicableRoles: AgentRole[];  // Which agents can use this skill
  protocol: string;        // Full protocol (markdown) — injected into prompt
  verificationSteps: string[];   // Checklist for verification
  source: 'superpowers' | 'antigravity' | 'built-in';
}
```

## Skill Categories

| Category | Description | Example Skills |
|----------|-------------|---------------|
| `development` | Core coding practices | Clean Code, TypeScript Mastery |
| `testing` | Test strategies | TDD, Testing Patterns |
| `architecture` | System design | Microservices, API Design |
| `security` | Security practices | Security Audit (OWASP) |
| `devops` | Infrastructure | Docker, CI/CD, Kubernetes |
| `data-ai` | Data & ML | Data Pipelines, AI/ML Engineering |
| `business` | Product & strategy | Product Strategy |
| `workflow` | Work processes | Writing Plans, Verification |
| `collaboration` | Team work | Brainstorming, Dispatching |
| `design` | UX/UI | UX Design Systems |
| `debugging` | Problem solving | Systematic Debugging |
| `documentation` | Docs | Documentation |

## Skill Sources

### Superpowers (prefix: `sp-`)

From [obra/superpowers](https://github.com/obra/superpowers) — workflow discipline for coding agents.

| ID | Name | Key Principle |
|----|------|--------------|
| `sp-brainstorming` | Brainstorming | NO code until design is approved |
| `sp-tdd` | Test-Driven Development | NO code without failing test first |
| `sp-systematic-debugging` | Systematic Debugging | 4-phase root cause analysis |
| `sp-writing-plans` | Writing Plans | 2-5 min bite-sized tasks |
| `sp-dispatching-parallel` | Parallel Dispatch | One agent per independent domain |
| `sp-verification` | Verification | NO claims without fresh evidence |
| `sp-code-review` | Code Review | Review against spec, block on critical |

### Antigravity (prefix: `ag-`)

From [Petriccone/antigravity-awesome-skills](https://github.com/Petriccone/antigravity-awesome-skills) — 1000+ agentic skills.

| ID | Name | Category |
|----|------|----------|
| `ag-clean-code` | Clean Code | development |
| `ag-typescript-mastery` | TypeScript Mastery | development |
| `ag-react-nextjs` | React & Next.js | development |
| `ag-api-design` | API Design | architecture |
| `ag-security-audit` | Security Audit | security |
| `ag-docker-containers` | Docker & Containers | devops |
| `ag-cicd-pipelines` | CI/CD Pipelines | devops |
| `ag-database-design` | Database Design | data-ai |
| `ag-testing-patterns` | Testing Patterns | testing |
| `ag-performance` | Performance Optimization | development |
| `ag-accessibility` | Accessibility (WCAG) | design |
| `ag-git-workflow` | Git Workflow | workflow |
| `ag-microservices` | Microservices | architecture |
| `ag-ux-design-systems` | UX Design Systems | design |
| `ag-agile-scrum` | Agile & Scrum | business |
| `ag-product-strategy` | Product Strategy | business |
| `ag-data-pipelines` | Data Pipelines | data-ai |
| `ag-ai-engineer` | AI/ML Engineering | data-ai |

### Built-in (prefix: `bi-`)

| ID | Name | Purpose |
|----|------|---------|
| `bi-browser-automation` | Browser Automation | Playwright MCP integration |
| `bi-visual-progress-tracking` | Visual Progress Tracking | Screenshot milestones |

## Skill-Agent Assignment

Each agent has a curated set of skill IDs in their persona definition:

| Agent | Role | # Skills | Key Skills |
|-------|------|----------|------------|
| 👑 Sage | CEO | 7 | Brainstorming, Plans, Dispatch, Product Strategy |
| 🔬 Nova | CTO | 12 | TDD, Debugging, Security Audit, Clean Code, Microservices |
| ⚡ Dex | Sr. Dev | 15 | TDD, Clean Code, TypeScript, React, Testing, Git |
| 🌊 Flux | Fullstack | 13 | React, Next.js, API Design, Database, Docker |
| 🔍 Quinn | QA | 8 | TDD, Testing Patterns, Accessibility, Verification |
| 🚀 Gage | DevOps | 9 | Docker, CI/CD, Kubernetes, Terraform, Monitoring |
| 📋 Morgan | Product | 5 | Product Strategy, Agile, Plans |
| 🎨 Uma | UX | 6 | UX Design Systems, Accessibility, React |
| 🏛️ Aria | Architect | 9 | Microservices, API Design, Clean Code, Security |
| 🌀 River | Scrum | 5 | Agile, Plans, Verification |
| 📊 Atlas | Data | 8 | Data Pipelines, AI/ML, Database, Testing |

## Skill Execution Flow

```
1. Trigger Detection
   Task context matches skill triggers?
   → shouldAutoSelectSkill(context)

2. Activation
   Agent has skill? Under concurrent limit?
   → agent.activateSkill(skillId)
   → Status: 'executing-skill'
   → Event: 'skill-activated'

3. Protocol Injection
   Skill protocol added to Claude system prompt
   → claude.executeSkill(persona, skillId, taskContext)

4. Execution
   Claude follows protocol step-by-step
   → Produces work output

5. Verification
   Check against verificationSteps[]
   → Each step: PASS or FAIL

6. Completion
   → agent.completeSkill(skillId, output, verified)
   → Event: 'skill-completed'
   → Status returns to previous
```

## API Functions

```typescript
// Find a skill by ID
getSkillById(id: string): SkillDefinition | undefined

// Get all skills applicable to a role
getSkillsByRole(role: AgentRole): SkillDefinition[]

// Find skills matching trigger keywords
getSkillsByTrigger(trigger: string): SkillDefinition[]

// Build skill context string for prompt injection
buildSkillContext(skillIds: string[]): string

// Full registry
SKILL_REGISTRY: SkillDefinition[]
```
