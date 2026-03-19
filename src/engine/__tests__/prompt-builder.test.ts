import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../prompt-builder';

describe('PromptBuilder', () => {
  const builder = new PromptBuilder();

  it('should build a system prompt with identity section', () => {
    const prompt = builder.build({
      agent: { id: 'dex', name: 'Dex', role: 'dev-senior', description: 'Senior TypeScript developer' },
      company: { name: 'Test Co', mission: 'Build great software' },
      skills: ['## TDD\nWrite test first.\n'],
      task: { title: 'Build auth', description: 'JWT middleware', requiredSkills: ['sp-tdd-cycle'] },
    });
    expect(prompt).toContain('You are Dex');
    expect(prompt).toContain('dev-senior');
    expect(prompt).toContain('TDD');
    expect(prompt).toContain('Build auth');
    expect(prompt).toContain('[sage:dex]');
  });

  it('should stay within token budget', () => {
    const prompt = builder.build({
      agent: { id: 'dex', name: 'Dex', role: 'dev-senior', description: 'Test' },
      company: { name: 'Co', mission: 'Test' },
      skills: ['x'.repeat(200000)], // Huge skill
      task: { title: 'Test', description: 'Test', requiredSkills: [] },
    });
    // Prompt should be truncated to ~30k tokens (~120k chars)
    expect(prompt.length).toBeLessThan(130000);
  });

  it('should include rules section', () => {
    const prompt = builder.build({
      agent: { id: 'flux', name: 'Flux', role: 'dev-fullstack', description: 'Fullstack dev' },
      company: { name: 'Co', mission: 'Test' },
      skills: [],
      task: { title: 'Build UI', description: 'React components', requiredSkills: [] },
    });
    expect(prompt).toContain('Work ONLY on the assigned task');
    expect(prompt).toContain('[sage:flux]');
    expect(prompt).toContain('Do NOT push');
  });
});
