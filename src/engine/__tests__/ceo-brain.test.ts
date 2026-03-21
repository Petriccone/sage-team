import { describe, it, expect } from 'vitest';
import { CEOBrain } from '../ceo-brain';

describe('CEOBrain', () => {
  it('should format goal decomposition prompt correctly', () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const prompt = brain.buildDecompositionPrompt(
      'Build a REST API for todo app',
      [{ id: 'dex', name: 'Dex', role: 'dev-senior', skills: ['sp-tdd-cycle', 'ag-typescript-pro'] }]
    );
    expect(prompt).toContain('Build a REST API for todo app');
    expect(prompt).toContain('Dex');
    expect(prompt).toContain('sp-tdd-cycle');
  });

  it('should parse decomposition response into tasks', () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const mockResponse = JSON.stringify({
      sprint: { name: 'Todo API MVP', goal: 'Working REST API' },
      tasks: [
        { title: 'Design API schema', assignee: 'aria', priority: 1, required_skills: ['ag-api-design'], depends_on: [] },
        { title: 'Implement endpoints', assignee: 'dex', priority: 2, required_skills: ['sp-tdd-cycle'], depends_on: ['task-0'] },
      ]
    });
    const result = brain.parseDecomposition(mockResponse);
    expect(result.sprint.name).toBe('Todo API MVP');
    expect(result.tasks.length).toBe(2);
    expect(result.tasks[1].depends_on).toEqual(['task-0']);
  });

  it('should handle malformed JSON gracefully', () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    expect(() => brain.parseDecomposition('not json at all')).toThrow();
  });

  it('should extract JSON from markdown-wrapped response', () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const wrappedResponse = `Here's the plan:
\`\`\`json
{
  "sprint": { "name": "Sprint 1", "goal": "Build it" },
  "tasks": [{ "title": "Do stuff", "assignee": "dex", "priority": 1, "required_skills": [], "depends_on": [] }]
}
\`\`\``;
    const result = brain.parseDecomposition(wrappedResponse);
    expect(result.sprint.name).toBe('Sprint 1');
    expect(result.tasks.length).toBe(1);
  });

  it('should include all agent roster in prompt', () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const prompt = brain.buildDecompositionPrompt('Build something', [
      { id: 'dex', name: 'Dex', role: 'dev-senior', skills: ['sp-tdd-cycle'] },
      { id: 'flux', name: 'Flux', role: 'dev-fullstack', skills: ['ag-react-patterns'] },
      { id: 'quinn', name: 'Quinn', role: 'qa-lead', skills: ['ag-testing-patterns'] },
    ]);
    expect(prompt).toContain('Dex');
    expect(prompt).toContain('Flux');
    expect(prompt).toContain('Quinn');
    expect(prompt).toContain('JSON');
  });

  it('should ask questions on first chat message (instant, no AI)', async () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const response = await brain.chat('Build a website for a painting company in Dublin');
    expect(response.type).toBe('question');
    expect(response.questions).toBeDefined();
    expect(response.questions!.length).toBeGreaterThan(0);
    expect(response.message).toBeTruthy();
  });

  it('should detect website project type', async () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const response = await brain.chat('Criar um site profissional para empresa de pintura');
    expect(response.type).toBe('question');
    expect(response.questions!.some(q => q.toLowerCase().includes('tech') || q.toLowerCase().includes('stack'))).toBe(true);
  });

  it('should be ready on second message', async () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    await brain.chat('Build a website for my company');
    const response = await brain.chat('Use Next.js, modern design, I have all content ready');
    expect(response.type).toBe('ready');
    expect(response.summary).toBeTruthy();
  });

  it('should detect API project type', async () => {
    const brain = new CEOBrain({ apiKey: 'test', model: 'claude-sonnet-4-20250514' });
    const response = await brain.chat('Build a REST API for a todo application');
    expect(response.type).toBe('question');
    expect(response.questions!.some(q => q.toLowerCase().includes('database') || q.toLowerCase().includes('framework'))).toBe(true);
  });
});
