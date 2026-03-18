import Anthropic from '@anthropic-ai/sdk';
import { AgentPersona, ChatMessage, AgentDecision } from '../types';
import { buildSkillContext, getSkillById, getSkillsByRole } from '../skills/registry';

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
You are FULLY AUTONOMOUS. Based on your role, skills, and the current context, decide what to do next.

You MUST respond with a JSON decision in this format:
\`\`\`json
{
  "type": "work|delegate|request-help|report|review|brainstorm|dispatch|skill-execute",
  "action": "specific action you're taking",
  "target": "agent-id if delegating or requesting help",
  "skillId": "skill-id if executing a skill",
  "reasoning": "brief explanation of why this is the right action",
  "confidence": 0.0-1.0,
  "output": "your work product, message, or result"
}
\`\`\`

### Decision Guidelines:
- **work**: You have what you need and are producing output
- **delegate**: This task is better suited for another agent (specify target)
- **request-help**: You need input from a specific agent
- **report**: Sharing progress, blockers, or results
- **review**: Reviewing someone else's work
- **brainstorm**: Need to explore approaches before implementing
- **dispatch**: Breaking work into parallel tasks for multiple agents
- **skill-execute**: Activating a specific skill protocol

### Your Available Skills:
${persona.skillIds.map((id) => {
  const skill = getSkillById(id);
  return skill ? `- **${skill.name}** (${skill.id}): ${skill.description}` : '';
}).filter(Boolean).join('\n')}

Choose the action that moves the task forward most effectively.`;

    return this.chat(persona, [{ role: 'user', content: prompt }]);
  }

  async autonomousDecide(
    persona: AgentPersona,
    context: {
      currentTask: string | null;
      teamStatus: string;
      availableTasks: string;
      recentDecisions: string;
      activeSkills: string;
    }
  ): Promise<AgentDecision> {
    const prompt = `## Autonomous Agent Decision

You are ${persona.name} (${persona.title}), operating in FULL AUTONOMY mode.

### Current State:
- **Your current task:** ${context.currentTask || 'None - you are idle'}
- **Active skills:** ${context.activeSkills || 'None'}

### Team Status:
${context.teamStatus}

### Available Tasks:
${context.availableTasks || 'No unassigned tasks.'}

### Your Recent Decisions:
${context.recentDecisions || 'No recent decisions.'}

### Your Capabilities:
- Can self-assign tasks: ${persona.autonomyConfig.canSelfAssignTasks}
- Can delegate to others: ${persona.autonomyConfig.canDelegateToOthers}
- Can create subtasks: ${persona.autonomyConfig.canCreateSubtasks}
- Can dispatch parallel work: ${persona.autonomyConfig.canDispatchParallelWork}

### Available Skills:
${persona.skillIds.map((id) => {
  const skill = getSkillById(id);
  return skill ? `- ${skill.name}: ${skill.description}` : '';
}).filter(Boolean).join('\n')}

## YOUR DECISION

As a fully autonomous agent, decide what to do RIGHT NOW.
Respond with ONLY a JSON object:

\`\`\`json
{
  "type": "work|delegate|request-help|report|review|brainstorm|dispatch|skill-execute",
  "action": "specific action description",
  "target": "agent-id or null",
  "skillId": "skill-id or null",
  "reasoning": "why this is the right move",
  "confidence": 0.85
}
\`\`\``;

    const response = await this.chat(persona, [{ role: 'user', content: prompt }]);

    try {
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // Try parsing the whole content as JSON
      return JSON.parse(response.content);
    } catch {
      // Default decision if parsing fails
      return {
        type: 'work',
        action: 'Continuing current work',
        reasoning: 'Could not parse decision, defaulting to work',
        confidence: 0.5,
      };
    }
  }

  async executeSkill(
    persona: AgentPersona,
    skillId: string,
    taskContext: string
  ): Promise<ClaudeResponse> {
    const skill = getSkillById(skillId);
    if (!skill) {
      return { content: 'Skill not found', tokensUsed: 0 };
    }

    const prompt = `## Skill Execution: ${skill.name}

### Task Context:
${taskContext}

### Skill Protocol:
${skill.protocol}

### Verification Requirements:
${skill.verificationSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Execute This Skill

Follow the protocol EXACTLY. Do not skip steps. Do not take shortcuts.
After executing, verify against ALL verification requirements.

Respond with:
1. **Execution Log**: Step-by-step what you did
2. **Output**: The work product
3. **Verification**: Status of each verification step (PASS/FAIL)
4. **Result**: VERIFIED or FAILED with explanation`;

    return this.chat(persona, [{ role: 'user', content: prompt }]);
  }

  async delegate(
    ceoPersona: AgentPersona,
    goal: string,
    availableAgents: AgentPersona[]
  ): Promise<ClaudeResponse> {
    const agentList = availableAgents
      .map((a) => `- **${a.name}** (${a.title}): Skills: ${a.skills.join(', ')} | Available Skills: ${a.skillIds.length} protocols`)
      .join('\n');

    const prompt = `## Goal
${goal}

## Available Team Members
${agentList}

## Your Task
You are the CEO operating in FULL AUTONOMY mode. Break this goal into specific tasks and assign each to the best team member.

### Delegation Principles:
1. Match tasks to agent expertise (check their skills)
2. Enable parallel work where tasks are independent
3. Set clear acceptance criteria for each task
4. Identify dependencies between tasks
5. Specify which skills each agent should activate

Respond in this JSON format:
\`\`\`json
{
  "tasks": [
    {
      "title": "Task name",
      "description": "What needs to be done, with specific acceptance criteria",
      "assignee": "agent-id",
      "priority": "high|medium|low",
      "storyPoints": 3,
      "dependencies": [],
      "requiredSkills": ["skill-id-1", "skill-id-2"]
    }
  ],
  "sprintGoal": "One-line sprint goal",
  "parallelGroups": [["task-indices that can run in parallel"]],
  "notes": "Coordination notes"
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

## Review Protocol (Code Review Skill)

Review this code against:

### 1. Correctness & Edge Cases
- Logic errors, off-by-one, null/undefined handling
- Race conditions, error propagation

### 2. Clean Code (SOLID Principles)
- Functions < 20 lines, single responsibility
- Meaningful names, no dead code
- Proper abstraction level

### 3. Security (OWASP Awareness)
- Input validation, injection prevention
- Auth checks, data exposure risks

### 4. Performance
- Unnecessary re-renders, expensive operations
- N+1 queries, memory leaks

### 5. Testing
- Is this code testable?
- What tests are missing?

### Issue Categories:
- **CRITICAL** (blocking): Security vulns, data loss, broken core
- **HIGH**: Logic errors, missing error handling
- **MEDIUM**: Code quality, naming, missing edge case tests
- **LOW**: Style, formatting

Provide specific, actionable feedback with line numbers and suggested fixes.`;

    return this.chat(reviewerPersona, [{ role: 'user', content: prompt }]);
  }

  private buildSystemPrompt(persona: AgentPersona, context?: string): string {
    // Build skill-aware system prompt
    const roleSkills = getSkillsByRole(persona.role as any);
    const skillSummary = persona.skillIds
      .map((id) => getSkillById(id))
      .filter(Boolean)
      .map((s) => `- ${s!.name}: ${s!.description}`)
      .join('\n');

    let prompt = `${persona.systemPrompt}

## Company Context
You are part of Sage Team, an autonomous AI software company. Each team member is an AI agent with specific expertise and world-class skills. You operate with FULL AUTONOMY — you make decisions, execute work, and collaborate without waiting for permission.

## Your Skill Arsenal (${persona.skillIds.length} skills):
${skillSummary}

## Autonomy Level: ${persona.autonomyConfig.level.toUpperCase()}
- Self-assign tasks: ${persona.autonomyConfig.canSelfAssignTasks ? 'YES' : 'NO'}
- Delegate to others: ${persona.autonomyConfig.canDelegateToOthers ? 'YES' : 'NO'}
- Create subtasks: ${persona.autonomyConfig.canCreateSubtasks ? 'YES' : 'NO'}
- Dispatch parallel work: ${persona.autonomyConfig.canDispatchParallelWork ? 'YES' : 'NO'}
- Max concurrent skills: ${persona.autonomyConfig.maxConcurrentSkills}

## Core Protocols (ALWAYS FOLLOW):
1. **Verification Before Completion**: NEVER claim done without running verification. Evidence > confidence.
2. **TDD When Coding**: No production code without a failing test first.
3. **Systematic Debugging**: Root cause investigation before any fix attempt.
4. **Clean Code**: Meaningful names, small functions, SOLID principles.

## Communication Style
- Be concise and actionable
- Use technical language appropriate for your role
- Tag other agents by name when you need their input
- Always explain your reasoning briefly
- Report blockers immediately`;

    if (context) {
      prompt += `\n\n## Additional Context\n${context}`;
    }

    return prompt;
  }
}
