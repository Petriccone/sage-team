import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../database';
import fs from 'fs';

describe('Database', () => {
  let db: Database;
  const testDbPath = '.sage-team/test-state.db';

  beforeEach(() => {
    db = new Database(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    // Clean up WAL/SHM files
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
  });

  it('should create database file', () => {
    expect(fs.existsSync(testDbPath)).toBe(true);
  });

  it('should set WAL journal mode', () => {
    const result = db.pragma('journal_mode');
    expect(result).toEqual([{ journal_mode: 'wal' }]);
  });

  it('should create all tables', () => {
    const tables = db.listTables();
    expect(tables).toContain('sessions');
    expect(tables).toContain('agents');
    expect(tables).toContain('tasks');
    expect(tables).toContain('sprints');
    expect(tables).toContain('messages');
    expect(tables).toContain('events');
    expect(tables).toContain('decisions');
    expect(tables).toContain('pull_requests');
    expect(tables).toContain('skill_executions');
  });

  it('should insert and query a session', () => {
    db.exec(`INSERT INTO sessions (id, goal, status) VALUES ('s1', 'Test goal', 'active')`);
    const row = db.get('SELECT * FROM sessions WHERE id = ?', 's1');
    expect(row.goal).toBe('Test goal');
  });
});
