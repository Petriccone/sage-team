import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export function doctorChecks(): HealthCheck[] {
  const checks: HealthCheck[] = [];

  // Node.js version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1));
  checks.push({
    name: 'Node.js',
    status: major >= 18 ? 'pass' : 'fail',
    message: `${nodeVersion} ${major >= 18 ? '(OK)' : '(requires >= 18)'}`,
  });

  // Git
  try {
    const gitVersion = execSync('git --version', { stdio: 'pipe', timeout: 3000 }).toString().trim();
    checks.push({ name: 'Git', status: 'pass', message: gitVersion });
  } catch {
    checks.push({ name: 'Git', status: 'fail', message: 'Not found' });
  }

  // Claude Code CLI
  try {
    execSync('claude --version', { stdio: 'pipe', timeout: 2000 });
    checks.push({ name: 'Claude Code', status: 'pass', message: 'Installed' });
  } catch {
    checks.push({ name: 'Claude Code', status: 'fail', message: 'Not found. Install: npm i -g @anthropic-ai/claude-code' });
  }

  // API Key
  const hasEnvKey = !!process.env.ANTHROPIC_API_KEY;
  const hasConfigKey = fs.existsSync('.sage-team/config.json') &&
    !!JSON.parse(fs.readFileSync('.sage-team/config.json', 'utf-8')).apiKey;
  checks.push({
    name: 'API Key',
    status: hasEnvKey || hasConfigKey ? 'pass' : 'warn',
    message: hasEnvKey ? 'Set via ANTHROPIC_API_KEY' : hasConfigKey ? 'Set in config' : 'Not set',
  });

  // Sage Team init
  checks.push({
    name: 'Initialized',
    status: fs.existsSync('.sage-team') ? 'pass' : 'warn',
    message: fs.existsSync('.sage-team') ? '.sage-team/ exists' : 'Run: sage-team init',
  });

  return checks;
}

export function doctorCommand(): Command {
  return new Command('doctor')
    .description('Check system health and dependencies')
    .action(() => {
      const checks = doctorChecks();
      console.log('Sage Team Health Check\n');
      for (const check of checks) {
        const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
        console.log(`${icon} ${check.name}: ${check.message}`);
      }
      const failures = checks.filter(c => c.status === 'fail');
      if (failures.length > 0) {
        console.log(`\n${failures.length} issue(s) found.`);
        process.exitCode = 1;
      } else {
        console.log('\nAll good!');
      }
    });
}
