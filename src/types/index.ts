// === Agent Types ===
export type AgentRole =
  | 'ceo' | 'cto' | 'architect' | 'dev-senior' | 'dev-fullstack'
  | 'qa-lead' | 'devops' | 'product-manager' | 'ux-designer'
  | 'scrum-master' | 'data-engineer';

export type AgentStatus =
  | 'idle' | 'thinking' | 'coding' | 'testing' | 'reviewing'
  | 'deploying' | 'meeting' | 'planning' | 'debugging'
  | 'designing' | 'walking' | 'pairing' | 'crisis'
  | 'brainstorming' | 'dispatching' | 'celebrating';

export type AgentMood = 'focused' | 'happy' | 'stressed' | 'creative' | 'collaborative';

export type AutonomyMode = 'sandbox' | 'direct' | 'supervised';

// === Task Types ===
export type TaskStatus = 'pending' | 'in_progress' | 'in_review' | 'completed' | 'failed';
export type TaskPriority = 1 | 2 | 3 | 4 | 5; // 1=critical, 5=low

// === PR Types ===
export type PRStatus =
  | 'pending_review' | 'agent_reviewed'
  | 'user_approved' | 'user_rejected'
  | 'merged' | 'rework';

// === Skill Types ===
export type SkillSource = 'superpowers' | 'antigravity' | 'built-in';
export type SkillExecutionStatus = 'active' | 'completed' | 'failed';

// === Core Entities ===
export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  status: AgentStatus;
  mood: AgentMood;
  positionRoom: string;
  positionSeat: number | null;
  currentTaskId: string | null;
  activeSkills: string[];
  sessionId: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  requiredSkills: string[];
  dependsOn: string[];
  sprintId: string;
  sessionId: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: 'active' | 'completed';
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
}

export interface Message {
  id: string;
  fromAgent: string;
  toAgent: string | null;
  content: string;
  type: 'chat' | 'decision' | 'review' | 'crisis';
  sessionId: string;
  timestamp: string;
}

export interface Event {
  id: number;
  type: string;
  agentId: string | null;
  data: Record<string, unknown> | null;
  sessionId: string;
  timestamp: string;
}

export interface Decision {
  id: string;
  agentId: string;
  type: 'delegate' | 'self-assign' | 'escalate' | 'dispatch' | 'crisis';
  action: string;
  reasoning: string | null;
  confidence: number;
  outcome: 'success' | 'failure' | 'pending';
  sessionId: string;
  timestamp: string;
}

export interface PullRequest {
  id: string;
  taskId: string;
  agentId: string;
  branch: string;
  status: PRStatus;
  reviewNotes: string | null;
  userFeedback: string | null;
  mergedBy: string | null;
  sessionId: string;
  createdAt: string;
  mergedAt: string | null;
}

export interface SkillExecution {
  id: string;
  agentId: string;
  skillId: string;
  skillSource: SkillSource;
  taskId: string | null;
  status: SkillExecutionStatus;
  output: string | null;
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
}

export interface Session {
  id: string;
  goal: string;
  status: 'active' | 'paused' | 'completed';
  startedAt: string;
  resumedAt: string | null;
  completedAt: string | null;
}

// === Configuration ===
export interface CompanyConfig {
  companyName: string;
  mission: string;
  model: string;
  maxConcurrentAgents: number;
  autonomyMode: AutonomyMode;
  apiKey: string;
}

// === WebSocket Events ===
export interface WSAgentMove {
  type: 'agent:move';
  agentId: string;
  to: { room: string; seat?: number };
}

export interface WSAgentStatus {
  type: 'agent:status';
  agentId: string;
  status: AgentStatus;
  detail?: string;
}

export interface WSMeetingStart {
  type: 'meeting:start';
  room: string;
  agents: string[];
  topic: string;
}

export interface WSMeetingEnd {
  type: 'meeting:end';
  room: string;
}

export interface WSCrisis {
  type: 'crisis:start';
  severity: 'critical' | 'high';
  message: string;
  agents: string[];
}

export interface WSCrisisResolved {
  type: 'crisis:resolved';
  message: string;
}

export interface WSTaskAssigned {
  type: 'task:assigned';
  taskId: string;
  agentId: string;
}

export interface WSTaskCompleted {
  type: 'task:completed';
  taskId: string;
  agentId: string;
}

export interface WSSkillActivated {
  type: 'skill:activated';
  agentId: string;
  skillId: string;
  phase?: string;
}

export interface WSPRCreated {
  type: 'pr:created';
  prId: string;
  agentId: string;
  branch: string;
}

export interface WSPRMerged {
  type: 'pr:merged';
  prId: string;
  mergedBy: string;
}

export interface WSCelebration {
  type: 'celebration:pr-merged' | 'celebration:deploy' | 'celebration:sprint-complete';
  [key: string]: unknown;
}

export interface WSChat {
  type: 'chat:message';
  from: string;
  to: string | null;
  content: string;
}

export type WSEvent =
  | WSAgentMove | WSAgentStatus
  | WSMeetingStart | WSMeetingEnd
  | WSCrisis | WSCrisisResolved
  | WSTaskAssigned | WSTaskCompleted
  | WSSkillActivated
  | WSPRCreated | WSPRMerged
  | WSCelebration | WSChat;

// === Agent Persona (for personas.ts) ===
export interface AgentPersona {
  id: string;
  name: string;
  role: AgentRole;
  emoji: string;
  color: string;
  description: string;
  skills: string[];
  defaultRoom: string;
  defaultSeat: number;
}
