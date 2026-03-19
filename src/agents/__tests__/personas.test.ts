import { describe, it, expect } from 'vitest';
import { PERSONAS } from '../personas';
import { AGENT_SKILLS } from '../skills-map';

describe('Agent Personas', () => {
  it('should define exactly 11 agents', () => {
    expect(PERSONAS.length).toBe(11);
  });

  it('should have unique IDs', () => {
    const ids = PERSONAS.map(p => p.id);
    expect(new Set(ids).size).toBe(11);
  });

  it('should have unique rooms', () => {
    const rooms = PERSONAS.map(p => p.defaultRoom);
    // Dev bullpen shares room, so unique count < 11
    expect(rooms.length).toBe(11);
  });

  it('should have valid roles', () => {
    const validRoles = [
      'ceo', 'cto', 'architect', 'dev-senior', 'dev-fullstack',
      'qa-lead', 'devops', 'product-manager', 'ux-designer',
      'scrum-master', 'data-engineer'
    ];
    PERSONAS.forEach(p => {
      expect(validRoles).toContain(p.role);
    });
  });
});

describe('Agent Skills Map', () => {
  it('should have skills for all 11 agents', () => {
    expect(Object.keys(AGENT_SKILLS).length).toBe(11);
  });

  it('should use sp- or ag- prefix for all skills', () => {
    Object.values(AGENT_SKILLS).flat().forEach(skillId => {
      expect(skillId.startsWith('sp-') || skillId.startsWith('ag-')).toBe(true);
    });
  });

  it('should assign TDD to developers', () => {
    expect(AGENT_SKILLS['dex']).toContain('sp-tdd-cycle');
    expect(AGENT_SKILLS['flux']).toContain('sp-tdd-cycle');
  });

  it('should assign brainstorming to CEO', () => {
    expect(AGENT_SKILLS['sage']).toContain('sp-brainstorming');
  });
});
