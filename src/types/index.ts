export type AgentRole =
  | 'ceo'
  | 'cto'
  | 'dev-senior'
  | 'dev-fullstack'
  | 'qa-lead'
  | 'devops'
  | 'product-manager'
  | 'ux-designer'
  | 'data-engineer'
  | 'scrum-master'
  | 'architect';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'coding'
  | 'reviewing'
  | 'testing'
  | 'deploying'
  | 'meeting'
  | 'break'
  | 'pair-programming'
  | 'researching'
  | 'writing-docs'
  | 'debugging'
  | 'brainstorming'
  | 'planning'
  | 'executing-skill'
  | 'security-audit'
  | 'dispatching';

export type AgentMood = 'focused' | 'happy' | 'stressed' | 'creative' | 'collaborative';

export interface Position {
  x: number;
  y: number;
}

// ─── Skill System ───────────────────────────────────────────────────────────

export type SkillCategory =
  | 'development'
  | 'testing'
  | 'architecture'
  | 'security'
  | 'devops'
  | 'data-ai'
  | 'business'
  | 'workflow'
  | 'collaboration'
  | 'design'
  | 'debugging'
  | 'documentation';

export type SkillTrigger = string;

export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  triggers: SkillTrigger[];
  applicableRoles: AgentRole[];
  protocol: string;
  verificationSteps: string[];
  source: 'superpowers' | 'antigravity' | 'built-in';
}

export interface SkillExecution {
  skillId: string;
  agentId: string;
  startedAt: number;
  completedAt: number | null;
  status: 'running' | 'completed' | 'failed' | 'blocked';
  output: string | null;
  verificationPassed: boolean;
}

// ─── Autonomy System ────────────────────────────────────────────────────────

export type AutonomyLevel = 'full' | 'supervised' | 'manual';

export interface AutonomyConfig {
  level: AutonomyLevel;
  canSelfAssignTasks: boolean;
  canDelegateToOthers: boolean;
  canCreateSubtasks: boolean;
  canRequestCodeReview: boolean;
  canDispatchParallelWork: boolean;
  maxConcurrentSkills: number;
  requiresApprovalFor: string[];
}

export interface AgentDecision {
  type: 'work' | 'delegate' | 'request-help' | 'report' | 'review' | 'brainstorm' | 'dispatch' | 'skill-execute';
  action: string;
  target?: string;
  skillId?: string;
  reasoning: string;
  confidence: number;
}

// ─── Agent Types ────────────────────────────────────────────────────────────

export interface AgentPersona {
  id: string;
  name: string;
  role: AgentRole;
  emoji: string;
  title: string;
  personality: string;
  skills: string[];
  skillIds: string[];
  systemPrompt: string;
  autonomyConfig: AutonomyConfig;
  desk: Position;
  color: string;
}

export interface AgentState {
  persona: AgentPersona;
  status: AgentStatus;
  mood: AgentMood;
  currentTask: string | null;
  activeSkills: SkillExecution[];
  position: Position;
  messages: ChatMessage[];
  memory: MemoryEntry[];
  stats: AgentStats;
  autonomyLog: AutonomyLogEntry[];
}

export interface AutonomyLogEntry {
  timestamp: number;
  decision: AgentDecision;
  outcome: 'success' | 'failure' | 'pending';
}

export interface AgentStats {
  tasksCompleted: number;
  linesWritten: number;
  reviewsDone: number;
  meetingsAttended: number;
  bugsFixed: number;
  skillsExecuted: number;
  autonomousDecisions: number;
  delegationsMade: number;
}

export interface ChatMessage {
  id: string;
  from: string;
  to: string | 'all';
  content: string;
  timestamp: number;
  channel: string;
}

export interface MemoryEntry {
  key: string;
  value: string;
  timestamp: number;
  importance: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string | null;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'testing' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdBy: string;
  createdAt: number;
  storyPoints: number;
  subtasks: string[];
  dependencies: string[];
  requiredSkills: string[];
}

export interface Sprint {
  id: string;
  name: string;
  tasks: Task[];
  startDate: number;
  endDate: number;
  goal: string;
}

export interface CompanyConfig {
  name: string;
  mission: string;
  apiKey: string;
  model: string;
  maxConcurrentAgents: number;
  sprintDurationDays: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  enableVisual: boolean;
  projectPath: string;
  autonomyLevel: AutonomyLevel;
}

export interface OfficeTile {
  char: string;
  fg: string;
  bg: string;
  label?: string;
}

export interface EngineEvent {
  type:
    | 'agent-status'
    | 'agent-move'
    | 'agent-message'
    | 'task-update'
    | 'sprint-update'
    | 'system'
    | 'skill-activated'
    | 'skill-completed'
    | 'autonomous-decision'
    | 'dispatch-parallel';
  agentId?: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface DashboardState {
  agents: Map<string, AgentState>;
  tasks: Task[];
  currentSprint: Sprint | null;
  events: EngineEvent[];
  companyMetrics: CompanyMetrics;
}

export interface CompanyMetrics {
  totalTasksCompleted: number;
  totalLinesOfCode: number;
  sprintVelocity: number;
  teamMorale: number;
  bugsFound: number;
  bugsFixed: number;
  deployments: number;
  uptime: number;
  skillsExecuted: number;
  autonomousDecisions: number;
}
