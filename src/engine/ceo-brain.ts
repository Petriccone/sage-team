import { execSync } from 'child_process';
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
  message: string;           // Sage's response text (always present)
  questions?: string[];       // Clarification questions (when type=question)
  summary?: string;           // Project summary (when type=ready)
}

const CEO_SYSTEM_PROMPT = `You are Sage, the CEO of Sage Team — an AI software company with 11 specialized agents. You are warm, professional, and strategic. You speak directly but with personality.

Your job is to understand what the user wants to build BEFORE assigning any work to your team. You act like a real CEO: you listen, ask smart questions, and make sure you fully understand the scope.

## Your Personality
- Confident but not arrogant
- Direct and efficient — you value everyone's time
- You use the team members' names naturally (Nova the CTO, Dex the senior dev, Uma the designer, etc.)
- You occasionally reference your team's strengths ("Dex loves a good TDD challenge", "Uma has great taste in UI")
- You speak in first person as Sage

## Conversation Flow
When the user describes a project:
1. Acknowledge what they want
2. Ask 2-4 clarifying questions about scope, tech preferences, design style, etc.
3. When you have enough info, summarize the plan and say you're ready

## Response Format
ALWAYS respond with ONLY valid JSON (no markdown, no explanation):

When you need more info:
{
  "type": "question",
  "message": "Your conversational response to the user",
  "questions": ["Question 1?", "Question 2?"]
}

When you're ready to start (you have enough context):
{
  "type": "ready",
  "message": "Your conversational response summarizing the plan",
  "summary": "Concise technical summary of what will be built"
}

IMPORTANT: Only set type="ready" when you genuinely have enough context. If the user's goal is very simple and clear (like "create a hello world page"), you can skip questions and go straight to ready.`;

/** Find the claude executable — works on Windows and Unix */
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

/** Run claude --print and return the text output */
function runClaude(systemPrompt: string, userPrompt: string): string {
  const claude = findClaudeExe();
  const env = { ...process.env };
  // Allow spawning claude from within MCP context
  delete (env as any).CLAUDECODE;

  const { spawnSync } = require('child_process');
  const result = spawnSync(claude, [
    '--print',
    '--dangerously-skip-permissions',
    '--output-format', 'text',
    '--max-turns', '1',
    '--system-prompt', systemPrompt,
    userPrompt,
  ], {
    encoding: 'utf-8',
    timeout: 60000,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`Failed to run claude: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Claude exited with code ${result.status}: ${(result.stderr || '').slice(0, 200)}`);
  }

  return (result.stdout || '').trim();
}

export class CEOBrain {
  private config: CEOBrainConfig;
  private client: Anthropic | null = null;
  private useClaudeCode = false;
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(config: CEOBrainConfig) {
    this.config = config;
    if (config.apiKey === 'test') {
      // Test mode: no client, no claude code
    } else if (config.apiKey) {
      try {
        this.client = new Anthropic({ apiKey: config.apiKey });
      } catch {
        this.useClaudeCode = true;
      }
    } else if (process.env.ANTHROPIC_API_KEY) {
      try {
        this.client = new Anthropic();
      } catch {
        this.useClaudeCode = true;
      }
    } else {
      // No API key — use Claude Code directly (plug-and-play)
      this.useClaudeCode = true;
    }
  }

  /** Start a conversation about a new goal */
  async chat(userMessage: string): Promise<CEOResponse> {
    this.conversationHistory.push({ role: 'user', content: userMessage });

    let text: string;

    if (this.client) {
      text = await this.chatViaSDK();
    } else {
      text = this.chatViaClaudeCode();
    }

    this.conversationHistory.push({ role: 'assistant', content: text });
    return this.parseCEOResponse(text);
  }

  private async chatViaSDK(): Promise<string> {
    const response = await this.client!.messages.create({
      model: this.config.model,
      max_tokens: 1024,
      system: CEO_SYSTEM_PROMPT,
      messages: this.conversationHistory,
    });

    return response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');
  }

  private chatViaClaudeCode(): string {
    // Build conversation context into the prompt
    const contextParts = this.conversationHistory.slice(0, -1).map(m =>
      `${m.role === 'user' ? 'User' : 'Sage'}: ${m.content}`
    );
    const currentMessage = this.conversationHistory[this.conversationHistory.length - 1].content;

    let prompt = currentMessage;
    if (contextParts.length > 0) {
      prompt = `Previous conversation:\n${contextParts.join('\n')}\n\nUser: ${currentMessage}\n\nRespond as Sage (JSON only):`;
    }

    return runClaude(CEO_SYSTEM_PROMPT, prompt);
  }

  private parseCEOResponse(text: string): CEOResponse {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      return {
        type: parsed.type || 'question',
        message: parsed.message || text,
        questions: parsed.questions,
        summary: parsed.summary,
      };
    } catch {
      return { type: 'question', message: text };
    }
  }

  /** Reset conversation for a new goal */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /** Get conversation context as a string for decomposition */
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
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

    // Also try raw JSON match if no code block found
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

  async decompose(goal: string, roster: AgentRoster[]): Promise<DecompositionResult> {
    // Include conversation context if available
    const context = this.conversationHistory.length > 0
      ? this.getConversationContext()
      : undefined;

    const prompt = this.buildDecompositionPrompt(goal, roster, context);

    let text: string;

    if (this.client) {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      text = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('');
    } else {
      // Use Claude Code — no API key needed
      text = runClaude('You are a technical project manager. Respond with ONLY valid JSON.', prompt);
    }

    return this.parseDecomposition(text);
  }
}
