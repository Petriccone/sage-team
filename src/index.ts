// Sage Team — AI-Powered Autonomous Software Company
// Public API for programmatic usage

export { Agent } from './agents/agent';
export { AGENT_PERSONAS, getPersona, getPersonaByRole } from './agents/personas';
export { Orchestrator } from './engine/orchestrator';
export { ClaudeClient } from './engine/claude-client';
export { Dashboard } from './visual/dashboard';
export { getConfig, setConfig, hasApiKey } from './utils/config';
export * from './types';
