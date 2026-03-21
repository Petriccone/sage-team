import { execSync, spawn } from 'child_process';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

export interface CEOBrainConfig {
  apiKey: string;
  model: string;
}

export interface AgentRoster {
  id: string;
  name: string;
  role: string;
  skills: string[];
}

export interface DecompositionResult {
  sprint: { name: string; goal: string };
  tasks: {
    title: string;
    assignee: string;
    priority: number;
    required_skills: string[];
    depends_on: string[];
    description?: string;
  }[];
}

export interface CEOResponse {
  type: 'question' | 'ready';
  message: string;
  questions?: string[];
  summary?: string;
}

// ── Smart questions based on project type detection ──────────────
interface ProjectType {
  keywords: string[];
  questions: string[];
  greeting: string;
}

const PROJECT_TYPES: ProjectType[] = [
  {
    keywords: ['site', 'website', 'web', 'landing', 'página', 'pagina', 'homepage'],
    greeting: 'Love it! A website project — Uma (our designer) is going to have a blast with this, and Dex is already itching to code.',
    questions: [
      'What tech stack do you prefer? (e.g., Next.js, React, plain HTML/CSS, WordPress)',
      'Do you have a design style in mind? (minimalist, bold/colorful, corporate, modern)',
      'Do you already have the content (texts, images, logo) or do we need to create placeholder content?',
      'Where do you want to deploy this? (Vercel, Netlify, traditional hosting, etc.)',
    ],
  },
  {
    keywords: ['api', 'backend', 'server', 'rest', 'graphql', 'microservice'],
    greeting: 'A backend project — Nova (CTO) and Dex (Senior Dev) are going to love architecting this.',
    questions: [
      'What language/framework do you prefer? (Node.js/Express, Python/FastAPI, Go, etc.)',
      'What database do you need? (PostgreSQL, MongoDB, SQLite, etc.)',
      'Do you need authentication? (JWT, OAuth, sessions)',
      'Will this API serve a frontend, mobile app, or both?',
    ],
  },
  {
    keywords: ['app', 'mobile', 'ios', 'android', 'react native', 'flutter'],
    greeting: 'A mobile app — exciting! Uma will design the screens while Dex and Gage handle the implementation.',
    questions: [
      'Which platform? (iOS only, Android only, or cross-platform)',
      'What framework do you prefer? (React Native, Flutter, native)',
      'Does it need a backend/API, or is it standalone?',
      'What are the 3 most important features?',
    ],
  },
  {
    keywords: ['dashboard', 'admin', 'painel', 'analytics', 'crm'],
    greeting: 'A dashboard project — River (Data) and Uma (Design) will make this shine. Dex will wire it all up.',
    questions: [
      'What data sources will this dashboard connect to?',
      'Do you need real-time updates or is periodic refresh OK?',
      'What are the key metrics/charts you want to display?',
      'Who are the users? (internal team, clients, public)',
    ],
  },
  {
    keywords: ['ecommerce', 'e-commerce', 'loja', 'store', 'shop', 'produto', 'product'],
    greeting: 'An e-commerce project — this is a big one! Nova will architect it, Uma will design the shopping experience, and Dex will build it solid.',
    questions: [
      'What platform do you prefer? (Shopify, custom with Stripe, WooCommerce)',
      'How many products approximately?',
      'Do you need inventory management, or just a simple catalog?',
      'What payment methods? (Credit card, PayPal, Pix, etc.)',
    ],
  },
];

const DEFAULT_PROJECT: ProjectType = {
  keywords: [],
  greeting: 'Interesting project! Let me make sure I understand exactly what you need before I rally the team.',
  questions: [
    'What technology/framework do you want us to use?',
    'What are the 3 most important features or requirements?',
    'Do you have any design preferences or references?',
    'What is the target audience for this project?',
  ],
};

function detectProjectType(goal: string): ProjectType {
  const lower = goal.toLowerCase();
  for (const pt of PROJECT_TYPES) {
    if (pt.keywords.some(kw => lower.includes(kw))) {
      return pt;
    }
  }
  return DEFAULT_PROJECT;
}

