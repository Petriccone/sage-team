import Anthropic from '@anthropic-ai/sdk';
import { AgentPersona, ChatMessage } from '../types';

export interface ClaudeResponse {
  content: string;
  tokensUsed: number;
}

export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async chat(
    persona: AgentPersona,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: string
  ): Promise<ClaudeResponse> {
    const systemPrompt = this.buildSystemPrompt(persona, context);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return {
      content: textBlock?.text || '',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  async agentThink(
    persona: AgentPersona,
    task: string,
    teamContext: string,
    recentMessages: ChatMessage[]
  ): Promise<ClaudeResponse> {
    const messagesContext = recentMessages
      .slice(-10)
      .map((m) => `[${m.from}→${m.to}] ${m.content}`)
      .join('\n');

    const prompt = `## Current Task
${task}

## Team Context
${teamContext}

## Recent Team Messages
${messagesContext || 'No recent messages.'}

## Your Action
Based on your role and the current context, decide what to do next. You can:
1. Work on the task directly (provide your output)
2. Ask a team member for help (specify who and what you need)
3. Report progress or blockers
4. Suggest improvements or raise concerns

Respond with your action in this format:
**Action:** [what you're doing]
**Output:** [your work product or message]
**Next:** [what should happen next]`;

    return this.chat(persona, [{ role: 'user', content: prompt }]);
  }

  async delegate(
    ceoPersona: AgentPersona,
    goal: string,
    availableAgents: AgentPersona[]
  ): Promise<ClaudeResponse> {
    const agentList = availableAgents
      .map((a) => `- **${a.name}** (${a.title}): ${a.skills.join(', ')}`)
      .join('\n');

    const prompt = `## Goal
${goal}

## Available Team Members
${agentList}

## Your Task
Break this goal into specific tasks and assign each to the best team member.
Respond in this JSON format:
\`\`\`json
{
  "tasks": [
    {
      "title": "Task name",
      "description": "What needs to be done",
      "assignee": "agent-id",
      "priority": "high|medium|low",
      "storyPoints": 3,
      "dependencies": []
    }
  ],
  "sprintGoal": "One-line sprint goal",
  "notes": "Any additional coordination notes"
}
\`\`\``;

    return this.chat(ceoPersona, [{ role: 'user', content: prompt }]);
  }

  async codeReview(
    reviewerPersona: AgentPersona,
    code: string,
    context: string
  ): Promise<ClaudeResponse> {
    const prompt = `## Code Review Request
**Context:** ${context}

\`\`\`
${code}
\`\`\`

Review this code for:
1. Correctness and edge cases
2. Code quality and readability
3. Performance concerns
4. Security issues
5. Test coverage needs

Provide specific, actionable feedback.`;

    return this.chat(reviewerPersona, [{ role: 'user', content: prompt }]);
  }

  private buildSystemPrompt(persona: AgentPersona, context?: string): string {
    let prompt = `${persona.systemPrompt}

## Company Context
You are part of an autonomous AI software company called Sage Team. Each team member is an AI agent with specific expertise. You collaborate through messages, code reviews, and meetings.

## Communication Style
- Be concise and actionable
- Use technical language appropriate for your role
- Tag other agents by name when you need their input
- Always explain your reasoning briefly`;

    if (context) {
      prompt += `\n\n## Additional Context\n${context}`;
    }

    return prompt;
  }
}
