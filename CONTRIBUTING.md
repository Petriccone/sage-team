# Contributing to Sage Team

## Getting Started

```bash
git clone https://github.com/Petriccone/sage-team.git
cd sage-team
npm install
npm run build
```

## Development

```bash
# Run in development mode (ts-node)
npm run dev -- start

# Type check without building
npx tsc --noEmit

# Build for production
npm run build
```

## Project Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture overview.

Key files:
- `src/agents/personas.ts` — Agent definitions (add/modify agents here)
- `src/skills/registry.ts` — Skill protocols (add new skills here)
- `src/engine/orchestrator.ts` — Core engine loop
- `src/visual/dashboard.ts` — Terminal UI
- `src/visual/office-map.ts` — Office layout and animations

## Code Guidelines

### TypeScript
- Strict mode enabled
- All types defined in `src/types/index.ts`
- No `any` types unless interfacing with blessed library

### Terminal UI
- Status animations must be ASCII-only (no emojis) — emojis have variable width and break alignment
- All animation frames must be exactly 5 characters wide
- Test dashboard rendering at different terminal sizes (minimum 80x24)

### Memory Safety
- All arrays must be bounded (see ARCHITECTURE.md for limits)
- Dashboard render must have re-entrancy guard and throttle
- Individual agent errors in tick loop must be caught

### Adding a New Agent

1. Add persona to `src/agents/personas.ts`
2. Add role to `AgentRole` type in `src/types/index.ts`
3. Add desk position in persona config
4. Add role-specific statuses in `orchestrator.ts` (`getWorkStatusesForRole`, `getIdleActivitiesForRole`)
5. Add agent key binding in `dashboard.ts`
6. Update office map in `src/visual/office-map.ts`

### Adding a New Skill

1. Add skill definition to `src/skills/registry.ts`
2. Assign to relevant agents via `skillIds` in `personas.ts`
3. Add trigger keywords for auto-activation
4. Include verification steps

## Pull Requests

- Branch from `master`
- Include design doc in `docs/plans/` for significant features
- Ensure `npx tsc --noEmit` passes
- Test with `sage-team start` and `sage-team start --no-visual`
- Update relevant docs (AGENTS.md, SKILLS.md, ARCHITECTURE.md)

## Design Documents

For non-trivial changes, create a design document in `docs/plans/` with the naming convention:

```
YYYY-MM-DD-feature-name-design.md
```

Include: Problem, Solution, Architecture changes, Impact.