// ── Claude Code spawn (only used for decomposition) ─────────────
function findClaudeExe(): string {
  if (process.platform === 'win32') {
    const fs = require('fs');
    const exePaths = [
      path.join(process.env.USERPROFILE || '', '.local', 'bin', 'claude.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'claude', 'claude.exe'),
    ];
    for (const p of exePaths) {
      if (fs.existsSync(p)) return p;
    }
    try {
      const lines = execSync('where claude.exe', { encoding: 'utf-8' }).trim().split('\n');
      const exeLine = lines.find((l: string) => l.trim().endsWith('.exe'));
      if (exeLine) return exeLine.trim();
    } catch { /* continue */ }
  }
  return 'claude';
}

function runClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const claude = findClaudeExe();
    const env = { ...process.env };
    delete (env as any).CLAUDECODE;

    const proc = spawn(claude, [
      '--print',
      '--dangerously-skip-permissions',
      '--output-format', 'text',
      '--max-turns', '1',
      '--system-prompt', systemPrompt,
      userPrompt,
    ], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Claude timed out after 180s'));
    }, 180000);

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to run claude: ${err.message}`));
    });

    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Claude exited with code ${code}: ${stderr.slice(0, 200)}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// ── CEO Brain ───────────────────────────────────────────────────
export class CEOBrain {
  private config: CEOBrainConfig;
  private client: Anthropic | null = null;
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  private collectedAnswers: string[] = [];
  private detectedProject: ProjectType | null = null;

  constructor(config: CEOBrainConfig) {
    this.config = config;
    if (config.apiKey === 'test') {
      // Test mode
    } else if (process.env.ANTHROPIC_API_KEY) {
      try {
        this.client = new Anthropic();
      } catch {
        // Fall through — will use template mode
      }
    }
  }

  /**
   * Chat with the user — INSTANT, no AI needed.
   * Uses smart project detection to ask relevant questions.
   * Only decomposition (later) needs AI.
   */
  async chat(userMessage: string): Promise<CEOResponse> {
    this.conversationHistory.push({ role: 'user', content: userMessage });

    const messageCount = this.conversationHistory.filter(m => m.role === 'user').length;

    if (messageCount === 1) {
      // First message — detect project type and ask questions
      this.detectedProject = detectProjectType(userMessage);
      const response: CEOResponse = {
        type: 'question',
        message: this.detectedProject.greeting,
        questions: this.detectedProject.questions,
      };
      this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(response) });
      return response;
    }

    // Subsequent messages — user is answering questions
    this.collectedAnswers.push(userMessage);

    if (messageCount === 2) {
      // Second message — we have enough context, Sage is ready
      const goalSummary = this.conversationHistory
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' | ');

      const response: CEOResponse = {
        type: 'ready',
        message: `Perfect, I have a clear picture now. Let me call the team together — Nova will handle the architecture, Uma will work on the design, and Dex will lead the implementation. I'll have Morgan coordinate everything. Let's go!`,
        summary: goalSummary,
      };
      this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(response) });
      return response;
    }

    // 3+ messages — still ready
    const goalSummary = this.conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' | ');

    const response: CEOResponse = {
      type: 'ready',
      message: `Got it! Adding that to the plan. Let me rally the team now.`,
      summary: goalSummary,
    };
    this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(response) });
    return response;
  }

  resetConversation(): void {
    this.conversationHistory = [];
    this.collectedAnswers = [];
    this.detectedProject = null;
  }

  getConversationContext(): string {
    return this.conversationHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Sage'}: ${m.content}`)
      .join('\n\n');
  }

  buildDecompositionPrompt(goal: string, roster: AgentRoster[], context?: string): string {
    const agentList = roster.map(a =>
      `- **${a.name}** (${a.id}): ${a.role} — skills: ${a.skills.join(', ')}`
    ).join('\n');

    const contextBlock = context
      ? `## Conversation Context\n${context}\n\n`
      : '';

    return `You are Sage, CEO of an AI software company. Decompose this goal into a sprint with concrete tasks.

${contextBlock}## Goal
${goal}

## Available Team
${agentList}

## Rules
- Each task must be assignable to exactly ONE agent
- Tasks should be 2-5 minutes of focused work each
- Use depends_on to express task dependencies (reference by index: "task-0", "task-1", etc.)
- Assign required_skills using the agent's skill IDs (sp- or ag- prefix)
- Priority: 1=critical, 2=high, 3=medium, 4=low, 5=nice-to-have
- Order tasks by dependency chain: independent tasks first
- Include description with enough context for the agent to work autonomously

## Response Format
Respond with ONLY valid JSON (no markdown, no explanation):

{
  "sprint": { "name": "Sprint Name", "goal": "Sprint goal" },
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "assignee": "agent-id",
      "priority": 1,
      "required_skills": ["sp-tdd-cycle"],
      "depends_on": []
    }
  ]
}`;
  }

  parseDecomposition(response: string): DecompositionResult {
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      const rawMatch = response.match(/\{[\s\S]*\}/);
      if (rawMatch) {
        parsed = JSON.parse(rawMatch[0]);
      } else {
        throw new Error('No valid JSON found in decomposition response');
      }
    }

    if (!parsed.sprint || !parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Invalid decomposition: missing sprint or tasks');
    }

    return {
      sprint: {
        name: parsed.sprint.name,
        goal: parsed.sprint.goal,
      },
      tasks: parsed.tasks.map((t: any) => ({
        title: t.title,
        description: t.description || '',
        assignee: t.assignee,
        priority: t.priority || 3,
        required_skills: t.required_skills || [],
        depends_on: t.depends_on || [],
      })),
    };
  }

  async decompose(goal: string, _roster: AgentRoster[]): Promise<DecompositionResult> {
    // Template-based decomposition — instant, works for everyone, no AI needed
    return this.decomposeFromTemplate(goal);
  }

  /** Template-based decomposition — instant, no AI. Always returns a result. */
  private decomposeFromTemplate(goal: string): DecompositionResult {
    const allContext = this.conversationHistory.map(m => m.content).join(' ').toLowerCase();
    const combined = `${goal.toLowerCase()} ${allContext}`;

    if (this.matchesKeywords(combined, ['site', 'website', 'landing', 'página', 'pagina', 'homepage', 'web page', 'webpage'])) {
      return this.websiteSprintTemplate(goal, combined);
    }
    if (this.matchesKeywords(combined, ['rest api', 'graphql', 'backend api', 'api endpoint', 'microservice', 'server api'])) {
      return this.apiSprintTemplate(goal);
    }
    if (this.matchesKeywords(combined, ['app', 'mobile', 'ios', 'android', 'react native', 'flutter', 'aplicativo'])) {
      return this.mobileSprintTemplate(goal);
    }
    if (this.matchesKeywords(combined, ['dashboard', 'admin', 'painel', 'analytics', 'crm', 'portal'])) {
      return this.dashboardSprintTemplate(goal);
    }
    if (this.matchesKeywords(combined, ['ecommerce', 'e-commerce', 'loja', 'store', 'shop', 'produto', 'product', 'cart', 'carrinho'])) {
      return this.ecommerceSprintTemplate(goal);
    }
    if (this.matchesKeywords(combined, ['cli', 'command line', 'terminal', 'tool', 'script', 'automation', 'ferramenta'])) {
      return this.cliToolSprintTemplate(goal);
    }
    if (this.matchesKeywords(combined, ['bot', 'chatbot', 'discord', 'telegram', 'slack', 'whatsapp'])) {
      return this.botSprintTemplate(goal);
    }
    if (this.matchesKeywords(combined, ['game', 'jogo', 'gaming', 'gameplay'])) {
      return this.gameSprintTemplate(goal);
    }
    // Generic fallback — works for ANY project
    return this.genericSprintTemplate(goal);
  }

  private matchesKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(kw => text.includes(kw));
  }

  private websiteSprintTemplate(goal: string, context: string): DecompositionResult {
    const sprintName = 'Website MVP';
    const hasNextjs = context.includes('next') || context.includes('react');
    const hasTailwind = context.includes('tailwind');
    const framework = hasNextjs ? 'Next.js' : 'HTML/CSS/JavaScript';
    const styling = hasTailwind ? 'Tailwind CSS' : 'CSS';

    return {
      sprint: { name: sprintName, goal: `Build a professional website: ${goal.slice(0, 100)}` },
      tasks: [
        {
          title: 'Define project architecture and tech stack',
          description: `Architect the website using ${framework} with ${styling}. Define folder structure, routing strategy, and component hierarchy. Create the project scaffold with all necessary configuration files.`,
          assignee: 'aria',
          priority: 1,
          required_skills: [],
          depends_on: [],
        },
        {
          title: 'Design UI/UX wireframes and component library',
          description: `Design the visual style for the website: color palette, typography, spacing, and component designs. Create reusable UI components (Header, Footer, Hero, Card, Button, CTA sections). Ensure responsive design for mobile, tablet, and desktop. Context: ${goal.slice(0, 200)}`,
          assignee: 'uma',
          priority: 1,
          required_skills: [],
          depends_on: [],
        },
        {
          title: 'Build Home page with Hero, Features, and CTA',
          description: `Implement the Home/Landing page with: hero section with headline and call-to-action, services overview section, testimonials preview, and contact CTA. Use ${framework} with ${styling}. Ensure responsive design.`,
          assignee: 'dex',
          priority: 1,
          required_skills: [],
          depends_on: ['task-0'],
        },
        {
          title: 'Build Services and About pages',
          description: `Create the Services page (list all services with descriptions, icons, and CTAs) and the About page (company story, team, mission/values). Use ${framework} with ${styling}. Include placeholder content.`,
          assignee: 'gage',
          priority: 2,
          required_skills: [],
          depends_on: ['task-0'],
        },
        {
          title: 'Build Gallery and Testimonials pages',
          description: `Create the Gallery page (grid of project images with lightbox/modal) and Testimonials page (customer reviews with ratings and quotes). Use placeholder images and content.`,
          assignee: 'gage',
          priority: 2,
          required_skills: [],
          depends_on: ['task-0'],
        },
        {
          title: 'Build Contact page with form',
          description: `Create the Contact page with: contact form (name, email, phone, message, service type dropdown), company address/map placeholder, phone number, email, business hours. Form should validate inputs client-side.`,
          assignee: 'dex',
          priority: 2,
          required_skills: [],
          depends_on: ['task-0'],
        },
        {
          title: 'SEO optimization and metadata',
          description: `Add proper SEO: meta tags (title, description, OpenGraph), semantic HTML structure, alt tags for images, sitemap.xml, robots.txt. Optimize for local SEO if applicable. Add structured data (JSON-LD) for local business.`,
          assignee: 'atlas',
          priority: 3,
          required_skills: [],
          depends_on: ['task-2', 'task-3'],
        },
        {
          title: 'Testing and quality review',
          description: `Test all pages: responsive design on mobile/tablet/desktop, navigation works correctly, form validation works, images load properly, no broken links, accessibility basics (contrast, alt tags, keyboard nav). Cross-browser check.`,
          assignee: 'quinn',
          priority: 3,
          required_skills: [],
          depends_on: ['task-2', 'task-3', 'task-4', 'task-5'],
        },
      ],
    };
  }

  private apiSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'API MVP', goal: `Build API: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Design API architecture and data models', description: `Design the API architecture: endpoints, data models, authentication strategy, error handling patterns. Define the database schema. Context: ${goal.slice(0, 200)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Set up project scaffold and database', description: `Create the project structure, install dependencies, configure the database connection, create migration files for the data models.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Implement core CRUD endpoints', description: `Implement the main API endpoints with full CRUD operations. Include input validation, error handling, and proper HTTP status codes.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-1'] },
        { title: 'Add authentication and authorization', description: `Implement authentication (JWT or session-based). Add middleware for protected routes. Include login, register, and token refresh endpoints.`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-1'] },
        { title: 'Write API tests', description: `Write comprehensive tests: unit tests for business logic, integration tests for endpoints, test auth flows, test error cases.`, assignee: 'quinn', priority: 2, required_skills: [], depends_on: ['task-2', 'task-3'] },
        { title: 'API documentation', description: `Create API documentation: endpoint reference, request/response examples, authentication guide, error codes.`, assignee: 'atlas', priority: 3, required_skills: [], depends_on: ['task-2'] },
      ],
    };
  }

  private mobileSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'Mobile App MVP', goal: `Build mobile app: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Define app architecture and navigation', description: `Design the mobile app architecture: screen flow, navigation structure, state management approach, and API integration plan. Context: ${goal.slice(0, 200)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Design UI screens and component library', description: `Design all app screens: splash, onboarding, main screens, detail views, settings. Create reusable components. Define color palette, typography, and spacing for mobile.`, assignee: 'uma', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Set up project and implement navigation', description: `Create the project scaffold, configure navigation (tab bar, stack navigation), set up state management, and create the app shell with all screen placeholders.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Build core feature screens', description: `Implement the main feature screens with full functionality. Connect to APIs/data sources. Handle loading states and errors.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-2'] },
        { title: 'Build secondary screens and settings', description: `Implement profile, settings, about, and any secondary screens. Add user preferences and app configuration options.`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-2'] },
        { title: 'Testing and QA', description: `Test all screens on different device sizes. Test navigation flows, data persistence, error handling, and edge cases.`, assignee: 'quinn', priority: 3, required_skills: [], depends_on: ['task-3', 'task-4'] },
      ],
    };
  }

  private dashboardSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'Dashboard MVP', goal: `Build dashboard: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Design dashboard architecture and data flow', description: `Architect the dashboard: define data sources, chart types, filtering/sorting needs, real-time vs batch updates, and component structure. Context: ${goal.slice(0, 200)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Design dashboard UI and layout', description: `Design the dashboard layout: widget grid, chart components, sidebar navigation, filters, and responsive breakpoints. Create the visual style guide.`, assignee: 'uma', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Set up project and data layer', description: `Create project scaffold, set up data fetching layer, configure state management, and create mock data for development.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Build main dashboard with charts and metrics', description: `Implement the main dashboard view with KPI cards, charts (bar, line, pie), and data tables. Add filtering and date range selection.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-2'] },
        { title: 'Build detail views and data tables', description: `Create detail/drill-down views, sortable/filterable data tables, export functionality, and any secondary dashboard pages.`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-2'] },
        { title: 'Set up data pipeline', description: `Configure the database, create data models, set up any ETL/aggregation needed, and connect real data sources to the dashboard.`, assignee: 'river', priority: 2, required_skills: [], depends_on: ['task-0'] },
        { title: 'Testing and QA', description: `Test all dashboard components: data accuracy, chart rendering, responsive design, filtering, and performance with large datasets.`, assignee: 'quinn', priority: 3, required_skills: [], depends_on: ['task-3', 'task-4'] },
      ],
    };
  }

  private ecommerceSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'E-Commerce MVP', goal: `Build store: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Design e-commerce architecture', description: `Architect the store: product catalog structure, cart system, checkout flow, payment integration plan, and order management. Context: ${goal.slice(0, 200)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Design store UI and shopping experience', description: `Design product listing, product detail, cart, checkout pages. Create a compelling shopping experience with clear CTAs, trust signals, and mobile-first design.`, assignee: 'uma', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Build product catalog and listing pages', description: `Implement product listing with categories, search, filtering, sorting, and pagination. Build product detail page with images, description, variants, and add-to-cart.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Build cart and checkout flow', description: `Implement shopping cart (add, remove, update quantities), checkout form (shipping, billing), order summary, and payment integration placeholder.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-2'] },
        { title: 'Build account and order pages', description: `Create user registration/login, account dashboard, order history, and order detail views.`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-0'] },
        { title: 'Set up product database', description: `Create product data models, seed with sample products, set up categories, and configure any search indexing.`, assignee: 'river', priority: 2, required_skills: [], depends_on: ['task-0'] },
        { title: 'SEO and content', description: `Add product SEO (meta tags, structured data, Open Graph), create placeholder content for categories and products, add sitemap.`, assignee: 'atlas', priority: 3, required_skills: [], depends_on: ['task-2'] },
        { title: 'Testing and QA', description: `Test full shopping flow: browse → add to cart → checkout. Test on mobile/desktop, test edge cases (empty cart, out of stock, invalid input).`, assignee: 'quinn', priority: 3, required_skills: [], depends_on: ['task-3', 'task-4'] },
      ],
    };
  }

  private cliToolSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'CLI Tool MVP', goal: `Build tool: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Design CLI architecture and commands', description: `Design the CLI structure: command hierarchy, arguments/flags, configuration file format, and output formatting. Context: ${goal.slice(0, 200)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Set up project and CLI framework', description: `Create project scaffold, configure CLI framework (commander/yargs/clap), set up build tooling, and implement the main entry point with help output.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Implement core commands', description: `Implement the main CLI commands with argument parsing, input validation, and formatted output. Handle errors gracefully with helpful messages.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-1'] },
        { title: 'Add configuration and utilities', description: `Implement config file loading, environment variable support, logging, and any utility commands (init, config, version).`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-1'] },
        { title: 'Write tests', description: `Write unit and integration tests for all commands. Test argument parsing, error cases, and output formatting.`, assignee: 'quinn', priority: 2, required_skills: [], depends_on: ['task-2'] },
        { title: 'Write documentation and README', description: `Create comprehensive README with installation instructions, usage examples for each command, configuration guide, and contributing guidelines.`, assignee: 'atlas', priority: 3, required_skills: [], depends_on: ['task-2'] },
      ],
    };
  }

  private botSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'Bot MVP', goal: `Build bot: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Design bot architecture and conversation flow', description: `Design the bot: command structure, conversation flows, integration points, data storage needs, and error handling strategy. Context: ${goal.slice(0, 200)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Set up project and bot framework', description: `Create project scaffold, configure the bot SDK/library, set up authentication/tokens, and implement the basic bot that responds to messages.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Implement core bot commands and features', description: `Implement the main bot commands/interactions. Handle user input parsing, generate responses, and connect to any required APIs or data sources.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-1'] },
        { title: 'Add advanced features and integrations', description: `Add secondary commands, scheduled tasks, embeds/rich messages, user preferences, and any external API integrations.`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-1'] },
        { title: 'Write tests', description: `Test all bot commands, conversation flows, error handling, and edge cases. Mock external APIs for testing.`, assignee: 'quinn', priority: 2, required_skills: [], depends_on: ['task-2'] },
        { title: 'Documentation', description: `Write setup guide, command reference, configuration docs, and deployment instructions.`, assignee: 'atlas', priority: 3, required_skills: [], depends_on: ['task-2'] },
      ],
    };
  }

  private gameSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'Game MVP', goal: `Build game: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Design game architecture and mechanics', description: `Design the game: core mechanics, game loop, entity system, input handling, and rendering strategy. Context: ${goal.slice(0, 200)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Design game art and visual style', description: `Create the visual style: color palette, character/sprite designs, UI elements, backgrounds, and animations. Define the overall aesthetic.`, assignee: 'uma', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Set up game engine and core loop', description: `Create project scaffold, configure the game engine/framework, implement the game loop, input system, and basic rendering.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Implement core gameplay mechanics', description: `Implement the main game mechanics: player movement, interactions, scoring, level progression, and collision detection.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-2'] },
        { title: 'Build UI and menus', description: `Create game UI: main menu, HUD (score, lives, timer), pause menu, game over screen, settings. Handle screen transitions.`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-2'] },
        { title: 'Testing and balancing', description: `Playtest all game mechanics, test edge cases, verify performance, check input responsiveness, and balance difficulty.`, assignee: 'quinn', priority: 3, required_skills: [], depends_on: ['task-3', 'task-4'] },
      ],
    };
  }

  /** Generic fallback template — works for ANY project type */
  private genericSprintTemplate(goal: string): DecompositionResult {
    return {
      sprint: { name: 'Project Sprint', goal: `Build: ${goal.slice(0, 100)}` },
      tasks: [
        { title: 'Define architecture and project structure', description: `Analyze the requirements and design the architecture: technology choices, folder structure, component hierarchy, data flow, and integration points. Create the project scaffold. Context: ${goal.slice(0, 300)}`, assignee: 'aria', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Design UI/UX and visual style', description: `Design the user interface: layout, components, color palette, typography, and responsive breakpoints. Create reusable UI components. Context: ${goal.slice(0, 200)}`, assignee: 'uma', priority: 1, required_skills: [], depends_on: [] },
        { title: 'Implement core functionality', description: `Build the main features and core business logic. Set up the primary user flows and data handling. Follow best practices for the chosen tech stack.`, assignee: 'dex', priority: 1, required_skills: [], depends_on: ['task-0'] },
        { title: 'Implement secondary features', description: `Build supporting features, secondary pages/views, settings, and utility functions. Handle edge cases and error states.`, assignee: 'gage', priority: 2, required_skills: [], depends_on: ['task-0'] },
        { title: 'Set up data layer', description: `Configure database/storage, create data models, set up any data pipelines or API connections needed.`, assignee: 'river', priority: 2, required_skills: [], depends_on: ['task-0'] },
        { title: 'Write documentation', description: `Create README with setup instructions, usage guide, architecture overview, and any API documentation needed.`, assignee: 'atlas', priority: 3, required_skills: [], depends_on: ['task-2'] },
        { title: 'Testing and quality review', description: `Test all features: functionality, edge cases, responsive design (if UI), error handling, and performance. Create automated tests where applicable.`, assignee: 'quinn', priority: 3, required_skills: [], depends_on: ['task-2', 'task-3'] },
      ],
    };
  }
}
