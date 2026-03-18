import Conf from 'conf';
import { CompanyConfig } from '../types';

const store = new Conf({
  projectName: 'sage-team',
  defaults: {
    companyName: 'Sage Team',
    mission: 'Build amazing software with autonomous AI agents',
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    maxConcurrentAgents: 5,
    sprintDurationDays: 7,
    workingHoursStart: 9,
    workingHoursEnd: 18,
    enableVisual: true,
    projectPath: process.cwd(),
    autonomyLevel: 'full',
  },
});

export function getConfig(): CompanyConfig {
  return {
    name: store.get('companyName') as string,
    mission: store.get('mission') as string,
    apiKey: (process.env.ANTHROPIC_API_KEY || store.get('apiKey')) as string,
    model: store.get('model') as string,
    maxConcurrentAgents: store.get('maxConcurrentAgents') as number,
    sprintDurationDays: store.get('sprintDurationDays') as number,
    workingHoursStart: store.get('workingHoursStart') as number,
    workingHoursEnd: store.get('workingHoursEnd') as number,
    enableVisual: store.get('enableVisual') as boolean,
    projectPath: store.get('projectPath') as string,
    autonomyLevel: (store.get('autonomyLevel') as any) || 'full',
  };
}

export function setConfig(key: string, value: unknown): void {
  store.set(key, value);
}

export function hasApiKey(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || store.get('apiKey'));
}

export { store };
