#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { renderSplash, renderLoading, renderSuccess, renderError, renderInfo } from './visual/splash';
import { getConfig, setConfig, hasApiKey } from './utils/config';
import { Orchestrator } from './engine/orchestrator';
import { Dashboard } from './visual/dashboard';
import { AGENT_PERSONAS } from './agents/personas';
import { SKILL_REGISTRY, getSkillById } from './skills/registry';

const program = new Command();

program
  .name('sage-team')
  .description('AI-powered autonomous agent team with real-time 2D visual office simulation')
  .version('2.0.0');

program
  .command('start')
  .description('Launch the Sage Team office simulation')
  .option('-v, --visual', 'Enable visual 2D dashboard (default: true)', true)
  .option('--no-visual', 'Disable visual dashboard, run in CLI mode')
  .option('-m, --model <model>', 'Claude model to use', 'claude-sonnet-4-20250514')
  .option('-g, --goal <goal>', 'Initial goal to assign to the team')
  .action(async (options) => {
    console.log(renderSplash());

    if (!hasApiKey()) {
      console.log(renderError('No API key found!'));
      console.log(renderInfo('Set your Anthropic API key:'));
      console.log(chalk.white('  export ANTHROPIC_API_KEY=your-key-here'));
      console.log(chalk.white('  # or'));
      console.log(chalk.white('  sage-team config --api-key your-key-here'));
      process.exit(1);
    }

    const config = getConfig();
    if (options.model) config.model = options.model;

    const steps = [
      'Initializing company structure...',
      'Loading skill registry (25+ world-class skills)...',
      'Booting agent personas with full autonomy...',
      'Setting up office layout...',
      'Connecting to Claude API...',
      'Activating autonomous decision engine...',
      'Launching visual dashboard...',
    ];

    for (let i = 0; i < steps.length; i++) {
      console.log(renderLoading(steps[i], i + 1, steps.length));
      await sleep(300);
    }

    console.log('');
    console.log(renderSuccess('Sage Team is ready!'));
    console.log('');

    const orchestrator = new Orchestrator(config);
    await orchestrator.start();

    if (options.visual) {
      const dashboard = new Dashboard(orchestrator, config);
      dashboard.start();

      if (options.goal) {
        await orchestrator.submitGoal(options.goal);
      }
    } else {
      // CLI-only mode
      console.log(renderInfo('Running in CLI mode. Use --visual for the 2D dashboard.'));
      console.log('');

      // Show team status
      for (const agent of orchestrator.getAgentList()) {
        const p = agent.state.persona;
        console.log(`  ${p.emoji} ${chalk.bold(p.name.padEnd(8))} ${chalk.gray(p.title)}`);
      }
      console.log('');

      if (options.goal) {
        const spinner = ora('CEO is processing your goal...').start();
        await orchestrator.submitGoal(options.goal);
        spinner.succeed('Tasks created and assigned!');

        console.log('');
        for (const task of orchestrator.tasks) {
          const assignee = task.assignee
            ? orchestrator.getAgent(task.assignee)?.emoji || '?'
            : '·';
          const color = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'white';
          console.log(`  ${assignee} ${chalk.keyword(color)(task.title)}`);
        }
      }

      // Keep process alive for background tasks
      orchestrator.on('event', (event) => {
        if (event.type === 'agent-message') {
          const msg = (event.data as any).message;
          const agent = orchestrator.getAgent(msg.from);
          console.log(
            `  ${agent?.emoji || '?'} ${chalk.bold(agent?.name || msg.from)}: ${msg.content}`
          );
        }
      });
    }
  });

program
  .command('config')
  .description('Configure Sage Team settings')
  .option('--api-key <key>', 'Set Anthropic API key')
  .option('--model <model>', 'Set default Claude model')
  .option('--company-name <name>', 'Set company name')
  .option('--mission <mission>', 'Set company mission')
  .option('--show', 'Show current configuration')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      console.log(renderSuccess('API key saved.'));
    }
    if (options.model) {
      setConfig('model', options.model);
      console.log(renderSuccess(`Model set to ${options.model}`));
    }
    if (options.companyName) {
      setConfig('companyName', options.companyName);
      console.log(renderSuccess(`Company name set to "${options.companyName}"`));
    }
    if (options.mission) {
      setConfig('mission', options.mission);
      console.log(renderSuccess(`Mission updated.`));
    }
    if (options.show || Object.keys(options).length === 0) {
      const config = getConfig();
      console.log(renderSplash());
      console.log(chalk.bold('  Current Configuration:'));
      console.log(`  ${chalk.gray('Company:')}    ${config.name}`);
      console.log(`  ${chalk.gray('Mission:')}    ${config.mission}`);
      console.log(`  ${chalk.gray('Model:')}      ${config.model}`);
      console.log(`  ${chalk.gray('API Key:')}    ${config.apiKey ? '***' + config.apiKey.slice(-4) : chalk.red('Not set')}`);
      console.log(`  ${chalk.gray('Visual:')}     ${config.enableVisual ? 'Enabled' : 'Disabled'}`);
      console.log(`  ${chalk.gray('Max Agents:')} ${config.maxConcurrentAgents}`);
      console.log('');
    }
  });

