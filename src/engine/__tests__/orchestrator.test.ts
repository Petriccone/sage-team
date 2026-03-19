import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Orchestrator } from '../orchestrator';
import { Database } from '../../state/database';
import fs from 'fs';

describe('Orchestrator', () => {
  let db: Database;
  let orchestrator: Orchestrator;
  const testDbPath = '.sage-team/test-orchestrator.db';

  beforeEach(() => {
    db = new Database(testDbPath);
    orchestrator = new Orchestrator(db, {
      apiKey: 'test',
      model: 'claude-sonnet-4-20250514',
      maxConcurrentAgents: 3,
      autonomyMode: 'sandbox',
      companyName: 'Test Co',
      mission: 'Build great software',
    });
  });

  afterEach(() => {
    orchestrator.stop();
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
  });

  it('should create a session on start', () => {
    const session = orchestrator.start();
    expect(session.status).toBe('active');
    expect(session.id).toBeTruthy();
  });

  it('should initialize all 11 agents on start', () => {
    const session = orchestrator.start();
    const agents = orchestrator.getAgents();
    expect(agents.length).toBe(11);
  });

  it('should emit events on state changes', () => {
    const events: any[] = [];
    orchestrator.on('event', (e: any) => events.push(e));
    orchestrator.start();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('system');
  });

  it('should track session ID', () => {
    const session = orchestrator.start();
    expect(orchestrator.sessionId).toBe(session.id);
  });

  it('should find no available tasks initially', () => {
    orchestrator.start();
    const available = orchestrator.getAvailableTasks(5);
    expect(available.length).toBe(0);
  });

  it('should resume an existing session', () => {
    const session = orchestrator.start();
    const sessionId = session.id;

    // Create a new orchestrator and resume
    const db2 = new Database(testDbPath);
    const orch2 = new Orchestrator(db2, {
      apiKey: 'test',
      model: 'claude-sonnet-4-20250514',
      maxConcurrentAgents: 3,
      autonomyMode: 'sandbox',
      companyName: 'Test Co',
      mission: 'Build great software',
    });
    const resumed = orch2.resume(sessionId);
    expect(resumed).toBe(true);
    expect(orch2.sessionId).toBe(sessionId);
    const agents = orch2.getAgents();
    expect(agents.length).toBe(11);
    orch2.stop();
    db2.close();
  });
});
