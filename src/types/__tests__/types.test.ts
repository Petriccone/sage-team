import { describe, it, expect } from 'vitest';
import type {
  AgentRole, AgentStatus, AgentMood, AutonomyMode,
  TaskStatus, PRStatus, SkillSource,
  Agent, Task, Sprint, Message, Event, Decision, PullRequest,
  SkillExecution, Session, CompanyConfig,
  WSEvent, WSAgentMove, WSCrisis, WSCelebration
} from '../index';

describe('v3 types', () => {
  it('should allow valid agent creation', () => {
    const agent: Agent = {
      id: 'sage',
      role: 'ceo',
      name: 'Sage',
      status: 'idle',
      mood: 'focused',
      positionRoom: 'ceo-office',
      positionSeat: 0,
      currentTaskId: null,
      activeSkills: [],
      sessionId: 'session-1',
      updatedAt: new Date().toISOString(),
    };
    expect(agent.role).toBe('ceo');
  });

  it('should allow valid task creation', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Build auth',
      description: 'JWT authentication',
      status: 'pending',
      priority: 1,
      assigneeId: null,
      requiredSkills: ['sp-tdd-cycle', 'ag-typescript-pro'],
      dependsOn: [],
      sprintId: 'sprint-1',
      sessionId: 'session-1',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    expect(task.status).toBe('pending');
  });

  it('should allow valid PR creation', () => {
    const pr: PullRequest = {
      id: 'pr-1',
      taskId: 'task-1',
      agentId: 'dex',
      branch: 'sage/dex/build-auth',
      status: 'pending_review',
      reviewNotes: null,
      userFeedback: null,
      mergedBy: null,
      sessionId: 'session-1',
      createdAt: new Date().toISOString(),
      mergedAt: null,
    };
    expect(pr.status).toBe('pending_review');
  });

  it('should type WebSocket events correctly', () => {
    const moveEvent: WSAgentMove = {
      type: 'agent:move',
      agentId: 'dex',
      to: { room: 'meeting', seat: 2 },
    };
    expect(moveEvent.type).toBe('agent:move');

    const crisisEvent: WSCrisis = {
      type: 'crisis:start',
      severity: 'critical',
      message: 'Tests failing',
      agents: ['nova', 'dex', 'quinn'],
    };
    expect(crisisEvent.severity).toBe('critical');
  });
});