program
  .command('team')
  .description('Show team composition and agent details')
  .option('--agent <id>', 'Show details for a specific agent')
  .action((options) => {
    console.log(renderSplash());

    if (options.agent) {
      const persona = AGENT_PERSONAS.find((p) => p.id === options.agent);
      if (!persona) {
        console.log(renderError(`Agent "${options.agent}" not found.`));
        console.log(renderInfo(`Available: ${AGENT_PERSONAS.map((p) => p.id).join(', ')}`));
        return;
      }
      console.log(`  ${persona.emoji} ${chalk.bold(persona.name)} — ${persona.title}`);
      console.log(`  ${chalk.gray(persona.personality)}`);
      console.log(`  ${chalk.cyan('Skills:')} ${persona.skills.join(', ')}`);
      console.log(`  ${chalk.hex('#6366f1')('Autonomy:')} ${persona.autonomyConfig.level.toUpperCase()}`);
      console.log(`  ${chalk.hex('#6366f1')('Skill Protocols:')} ${persona.skillIds.length}`);
      for (const skillId of persona.skillIds) {
        const skill = getSkillById(skillId);
        if (skill) {
          console.log(`    ${chalk.gray('▸')} ${chalk.white(skill.name)} ${chalk.gray(`(${skill.source})`)}`);
        }
      }
      console.log('');
      return;
    }

    console.log(chalk.bold('  Team Roster:\n'));

    const departments: Record<string, typeof AGENT_PERSONAS> = {
      'C-Suite': AGENT_PERSONAS.filter((p) => ['ceo', 'cto'].includes(p.role)),
      'Engineering': AGENT_PERSONAS.filter((p) =>
        ['dev-senior', 'dev-fullstack', 'architect', 'data-engineer'].includes(p.role)
      ),
      'Quality & Ops': AGENT_PERSONAS.filter((p) =>
        ['qa-lead', 'devops'].includes(p.role)
      ),
      'Product & Design': AGENT_PERSONAS.filter((p) =>
        ['product-manager', 'ux-designer', 'scrum-master'].includes(p.role)
      ),
    };

    for (const [dept, members] of Object.entries(departments)) {
      console.log(`  ${chalk.hex('#6366f1').bold(`── ${dept} ──`)}`);
      for (const p of members) {
        console.log(`    ${p.emoji} ${chalk.bold(p.name.padEnd(8))} ${chalk.gray(p.title)} ${chalk.green(`[${p.autonomyConfig.level.toUpperCase()}]`)} ${chalk.cyan(`${p.skillIds.length} skills`)}`);
        console.log(`      ${chalk.gray(p.skills.slice(0, 5).join(' · '))}`);
      }
      console.log('');
    }

    console.log(`  ${chalk.hex('#6366f1').bold('── Skill Registry ──')}`);
    console.log(`    ${chalk.white(`${SKILL_REGISTRY.length} total skills`)} from ${chalk.cyan('Superpowers')} + ${chalk.yellow('Antigravity')}`);
    console.log(`    Categories: ${[...new Set(SKILL_REGISTRY.map((s) => s.category))].join(', ')}`);
    console.log('');
  });

program
  .command('doctor')
  .description('Check system health and dependencies')
  .action(async () => {
    console.log(renderSplash());
    console.log(chalk.bold('  System Health Check:\n'));

    // Check Node version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1));
    if (major >= 18) {
      console.log(renderSuccess(`Node.js ${nodeVersion}`));
    } else {
      console.log(renderError(`Node.js ${nodeVersion} — requires >= 18`));
    }

    // Check API key
    if (hasApiKey()) {
      console.log(renderSuccess('Anthropic API key configured'));
    } else {
      console.log(renderError('Anthropic API key not found'));
    }

    // Check terminal
    const cols = process.stdout.columns || 0;
    const rows = process.stdout.rows || 0;
    if (cols >= 120 && rows >= 35) {
      console.log(renderSuccess(`Terminal size ${cols}x${rows} (optimal)`));
    } else if (cols >= 80 && rows >= 24) {
      console.log(renderSuccess(`Terminal size ${cols}x${rows} (acceptable)`));
    } else {
      console.log(renderError(`Terminal size ${cols}x${rows} — recommended 120x35+`));
    }

    console.log(renderSuccess(`Platform: ${process.platform}`));

    // Check Playwright
    try {
      require.resolve('playwright-core');
      console.log(renderSuccess('Playwright installed'));
    } catch {
      console.log(renderError('Playwright not installed — run: npm install playwright-core'));
    }

    // Check MCP config
    const mcpPath = require('path').join(process.cwd(), '.mcp.json');
    if (require('fs').existsSync(mcpPath)) {
      console.log(renderSuccess('MCP Playwright configured (.mcp.json)'));
    } else {
      console.log(renderInfo('MCP not configured — optional for visual tracking'));
    }

    console.log('');
  });

program
  .command('screenshot')
  .description('Take a screenshot of a URL for visual tracking')
  .argument('<url>', 'URL to capture')
  .option('-l, --label <label>', 'Screenshot label', 'manual')
  .option('-f, --full-page', 'Capture full page', false)
  .option('-a, --agent <id>', 'Agent taking the screenshot', 'system')
  .action(async (url, options) => {
    const { PlaywrightBridge } = await import('./browser/playwright-bridge');
    const bridge = new PlaywrightBridge(process.cwd());

    const spinner = ora('Connecting to browser...').start();
    const connected = await bridge.connect();

    if (!connected) {
      spinner.fail('Could not connect to browser. Ensure Chromium is installed.');
      console.log(renderInfo('Run: npx playwright install chromium'));
      process.exit(1);
    }

    spinner.text = `Capturing ${url}...`;
    const result = await bridge.screenshot({
      url,
      label: options.label,
      fullPage: options.fullPage,
      agentId: options.agent,
    });

    if (result) {
      spinner.succeed(`Screenshot saved: ${result.path}`);
    } else {
      spinner.fail('Screenshot failed');
    }

    await bridge.disconnect();
  });

program
  .command('report')
  .description('Generate visual progress report from screenshots')
  .action(async () => {
    const { PlaywrightBridge } = await import('./browser/playwright-bridge');
    const bridge = new PlaywrightBridge(process.cwd());
    const report = await bridge.generateProgressReport();
    console.log(report);
  });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

program.parse();
