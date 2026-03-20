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

export class CEOBrain {
  private config: CEOBrainConfig;
  private client: Anthropic | null = null;

  constructor(config: CEOBrainConfig) {
    this.config = config;
    if (config.apiKey === 'test') {
      // Test mode: no client
    } else if (config.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    } else if (process.env.ANTHROPIC_API_KEY) {
      // SDK reads ANTHROPIC_API_KEY from environment automatically
      this.client = new Anthropic();
    }
  }

  buildDecompositionPrompt(goal: string, roster: AgentRoster[]): string {
    const agentList = roster.map(a =>
      `- **${a.name}** (${a.id}): ${a.role} — skills: ${a.skills.join(', ')}`
    ).join('\n');

    return `You are Sage, CEO of an AI software company. Decompose this goal into a sprint with concrete tasks.

## Goal
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

    const prompt = this.buildDecompositionPrompt(goal, roster);

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
