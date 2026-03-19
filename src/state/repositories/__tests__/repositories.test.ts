import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../database';
import { SessionsRepo } from '../sessions';
import { AgentsRepo } from '../agents';
import { TasksRepo } from '../tasks';
import { SprintsRepo } from '../sprints';
import { EventsRepo } from '../events';
import { MessagesRepo } from '../messages';
import { PullRequestsRepo } from '../pull-requests';
import fs from 'fs';

describe('Repositories', () => {
  let db: Database;
  const testDbPath = '.sage-team/test-repos.db';

  beforeEach(() => {
    db = new Database(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
  });

  describe('SessionsRepo', () => {
    it('should create and find a session', () => {
      const repo = new SessionsRepo(db);
      const session = repo.create('Build a blog');
      expect(session.goal).toBe('Build a blog');
      expect(session.status).toBe('active');
      const found = repo.findById(session.id);
      expect(found?.goal).toBe('Build a blog');
    });

    it('should find latest active session', () => {
      const repo = new SessionsRepo(db);
      repo.create('First goal');
      const second = repo.create('Second goal');
      const latest = repo.findLatestActive();
      expect(latest?.id).toBe(second.id);
    });
  });

  describe('AgentsRepo', () => {
    it('should initialize all 11 agents for a session', () => {
      const repo = new AgentsRepo(db);
      repo.initializeForSession('session-1');
      const agents = repo.findBySession('session-1');
      expect(agents.length).toBe(11);
    });

    it('should update agent status', () => {
      const repo = new AgentsRepo(db);
      repo.initializeForSession('session-1');
      repo.updateStatus('dex', 'coding');
      const agent = repo.findById('dex');
      expect(agent?.status).toBe('coding');
    });

    it('should update agent room', () => {
      const repo = new AgentsRepo(db);
      repo.initializeForSession('session-1');
      repo.updateRoom('dex', 'meeting', 2);
      const agent = repo.findById('dex');
      expect(agent?.position_room).toBe('meeting');
      expect(agent?.position_seat).toBe(2);
    });
  });

  describe('TasksRepo', () => {
    it('should create and list tasks', () => {
      const repo = new TasksRepo(db);
      repo.create({
        title: 'Build auth',
        description: 'JWT middleware',
        priority: 1,
        requiredSkills: ['sp-tdd-cycle'],
        dependsOn: [],
        sprintId: 'sprint-1',
        sessionId: 'session-1',
      });
      const tasks = repo.findBySession('session-1');
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Build auth');
    });

    it('should find next available tasks respecting dependencies', () => {
      const repo = new TasksRepo(db);
      const t1 = repo.create({ title: 'Task 1', priority: 1, dependsOn: [], sprintId: 's1', sessionId: 's1' });
      repo.create({ title: 'Task 2', priority: 2, dependsOn: [t1.id], sprintId: 's1', sessionId: 's1' });
      const available = repo.findAvailable('s1', 5);
      expect(available.length).toBe(1);
      expect(available[0].title).toBe('Task 1');
    });
  });

  describe('SprintsRepo', () => {
    it('should create and find active sprint', () => {
      const repo = new SprintsRepo(db);
      const sprint = repo.create({ name: 'Sprint 1', goal: 'Build MVP', sessionId: 'session-1' });
      expect(sprint.name).toBe('Sprint 1');
      const active = repo.findActive('session-1');
      expect(active?.id).toBe(sprint.id);
    });

    it('should complete a sprint', () => {
      const repo = new SprintsRepo(db);
      const sprint = repo.create({ name: 'Sprint 1', goal: 'Build MVP', sessionId: 'session-1' });
      repo.complete(sprint.id);
      const completed = repo.findById(sprint.id);
      expect(completed?.status).toBe('completed');
    });
  });

  describe('EventsRepo', () => {
    it('should log and query events', () => {
      const repo = new EventsRepo(db);
      repo.log('agent:move', 'dex', { room: 'meeting' }, 'session-1');
      repo.log('agent:status', 'dex', { status: 'coding' }, 'session-1');
      const events = repo.findBySession('session-1', 50);
      expect(events.length).toBe(2);
    });

    it('should cleanup old events', () => {
      const repo = new EventsRepo(db);
      for (let i = 0; i < 20; i++) {
        repo.log('tick', null, { i }, 'session-1');
      }
      repo.cleanup('session-1', 10);
      const events = repo.findBySession('session-1', 100);
      expect(events.length).toBe(10);
    });
  });

  describe('MessagesRepo', () => {
    it('should create and query messages', () => {
      const repo = new MessagesRepo(db);
      repo.create({ fromAgent: 'sage', toAgent: null, content: 'Hello team!', type: 'chat', sessionId: 'session-1' });
      repo.create({ fromAgent: 'dex', toAgent: 'sage', content: 'On it!', type: 'chat', sessionId: 'session-1' });
      const messages = repo.findBySession('session-1', 50);
      expect(messages.length).toBe(2);
    });
  });

  describe('PullRequestsRepo', () => {
    it('should create PR and transition status', () => {
      const repo = new PullRequestsRepo(db);
      const pr = repo.create({
        taskId: 'task-1',
        agentId: 'dex',
        branch: 'sage/dex/build-auth',
        sessionId: 'session-1',
      });
      expect(pr.status).toBe('pending_review');
      repo.updateStatus(pr.id, 'agent_reviewed', { notes: 'LGTM' });
      const updated = repo.findById(pr.id);
      expect(updated?.status).toBe('agent_reviewed');
    });

    it('should find pending PRs for a session', () => {
      const repo = new PullRequestsRepo(db);
      repo.create({ taskId: 'task-1', agentId: 'dex', branch: 'sage/dex/t1', sessionId: 'session-1' });
      repo.create({ taskId: 'task-2', agentId: 'flux', branch: 'sage/flux/t2', sessionId: 'session-1' });
      const pending = repo.findPending('session-1');
      expect(pending.length).toBe(2);
    });
  });
});
