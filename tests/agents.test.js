const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Agent Personas', () => {
  let AGENT_PERSONAS;

  it('should load personas module', () => {
    const personas = require('../dist/agents/personas');
    AGENT_PERSONAS = personas.AGENT_PERSONAS;
    assert.ok(Array.isArray(AGENT_PERSONAS));
  });

  it('should have exactly 11 agents', () => {
    assert.equal(AGENT_PERSONAS.length, 11);
  });

  it('all agents should have required fields', () => {
    for (const agent of AGENT_PERSONAS) {
      assert.ok(agent.id, `Agent missing id`);
      assert.ok(agent.name, `Agent ${agent.id} missing name`);
      assert.ok(agent.role, `Agent ${agent.id} missing role`);
      assert.ok(agent.emoji, `Agent ${agent.id} missing emoji`);
      assert.ok(agent.title, `Agent ${agent.id} missing title`);
      assert.ok(agent.personality, `Agent ${agent.id} missing personality`);
      assert.ok(Array.isArray(agent.skills), `Agent ${agent.id} skills should be array`);
      assert.ok(Array.isArray(agent.skillIds), `Agent ${agent.id} skillIds should be array`);
      assert.ok(agent.systemPrompt, `Agent ${agent.id} missing systemPrompt`);
      assert.ok(agent.autonomyConfig, `Agent ${agent.id} missing autonomyConfig`);
      assert.ok(agent.desk, `Agent ${agent.id} missing desk position`);
      assert.ok(agent.color, `Agent ${agent.id} missing color`);
    }
  });

  it('all agent IDs should be unique', () => {
    const ids = AGENT_PERSONAS.map(a => a.id);
    const unique = new Set(ids);
    assert.equal(ids.length, unique.size, 'Duplicate agent IDs found');
  });

  it('all agent roles should be unique', () => {
    const roles = AGENT_PERSONAS.map(a => a.role);
    const unique = new Set(roles);
    assert.equal(roles.length, unique.size, 'Duplicate agent roles found');
  });

  it('all agents should have valid desk positions', () => {
    for (const agent of AGENT_PERSONAS) {
      assert.ok(typeof agent.desk.x === 'number', `Agent ${agent.id} desk.x should be number`);
      assert.ok(typeof agent.desk.y === 'number', `Agent ${agent.id} desk.y should be number`);
      assert.ok(agent.desk.x >= 0, `Agent ${agent.id} desk.x should be >= 0`);
      assert.ok(agent.desk.y >= 0, `Agent ${agent.id} desk.y should be >= 0`);
    }
  });

  it('all agents should have full autonomy', () => {
    for (const agent of AGENT_PERSONAS) {
      assert.equal(agent.autonomyConfig.level, 'full', `Agent ${agent.id} should have full autonomy`);
    }
  });

  it('all agents should have at least 1 skill ID', () => {
    for (const agent of AGENT_PERSONAS) {
      assert.ok(agent.skillIds.length >= 1, `Agent ${agent.id} should have at least 1 skill`);
    }
  });

  it('CEO should be able to delegate and dispatch', () => {
    const ceo = AGENT_PERSONAS.find(a => a.role === 'ceo');
    assert.ok(ceo, 'CEO should exist');
    assert.ok(ceo.autonomyConfig.canDelegateToOthers, 'CEO should be able to delegate');
    assert.ok(ceo.autonomyConfig.canDispatchParallelWork, 'CEO should be able to dispatch');
  });

  it('known agents should exist', () => {
    const expectedIds = ['sage', 'nova', 'dex', 'flux', 'quinn', 'gage', 'morgan', 'uma', 'aria', 'river', 'atlas'];
    for (const id of expectedIds) {
      const agent = AGENT_PERSONAS.find(a => a.id === id);
      assert.ok(agent, `Agent ${id} should exist`);
    }
  });
});
