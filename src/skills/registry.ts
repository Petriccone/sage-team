import { SkillDefinition, SkillCategory, AgentRole } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// SAGE TEAM SKILL REGISTRY
// Integrating: Superpowers (obra) + Antigravity Awesome Skills (Petriccone)
// 100+ world-class skills for fully autonomous AI agents
// ═══════════════════════════════════════════════════════════════════════════════

export const SKILL_REGISTRY: SkillDefinition[] = [
  // ─── SUPERPOWERS: Core Workflow Skills ─────────────────────────────────────

  {
    id: 'sp-brainstorming',
    name: 'Brainstorming',
    category: 'collaboration',
    description: 'Turn ideas into fully formed designs through structured dialogue before any implementation. Hard gate: NO code until design is approved.',
    triggers: ['new feature', 'design', 'brainstorm', 'idea', 'proposal'],
    applicableRoles: ['ceo', 'cto', 'architect', 'product-manager', 'ux-designer', 'dev-senior', 'dev-fullstack'],
    protocol: `## Brainstorming Protocol (Superpowers)
HARD GATE: No code, no implementation, no scaffolding until design is presented and approved.

### Process:
1. EXPLORE project context — review existing files, docs, commits
2. ASK clarifying questions — one at a time, understand purpose and constraints
3. PROPOSE 2-3 approaches — with trade-offs and reasoning for each
4. PRESENT design — scaled to complexity, get approval per section
5. WRITE design doc — save to docs/specs/
6. SPEC REVIEW — dispatch reviewer, fix issues (max 3 iterations)
7. USER REVIEWS spec — gate before proceeding

### Design Principles:
- Break systems into smaller units with clear purpose and well-defined interfaces
- Each unit answers: what does it do, how do you use it, what depends on it?
- Follow existing patterns; include targeted improvements only where they serve current goals
- Remove unnecessary features ruthlessly (YAGNI)
- Present design sections incrementally with approval checkpoints`,
    verificationSteps: [
      'Design document exists and is complete',
      'All sections have been reviewed and approved',
      'Trade-offs are documented',
      'No implementation has started before approval',
    ],
    source: 'superpowers',
  },

  {
    id: 'sp-tdd',
    name: 'Test-Driven Development',
    category: 'testing',
    description: 'Write the test first. Watch it fail. Write minimal code to pass. The Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.',
    triggers: ['test', 'tdd', 'write test', 'test first', 'red green refactor'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'qa-lead'],
    protocol: `## TDD Protocol (Superpowers)
THE IRON LAW: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
Any code written before its corresponding test must be DELETED entirely.

### Red-Green-Refactor Cycle:

**RED Phase:**
- Write ONE minimal test demonstrating required behavior
- Clear name, real code (not mocks unless essential), single behavior focus
- Run tests → confirm FAILURE with expected message
- The failure proves the feature is missing, not that there's a typo

**GREEN Phase:**
- Write the SIMPLEST code that satisfies the test
- No adding features, no refactoring unrelated code, no over-engineering
- Run tests → confirm ALL pass with clean output

**REFACTOR Phase:**
- Only after green: remove duplication, improve names, extract helpers
- Maintain test passage throughout
- Commit after each successful refactor

### Red Flags Requiring Restart:
- Code written before tests
- Tests passing immediately (proves nothing)
- Cannot explain why test should fail
- Rationalizing exceptions to the process

### Verification Checklist:
- Every new function/method has a corresponding test
- Each test was watched failing before implementation
- Each test failed for the expected reason
- Minimal code was written to pass each test
- All tests pass with zero errors/warnings
- Edge cases and errors are covered`,
    verificationSteps: [
      'Every function has a corresponding test',
      'Each test was seen failing before implementation',
      'All tests pass with zero warnings',
      'Edge cases are covered',
    ],
    source: 'superpowers',
  },

  {
    id: 'sp-systematic-debugging',
    name: 'Systematic Debugging',
    category: 'debugging',
    description: 'Four-phase root cause analysis. NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.',
    triggers: ['bug', 'debug', 'error', 'fix', 'broken', 'crash', 'exception'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'qa-lead', 'devops'],
    protocol: `## Systematic Debugging Protocol (Superpowers)
IRON LAW: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

### Phase 1: Root Cause Investigation
- Analyze error messages carefully (read every line)
- Reproduce consistently with minimal steps
- Examine recent changes (git diff, git log)
- In multi-component systems: instrument each boundary to locate failure point

### Phase 2: Pattern Analysis
- Find WORKING examples of similar functionality
- Study complete reference implementations
- Compare working vs broken code systematically

### Phase 3: Hypothesis & Testing
- Formulate SPECIFIC hypothesis ("X fails because Y")
- Test with MINIMAL changes (one variable at a time)
- Validate before moving to next hypothesis

### Phase 4: Implementation
- Create FAILING test case that reproduces the bug
- Implement SINGLE focused fix
- If 3+ attempts fail: question architecture, not implementation

### Red Flags:
- "Quick fix for now" thinking
- Multiple simultaneous changes
- Skipping tests
- Proposing solutions before tracing data flow
- After 2 failed attempts, trying a third without questioning fundamentals`,
    verificationSteps: [
      'Root cause identified with evidence',
      'Failing test reproduces the bug',
      'Fix addresses root cause, not symptom',
      'All existing tests still pass',
    ],
    source: 'superpowers',
  },

  {
    id: 'sp-writing-plans',
    name: 'Writing Implementation Plans',
    category: 'workflow',
    description: 'Create detailed task-by-task implementation guides with 2-5 minute bite-sized steps following TDD.',
    triggers: ['plan', 'implementation plan', 'break down', 'task list', 'roadmap'],
    applicableRoles: ['ceo', 'cto', 'architect', 'dev-senior', 'product-manager', 'scrum-master'],
    protocol: `## Plan Writing Protocol (Superpowers)

### Plan Header (mandatory):
- Feature Name
- Goal (one sentence)
- Architecture (2-3 sentences)
- Tech Stack

### Task Decomposition:
- Each step: 2-5 minutes of work
- Exact file paths and line numbers
- Complete code samples (not pseudo-code)
- Specific commands with expected outputs
- One action per checkbox step

### File Organization:
- Design units with clear boundaries
- Keep files focused on single responsibilities
- Files that change together should co-locate
- Prefer smaller, maintainable files

### Process:
1. Scope check — verify feature doesn't span multiple independent subsystems
2. Map file structure — document what each file does
3. Decompose to bite-sized tasks
4. Review loop — fix issues until approved
5. Execution handoff — dispatch to subagents or execute inline`,
    verificationSteps: [
      'Every task has exact file paths',
      'Steps are 2-5 minutes each',
      'Code samples are complete, not pseudo-code',
      'Plan has been reviewed and approved',
    ],
    source: 'superpowers',
  },

  {
    id: 'sp-dispatching-parallel',
    name: 'Dispatching Parallel Agents',
    category: 'workflow',
    description: 'Dispatch one agent per independent problem domain. Let them work concurrently on unrelated issues.',
    triggers: ['parallel', 'concurrent', 'dispatch', 'multiple tasks', 'split work'],
    applicableRoles: ['ceo', 'cto', 'scrum-master', 'architect'],
    protocol: `## Parallel Dispatch Protocol (Superpowers)

### When to Apply:
- Multiple test failures with distinct root causes
- Several broken subsystems operating independently
- Each problem understandable without referencing others
- No shared state between investigations

### When NOT to Apply:
- Failures are interconnected (fixing one resolves others)
- Full system context is essential
- Agents would interfere with shared resources

### Steps:
1. IDENTIFY independent domains — group failures by what's broken
2. CREATE focused tasks — specific scope, clear objectives, constraints on what NOT to change
3. DISPATCH simultaneously — one agent per domain
4. REVIEW & INTEGRATE — verify non-conflicting fixes, run full test suite

### Effective Task Prompts:
- Focused on ONE problem domain
- Self-contained with all necessary context
- Include actual error messages and test names
- Establish clear constraints
- Specify expected deliverables`,
    verificationSteps: [
      'Domains are truly independent',
      'Each agent has focused, self-contained task',
      'No conflicting changes between agents',
      'Full test suite passes after integration',
    ],
    source: 'superpowers',
  },

  {
    id: 'sp-verification',
    name: 'Verification Before Completion',
    category: 'workflow',
    description: 'NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. Run the command. Read the output. THEN claim the result.',
    triggers: ['done', 'complete', 'finished', 'ready', 'ship', 'deploy'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'qa-lead', 'devops', 'cto'],
    protocol: `## Verification Protocol (Superpowers)
RULE: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.
Skipping verification is DISHONESTY, not efficiency.

### The Gate:
1. IDENTIFY which command validates the claim
2. EXECUTE that command completely and freshly
3. EXAMINE the full output and exit code
4. CONFIRM output supports the assertion
5. ONLY THEN articulate the claim with evidence

### Red Flags (HALT immediately):
- Language: "should work", "probably", "seems to"
- Expressing satisfaction before running checks
- "Great!", "Done!" before verification
- Confidence without evidence
- Partial checks ("some tests pass")

### Applies To:
- Any completion claim
- Any satisfaction expression
- Any positive work assessment
- Regardless of wording or implications

BOTTOM LINE: Run the command. Read the output. THEN claim the result.`,
    verificationSteps: [
      'Verification command has been run',
      'Full output has been examined',
      'Exit code is zero',
      'Output supports the completion claim',
    ],
    source: 'superpowers',
  },

  {
    id: 'sp-code-review',
    name: 'Code Review Protocol',
    category: 'collaboration',
    description: 'Structured code review against plans, categorizing issues by severity, blocking critical problems.',
    triggers: ['review', 'code review', 'PR review', 'pull request'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'qa-lead', 'cto', 'architect'],
    protocol: `## Code Review Protocol (Superpowers)

### Review Against:
- The implementation plan (exact file paths, expected behavior)
- Coding standards and patterns
- Security considerations
- Performance implications
- Test coverage

### Issue Categories:
- CRITICAL (blocking): Security vulnerabilities, data loss risks, broken core functionality
- HIGH: Logic errors, missing error handling, performance issues
- MEDIUM: Code quality, naming, missing tests for edge cases
- LOW: Style, formatting, documentation

### Process:
1. Read the plan/spec first
2. Review each file against its spec
3. Run tests and verify they pass
4. Check for missed edge cases
5. Provide specific, actionable feedback
6. Block on CRITICAL/HIGH issues only`,
    verificationSteps: [
      'All files reviewed against spec',
      'Issues categorized by severity',
      'No critical issues remain unresolved',
      'Tests pass after review changes',
    ],
    source: 'superpowers',
  },

  // ─── ANTIGRAVITY: Development Skills ───────────────────────────────────────

  {
    id: 'ag-clean-code',
    name: 'Clean Code',
    category: 'development',
    description: 'Robert C. Martin Clean Code principles: meaningful names, small functions, SOLID, no code smells.',
    triggers: ['clean code', 'refactor', 'code quality', 'maintainability', 'SOLID'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'architect', 'cto'],
    protocol: `## Clean Code Protocol (Antigravity)

### Meaningful Names:
- Use intention-revealing identifiers (elapsedTimeInDays, not d)
- Nouns for classes, verbs for methods
- Avoid misleading or ambiguous names
- Searchable names for important values

### Functions:
- Keep under 20 lines
- Single responsibility (do ONE thing)
- Max 2 parameters (ideally 0-1)
- Consistent abstraction level
- No side effects

### Error Handling:
- Prefer exceptions over return codes
- Write try-catch blocks FIRST
- Never return or pass null
- Create informative error messages

### Comments:
- Code should be self-documenting
- Only: legal notices, regex explanations, external dependency notes
- Delete redundant, misleading, or obvious comments

### SOLID Principles:
- S: Single Responsibility — one reason to change
- O: Open/Closed — open for extension, closed for modification
- L: Liskov Substitution — subtypes must be substitutable
- I: Interface Segregation — no fat interfaces
- D: Dependency Inversion — depend on abstractions

### Code Smells:
- Rigidity, fragility, immobility
- Needless complexity, repetition
- Long methods, large classes
- Feature envy, inappropriate intimacy`,
    verificationSteps: [
      'Functions under 20 lines',
      'Single responsibility per function/class',
      'Meaningful, searchable names',
      'No null returns/passes',
      'No code smells detected',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-typescript-mastery',
    name: 'TypeScript Mastery',
    category: 'development',
    description: 'Advanced TypeScript patterns: generics, conditional types, mapped types, strict mode, discriminated unions.',
    triggers: ['typescript', 'type', 'generic', 'interface', 'ts'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'architect'],
    protocol: `## TypeScript Mastery Protocol (Antigravity)

### Strict Mode Always:
- strict: true in tsconfig.json
- noImplicitAny, strictNullChecks, strictFunctionTypes
- noUncheckedIndexedAccess for safer arrays/objects

### Advanced Patterns:
- Discriminated unions for state machines
- Branded types for type-safe IDs
- Template literal types for string validation
- Conditional types for flexible APIs
- Mapped types for transformations
- const assertions for literal types
- satisfies operator for validation without widening

### Error Handling:
- Result<T, E> pattern over throw
- Exhaustive switch with never
- Type guards with is keyword
- Assertion functions

### Best Practices:
- Prefer interfaces over types for object shapes
- Use readonly by default
- Narrow types as early as possible
- Avoid enums — use const objects + type
- Generic constraints for better inference
- Utility types: Pick, Omit, Partial, Required, Record`,
    verificationSteps: [
      'Strict mode enabled',
      'No any types without justification',
      'Discriminated unions for state',
      'Proper error handling pattern',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-react-best-practices',
    name: 'React Best Practices',
    category: 'development',
    description: 'Modern React patterns: hooks, server components, performance optimization, state management.',
    triggers: ['react', 'component', 'hook', 'jsx', 'frontend', 'UI component'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'ux-designer'],
    protocol: `## React Best Practices Protocol (Antigravity)

### Component Architecture:
- Functional components only (no classes)
- Single responsibility per component
- Composition over inheritance
- Props interface defined explicitly
- Default exports for pages, named exports for components

### Hooks Best Practices:
- Custom hooks for reusable logic
- useCallback for stable references
- useMemo for expensive computations
- useRef for mutable values without re-renders
- Follow Rules of Hooks strictly

### Performance:
- React.memo for pure components
- Lazy loading with Suspense for code splitting
- Virtual lists for large datasets
- Avoid prop drilling — use Context or state managers
- Key prop optimization for lists

### State Management:
- Local state first (useState)
- useReducer for complex state logic
- Context for truly global state
- External stores (Zustand/Jotai) for complex apps
- Server state with TanStack Query

### Patterns:
- Render props for flexible rendering
- Compound components for related UI
- Controlled vs uncontrolled inputs
- Error boundaries for graceful failures
- Portal for modals/tooltips`,
    verificationSteps: [
      'Functional components only',
      'Custom hooks for reusable logic',
      'No prop drilling',
      'Proper key props on lists',
      'Performance optimizations applied',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-nextjs-expert',
    name: 'Next.js Expert',
    category: 'development',
    description: 'Next.js App Router, Server Components, API routes, middleware, ISR, and deployment optimization.',
    triggers: ['nextjs', 'next.js', 'app router', 'server component', 'SSR', 'ISR'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'architect'],
    protocol: `## Next.js Expert Protocol (Antigravity)

### App Router Architecture:
- Server Components by default (no "use client" unless needed)
- layout.tsx for shared UI
- loading.tsx for Suspense boundaries
- error.tsx for error handling
- Route groups for organization without URL impact

### Data Fetching:
- Server Components fetch data directly (no useEffect)
- Parallel data fetching with Promise.all
- Streaming with Suspense for progressive loading
- Cache and revalidate strategies (ISR)
- Server Actions for mutations

### Performance:
- Image optimization with next/image
- Font optimization with next/font
- Dynamic imports for code splitting
- Metadata API for SEO
- Middleware for auth/redirects/i18n

### API Routes:
- Route handlers in app/api/
- Type-safe request/response
- Rate limiting and validation
- Edge runtime for global low-latency

### Deployment:
- Vercel for zero-config deployment
- Docker for self-hosting
- Environment variables management
- Build optimization and caching`,
    verificationSteps: [
      'Server Components used by default',
      'Proper loading/error boundaries',
      'Optimized images and fonts',
      'SEO metadata configured',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-api-design',
    name: 'API Design Principles',
    category: 'architecture',
    description: 'RESTful API design, GraphQL, versioning, error handling, pagination, rate limiting.',
    triggers: ['api', 'rest', 'endpoint', 'graphql', 'api design'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'architect', 'cto'],
    protocol: `## API Design Protocol (Antigravity)

### REST Principles:
- Resource-based URLs (/users, /users/:id)
- HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE
- Status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401/403, 404, 422, 500
- HATEOAS for discoverability

### Request/Response:
- JSON:API or consistent envelope format
- Pagination: cursor-based preferred, offset for simple cases
- Filtering: ?filter[field]=value
- Sorting: ?sort=-createdAt,name
- Field selection: ?fields=id,name,email
- Include relations: ?include=posts,comments

### Error Handling:
- Consistent error format: { error: { code, message, details } }
- Validation errors with field-level detail
- Rate limit headers (X-RateLimit-*)
- Request IDs for tracing

### Security:
- Authentication: Bearer tokens (JWT or opaque)
- Authorization: RBAC or ABAC
- Input validation on every endpoint
- Rate limiting per user/IP
- CORS configuration
- No sensitive data in URLs

### Versioning:
- URL prefix (/v1/) or Accept header
- Deprecation headers and timeline
- Backwards compatibility within major version`,
    verificationSteps: [
      'Consistent URL naming convention',
      'Proper HTTP status codes',
      'Error responses are structured',
      'Rate limiting configured',
      'Authentication/authorization in place',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-security-audit',
    name: 'Security Audit',
    category: 'security',
    description: 'Comprehensive security audit: OWASP Top 10, vulnerability scanning, penetration testing, hardening.',
    triggers: ['security', 'vulnerability', 'audit', 'owasp', 'penetration test', 'secure'],
    applicableRoles: ['cto', 'devops', 'dev-senior', 'architect'],
    protocol: `## Security Audit Protocol (Antigravity)

### 7-Phase Audit:

**Phase 1: Reconnaissance**
- Map attack surface
- Identify technologies in scope
- Enumerate endpoints and entry points

**Phase 2: Vulnerability Scanning**
- Automated scanners (SAST/DAST)
- Dependency checking (npm audit, Snyk)
- Static analysis for code patterns

**Phase 3: OWASP Top 10 Testing**
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection (SQL, XSS, Command)
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Data Integrity Failures
- A09: Logging/Monitoring Failures
- A10: Server-Side Request Forgery

**Phase 4: API Security**
- Endpoint enumeration
- Auth/authz validation
- Rate limiting assessment
- Input validation testing

**Phase 5: Penetration Testing**
- Exploit demonstrated vulnerabilities
- Privilege escalation attempts
- Session management testing

**Phase 6: Hardening**
- Security headers (CSP, HSTS, etc.)
- Authentication strengthening
- Logging configuration

**Phase 7: Reporting**
- Risk assessment per finding
- Remediation guidance
- Executive and technical reports`,
    verificationSteps: [
      'All 7 phases completed',
      'OWASP Top 10 checked',
      'Vulnerabilities documented with PoC',
      'Remediation plan created',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-docker-expert',
    name: 'Docker & Containerization',
    category: 'devops',
    description: 'Docker best practices: multi-stage builds, security, orchestration, optimization.',
    triggers: ['docker', 'container', 'dockerfile', 'docker-compose', 'containerize'],
    applicableRoles: ['devops', 'dev-senior', 'architect'],
    protocol: `## Docker Expert Protocol (Antigravity)

### Dockerfile Best Practices:
- Multi-stage builds to minimize image size
- Use specific base image tags (not :latest)
- Order layers by change frequency (least → most)
- Combine RUN commands to reduce layers
- Use .dockerignore to exclude unnecessary files
- Non-root user for security
- HEALTHCHECK instruction

### Security:
- Scan images for vulnerabilities (Trivy, Snyk)
- No secrets in images or build args
- Read-only filesystem where possible
- Minimal base images (alpine, distroless)
- Pin dependencies to specific versions

### Docker Compose:
- Service dependency ordering
- Named volumes for persistence
- Network isolation between services
- Environment variable management
- Health checks for service readiness

### Optimization:
- Layer caching strategy
- BuildKit for parallel builds
- Multi-platform builds (arm64/amd64)
- Image size optimization (< 100MB target)`,
    verificationSteps: [
      'Multi-stage build used',
      'Non-root user configured',
      'No secrets in image',
      'Health check defined',
      'Image size optimized',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-ci-cd-pipeline',
    name: 'CI/CD Pipeline Design',
    category: 'devops',
    description: 'Continuous integration and deployment: GitHub Actions, testing gates, deployment strategies.',
    triggers: ['ci/cd', 'pipeline', 'github actions', 'deployment', 'continuous integration'],
    applicableRoles: ['devops', 'cto', 'dev-senior'],
    protocol: `## CI/CD Pipeline Protocol (Antigravity)

### Pipeline Stages:
1. LINT — code style and static analysis
2. TYPE CHECK — TypeScript/Flow verification
3. UNIT TESTS — fast, isolated tests
4. INTEGRATION TESTS — service interaction tests
5. BUILD — production build
6. SECURITY SCAN — vulnerability check
7. E2E TESTS — full user flow testing
8. DEPLOY (staging) — auto-deploy to staging
9. SMOKE TESTS — verify staging deployment
10. DEPLOY (production) — manual approval gate

### GitHub Actions Best Practices:
- Matrix builds for multiple Node/OS versions
- Caching (node_modules, build artifacts)
- Parallel jobs where possible
- Secrets management
- Branch protection rules
- Required status checks

### Deployment Strategies:
- Blue/Green for zero-downtime
- Canary for gradual rollout
- Rolling updates for k8s
- Feature flags for controlled releases

### Monitoring:
- Deploy notifications (Slack/Discord)
- Rollback automation
- Performance regression detection
- Error rate monitoring post-deploy`,
    verificationSteps: [
      'All pipeline stages defined',
      'Tests must pass before deploy',
      'Secrets properly managed',
      'Rollback strategy documented',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-database-design',
    name: 'Database Design & Optimization',
    category: 'data-ai',
    description: 'Schema design, query optimization, migrations, indexing strategies, PostgreSQL mastery.',
    triggers: ['database', 'schema', 'sql', 'query', 'migration', 'postgres', 'index'],
    applicableRoles: ['data-engineer', 'dev-senior', 'dev-fullstack', 'architect'],
    protocol: `## Database Design Protocol (Antigravity)

### Schema Design:
- Normalize to 3NF minimum
- Denormalize strategically for read performance
- Use UUIDs for distributed systems, BIGSERIAL for single-DB
- Created/updated timestamps on every table
- Soft deletes (deleted_at) for reversibility
- Proper foreign keys with cascading rules

### Indexing Strategy:
- Index foreign keys always
- Composite indexes: most selective column first
- Partial indexes for filtered queries
- GIN indexes for full-text search and JSONB
- BRIN indexes for time-series data
- Monitor with pg_stat_user_indexes

### Query Optimization:
- EXPLAIN ANALYZE on slow queries
- Avoid SELECT * — specify columns
- Use CTEs for readability, subqueries for performance
- Batch operations for bulk inserts/updates
- Connection pooling (PgBouncer)

### Migrations:
- Forward-only, never edit past migrations
- One logical change per migration
- Test migrations on production-size data
- Separate deploy from migrate
- Zero-downtime migration patterns`,
    verificationSteps: [
      'Schema normalized appropriately',
      'Foreign keys and indexes defined',
      'Migrations are forward-only',
      'Slow queries optimized with EXPLAIN',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-testing-patterns',
    name: 'Testing Patterns & Strategies',
    category: 'testing',
    description: 'Test pyramid, mocking strategies, E2E testing, property-based testing, snapshot testing.',
    triggers: ['testing', 'test strategy', 'unit test', 'integration test', 'e2e', 'test pattern'],
    applicableRoles: ['qa-lead', 'dev-senior', 'dev-fullstack'],
    protocol: `## Testing Patterns Protocol (Antigravity)

### Test Pyramid:
- UNIT (70%): Fast, isolated, test one thing
- INTEGRATION (20%): Test component interactions
- E2E (10%): Test full user flows

### Unit Testing:
- AAA pattern: Arrange, Act, Assert
- One assertion per test (logical, not literal)
- Descriptive test names: "should [behavior] when [condition]"
- Test behavior, not implementation
- Mock external dependencies, not internal modules

### Integration Testing:
- Test API endpoints with real database
- Use test containers for services
- Seed data for each test (isolated)
- Test error scenarios explicitly

### E2E Testing:
- Playwright or Cypress
- Page Object Model pattern
- Test critical user paths
- Visual regression testing
- Flake-resistant selectors (data-testid)

### Advanced Patterns:
- Property-based testing (fast-check)
- Snapshot testing for UI components
- Contract testing for APIs
- Mutation testing for test quality
- Chaos testing for resilience

### F.I.R.S.T. Principles:
- Fast: Milliseconds per test
- Independent: No test depends on another
- Repeatable: Same result every time
- Self-validating: Pass or fail, no manual check
- Timely: Written before or with the code`,
    verificationSteps: [
      'Test pyramid ratios respected',
      'AAA pattern followed',
      'No flaky tests',
      'Critical paths covered E2E',
      'Test coverage above threshold',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-performance-optimization',
    name: 'Performance Optimization',
    category: 'development',
    description: 'Web performance: Core Web Vitals, bundle optimization, rendering, caching, lazy loading.',
    triggers: ['performance', 'slow', 'optimize', 'speed', 'web vitals', 'lighthouse'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'architect', 'devops'],
    protocol: `## Performance Protocol (Antigravity)

### Core Web Vitals:
- LCP (Largest Contentful Paint) < 2.5s
- INP (Interaction to Next Paint) < 200ms
- CLS (Cumulative Layout Shift) < 0.1

### Bundle Optimization:
- Tree shaking for dead code elimination
- Code splitting by route
- Dynamic imports for heavy components
- Analyze with webpack-bundle-analyzer
- Target < 200KB initial JS

### Rendering:
- Server-side rendering for first paint
- Streaming SSR for progressive loading
- Virtual scrolling for long lists
- Debounce/throttle expensive handlers
- requestAnimationFrame for animations

### Caching:
- HTTP cache headers (Cache-Control, ETag)
- Service Worker for offline support
- CDN for static assets
- API response caching (SWR/TanStack Query)
- Memoization for expensive computations

### Images & Media:
- WebP/AVIF formats
- Responsive images (srcset)
- Lazy loading below the fold
- Blur placeholders for perceived speed
- Video: poster frames, lazy load`,
    verificationSteps: [
      'Core Web Vitals within targets',
      'Initial JS bundle < 200KB',
      'Images optimized',
      'Caching strategy implemented',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-accessibility',
    name: 'Accessibility Compliance',
    category: 'design',
    description: 'WCAG 2.1 AA compliance: semantic HTML, ARIA, keyboard navigation, screen readers, color contrast.',
    triggers: ['accessibility', 'a11y', 'wcag', 'screen reader', 'aria', 'keyboard navigation'],
    applicableRoles: ['ux-designer', 'dev-senior', 'dev-fullstack', 'qa-lead'],
    protocol: `## Accessibility Protocol (Antigravity)

### WCAG 2.1 AA Requirements:
- Perceivable: Text alternatives, captions, contrast 4.5:1
- Operable: Keyboard navigable, no seizure triggers, enough time
- Understandable: Readable, predictable, input assistance
- Robust: Compatible with assistive technologies

### Implementation:
- Semantic HTML first (nav, main, article, section, aside)
- ARIA only when HTML semantics are insufficient
- Skip navigation links
- Focus management for SPAs
- Visible focus indicators
- Color is never the only indicator
- Form labels and error messages
- Alt text for all informative images

### Testing:
- axe-core automated testing
- Screen reader testing (NVDA, VoiceOver)
- Keyboard-only navigation test
- Color contrast checker
- Zoom to 200% test
- Reduced motion preference

### Common Mistakes:
- div soup (use semantic elements)
- aria-label overuse (use visible labels)
- Missing heading hierarchy
- Tab traps in modals
- Auto-playing media without controls`,
    verificationSteps: [
      'Semantic HTML used throughout',
      'Color contrast meets 4.5:1 ratio',
      'Keyboard navigation works',
      'Screen reader tested',
      'axe-core passes with zero violations',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-git-workflow',
    name: 'Git Workflow',
    category: 'workflow',
    description: 'Git best practices: conventional commits, branching strategy, merge strategies, conflict resolution.',
    triggers: ['git', 'commit', 'branch', 'merge', 'rebase', 'version control'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'devops', 'cto'],
    protocol: `## Git Workflow Protocol (Antigravity)

### Conventional Commits:
- feat: new feature
- fix: bug fix
- docs: documentation only
- style: formatting, no logic change
- refactor: restructure without behavior change
- perf: performance improvement
- test: adding/fixing tests
- chore: build, CI, dependencies
- Format: type(scope): description

### Branching Strategy:
- main: always deployable
- develop: integration branch
- feature/*: new features
- fix/*: bug fixes
- release/*: release preparation
- hotfix/*: production emergency fixes

### Commit Best Practices:
- Small, atomic commits (one logical change)
- Present tense, imperative mood
- Subject line < 72 chars
- Body explains WHY, not WHAT
- Reference issue numbers

### Merge Strategy:
- Squash merge for feature branches
- Rebase for keeping history clean
- Merge commit for release branches
- Never force push shared branches

### Pull Requests:
- Template with description, testing, screenshots
- Require at least 1 review
- CI must pass before merge
- Link to issue/ticket`,
    verificationSteps: [
      'Conventional commit format used',
      'Branch naming follows convention',
      'PRs have descriptions and linked issues',
      'CI passes before merge',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-microservices',
    name: 'Microservices Architecture',
    category: 'architecture',
    description: 'Service decomposition, communication patterns, event-driven architecture, service mesh.',
    triggers: ['microservice', 'service', 'event-driven', 'message queue', 'distributed'],
    applicableRoles: ['architect', 'cto', 'dev-senior', 'devops'],
    protocol: `## Microservices Protocol (Antigravity)

### Service Decomposition:
- Bounded contexts from domain-driven design
- Single responsibility per service
- Independent deployment and scaling
- Own database per service
- Loose coupling, high cohesion

### Communication Patterns:
- Synchronous: REST, gRPC (for internal)
- Asynchronous: Event bus (Kafka, RabbitMQ)
- Request/Reply for queries
- Event Sourcing for audit trails
- CQRS for read/write separation
- Saga pattern for distributed transactions

### Resilience:
- Circuit breaker pattern
- Retry with exponential backoff
- Bulkhead isolation
- Timeout on all external calls
- Health checks and readiness probes
- Graceful degradation

### Observability:
- Distributed tracing (OpenTelemetry)
- Centralized logging (ELK, Loki)
- Metrics (Prometheus + Grafana)
- Service mesh (Istio/Linkerd)
- Alert on SLO violations`,
    verificationSteps: [
      'Services have clear bounded contexts',
      'Each service owns its data',
      'Communication patterns documented',
      'Circuit breakers implemented',
      'Observability stack configured',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-ux-design',
    name: 'UX/UI Design System',
    category: 'design',
    description: 'Design tokens, component library, user research, wireframing, prototyping, design principles.',
    triggers: ['design', 'UI', 'UX', 'wireframe', 'prototype', 'design system', 'user experience'],
    applicableRoles: ['ux-designer', 'dev-fullstack', 'product-manager'],
    protocol: `## UX/UI Design Protocol (Antigravity)

### Design Tokens:
- Colors: primary, secondary, neutral, semantic (success/warning/error/info)
- Typography: font families, sizes (scale), weights, line heights
- Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- Border radius: none, sm, md, lg, full
- Shadows: sm, md, lg, xl
- Breakpoints: sm (640), md (768), lg (1024), xl (1280), 2xl (1536)

### Component Library:
- Atoms: Button, Input, Badge, Avatar, Icon
- Molecules: Form Field, Card, Alert, Toast
- Organisms: Navigation, Form, Table, Modal
- Templates: Page layouts, Grid systems
- Each component: variants, sizes, states (default, hover, focus, disabled, error)

### User Research:
- User personas with goals and pain points
- User journey mapping
- Task analysis
- Usability testing (5 users = 80% of issues)
- A/B testing for data-driven decisions

### Design Principles:
- Clarity over cleverness
- Consistency across the application
- Feedback for every user action
- Forgiveness (undo, confirmation)
- Progressive disclosure for complexity`,
    verificationSteps: [
      'Design tokens defined',
      'Component library documented',
      'User personas created',
      'Accessibility built into design',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-agile-scrum',
    name: 'Agile & Scrum Mastery',
    category: 'workflow',
    description: 'Sprint planning, daily standups, retrospectives, velocity tracking, user stories, estimation.',
    triggers: ['sprint', 'standup', 'retro', 'user story', 'velocity', 'agile', 'scrum'],
    applicableRoles: ['scrum-master', 'product-manager', 'ceo'],
    protocol: `## Agile & Scrum Protocol (Antigravity)

### Sprint Ceremonies:
- Sprint Planning: 2-4 hours, select stories, break into tasks
- Daily Standup: 15 min, what did/will/blockers
- Sprint Review: Demo working software to stakeholders
- Retrospective: What went well, improve, actions

### User Stories:
- Format: "As a [role], I want [feature], so that [benefit]"
- Acceptance criteria: Given/When/Then
- INVEST: Independent, Negotiable, Valuable, Estimable, Small, Testable
- Story points: Fibonacci (1, 2, 3, 5, 8, 13)

### Sprint Execution:
- Sprint goal: ONE clear objective
- WIP limits: Max 2 tasks per person
- Pull, don't push work
- Protect the sprint from scope changes
- Definition of Done: coded, tested, reviewed, documented, deployed

### Metrics:
- Velocity: average story points per sprint
- Burn-down chart: remaining work over time
- Cycle time: time from start to done
- Lead time: time from request to delivery
- Escaped defects: bugs found in production

### Continuous Improvement:
- Track retrospective actions
- Measure improvement over 3-sprint window
- Celebrate wins, learn from failures
- Team health checks quarterly`,
    verificationSteps: [
      'Sprint goal is clear and achievable',
      'All stories have acceptance criteria',
      'WIP limits are respected',
      'Velocity tracked over sprints',
      'Retro actions followed up',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-product-strategy',
    name: 'Product Strategy & PRD',
    category: 'business',
    description: 'Product requirements, market analysis, roadmapping, prioritization frameworks, metrics.',
    triggers: ['product', 'PRD', 'requirements', 'roadmap', 'prioritize', 'feature request'],
    applicableRoles: ['product-manager', 'ceo', 'cto'],
    protocol: `## Product Strategy Protocol (Antigravity)

### PRD Structure:
1. Problem Statement — what pain point are we solving?
2. Target Users — personas and segments
3. Goals & Success Metrics — OKRs, KPIs
4. User Stories — detailed requirements
5. Technical Considerations — constraints, dependencies
6. Design Requirements — UX/UI guidelines
7. Launch Plan — phased rollout
8. Risk Assessment — what could go wrong

### Prioritization Frameworks:
- RICE: Reach × Impact × Confidence / Effort
- MoSCoW: Must/Should/Could/Won't
- Value vs Effort matrix (2×2)
- Kano Model: Basic/Performance/Excitement
- ICE: Impact × Confidence × Ease

### Metrics:
- Acquisition: signups, install rate
- Activation: onboarding completion
- Retention: DAU/MAU, churn rate
- Revenue: MRR, ARPU, LTV
- Referral: NPS, viral coefficient

### Roadmapping:
- Now/Next/Later framework
- Themes > Epics > Stories
- Outcome-based, not output-based
- Review and adjust quarterly
- Communicate changes transparently`,
    verificationSteps: [
      'Problem statement is clear',
      'Success metrics are measurable',
      'Prioritization framework applied',
      'Risks identified and mitigated',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-data-pipeline',
    name: 'Data Pipeline Engineering',
    category: 'data-ai',
    description: 'ETL/ELT design, data quality, pipeline orchestration, data modeling, analytics.',
    triggers: ['data pipeline', 'etl', 'data quality', 'data model', 'analytics', 'data warehouse'],
    applicableRoles: ['data-engineer', 'architect', 'dev-senior'],
    protocol: `## Data Pipeline Protocol (Antigravity)

### Pipeline Architecture:
- Extract: APIs, databases, files, streams
- Transform: Clean, validate, enrich, aggregate
- Load: Data warehouse, data lake, feature store

### Design Principles:
- Idempotent operations (safe to re-run)
- Schema evolution support
- Data lineage tracking
- Incremental processing over full rebuilds
- Dead letter queues for failed records

### Data Quality:
- Schema validation at ingestion
- Null checks, range checks, uniqueness checks
- Data freshness monitoring
- Anomaly detection on key metrics
- Automated alerts on quality failures

### Orchestration:
- DAG-based scheduling (Airflow, Dagster, Prefect)
- Dependency management between jobs
- Retry policies with backoff
- SLA monitoring and alerting
- Cost tracking per pipeline

### Modeling:
- Star schema for analytics (facts + dimensions)
- Slowly changing dimensions (SCD Type 2)
- Medallion architecture (bronze/silver/gold)
- Metrics layer for consistent definitions`,
    verificationSteps: [
      'Pipeline is idempotent',
      'Data quality checks in place',
      'Lineage is tracked',
      'Alerting configured for failures',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-ai-engineer',
    name: 'AI/ML Engineering',
    category: 'data-ai',
    description: 'LLM integration, RAG systems, prompt engineering, embeddings, fine-tuning, agent patterns.',
    triggers: ['ai', 'ml', 'llm', 'rag', 'prompt', 'embedding', 'fine-tune', 'agent'],
    applicableRoles: ['data-engineer', 'dev-senior', 'cto', 'architect'],
    protocol: `## AI Engineering Protocol (Antigravity)

### LLM Integration:
- Use structured outputs (JSON mode, tool use)
- Token management and context window optimization
- Streaming responses for UX
- Fallback chains (primary → secondary model)
- Rate limiting and retry with backoff
- Cost tracking per request

### RAG (Retrieval-Augmented Generation):
- Document chunking strategy (overlap, semantic)
- Embedding model selection (OpenAI, Cohere, local)
- Vector database (Pinecone, Weaviate, pgvector)
- Retrieval: hybrid search (semantic + keyword)
- Re-ranking for relevance
- Context window packing

### Prompt Engineering:
- System prompts for persona and constraints
- Few-shot examples for format guidance
- Chain-of-thought for reasoning tasks
- Structured output schemas
- Temperature tuning per task type
- Evaluation framework (human + automated)

### Agent Patterns:
- ReAct (Reasoning + Acting)
- Tool use with function calling
- Multi-agent orchestration
- Memory systems (short/long term)
- Self-reflection and correction loops
- Human-in-the-loop gates`,
    verificationSteps: [
      'Structured outputs enforced',
      'Rate limiting configured',
      'RAG retrieval quality measured',
      'Prompts versioned and evaluated',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-kubernetes',
    name: 'Kubernetes Architecture',
    category: 'devops',
    description: 'K8s deployment, services, ingress, scaling, monitoring, Helm charts, security.',
    triggers: ['kubernetes', 'k8s', 'pod', 'deployment', 'helm', 'cluster'],
    applicableRoles: ['devops', 'architect', 'cto'],
    protocol: `## Kubernetes Protocol (Antigravity)

### Core Resources:
- Deployments for stateless workloads
- StatefulSets for databases/queues
- DaemonSets for node-level services
- Jobs/CronJobs for batch processing
- Services (ClusterIP, NodePort, LoadBalancer)
- Ingress for HTTP routing

### Best Practices:
- Resource requests and limits on all containers
- Liveness and readiness probes
- Pod Disruption Budgets for availability
- Namespace isolation per environment
- Network Policies for security
- RBAC for access control

### Scaling:
- HPA (Horizontal Pod Autoscaler) on CPU/memory
- VPA (Vertical Pod Autoscaler) for right-sizing
- Cluster Autoscaler for node management
- KEDA for event-driven scaling

### Helm Charts:
- Values files per environment
- Template helpers for DRY
- Hooks for migrations
- Chart testing
- Semantic versioning

### Monitoring:
- Prometheus for metrics
- Grafana for dashboards
- Alert Manager for notifications
- Jaeger for distributed tracing
- Kube-state-metrics for cluster health`,
    verificationSteps: [
      'Resource limits set on all containers',
      'Health probes configured',
      'RBAC properly configured',
      'Monitoring and alerting in place',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-terraform',
    name: 'Infrastructure as Code (Terraform)',
    category: 'devops',
    description: 'Terraform modules, state management, workspace organization, drift detection.',
    triggers: ['terraform', 'infrastructure as code', 'iac', 'provision', 'aws', 'cloud'],
    applicableRoles: ['devops', 'architect', 'cto'],
    protocol: `## Terraform Protocol (Antigravity)

### Module Structure:
- Root module: orchestrates child modules
- Child modules: reusable components
- Variables, outputs, locals in separate files
- README.md per module
- Examples directory

### State Management:
- Remote backend (S3 + DynamoDB lock)
- State per environment
- Never edit state manually
- Import existing resources before managing
- State file encryption

### Best Practices:
- terraform fmt and validate in CI
- Plan before apply (always review)
- Targeted applies for risky changes
- Use data sources over hard-coded values
- Tag all resources consistently
- Use count/for_each for repetitive resources

### Security:
- No secrets in state files (use Vault/SSM)
- Least privilege IAM roles
- Enable encryption at rest everywhere
- Security groups: default deny
- Enable CloudTrail/audit logging`,
    verificationSteps: [
      'Remote backend configured',
      'Plan reviewed before apply',
      'No secrets in code or state',
      'All resources tagged',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-monitoring-observability',
    name: 'Monitoring & Observability',
    category: 'devops',
    description: 'Three pillars: logs, metrics, traces. Alerting, dashboards, SLOs, incident response.',
    triggers: ['monitoring', 'observability', 'logging', 'metrics', 'tracing', 'alert', 'SLO'],
    applicableRoles: ['devops', 'dev-senior', 'cto'],
    protocol: `## Observability Protocol (Antigravity)

### Three Pillars:
- LOGS: Structured JSON, log levels, correlation IDs
- METRICS: Counters, gauges, histograms (RED/USE methods)
- TRACES: Distributed tracing across services

### SLO-Based Alerting:
- Define SLIs (latency p99, error rate, availability)
- Set SLOs (99.9% availability = 43min/month error budget)
- Alert on error budget burn rate, not individual failures
- Multi-window alerts (fast burn + slow burn)

### Dashboards:
- Golden signals: latency, traffic, errors, saturation
- Business metrics alongside technical
- Per-service dashboards
- Dependency maps

### Incident Response:
- PagerDuty/OpsGenie for on-call rotation
- Runbooks for known issues
- Blameless post-mortems
- Track MTTD, MTTR, MTBF
- Status page for external communication`,
    verificationSteps: [
      'Structured logging implemented',
      'SLOs defined and measured',
      'Alerting on error budget burn',
      'Dashboards for golden signals',
      'Runbooks for common incidents',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-seo-optimization',
    name: 'SEO Optimization',
    category: 'business',
    description: 'Technical SEO, content strategy, meta tags, structured data, sitemap, core web vitals.',
    triggers: ['seo', 'search engine', 'meta tags', 'sitemap', 'structured data', 'ranking'],
    applicableRoles: ['dev-fullstack', 'product-manager', 'ux-designer'],
    protocol: `## SEO Protocol (Antigravity)

### Technical SEO:
- Semantic HTML structure (h1-h6 hierarchy)
- Meta tags: title (60 chars), description (155 chars)
- Open Graph and Twitter Card tags
- Canonical URLs to prevent duplicates
- XML sitemap with priority and frequency
- robots.txt configuration
- Structured data (JSON-LD Schema.org)

### Performance:
- Core Web Vitals (LCP, INP, CLS)
- Mobile-first responsive design
- Image optimization (WebP, lazy loading, alt text)
- Minimize render-blocking resources
- CDN for global delivery

### Content:
- Unique, valuable content per page
- Internal linking strategy
- URL structure: short, descriptive, hyphenated
- Breadcrumb navigation
- 404 page with helpful links

### Monitoring:
- Google Search Console
- Lighthouse audits
- Core Web Vitals tracking
- Backlink monitoring
- Keyword ranking tracking`,
    verificationSteps: [
      'Meta tags on all pages',
      'Structured data valid',
      'Sitemap generated and submitted',
      'Core Web Vitals passing',
      'Mobile-responsive verified',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-stripe-integration',
    name: 'Stripe Payment Integration',
    category: 'development',
    description: 'Stripe Checkout, subscriptions, webhooks, customer portal, billing management.',
    triggers: ['stripe', 'payment', 'subscription', 'billing', 'checkout'],
    applicableRoles: ['dev-senior', 'dev-fullstack'],
    protocol: `## Stripe Integration Protocol (Antigravity)

### Setup:
- Server-side SDK (never client-side secret key)
- Webhook endpoint with signature verification
- Test mode for development
- Environment-specific API keys

### Checkout Flow:
- Stripe Checkout for hosted payment page
- Price IDs from Stripe dashboard (not hardcoded amounts)
- Success/cancel URLs with session ID
- Customer creation and linking

### Subscriptions:
- Products and Prices in Stripe
- Customer portal for self-service
- Webhook events: checkout.session.completed, invoice.paid, customer.subscription.updated/deleted
- Handle failed payments: invoice.payment_failed
- Proration for plan changes

### Webhooks:
- Verify signature with STRIPE_WEBHOOK_SECRET
- Idempotent event handling
- Return 200 quickly, process async
- Handle duplicate events gracefully
- Log all webhook events

### Security:
- Never expose secret key to client
- Always verify webhook signatures
- Use Stripe.js for card collection (PCI compliance)
- Validate amounts server-side`,
    verificationSteps: [
      'Webhook signature verification',
      'Idempotent event handling',
      'No secret keys on client',
      'All payment events handled',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-auth-patterns',
    name: 'Authentication & Authorization',
    category: 'security',
    description: 'JWT, OAuth 2.0, RBAC, ABAC, session management, MFA, password hashing.',
    triggers: ['auth', 'login', 'jwt', 'oauth', 'session', 'permission', 'role'],
    applicableRoles: ['dev-senior', 'dev-fullstack', 'architect', 'cto'],
    protocol: `## Auth Protocol (Antigravity)

### Authentication:
- Password hashing: bcrypt/argon2 (NEVER plain text or MD5/SHA)
- JWT: short-lived access tokens (15min) + long-lived refresh tokens
- HTTP-only, Secure, SameSite cookies for tokens
- OAuth 2.0 / OIDC for third-party login
- MFA: TOTP (Google Authenticator) or WebAuthn
- Rate limiting on login endpoints

### Authorization:
- RBAC: Role-Based Access Control for simple apps
- ABAC: Attribute-Based for complex policies
- Permission checks on EVERY endpoint
- Row-Level Security in database
- Principle of least privilege
- Audit logging for sensitive operations

### Session Management:
- Secure session IDs (cryptographically random)
- Session invalidation on logout
- Idle timeout and absolute timeout
- Single session or multi-session policy
- Session fixation protection

### Security Headers:
- Strict-Transport-Security
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin`,
    verificationSteps: [
      'Passwords hashed with bcrypt/argon2',
      'JWT tokens are short-lived',
      'Permission checks on every endpoint',
      'Security headers configured',
      'Rate limiting on auth endpoints',
    ],
    source: 'antigravity',
  },

  {
    id: 'ag-documentation',
    name: 'Technical Documentation',
    category: 'documentation',
    description: 'API docs, architecture decision records, onboarding guides, runbooks, changelogs.',
    triggers: ['documentation', 'docs', 'readme', 'ADR', 'runbook', 'onboarding'],
    applicableRoles: ['dev-senior', 'architect', 'product-manager', 'scrum-master'],
    protocol: `## Documentation Protocol (Antigravity)

### Types of Documentation:
- README: Project overview, quickstart, installation
- API Docs: OpenAPI/Swagger, examples, error codes
- ADRs: Architecture Decision Records (context, decision, consequences)
- Runbooks: Step-by-step operational procedures
- Onboarding: New developer setup guide
- Changelog: User-facing changes per release

### README Structure:
1. Project name and description
2. Quick start (3 steps or less)
3. Prerequisites
4. Installation
5. Usage examples
6. Configuration
7. Contributing guidelines
8. License

### Writing Principles:
- Write for the reader, not the writer
- Show, don't tell (examples over explanations)
- Keep it current (outdated docs are worse than none)
- Use diagrams for architecture
- Code examples that actually run

### ADR Format:
- Title: ADR-NNN: Decision Title
- Status: Proposed/Accepted/Deprecated/Superseded
- Context: Why this decision was needed
- Decision: What was decided
- Consequences: Trade-offs and implications`,
    verificationSteps: [
      'README has quickstart guide',
      'API endpoints documented',
      'Architecture decisions recorded',
      'Documentation is current',
    ],
    source: 'antigravity',
  },
];

// ─── Skill Registry Functions ────────────────────────────────────────────────

export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find((s) => s.id === id);
}

export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
  return SKILL_REGISTRY.filter((s) => s.category === category);
}

export function getSkillsByRole(role: AgentRole): SkillDefinition[] {
  return SKILL_REGISTRY.filter((s) => s.applicableRoles.includes(role));
}

export function getSkillsByTrigger(input: string): SkillDefinition[] {
  const lower = input.toLowerCase();
  return SKILL_REGISTRY.filter((s) =>
    s.triggers.some((t) => lower.includes(t.toLowerCase()))
  );
}

export function getSkillsBySource(source: 'superpowers' | 'antigravity' | 'built-in'): SkillDefinition[] {
  return SKILL_REGISTRY.filter((s) => s.source === source);
}

export function getAllSkillIds(): string[] {
  return SKILL_REGISTRY.map((s) => s.id);
}

export function getSkillProtocol(id: string): string | null {
  const skill = getSkillById(id);
  return skill?.protocol || null;
}

export function buildSkillContext(skillIds: string[]): string {
  return skillIds
    .map((id) => getSkillById(id))
    .filter(Boolean)
    .map((s) => `### ${s!.name}\n${s!.protocol}`)
    .join('\n\n---\n\n');
}
