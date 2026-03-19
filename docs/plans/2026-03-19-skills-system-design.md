# Skills System — Design Document

**Date:** 2026-03-19
**Status:** Implemented
**Author:** Claude

## Overview

The skills system provides structured protocols that are injected into agent system prompts, giving each agent role-specific capabilities based on proven methodologies.

## Architecture

```
SkillDefinition {
  id: string           # Unique ID (e.g., "sp-tdd", "ag-clean-code")
  name: string         # Display name
  source: string       # "superpowers" | "antigravity" | "built-in"
  category: SkillCategory
  description: string
  triggers: string[]   # Keywords that auto-activate this skill
  protocol: string     # Step-by-step instructions
  verificationSteps: string[]  # How to verify skill was applied correctly
  applicableRoles: AgentRole[]
}
```

## Skill Sources

### Superpowers (7 skills)
Prefix: `sp-`
Based on https://github.com/obra/superpowers — workflow discipline for AI coding agents.

| ID | Skill | Key Protocol |
|----|-------|-------------|
| sp-tdd | TDD | No code without failing test first |
| sp-brainstorming | Brainstorming | 2-3 approaches before any code |
| sp-debugging | Systematic Debugging | 4-phase root cause analysis |
| sp-writing-plans | Writing Plans | 2-5 min bite-sized tasks |
| sp-dispatching-parallel | Parallel Dispatch | One agent per domain |
| sp-verification | Verification | Fresh evidence before claiming done |
| sp-code-review | Code Review | Categorize by severity |

### Antigravity (18+ skills)
Prefix: `ag-`
Based on https://github.com/Petriccone/antigravity-awesome-skills

Covers: Clean Code, TypeScript, React, Next.js, API Design, Security, Docker, CI/CD, Database, Testing, Performance, Accessibility, Git, Microservices, UX, Agile, Product Strategy, Data/AI.

### Built-in (2 skills)
Prefix: `bi-`

| ID | Skill | Purpose |
|----|-------|---------|
| bi-browser-automation | Browser Automation | Playwright MCP integration |
| bi-visual-progress-tracking | Visual Tracking | Screenshots and reports |

## Skill Injection Flow

1. Agent is created with `skillIds: string[]` in persona config
2. `ClaudeClient.buildSystemPrompt()` calls `getSkillsByRole()` and `buildSkillContext()`
3. Skill protocols are appended to the agent's system prompt
4. When a task matches skill triggers, the skill is auto-activated
5. Agent tracks active skills in `state.activeSkills[]`
6. Completed skills are verified against `verificationSteps`

## Skill-to-Agent Mapping

Each agent has skills assigned by role relevance. See `personas.ts` for the full mapping. Example:
- Dex (Senior Dev): sp-tdd, sp-code-review, ag-clean-code, ag-typescript, ag-testing
- Quinn (QA Lead): sp-tdd, sp-verification, ag-testing, ag-accessibility, bi-browser-automation
- Gage (DevOps): ag-docker, ag-cicd, ag-kubernetes, ag-terraform, ag-monitoring
