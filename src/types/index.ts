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
  | 'debugging';

export type AgentMood = 'focused' | 'happy' | 'stressed' | 'creative' | 'collaborative';

export interface Position {
  x: number;
  y: number;
}

export interface AgentPersona {
  id: string;
  name: string;
  role: AgentRole;
  emoji: string;
  title: string;
  personality: string;
  skills: string[];
  systemPrompt: string;
  desk: Position;
  color: string;
}

export interface AgentState {
  persona: AgentPersona;
  status: AgentStatus;
  mood: AgentMood;
  currentTask: string | null;
  position: Position;
  messages: ChatMessage[];
  memory: MemoryEntry[];
  stats: AgentStats;
}

export interface AgentStats {
  tasksCompleted: number;
  linesWritten: number;
  reviewsDone: number;
  meetingsAttended: number;
  bugsFixed: number;
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
}

export interface OfficeTile {
  char: string;
  fg: string;
  bg: string;
  label?: string;
}

export interface EngineEvent {
  type: 'agent-status' | 'agent-move' | 'agent-message' | 'task-update' | 'sprint-update' | 'system';
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
}
