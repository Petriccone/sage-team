/**
 * Agent unit tests
 *
 * Tests for agent state machine, skill activation, task management,
 * memory bounds, and autonomous decision tracking.
 */

import { Agent } from '../src/agents/agent';
import { AGENT_PERSONAS } from '../src/agents/personas';

// Get a test persona (Dex - Senior Dev)
const getTestPersona = () => AGENT_PERSONAS.find((p) => p.id === 'dex')!;

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent(getTestPersona());
  });

  describe('initialization', () => {
    it('should initialize with correct persona', () => {
      expect(agent.id).toBe('dex');
      expect(agent.name).toBe('Dex');
      expect(agent.role).toBe('dev-senior');
      expect(agent.status).toBe('idle');
    });

    it('should start at desk position', () => {
      expect(agent.state.position).toEqual(getTestPersona().desk);
    });

    it('should have empty stats', () => {
      expect(agent.state.stats.tasksCompleted).toBe(0);
      expect(agent.state.stats.skillsExecuted).toBe(0);
    });
  });

  describe('status management', () => {
    it('should change status and emit event', () => {
      const events: any[] = [];
      agent.on('status-change', (data) => events.push(data));

      agent.setStatus('coding');

      expect(agent.status).toBe('coding');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ agentId: 'dex', from: 'idle', to: 'coding' });
    });
  });

  describe('task management', () => {
    it('should assign and complete tasks', () => {
      const task = {
        id: 'task-1',
        title: 'Test task',
        description: 'A test task',
        assignee: 'dex',
        status: 'in-progress' as const,
        priority: 'medium' as const,
        createdBy: 'sage',
        createdAt: Date.now(),
        storyPoints: 3,
        subtasks: [],
        dependencies: [],
        requiredSkills: [],
      };

      agent.assignTask(task);
      expect(agent.state.currentTask).toBe('task-1');
      expect(agent.status).toBe('thinking');

      agent.completeTask();
      expect(agent.state.currentTask).toBeNull();
      expect(agent.state.stats.tasksCompleted).toBe(1);
      expect(agent.status).toBe('idle');
    });
  });

  describe('message bounds', () => {
    it('should bound messages array at 200', () => {
      for (let i = 0; i < 250; i++) {
        agent.sendMessage('all', `Message ${i}`, 'general');
      }
      expect(agent.state.messages.length).toBeLessThanOrEqual(200);
    });
  });

  describe('memory management', () => {
    it('should bound memory at 100 entries', () => {
      for (let i = 0; i < 120; i++) {
        agent.remember(`key-${i}`, `value-${i}`, Math.random() * 10);
      }
      expect(agent.state.memory.length).toBeLessThanOrEqual(100);
    });
  });

  describe('display helpers', () => {
    it('should return status icon', () => {
      agent.setStatus('coding');
      expect(agent.getStatusIcon()).toBeDefined();
    });

    it('should return status text', () => {
      agent.setStatus('testing');
      expect(agent.getStatusText()).toBe('Running tests');
    });

    it('should serialize to JSON', () => {
      const json = agent.toJSON();
      expect(json.id).toBe('dex');
      expect(json.name).toBe('Dex');
      expect(json.status).toBe('idle');
    });
  });
});
