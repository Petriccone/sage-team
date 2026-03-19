/**
 * Orchestrator unit tests
 *
 * Tests for agent initialization, task management, event system,
 * memory bounds, and tick loop error handling.
 */

import { Orchestrator } from '../src/engine/orchestrator';
import { CompanyConfig } from '../src/types';

const getTestConfig = (): CompanyConfig => ({
  name: 'Test Company',
  mission: 'Test mission',
  apiKey: 'test-key',
  model: 'claude-sonnet-4-20250514',
  maxConcurrentAgents: 11,
  sprintDurationDays: 14,
  enableVisual: false,
  projectPath: process.cwd(),
});

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator(getTestConfig());
  });

  afterEach(() => {
    orchestrator.stop();
  });

  describe('initialization', () => {
    it('should initialize 11 agents', () => {
      expect(orchestrator.getAgentList()).toHaveLength(11);
    });

    it('should have all expected agents', () => {
      const ids = orchestrator.getAgentList().map((a) => a.id);
      expect(ids).toContain('sage');
      expect(ids).toContain('nova');
      expect(ids).toContain('dex');
      expect(ids).toContain('flux');
      expect(ids).toContain('quinn');
      expect(ids).toContain('gage');
      expect(ids).toContain('morgan');
      expect(ids).toContain('uma');
      expect(ids).toContain('aria');
      expect(ids).toContain('river');
      expect(ids).toContain('atlas');
    });

    it('should start with empty tasks', () => {
      expect(orchestrator.tasks).toHaveLength(0);
    });

    it('should start with zero metrics', () => {
      expect(orchestrator.metrics.totalTasksCompleted).toBe(0);
      expect(orchestrator.metrics.skillsExecuted).toBe(0);
    });
  });

  describe('agent lookup', () => {
    it('should find agent by id', () => {
      const agent = orchestrator.getAgent('dex');
      expect(agent).toBeDefined();
      expect(agent!.name).toBe('Dex');
    });

    it('should return undefined for unknown agent', () => {
      expect(orchestrator.getAgent('unknown')).toBeUndefined();
    });
  });

  describe('event system', () => {
    it('should emit events', () => {
      const events: any[] = [];
      orchestrator.on('event', (e) => events.push(e));

      const agent = orchestrator.getAgent('dex')!;
      agent.setStatus('coding');

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('agent-status');
    });

    it('should bound events array', () => {
      // Push more than 500 events
      for (let i = 0; i < 600; i++) {
        const agent = orchestrator.getAgent('dex')!;
        agent.setStatus(i % 2 === 0 ? 'coding' : 'idle');
      }
      expect(orchestrator.events.length).toBeLessThanOrEqual(500);
    });
  });
});
