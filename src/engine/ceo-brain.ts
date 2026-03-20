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

export class CEOBrain {
  private config: CEOBrainConfig;
  private client: Anthropic | null = null;
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(config: CEOBrainConfig) {
    this.config = config;
    if (config.apiKey === 'test') {
      // Test mode: no client
    } else if (config.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic();
    }
  }

  /** Start a conversation about a new goal */
  async chat(userMessage: string): Promise<CEOResponse> {
    if (!this.client) {
      throw new Error('CEO Brain not initialized: no API key');
    }

    this.conversationHistory.push({ role: 'user', content: userMessage });

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1024,
      system: CEO_SYSTEM_PROMPT,
      messages: this.conversationHistory,
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    this.conversationHistory.push({ role: 'assistant', content: text });

    // Parse the JSON response
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
      // If JSON parsing fails, treat as a question
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

    const parsed = JSON.parse(jsonStr);

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
    if (!this.client) {
      throw new Error('CEO Brain not initialized: no API key');
    }

    // Include conversation context if available
    const context = this.conversationHistory.length > 0
      ? this.getConversationContext()
      : undefined;

    const prompt = this.buildDecompositionPrompt(goal, roster, context);

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    return this.parseDecomposition(text);
  }
}
