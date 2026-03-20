#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { Database } from '../state/database';
import { Orchestrator } from '../engine/orchestrator';
import { PERSONAS } from '../agents/personas';

// ── State ────────────────────────────────────────────────────────────
let orchestrator: Orchestrator | null = null;
let db: Database | null = null;
let httpServer: import('http').Server | null = null;
let officePort = 3000;

function loadConfig(): any {
  const configPath = path.join(process.cwd(), '.sage-team', 'config.json');
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

/** Auto-initialize .sage-team/ if it doesn't exist */
/** Detect if current directory is inside a git repository */
function hasGit(): boolean {
  try {
    const { execSync } = require('child_process');
    execSync('git rev-parse --git-dir', { cwd: process.cwd(), stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function autoInit(): void {
  const sageDir = path.join(process.cwd(), '.sage-team');
  const configPath = path.join(sageDir, 'config.json');

  if (fs.existsSync(configPath)) return;

  fs.mkdirSync(sageDir, { recursive: true });

  // Auto-detect: use sandbox (git worktrees) if git available, otherwise direct
  const isGitRepo = hasGit();

  const config = {
    companyName: 'Sage Team',
    mission: 'Build amazing software autonomously',
    model: 'claude-sonnet-4-20250514',
    maxConcurrentAgents: 3,
    autonomyMode: isGitRepo ? 'sandbox' : 'direct',
    apiKey: '',
  };

  // Grab API key from any available source
  if (process.env.ANTHROPIC_API_KEY) {
    config.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Add to .gitignore only if git exists
  if (isGitRepo) {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const entry = '\n# Sage Team\n.sage-team/\n';
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      if (!content.includes('.sage-team')) {
        fs.appendFileSync(gitignorePath, entry);
      }
    }
  }
}

function ensureOrchestrator(): Orchestrator {
  if (orchestrator) return orchestrator;

  // Auto-init if needed
  autoInit();

  const config = loadConfig()!;

  // API key: config > env var > empty string
  // When empty, Anthropic SDK will try env var automatically
  // Only fails when actually calling the API, not at setup
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';

  const dbPath = path.join(process.cwd(), '.sage-team', 'state.db');
  db = new Database(dbPath);
  orchestrator = new Orchestrator(db, {
    apiKey,
    model: config.model || 'claude-sonnet-4-20250514',
    maxConcurrentAgents: config.maxConcurrentAgents || 3,
    autonomyMode: config.autonomyMode || 'sandbox',
    companyName: config.companyName || 'Sage Team',
    mission: config.mission || 'Build amazing software autonomously',
  });

  return orchestrator;
}

// ── MCP Server ───────────────────────────────────────────────────────
const server = new McpServer({
  name: 'sage-team',
  version: '3.4.6',
});

// ── Tool: init ───────────────────────────────────────────────────────
server.tool(
  'sage_team_init',
  'Initialize Sage Team in the current project directory. Creates .sage-team/ config. Usually not needed — sage_team_start auto-initializes.',
  {},
  async () => {
    const configPath = path.join(process.cwd(), '.sage-team', 'config.json');
    if (fs.existsSync(configPath)) {
      return { content: [{ type: 'text', text: 'Sage Team already initialized in this directory.' }] };
    }

    autoInit();
    return {
      content: [{
        type: 'text',
        text: 'Sage Team initialized! Ready to use — just call sage_team_start with a goal.',
      }],
    };
  },
);

// ── Tool: team ───────────────────────────────────────────────────────
server.tool(
  'sage_team_list',
  'Show all 11 Sage Team AI agents with their roles, skills, and emoji.',
  {},
  async () => {
    const lines = PERSONAS.map(p =>
      `${p.emoji} **${p.name}** (${p.id}) — ${p.role}\n   ${p.description}\n   Skills: ${p.skills.join(', ')}`
    );
    return { content: [{ type: 'text', text: `# Sage Team — 11 Agents\n\n${lines.join('\n\n')}` }] };
  },
);

// ── Tool: chat ───────────────────────────────────────────────────────
server.tool(
  'sage_team_chat',
  'Chat with Sage (CEO) to discuss your project before starting. Sage will ask clarifying questions to understand your vision, then hold a team meeting to plan the sprint. Use this for a conversational experience — or use sage_team_start to skip straight to execution.',
  {
    message: z.string().describe('Your message to Sage (describe what you want to build, answer questions, etc.)'),
    port: z.number().optional().describe('Port for the office UI (default: 3000)'),
    no_browser: z.boolean().optional().describe('Skip opening the browser'),
  },
  async ({ message, port, no_browser }) => {
    try {
      const orch = ensureOrchestrator();

      // Ensure session exists
      if (!orch.sessionId) {
        orch.start();
      }

      // Start office if not running
      officePort = port || officePort;
      if (!httpServer) {
        try {
          const { createServer } = await import('../server/index');
          httpServer = await createServer(orch, officePort);
          const addr = httpServer.address();
          officePort = typeof addr === 'object' && addr ? addr.port : officePort;

          if (!no_browser) {
            try { const open = (await import('open')).default; await open(`http://localhost:${officePort}`); } catch {}
          }
        } catch {}
      }

      // Chat with CEO (uses Claude Code if no API key — plug and play)
      const response = await Promise.race([
        orch.chatWithCEO(message),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 180000)),
      ]) as any;

      if (response.type === 'ready') {
        // Sage is ready — launch the sprint!
        const lines: string[] = [];
        lines.push(`👑 **Sage:** ${response.message}`);
        lines.push('');
        lines.push('🤝 *Sage called a team meeting to discuss the plan...*');
        lines.push('');

        // Launch sprint with the conversation context
        try {
          await Promise.race([
            orch.launchSprint(response.summary || message),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 30000)),
          ]);

          const tasks = orch.getTasks();
          lines.push(`✅ Sprint created with ${tasks.length} tasks:\n`);
          for (const t of tasks) {
            const persona = PERSONAS.find(p => p.id === t.assignee_id);
            lines.push(`  ${persona?.emoji || '•'} **${persona?.name || t.assignee_id}** → ${t.title}`);
          }
          lines.push('');
          lines.push(`🏢 Watch the team at http://localhost:${officePort}`);
          lines.push('Agents are working! Use sage_team_status to check progress.');
        } catch (err: any) {
          if (err.message === 'TIMEOUT') {
            lines.push('Still planning... Use sage_team_status to check progress.');
          } else {
            lines.push(`❌ Sprint creation failed: ${err.message}`);
          }
        }

        return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
      } else {
        // Sage has questions
        const lines: string[] = [];
        lines.push(`👑 **Sage:** ${response.message}`);

        if (response.questions && response.questions.length > 0) {
          lines.push('');
          for (const q of response.questions) {
            lines.push(`  → ${q}`);
          }
        }

        lines.push('');
        lines.push('*Reply with sage_team_chat to continue the conversation.*');

        return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
      }
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: `Error chatting with Sage: ${err.message}` }] };
    }
  },
);

