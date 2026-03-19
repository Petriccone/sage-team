import { Command } from 'commander';
import { PERSONAS } from '../../agents/personas';
import { AGENT_SKILLS } from '../../agents/skills-map';

export function formatTeamRoster(agentId?: string): string {
  const agents = agentId
    ? PERSONAS.filter(p => p.id === agentId)
    : PERSONAS;

  if (agents.length === 0) return `Agent "${agentId}" not found.`;

  return agents.map(p => {
    const skills = AGENT_SKILLS[p.id] || [];
    const skillStr = skills.map(s => `    ${s}`).join('\n');
    return `${p.emoji} ${p.name} (${p.id})
  Role: ${p.role}
  Room: ${p.defaultRoom}
  Color: ${p.color}
  Skills:
${skillStr}`;
  }).join('\n\n');
}

export function teamCommand(): Command {
  return new Command('team')
    .description('Show team roster and skills')
    .option('--agent <id>', 'Show details for specific agent')
    .action((options) => {
      console.log(formatTeamRoster(options.agent));
    });
}
