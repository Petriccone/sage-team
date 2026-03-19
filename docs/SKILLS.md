# Skills Catalog

Sage Team integrates 27+ structured skill protocols from three sources. Each skill provides step-by-step protocols injected into agent system prompts.

## Superpowers Skills (7)

Source: [github.com/obra/superpowers](https://github.com/obra/superpowers)

| ID | Name | Category | Trigger Keywords |
|----|------|----------|-----------------|
| `sp-tdd` | TDD | development | test, tdd, spec, unit |
| `sp-brainstorming` | Brainstorming | workflow | plan, design, approach, brainstorm |
| `sp-debugging` | Systematic Debugging | development | bug, error, fix, debug, broken |
| `sp-writing-plans` | Writing Plans | workflow | plan, task, breakdown, steps |
| `sp-dispatching-parallel` | Parallel Dispatch | workflow | parallel, concurrent, dispatch |
| `sp-verification` | Verification | workflow | verify, confirm, check, validate |
| `sp-code-review` | Code Review | development | review, pr, pull request |

### Key Protocols

**TDD Iron Law:** No production code without a failing test first. Cycle: Red (write failing test) → Green (minimal code to pass) → Refactor (clean up).

**Brainstorming Hard Gate:** No code until design is approved. Always explore 2-3 approaches with trade-offs before committing.

**Verification:** Never claim done without fresh evidence. Run the tests. Read the output. THEN claim success.

## Antigravity Skills (18+)

Source: [github.com/Petriccone/antigravity-awesome-skills](https://github.com/Petriccone/antigravity-awesome-skills)

| ID | Name | Category | Applicable Roles |
|----|------|----------|-----------------|
| `ag-clean-code` | Clean Code | development | cto, dev-senior, dev-fullstack, architect |
| `ag-typescript` | TypeScript Mastery | development | cto, dev-senior, dev-fullstack |
| `ag-react` | React | development | dev-senior, dev-fullstack, ux-designer |
| `ag-nextjs` | Next.js | development | dev-senior, dev-fullstack |
| `ag-api-design` | API Design | architecture | cto, dev-senior, dev-fullstack, architect |
| `ag-security-audit` | Security Audit (OWASP) | security | cto, devops |
| `ag-docker` | Docker | devops | devops |
| `ag-cicd` | CI/CD Pipelines | devops | devops |
| `ag-kubernetes` | Kubernetes | devops | devops |
| `ag-terraform` | Terraform | devops | devops |
| `ag-database` | Database Design | data-ai | dev-senior, dev-fullstack, architect, data-engineer |
| `ag-testing` | Testing Patterns | testing | cto, dev-senior, dev-fullstack, qa-lead, data-engineer |
| `ag-performance` | Performance Optimization | development | cto, dev-senior, dev-fullstack, architect, devops, data-engineer |
| `ag-accessibility` | Accessibility (WCAG) | development | dev-fullstack, qa-lead, ux-designer, product-manager |
| `ag-git-workflow` | Git Workflow | workflow | cto, dev-senior, devops |
| `ag-microservices` | Microservices | architecture | cto, architect |
| `ag-ux-design-systems` | UX Design Systems | business | ux-designer |
| `ag-agile-scrum` | Agile/Scrum | business | ceo, product-manager, scrum-master |
| `ag-product-strategy` | Product Strategy | business | ceo, product-manager, scrum-master |
| `ag-data-pipelines` | Data Pipelines | data-ai | data-engineer |
| `ag-ai-ml` | AI/ML Engineering | data-ai | data-engineer |
| `ag-monitoring` | Monitoring & Observability | devops | devops |
| `ag-seo` | SEO | business | product-manager |
| `ag-documentation` | Documentation | workflow | scrum-master |

## Built-in Skills (2)

| ID | Name | Category | Applicable Roles |
|----|------|----------|-----------------|
| `bi-browser-automation` | Browser Automation | development | qa-lead, ux-designer, dev-senior, dev-fullstack |
| `bi-visual-progress-tracking` | Visual Progress Tracking | workflow | ceo, qa-lead, ux-designer |

## How Skills Work

### Injection
Skills are loaded from the registry and injected into the agent's Claude system prompt at startup. Each agent only receives skills relevant to their role.

### Activation
Skills can be activated:
1. **Auto-trigger**: When task description matches skill trigger keywords
2. **Manual**: By agent decision during autonomous operation
3. **On assignment**: When a task specifies `requiredSkills`

### Execution Tracking
```typescript
SkillExecution {
  skillId: string
  agentId: string
  startedAt: number
  completedAt: number | null
  status: 'running' | 'completed' | 'failed'
  output: string | null
  verificationPassed: boolean
}
```

### Concurrency Limits
Each agent has `maxConcurrentSkills` (typically 2-4). New skills are queued if the limit is reached.