// ── Tool: start ──────────────────────────────────────────────────────
server.tool(
  'sage_team_start',
  'Start a Sage Team session and immediately begin working on a goal. Skips the conversational flow — use sage_team_chat instead for a step-by-step discussion with Sage (CEO) before starting.',
  {
    goal: z.string().describe('The goal for the team (e.g. "Build a REST API for a todo app")'),
    port: z.number().optional().describe('Port for the office UI (default: 3000)'),
    no_browser: z.boolean().optional().describe('Skip opening the browser'),
  },
  async ({ goal, port, no_browser }) => {
    try {
      const orch = ensureOrchestrator();
      const session = orch.start();
      officePort = port || 3000;

      const lines: string[] = [];
      lines.push(`👑 **Sage:** Got it — "${goal}". Let me rally the team.`);
      lines.push('');

      // Start the Express + WebSocket server for the office UI
      if (!httpServer) {
        try {
          const { createServer } = await import('../server/index');
          httpServer = await createServer(orch, officePort);
          const addr = httpServer.address();
          const actualPort = typeof addr === 'object' && addr ? addr.port : officePort;
          officePort = actualPort;
          lines.push(`🏢 Office running at http://localhost:${actualPort}`);

          if (!no_browser) {
            try {
              const open = (await import('open')).default;
              await open(`http://localhost:${actualPort}`);
              lines.push('🌐 Browser opened.');
            } catch {
              lines.push(`🌐 Open in browser: http://localhost:${actualPort}`);
            }
          }
        } catch (err: any) {
          lines.push(`⚠️ Could not start office UI: ${err.message}`);
        }
      } else {
        lines.push(`🏢 Office already running at http://localhost:${officePort}`);
      }

      // No API key check needed — CEO Brain uses Claude Code if no key available
      lines.push('');
      lines.push('🤝 *Team meeting in progress...*');

      try {
        await Promise.race([
          orch.submitGoal(goal),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 180000)),
        ]);
        const tasks = orch.getTasks();
        lines.push('');
        lines.push(`✅ Sprint planned — ${tasks.length} tasks assigned:\n`);
        for (const t of tasks) {
          const persona = PERSONAS.find(p => p.id === t.assignee_id);
          lines.push(`  ${persona?.emoji || '•'} **${persona?.name || t.assignee_id}** → ${t.title}`);
        }
        lines.push('');
        lines.push('The team is on it. Use sage_team_status to check progress.');
      } catch (err: any) {
        if (err.message === 'TIMEOUT') {
          lines.push('\nStill planning... Use sage_team_status to check progress.');
        } else {
          lines.push(`\n❌ Goal decomposition failed: ${err.message}`);
        }
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: `Error starting Sage Team: ${err.message}` }] };
    }
  },
);

