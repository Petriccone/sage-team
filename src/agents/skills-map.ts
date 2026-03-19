/**
 * Agent → Skill assignments.
 * All skill IDs use prefix convention: sp- for Superpowers, ag- for Antigravity.
 * See spec Section 7.2 for full mapping details.
 */
export const AGENT_SKILLS: Record<string, string[]> = {
  sage: [
    'sp-brainstorming', 'sp-writing-plans', 'sp-dispatching-parallel',
    'sp-verification', 'ag-product-strategy',
  ],
  nova: [
    'sp-requesting-review', 'sp-receiving-review', 'ag-security-audit',
    'ag-api-design-principles', 'ag-architecture', 'ag-monitoring-observability',
  ],
  aria: [
    'sp-writing-plans', 'sp-subagent-dev', 'ag-architecture',
    'ag-api-design-principles', 'ag-database-design', 'ag-microservices-patterns',
  ],
  dex: [
    'sp-tdd-cycle', 'sp-tdd-red', 'sp-tdd-green', 'sp-tdd-refactor',
    'sp-systematic-debugging', 'ag-clean-code', 'ag-typescript-pro', 'ag-auth-patterns',
  ],
  flux: [
    'sp-tdd-cycle', 'sp-finishing-branch', 'ag-react-patterns',
    'ag-nextjs-best-practices', 'ag-tailwind-design-system', 'ag-frontend-design',
  ],
  quinn: [
    'sp-verification', 'sp-systematic-debugging', 'ag-testing-patterns',
    'ag-playwright-skill', 'ag-e2e-testing', 'ag-accessibility-compliance',
  ],
  gage: [
    'sp-git-worktrees', 'ag-docker-expert', 'ag-kubernetes-architect',
    'ag-terraform-skill', 'ag-cicd-automation', 'ag-github-actions-templates',
  ],
  morgan: [
    'sp-brainstorming', 'sp-writing-plans', 'ag-product-manager-toolkit',
    'ag-analytics-tracking',
  ],
  uma: [
    'sp-brainstorming', 'ag-ui-ux-designer', 'ag-accessibility-compliance',
    'ag-tailwind-design-system', 'ag-frontend-design',
  ],
  river: [
    'sp-dispatching-parallel', 'sp-verification', 'ag-agile-scrum',
    'ag-team-collaboration-standup-notes',
  ],
  atlas: [
    'sp-tdd-cycle', 'ag-database-design', 'ag-postgresql', 'ag-sql-pro',
    'ag-data-engineering-data-pipeline', 'ag-ai-ml',
  ],
};
