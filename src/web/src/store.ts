import { create } from 'zustand';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  mood: string;
  position_room: string;
  position_seat: number;
  current_task_id: string | null;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  assigned_to: string | null;
  priority: string;
  sprint_id: string | null;
}

export interface Message {
  id: string;
  from_agent: string;
  to_agent: string | null;
  content: string;
  channel: string;
  timestamp: string;
}

export interface PullRequest {
  id: string;
  title: string;
  branch: string;
  author_agent: string;
  status: string;
  task_id: string;
  review_notes: string | null;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: string;
  task_count: number;
  completed_count: number;
}

export interface ActivityEntry {
  id: string;
  time: string;
  agentId: string | null;
  icon: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'agent' | 'task' | 'system';
}

export type WowEvent =
  | { type: 'meeting:start'; agents: string[] }
  | { type: 'meeting:end' }
  | { type: 'crisis:start'; reason: string }
  | { type: 'crisis:resolved' }
  | { type: 'pr:merged'; agentId: string; title: string }
  | { type: 'deploy:success' }
  | { type: 'sprint:complete' }
  | { type: 'pair:start'; agents: string[] }
  | { type: 'pair:end' };

export interface StoreState {
  connected: boolean;
  agents: Agent[];
  tasks: Task[];
  messages: Message[];
  prs: PullRequest[];
  sprint: Sprint | null;
  selectedPR: string | null;
  wowEvents: WowEvent[];
  activity: ActivityEntry[];

  setConnected: (connected: boolean) => void;
  setAgents: (agents: Agent[]) => void;
  setTasks: (tasks: Task[]) => void;
  setSprint: (sprint: Sprint | null) => void;
  setPRs: (prs: PullRequest[]) => void;
  setSelectedPR: (id: string | null) => void;
  addMessage: (msg: Message) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addPR: (pr: PullRequest) => void;
  updatePR: (id: string, updates: Partial<PullRequest>) => void;
  pushWow: (event: WowEvent) => void;
  popWow: () => WowEvent | undefined;
  pushActivity: (entry: Omit<ActivityEntry, 'id' | 'time'>) => void;
}

let activityCounter = 0;

export const useStore = create<StoreState>((set) => ({
  connected: false,
  agents: [],
  tasks: [],
  messages: [],
  prs: [],
  sprint: null,
  selectedPR: null,
  wowEvents: [],
  activity: [],

  setConnected: (connected) => set({ connected }),
  setAgents: (agents) => set({ agents }),
  setTasks: (tasks) => set({ tasks }),
  setSprint: (sprint) => set({ sprint }),
  setPRs: (prs) => set({ prs }),
  setSelectedPR: (id) => set({ selectedPR: id }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-199), msg] })),

  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  addPR: (pr) => set((s) => ({ prs: [...s.prs, pr] })),

  updatePR: (id, updates) =>
    set((s) => ({
      prs: s.prs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  pushWow: (event) =>
    set((s) => ({ wowEvents: [...s.wowEvents, event] })),

  popWow: (): WowEvent | undefined => {
    const state = useStore.getState() as StoreState;
    const events = state.wowEvents;
    if (events.length === 0) return undefined;
    const first: WowEvent = events[0];
    useStore.setState({ wowEvents: events.slice(1) });
    return first;
  },

  pushActivity: (entry) =>
    set((s) => ({
      activity: [
        ...s.activity.slice(-299),
        {
          ...entry,
          id: `act-${++activityCounter}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ],
    })),
}));
