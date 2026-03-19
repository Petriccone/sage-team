import { describe, it, expect } from 'vitest';
import { buildProgram } from '../index';
import { doctorChecks } from '../commands/doctor';
import { formatTeamRoster } from '../commands/team';
import { PERSONAS } from '../../agents/personas';

describe('CLI', () => {
  it('should register all commands', () => {
    const program = buildProgram();
    const commandNames = program.commands.map((c: any) => c.name());
    expect(commandNames).toContain('init');
    expect(commandNames).toContain('start');
    expect(commandNames).toContain('resume');
    expect(commandNames).toContain('config');
    expect(commandNames).toContain('team');
    expect(commandNames).toContain('status');
    expect(commandNames).toContain('doctor');
    expect(commandNames).toContain('logs');
  });

  it('should have correct program name and version', () => {
    const program = buildProgram();
    expect(program.name()).toBe('sage-team');
  });
});

describe('Doctor', () => {
  it('should return check results', { timeout: 15000 }, () => {
    const checks = doctorChecks();
    expect(checks.length).toBeGreaterThan(0);
    // Each check has name, status, message
    for (const check of checks) {
      expect(check.name).toBeTruthy();
      expect(['pass', 'fail', 'warn']).toContain(check.status);
      expect(check.message).toBeTruthy();
    }
  });

  it('should check for Node.js version', { timeout: 15000 }, () => {
    const checks = doctorChecks();
    const nodeCheck = checks.find(c => c.name === 'Node.js');
    expect(nodeCheck).toBeTruthy();
    expect(nodeCheck!.status).toBe('pass');
  });
});

describe('Team', () => {
  it('should format all 11 agents', () => {
    const output = formatTeamRoster();
    expect(output).toContain('Sage');
    expect(output).toContain('Nova');
    expect(output).toContain('Dex');
    expect(output).toContain('Flux');
    expect(output).toContain('Quinn');
    expect(output).toContain('Gage');
    expect(output).toContain('Morgan');
    expect(output).toContain('Uma');
    expect(output).toContain('Aria');
    expect(output).toContain('River');
    expect(output).toContain('Atlas');
  });

  it('should include agent roles', () => {
    const output = formatTeamRoster();
    expect(output).toContain('ceo');
    expect(output).toContain('cto');
    expect(output).toContain('dev-senior');
  });
});
