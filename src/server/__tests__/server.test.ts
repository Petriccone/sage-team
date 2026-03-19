import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { Database } from '../../state/database';
import { Orchestrator } from '../../engine/orchestrator';
import { createServer } from '../index';
import fs from 'fs';

describe('Server', () => {
  let db: Database;
  let orchestrator: Orchestrator;
  let server: http.Server;
  const testDbPath = '.sage-team/test-server.db';
  const port = 0; // random port

  beforeAll(async () => {
    db = new Database(testDbPath);
    orchestrator = new Orchestrator(db, {
      apiKey: 'test',
      model: 'claude-sonnet-4-20250514',
      maxConcurrentAgents: 3,
      autonomyMode: 'sandbox',
      companyName: 'Test Co',
      mission: 'Build great software',
    });
    orchestrator.start();
    server = createServer(orchestrator, 0);
    // Wait for server to be listening
    await new Promise<void>(resolve => {
      if (server.listening) return resolve();
      server.on('listening', resolve);
    });
  });

  afterAll(() => {
    orchestrator.stop();
    server.close();
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
  });

  function getAddress(): string {
    const addr = server.address() as any;
    return `http://localhost:${addr.port}`;
  }

  async function fetchJSON(path: string): Promise<any> {
    const res = await fetch(`${getAddress()}${path}`);
    return res.json();
  }

  it('should return agents from GET /api/agents', async () => {
    const data = await fetchJSON('/api/agents');
    expect(data.agents).toBeDefined();
    expect(data.agents.length).toBe(11);
  });

  it('should return tasks from GET /api/tasks', async () => {
    const data = await fetchJSON('/api/tasks');
    expect(data.tasks).toBeDefined();
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  it('should return sprint from GET /api/sprint', async () => {
    const data = await fetchJSON('/api/sprint');
    expect(data).toBeDefined();
    // sprint may be null if no goal was set
  });

  it('should return PRs from GET /api/prs', async () => {
    const data = await fetchJSON('/api/prs');
    expect(data.prs).toBeDefined();
    expect(Array.isArray(data.prs)).toBe(true);
  });

  it('should return messages from GET /api/messages', async () => {
    const data = await fetchJSON('/api/messages');
    expect(data.messages).toBeDefined();
    expect(Array.isArray(data.messages)).toBe(true);
  });

  it('should respond to GET /api/health', async () => {
    const res = await fetch(`${getAddress()}/api/health`);
    const data: any = await res.json();
    expect(data.status).toBe('ok');
    expect(data.sessionId).toBeTruthy();
  });
});
