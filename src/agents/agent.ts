import { EventEmitter } from 'eventemitter3';
import {
  AgentPersona,
  AgentState,
  AgentStatus,
  AgentMood,
  ChatMessage,
  MemoryEntry,
  Task,
} from '../types';

export class Agent extends EventEmitter {
  public state: AgentState;
  private autonomyLoop: ReturnType<typeof setInterval> | null = null;

  constructor(persona: AgentPersona) {
    super();
    this.state = {
      persona,
      status: 'idle',
      mood: 'focused',
      currentTask: null,
      position: { ...persona.desk },
      messages: [],
      memory: [],
      stats: {
        tasksCompleted: 0,
        linesWritten: 0,
        reviewsDone: 0,
        meetingsAttended: 0,
        bugsFixed: 0,
      },
    };
  }

  get id(): string {
    return this.state.persona.id;
  }

  get name(): string {
    return this.state.persona.name;
  }

  get role(): string {
    return this.state.persona.role;
  }

  get emoji(): string {
    return this.state.persona.emoji;
  }

  get status(): AgentStatus {
    return this.state.status;
  }

  setStatus(status: AgentStatus): void {
    const prev = this.state.status;
    this.state.status = status;
    this.emit('status-change', { agentId: this.id, from: prev, to: status });
  }

  setMood(mood: AgentMood): void {
    this.state.mood = mood;
    this.emit('mood-change', { agentId: this.id, mood });
  }

  assignTask(task: Task): void {
    this.state.currentTask = task.id;
    this.setStatus('thinking');
    this.emit('task-assigned', { agentId: this.id, taskId: task.id });
  }

  completeTask(): void {
    const taskId = this.state.currentTask;
    this.state.currentTask = null;
    this.state.stats.tasksCompleted++;
    this.setStatus('idle');
    this.emit('task-completed', { agentId: this.id, taskId });
  }

  moveTo(x: number, y: number): void {
    this.state.position = { x, y };
    this.emit('move', { agentId: this.id, position: this.state.position });
  }

  moveToDesk(): void {
    this.moveTo(this.state.persona.desk.x, this.state.persona.desk.y);
  }

  sendMessage(to: string, content: string, channel: string = 'general'): ChatMessage {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: this.id,
      to,
      content,
      timestamp: Date.now(),
      channel,
    };
    this.state.messages.push(msg);
    this.emit('message', msg);
    return msg;
  }

  remember(key: string, value: string, importance: number = 5): void {
    const entry: MemoryEntry = {
      key,
      value,
      timestamp: Date.now(),
      importance,
    };
    this.state.memory.push(entry);
    if (this.state.memory.length > 100) {
      this.state.memory.sort((a, b) => b.importance - a.importance);
      this.state.memory = this.state.memory.slice(0, 80);
    }
  }

  recall(key: string): MemoryEntry | undefined {
    return this.state.memory.find((m) => m.key === key);
  }

  startAutonomy(intervalMs: number = 5000): void {
    if (this.autonomyLoop) return;
    this.autonomyLoop = setInterval(() => {
      this.autonomousTick();
    }, intervalMs);
  }

  stopAutonomy(): void {
    if (this.autonomyLoop) {
      clearInterval(this.autonomyLoop);
      this.autonomyLoop = null;
    }
  }

  private autonomousTick(): void {
    this.emit('autonomy-tick', { agentId: this.id, state: this.state });
  }

  getStatusIcon(): string {
    const icons: Record<AgentStatus, string> = {
      idle: '💤',
      thinking: '🤔',
      coding: '💻',
      reviewing: '👀',
      testing: '🧪',
      deploying: '🚀',
      meeting: '🗣️',
      break: '☕',
      'pair-programming': '👥',
      researching: '📚',
      'writing-docs': '📝',
      debugging: '🐛',
    };
    return icons[this.state.status] || '❓';
  }

  getStatusText(): string {
    const texts: Record<AgentStatus, string> = {
      idle: 'Available',
      thinking: 'Thinking...',
      coding: 'Writing code',
      reviewing: 'Code review',
      testing: 'Running tests',
      deploying: 'Deploying',
      meeting: 'In a meeting',
      break: 'On break',
      'pair-programming': 'Pair programming',
      researching: 'Researching',
      'writing-docs': 'Writing docs',
      debugging: 'Debugging',
    };
    return texts[this.state.status] || 'Unknown';
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      emoji: this.emoji,
      status: this.status,
      mood: this.state.mood,
      currentTask: this.state.currentTask,
      position: this.state.position,
      stats: this.state.stats,
    };
  }
}
