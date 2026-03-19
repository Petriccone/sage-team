const MAX_PROMPT_CHARS = 120000; // ~30k tokens at 4 chars/token
const CHARS_PER_TOKEN = 4;

export interface PromptBuildInput {
  agent: {
    id: string;
    name: string;
    role: string;
    description: string;
  };
  company: {
    name: string;
    mission: string;
  };
  skills: string[]; // Pre-loaded skill content strings
  task: {
    title: string;
    description: string;
    requiredSkills: string[];
  };
  dependenciesSummary?: string;
}

export class PromptBuilder {
  build(input: PromptBuildInput): string {
    const identity = this.buildIdentity(input);
    const rules = this.buildRules(input.agent.id);
    const taskSection = this.buildTask(input);

    // Calculate remaining budget for skills
    const fixedContent = identity + taskSection + rules;
    const fixedChars = fixedContent.length;
    const remainingChars = MAX_PROMPT_CHARS - fixedChars;

    const skillsSection = this.buildSkills(input.skills, remainingChars);

    return `${identity}\n${skillsSection}\n${taskSection}\n${rules}`;
  }

  private buildIdentity(input: PromptBuildInput): string {
    return `# Identity
You are ${input.agent.name}, ${input.agent.role} at ${input.company.name}.
${input.agent.description}

Company mission: ${input.company.mission}
`;
  }

  private buildSkills(skills: string[], maxChars: number): string {
    if (skills.length === 0) {
      return '# Active Skills\nNo specific skills activated for this task.\n';
    }

    let section = `# Active Skills
The following skill protocols are ACTIVE for this task. Follow them exactly.

`;
    let remaining = maxChars - section.length;

    for (const skill of skills) {
      if (skill.length <= remaining) {
        section += skill + '\n\n';
        remaining -= skill.length + 2;
      } else if (remaining > 1000 * CHARS_PER_TOKEN) {
        // Truncate but include partial
        section += skill.slice(0, remaining - 50) + '\n\n[... truncated to fit token budget]\n';
        break;
      } else {
        break;
      }
    }

    return section;
  }

  private buildTask(input: PromptBuildInput): string {
    let section = `# Current Task
Title: ${input.task.title}
Description: ${input.task.description}
Required skills: ${input.task.requiredSkills.join(', ') || 'none'}
`;
    if (input.dependenciesSummary) {
      section += `Dependencies completed: ${input.dependenciesSummary}\n`;
    }
    return section;
  }

  private buildRules(agentId: string): string {
    return `# Rules
- Work ONLY on the assigned task
- Follow ALL active skill protocols exactly
- Commit with message: [sage:${agentId}] {semantic description}
- Do NOT push — CEO handles all push operations
- Run tests before marking complete
`;
  }
}
