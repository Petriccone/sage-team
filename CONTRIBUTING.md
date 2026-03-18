# Contributing to Sage Team

Thank you for your interest in contributing to Sage Team! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm
- Anthropic API key (for integration testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/Petriccone/sage-team.git
cd sage-team

# Install dependencies (also installs Chromium for Playwright)
npm install

# Build
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

### Environment

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes** following the code conventions below

3. **Build and test**:
   ```bash
   npm run build
   npm test
   ```

4. **Commit** using conventional commits:
   ```bash
   git commit -m "feat: add new skill for X"
   git commit -m "fix: resolve agent movement bug"
   git commit -m "docs: update skills documentation"
   ```

5. **Push and open a PR** against `main`

## Code Conventions

### TypeScript

- Strict mode is always enabled
- All types go in `src/types/index.ts`
- Use interfaces over type aliases for object shapes
- No `any` unless absolutely necessary (and documented why)

### Naming

- **Agent IDs**: lowercase, single word (`sage`, `nova`, `dex`)
- **Skill IDs**: prefixed by source (`sp-`, `ag-`, `bi-`)
- **Files**: kebab-case (`office-map.ts`, `claude-client.ts`)
- **Classes**: PascalCase (`Orchestrator`, `PlaywrightBridge`)
- **Functions**: camelCase (`getSkillById`, `buildSkillContext`)

### Project Structure

```
src/
├── agents/     # Agent definitions and logic
├── engine/     # Orchestrator and Claude client
├── skills/     # Skill registry
├── browser/    # Playwright integration
├── visual/     # Terminal UI
├── types/      # TypeScript types
├── utils/      # Utilities
├── cli.ts      # CLI entry
└── index.ts    # Public API
```

## Adding a New Agent

1. Define the persona in `src/agents/personas.ts`:
   - Unique `id`, `name`, `role`, `emoji`, `color`
   - `desk` position (check `office-map.ts` for available spots)
   - `skillIds` array referencing skills from the registry
   - `autonomyConfig` with appropriate capabilities
   - `systemPrompt` with role-specific instructions

2. Add desk to office map in `src/visual/office-map.ts`

3. Add room area coordinates to `ROOM_AREAS`

4. Add tests in `tests/agents.test.js`

## Adding a New Skill

1. Add `SkillDefinition` to `src/skills/registry.ts`
2. Use appropriate prefix: `sp-` (Superpowers), `ag-` (Antigravity), `bi-` (Built-in)
3. Document in `skills/<source>/SKILLS.md`
4. Assign to relevant agents in `src/agents/personas.ts`
5. Add tests in `tests/skills.test.js`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Maintenance

## Questions?

Open an issue on GitHub for questions or discussions.
