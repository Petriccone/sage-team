const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Note: These tests work on the compiled output in dist/
// Run `npm run build` before running tests

describe('Skill Registry', () => {
  let SKILL_REGISTRY, getSkillById, getSkillsByRole, getSkillsByTrigger;

  it('should load skill registry module', () => {
    const registry = require('../dist/skills/registry');
    SKILL_REGISTRY = registry.SKILL_REGISTRY;
    getSkillById = registry.getSkillById;
    getSkillsByRole = registry.getSkillsByRole;
    getSkillsByTrigger = registry.getSkillsByTrigger;
    assert.ok(Array.isArray(SKILL_REGISTRY));
  });

  it('should have at least 27 skills', () => {
    assert.ok(SKILL_REGISTRY.length >= 27, `Expected >= 27 skills, got ${SKILL_REGISTRY.length}`);
  });

  it('should have skills from all 3 sources', () => {
    const sources = new Set(SKILL_REGISTRY.map(s => s.source));
    assert.ok(sources.has('superpowers'), 'Missing superpowers skills');
    assert.ok(sources.has('antigravity'), 'Missing antigravity skills');
    assert.ok(sources.has('built-in'), 'Missing built-in skills');
  });

  it('should have correct Superpowers prefix (sp-)', () => {
    const spSkills = SKILL_REGISTRY.filter(s => s.source === 'superpowers');
    for (const skill of spSkills) {
      assert.ok(skill.id.startsWith('sp-'), `Superpowers skill ${skill.id} should start with sp-`);
    }
  });

  it('should have correct Antigravity prefix (ag-)', () => {
    const agSkills = SKILL_REGISTRY.filter(s => s.source === 'antigravity');
    for (const skill of agSkills) {
      assert.ok(skill.id.startsWith('ag-'), `Antigravity skill ${skill.id} should start with ag-`);
    }
  });

  it('should have correct Built-in prefix (bi-)', () => {
    const biSkills = SKILL_REGISTRY.filter(s => s.source === 'built-in');
    for (const skill of biSkills) {
      assert.ok(skill.id.startsWith('bi-'), `Built-in skill ${skill.id} should start with bi-`);
    }
  });

  it('every skill should have required fields', () => {
    for (const skill of SKILL_REGISTRY) {
      assert.ok(skill.id, `Skill missing id`);
      assert.ok(skill.name, `Skill ${skill.id} missing name`);
      assert.ok(skill.category, `Skill ${skill.id} missing category`);
      assert.ok(skill.description, `Skill ${skill.id} missing description`);
      assert.ok(Array.isArray(skill.triggers), `Skill ${skill.id} triggers should be array`);
      assert.ok(Array.isArray(skill.applicableRoles), `Skill ${skill.id} applicableRoles should be array`);
      assert.ok(skill.protocol, `Skill ${skill.id} missing protocol`);
      assert.ok(Array.isArray(skill.verificationSteps), `Skill ${skill.id} verificationSteps should be array`);
      assert.ok(skill.source, `Skill ${skill.id} missing source`);
    }
  });

  it('getSkillById should return correct skill', () => {
    const tdd = getSkillById('sp-tdd');
    assert.ok(tdd, 'sp-tdd should exist');
    assert.equal(tdd.name, 'Test-Driven Development');
    assert.equal(tdd.source, 'superpowers');
  });

  it('getSkillById should return undefined for unknown', () => {
    const result = getSkillById('nonexistent-skill');
    assert.equal(result, undefined);
  });

  it('getSkillsByRole should return skills for dev-senior', () => {
    const skills = getSkillsByRole('dev-senior');
    assert.ok(skills.length > 0, 'dev-senior should have skills');
    // TDD should be applicable to dev-senior
    const hasTdd = skills.some(s => s.id === 'sp-tdd');
    assert.ok(hasTdd, 'dev-senior should have TDD skill');
  });

  it('getSkillsByTrigger should match keywords', () => {
    const skills = getSkillsByTrigger('test');
    assert.ok(skills.length > 0, 'Should match at least one skill for "test"');
  });

  it('all skill IDs should be unique', () => {
    const ids = SKILL_REGISTRY.map(s => s.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'Duplicate skill IDs found');
  });
});
