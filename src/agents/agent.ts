import { EventEmitter } from 'eventemitter3';
import {
  AgentPersona,
  AgentState,
  AgentStatus,
  AgentMood,
  ChatMessage,
  MemoryEntry,
  Task,
  AgentDecision,
  SkillExecution,
  AutonomyLogEntry,
} from '../types';
import { getSkillById, getSkillsByRole, buildSkillContext } from '../skills/registry';

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
      activeSkills: [],
      position: { ...persona.desk },
      messages: [],
      memory: [],
      stats: {
        tasksCompleted: 0,
        linesWritten: 0,
        reviewsDone: 0,
        meetingsAttended: 0,
        bugsFixed: 0,
        skillsExecuted: 0,
        autonomousDecisions: 0,
        delegationsMade: 0,
      },
      autonomyLog: [],
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

  get isAutonomous(): boolean {
    return this.state.persona.autonomyConfig.level === 'full';
  }

  get canDelegate(): boolean {
    return this.state.persona.autonomyConfig.canDelegateToOthers;
  }

  get canDispatch(): boolean {
    return this.state.persona.autonomyConfig.canDispatchParallelWork;
  }

  // ─── Status Management ──────────────────────────────────────────────────

  setStatus(status: AgentStatus): void {
    const prev = this.state.status;
    this.state.status = status;
    this.emit('status-change', { agentId: this.id, from: prev, to: status });
  }

  setMood(mood: AgentMood): void {
    this.state.mood = mood;
    this.emit('mood-change', { agentId: this.id, mood });
  }

  // ─── Task Management ────────────────────────────────────────────────────

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

  // ─── Skill Execution ───────────────────────────────────────────────────

  activateSkill(skillId: string): SkillExecution | null {
    const skill = getSkillById(skillId);
    if (!skill) return null;

    // Check if agent has this skill
    if (!this.state.persona.skillIds.includes(skillId) &&
        !skill.applicableRoles.includes(this.state.persona.role as any)) {
      return null;
    }

    // Check concurrent skill limit
    const runningSkills = this.state.activeSkills.filter((s) => s.status === 'running');
    if (runningSkills.length >= this.state.persona.autonomyConfig.maxConcurrentSkills) {
      return null;
    }

    const execution: SkillExecution = {
      skillId,
      agentId: this.id,
      startedAt: Date.now(),
      completedAt: null,
      status: 'running',
      output: null,
      verificationPassed: false,
    };

    this.state.activeSkills.push(execution);
    this.state.stats.skillsExecuted++;
    this.setStatus('executing-skill');
    this.emit('skill-activated', {
      agentId: this.id,
      skillId,
      skillName: skill.name,
    });

    return execution;
  }

  completeSkill(skillId: string, output: string, verified: boolean): void {
    const execution = this.state.activeSkills.find(
      (s) => s.skillId === skillId && s.status === 'running'
    );
    if (!execution) return;

    execution.completedAt = Date.now();
    execution.status = verified ? 'completed' : 'failed';
    execution.output = output;
    execution.verificationPassed = verified;

    this.emit('skill-completed', {
      agentId: this.id,
      skillId,
      verified,
      duration: execution.completedAt - execution.startedAt,
    });

    // Return to previous status if no more running skills
    const stillRunning = this.state.activeSkills.filter((s) => s.status === 'running');
    if (stillRunning.length === 0) {
      this.setStatus(this.state.currentTask ? 'coding' : 'idle');
    }
  }

  getActiveSkillNames(): string[] {
    return this.state.activeSkills
      .filter((s) => s.status === 'running')
      .map((s) => {
        const skill = getSkillById(s.skillId);
        return skill?.name || s.skillId;
      });
  }

  getAvailableSkills(): string[] {
    return getSkillsByRole(this.state.persona.role as any).map((s) => s.id);
  }

  getSkillContext(): string {
    return buildSkillContext(this.state.persona.skillIds);
  }

  // ─── Autonomous Decision Making ─────────────────────────────────────────

  recordDecision(decision: AgentDecision, outcome: 'success' | 'failure' | 'pending'): void {
    const entry: AutonomyLogEntry = {
      timestamp: Date.now(),
      decision,
      outcome,
    };
    this.state.autonomyLog.push(entry);
    this.state.stats.autonomousDecisions++;

    if (decision.type === 'delegate') {
      this.state.stats.delegationsMade++;
    }

    // Keep log bounded
    if (this.state.autonomyLog.length > 200) {
      this.state.autonomyLog = this.state.autonomyLog.slice(-150);
    }

    this.emit('autonomous-decision', {
      agentId: this.id,
      decision,
      outcome,
    });
  }

  getRecentDecisions(count: number = 10): AutonomyLogEntry[] {
    return this.state.autonomyLog.slice(-count);
  }

  shouldAutoSelectSkill(context: string): string | null {
    const available = this.state.persona.skillIds;
    const lower = context.toLowerCase();

    // Match skills based on triggers
    for (const skillId of available) {
      const skill = getSkillById(skillId);
      if (!skill) continue;
      if (skill.triggers.some((t) => lower.includes(t.toLowerCase()))) {
        return skillId;
      }
    }
    return null;
  }

  // ─── Movement ───────────────────────────────────────────────────────────

  moveTo(x: number, y: number): void {
    this.state.position = { x, y };
    this.emit('move', { agentId: this.id, position: this.state.position });
  }

  moveToDesk(): void {
    this.moveTo(this.state.persona.desk.x, this.state.persona.desk.y);
  }

  // ─── Communication ──────────────────────────────────────────────────────

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

  // ─── Memory ─────────────────────────────────────────────────────────────

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

  // ─── Autonomy Loop ──────────────────────────────────────────────────────

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

  // ─── Display Helpers ────────────────────────────────────────────────────

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
      brainstorming: '💡',
      planning: '📐',
      'executing-skill': '⚡',
      'security-audit': '🛡️',
      dispatching: '📡',
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
      brainstorming: 'Brainstorming',
      planning: 'Writing plan',
      'executing-skill': `Skill: ${this.getActiveSkillNames().join(', ') || 'executing'}`,
      'security-audit': 'Security audit',
      dispatching: 'Dispatching work',
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
      activeSkills: this.getActiveSkillNames(),
      isAutonomous: this.isAutonomous,
      canDelegate: this.canDelegate,
    };
  }
}
