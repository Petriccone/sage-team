# Sage Team — Skills Catalog

> 27+ world-class skill protocols for autonomous AI agents.

Skills are structured protocols that guide agent behavior through proven methodologies. Each skill gets injected into the agent's Claude system prompt, ensuring consistent, high-quality execution.

## Sources

| Source | # Skills | Description |
|--------|----------|-------------|
| [Superpowers](https://github.com/obra/superpowers) | 7 | Workflow discipline for coding agents |
| [Antigravity](https://github.com/Petriccone/antigravity-awesome-skills) | 18 | 1000+ agentic skills for AI assistants |
| Built-in | 2 | Sage Team native integrations |

## Skill Directories

```
skills/
├── README.md              # This file
├── superpowers/           # Superpowers skills (sp-*)
│   └── SKILLS.md
├── antigravity/           # Antigravity skills (ag-*)
│   └── SKILLS.md
└── built-in/              # Native skills (bi-*)
    └── SKILLS.md
```

## Quick Reference

### Superpowers Skills

| ID | Name | Category |
|----|------|----------|
| `sp-brainstorming` | Brainstorming | collaboration |
| `sp-tdd` | Test-Driven Development | testing |
| `sp-systematic-debugging` | Systematic Debugging | debugging |
| `sp-writing-plans` | Writing Plans | workflow |
| `sp-dispatching-parallel` | Parallel Dispatch | collaboration |
| `sp-verification` | Verification | workflow |
| `sp-code-review` | Code Review | development |

### Antigravity Skills

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

### Built-in Skills

| ID | Name | Category |
|----|------|----------|
| `bi-browser-automation` | Browser Automation | development |
| `bi-visual-progress-tracking` | Visual Progress Tracking | workflow |

## Adding New Skills

To add a skill, add a `SkillDefinition` to `src/skills/registry.ts`:

```typescript
{
  id: 'ag-my-skill',           // Prefix: sp-, ag-, or bi-
  name: 'My Skill',
  category: 'development',     // One of 12 categories
  description: 'What this skill does',
  triggers: ['keyword1', 'keyword2'],
  applicableRoles: ['dev-senior', 'dev-fullstack'],
  protocol: `## Protocol\n...`,
  verificationSteps: ['Step 1', 'Step 2'],
  source: 'antigravity',
}
```

Then assign it to agents in `src/agents/personas.ts` by adding the skill ID to the agent's `skillIds` array.