// ── Tool: office ─────────────────────────────────────────────────────
server.tool(
  'sage_team_office',
  'Open the isometric office visualization in the browser. If the server is not running, starts it first.',
  {
    port: z.number().optional().describe('Port for the office UI (default: 3000)'),
  },
  async ({ port }) => {
    const orch = ensureOrchestrator();
    officePort = port || officePort;

    // Start server if not running
    if (!httpServer) {
      try {
        const { createServer } = await import('../server/index');
        httpServer = await createServer(orch, officePort);
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Failed to start office: ${err.message}` }] };
      }
    }

    // Open browser
    try {
      const open = (await import('open')).default;
      await open(`http://localhost:${officePort}`);
      return { content: [{ type: 'text', text: `🏢 Office opened at http://localhost:${officePort}` }] };
    } catch {
      return { content: [{ type: 'text', text: `🏢 Office running at http://localhost:${officePort} — open it manually in your browser.` }] };
    }
  },
);

// ── Tool: status ─────────────────────────────────────────────────────
server.tool(
  'sage_team_status',
  'Show current sprint progress: tasks, agent statuses, and pending PRs.',
  {},
  async () => {
    const orch = ensureOrchestrator();
    if (!orch.sessionId) {
      return { content: [{ type: 'text', text: '👑 **Sage:** No session running. Use sage_team_chat to tell me what you want to build, or sage_team_start to jump right in.' }] };
    }

    const agents = orch.getAgents();
    const tasks = orch.getTasks();
    const prs = orch.getPendingPRs();

    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
    const pending = tasks.filter((t: any) => t.status === 'pending').length;
    const failed = tasks.filter((t: any) => t.status === 'failed').length;

    const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const bar = tasks.length > 0
      ? '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5))
      : '';

    // Active agents summary
    const working = agents.filter((a: any) => a.status !== 'idle');

    const lines = [
      `# 👑 Sprint Report from Sage`,
      ``,
      `**Progress:** ${bar} ${pct}% (${completed}/${tasks.length} tasks done)`,
      inProgress > 0 ? `**In flight:** ${inProgress} tasks being worked on` : '',
      pending > 0 ? `**Queued:** ${pending} tasks waiting` : '',
      failed > 0 ? `**⚠️ Failed:** ${failed} tasks need attention` : '',
      ``,
      `## Team Status`,
      ...agents.map((a: any) => {
        const persona = PERSONAS.find(p => p.id === a.agent_id);
        const task = a.current_task_id ? tasks.find((t: any) => t.id === a.current_task_id) : null;
        const taskInfo = task ? ` — working on "${task.title}"` : '';
        const status = a.status === 'idle' ? 'available' : a.status;
        return `  ${persona?.emoji || '?'} **${persona?.name || a.agent_id}**: ${status}${taskInfo}`;
      }),
      ``,
      `## Tasks`,
      ...tasks.map((t: any) => {
        const icon = t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🔨' : t.status === 'failed' ? '❌' : '⏳';
        const persona = PERSONAS.find(p => p.id === t.assignee_id);
        return `  ${icon} **${persona?.name || t.assignee_id}** → ${t.title}`;
      }),
    ].filter(l => l !== '');

    if (prs.length > 0) {
      lines.push('', '## Pending PRs (need your approval)');
      for (const pr of prs) {
        const persona = PERSONAS.find(p => p.id === pr.agent_id);
        lines.push(`  📝 PR by **${persona?.name || pr.agent_id}** — branch: \`${pr.branch}\``);
      }
    }

    if (httpServer) {
      lines.push('', `🏢 Office: http://localhost:${officePort}`);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
);

// ── Tool: doctor ─────────────────────────────────────────────────────
server.tool(
  'sage_team_doctor',
  'Check system health: Node.js, Git, Claude Code, API key status.',
  {},
  async () => {
    const { execSync } = await import('child_process');
    const checks: string[] = [];

    // Node
    try {
      const v = execSync('node --version', { timeout: 3000 }).toString().trim();
      checks.push(`✅ Node.js: ${v}`);
    } catch { checks.push('❌ Node.js: not found'); }

    // Git
    try {
      const v = execSync('git --version', { timeout: 3000 }).toString().trim();
      checks.push(`✅ Git: ${v}`);
    } catch { checks.push('❌ Git: not found'); }

    // Claude Code
    try {
      execSync('claude --version', { timeout: 3000, stdio: 'pipe' });
      checks.push('✅ Claude Code: installed');
    } catch { checks.push('❌ Claude Code: not found'); }

    // API Key
    const hasEnv = !!process.env.ANTHROPIC_API_KEY;
    const config = loadConfig();
    const hasConfig = config && !!config.apiKey;
    if (hasEnv) checks.push('✅ API Key: set via ANTHROPIC_API_KEY');
    else if (hasConfig) checks.push('✅ API Key: set in config');
    else checks.push('⚠️ API Key: not detected (will use Claude Code\'s key if available)');

    // Init
    if (config) checks.push('✅ Initialized: .sage-team/ exists');
    else checks.push('ℹ️  Not initialized yet (auto-initializes on first use)');

    return { content: [{ type: 'text', text: `# Sage Team Doctor\n\n${checks.join('\n')}` }] };
  },
);

// ── Tool: approve PR ─────────────────────────────────────────────────
server.tool(
  'sage_team_approve_pr',
  'Approve and merge a pending pull request.',
  { pr_id: z.string().describe('The PR ID to approve') },
  async ({ pr_id }) => {
    const orch = ensureOrchestrator();
    try {
      await orch.approvePR(pr_id);
      return { content: [{ type: 'text', text: `PR ${pr_id} approved and merged.` }] };
    } catch (err: any) {
      return { content: [{ type: 'text', text: `Failed to approve PR: ${err.message}` }] };
    }
  },
);

// ── Tool: reject PR ──────────────────────────────────────────────────
server.tool(
  'sage_team_reject_pr',
  'Reject a pull request with feedback. The agent will rework the task.',
  {
    pr_id: z.string().describe('The PR ID to reject'),
    feedback: z.string().describe('Feedback for the agent on what to fix'),
  },
  async ({ pr_id, feedback }) => {
    const orch = ensureOrchestrator();
    try {
      orch.rejectPR(pr_id, feedback);
      return { content: [{ type: 'text', text: `PR ${pr_id} rejected. Agent will rework with feedback.` }] };
    } catch (err: any) {
      return { content: [{ type: 'text', text: `Failed to reject PR: ${err.message}` }] };
    }
  },
);

// ── Tool: config ─────────────────────────────────────────────────────
server.tool(
  'sage_team_config',
  'View or update Sage Team configuration (model, max agents, autonomy mode, company name).',
  {
    show: z.boolean().optional().describe('Show current config'),
    model: z.string().optional().describe('Claude model to use'),
    max_agents: z.number().optional().describe('Max concurrent agents (1-10)'),
    autonomy: z.enum(['sandbox', 'direct', 'supervised']).optional().describe('Autonomy mode'),
    company_name: z.string().optional().describe('Company name'),
  },
  async ({ show, model, max_agents, autonomy, company_name }) => {
    autoInit();
    const configPath = path.join(process.cwd(), '.sage-team', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (show || (!model && !max_agents && !autonomy && !company_name)) {
      const display = { ...config };
      if (display.apiKey) display.apiKey = display.apiKey.slice(0, 10) + '...';
      return { content: [{ type: 'text', text: `# Config\n\n\`\`\`json\n${JSON.stringify(display, null, 2)}\n\`\`\`` }] };
    }

    if (model) config.model = model;
    if (max_agents) config.maxConcurrentAgents = max_agents;
    if (autonomy) config.autonomyMode = autonomy;
    if (company_name) config.companyName = company_name;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { content: [{ type: 'text', text: 'Configuration updated.' }] };
  },
);

// ── Process-level error handlers (prevent MCP crashes) ──────────────
process.on('uncaughtException', (err) => {
  process.stderr.write(`[sage-team-mcp] Uncaught exception: ${err.message}\n`);
});

process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[sage-team-mcp] Unhandled rejection: ${reason}\n`);
});

// ── Start ────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP server failed: ${err}\n`);
  process.exit(1);
});
