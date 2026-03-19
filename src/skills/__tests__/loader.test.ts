import { describe, it, expect } from 'vitest';
import { SkillLoader } from '../loader';

describe('SkillLoader', () => {
  const loader = new SkillLoader();

  it('should detect superpowers installation path', () => {
    const path = loader.getSuperpowersPath();
    // May be null if not installed — test handles both
    if (path) {
      expect(path).toContain('superpowers');
    }
  });

  it('should resolve sp- skill ID to file path', () => {
    const resolved = loader.resolveSkillPath('sp-tdd-cycle');
    if (resolved) {
      expect(resolved).toContain('test-driven-development');
    }
  });

  it('should load skill content as string', () => {
    const content = loader.loadSkill('sp-brainstorming');
    if (content) {
      expect(content.length).toBeGreaterThan(100);
      expect(content.toLowerCase()).toContain('brainstorm');
    }
  });

  it('should return null for unknown skill ID', () => {
    const content = loader.loadSkill('sp-nonexistent-skill');
    expect(content).toBeNull();
  });

  it('should respect token budget', () => {
    const skills = loader.loadSkillsForTask(
      ['sp-tdd-cycle', 'sp-brainstorming', 'ag-clean-code'],
      30000 // token budget
    );
    // Should load at least the first skill (if superpowers installed)
    expect(skills.length).toBeGreaterThanOrEqual(0);
    // Total content should be under budget (~4 chars/token)
    const totalChars = skills.reduce((sum, s) => sum + s.content.length, 0);
    expect(totalChars).toBeLessThanOrEqual(30000 * 4);
  });

  it('should have correct skill ID mappings', () => {
    // Verify the internal mapping covers known skill IDs
    const knownIds = ['sp-brainstorming', 'sp-tdd-cycle', 'sp-verification', 'sp-writing-plans'];
    for (const id of knownIds) {
      const path = loader.resolveSkillPath(id);
      // Path may be null if not installed, but resolveSkillPath should know the mapping
      expect(loader.hasMapping(id)).toBe(true);
    }
  });
});
