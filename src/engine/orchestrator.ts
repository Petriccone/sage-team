import path from 'path';
import { EventEmitter } from 'events';
import { Database } from '../state/database';
import { SessionsRepo } from '../state/repositories/sessions';
import { AgentsRepo } from '../state/repositories/agents';
import { TasksRepo } from '../state/repositories/tasks';
import { SprintsRepo } from '../state/repositories/sprints';
import { EventsRepo } from '../state/repositories/events';
import { MessagesRepo } from '../state/repositories/messages';
import { PullRequestsRepo } from '../state/repositories/pull-requests';
import { CEOBrain, CEOResponse, AgentRoster } from './ceo-brain';
import { Dispatcher } from './dispatcher';
import { PRManager } from './pr-manager';
import { PromptBuilder } from './prompt-builder';
import { SkillLoader } from '../skills/loader';
import { PERSONAS } from '../agents/personas';
import { AGENT_SKILLS } from '../agents/skills-map';
import type { Session, AutonomyMode } from '../types';

export interface OrchestratorConfig {
  apiKey: string;
  model: string;
  maxConcurrentAgents: number;
  autonomyMode: AutonomyMode;
  companyName: string;
  mission: string;
}

export class Orchestrator extends EventEmitter {
  private db: Database;
  private config: OrchestratorConfig;

  // Repositories
  private sessions: SessionsRepo;
  private agents: AgentsRepo;
  private tasks: TasksRepo;
  private sprints: SprintsRepo;
  private events: EventsRepo;
  private messages: MessagesRepo;
  private pullRequests: PullRequestsRepo;

  // Engine components
  private ceoBrain: CEOBrain;
  private dispatcher: Dispatcher;
  private prManager: PRManager;
  private promptBuilder: PromptBuilder;
  private skillLoader: SkillLoader;

  // State
  private _sessionId: string | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  get sessionId(): string | null {
    return this._sessionId;
  }

  constructor(db: Database, config: OrchestratorConfig) {
    super();
    this.db = db;
    this.config = config;

    // Init repos
    this.sessions = new SessionsRepo(db);
    this.agents = new AgentsRepo(db);
    this.tasks = new TasksRepo(db);
    this.sprints = new SprintsRepo(db);
    this.events = new EventsRepo(db);
    this.messages = new MessagesRepo(db);
    this.pullRequests = new PullRequestsRepo(db);

    // Init engine
    this.ceoBrain = new CEOBrain({ apiKey: config.apiKey, model: config.model });
    this.dispatcher = new Dispatcher({ maxConcurrent: config.maxConcurrentAgents });
    this.prManager = new PRManager();
    this.promptBuilder = new PromptBuilder();
    this.skillLoader = new SkillLoader();

    this.setupDispatcherListeners();
  }

  private setupDispatcherListeners(): void {
    this.dispatcher.on('agent-status', ({ agentId, status, tool, detail }) => {
      this.agents.updateStatus(agentId, status);
      this.emitEvent('agent:status', agentId, { status, tool, detail });
    });

    this.dispatcher.on('agent-narration', ({ agentId, taskId, text }) => {
      this.emitEvent('agent:narration', agentId, { taskId, text });
    });

    this.dispatcher.on('task-complete', ({ agentId, taskId, cost, duration, turns, result }) => {
      this.handleTaskComplete(taskId, agentId);
      this.emitEvent('task:completed', agentId, { taskId, cost, duration, turns, result });
    });

    this.dispatcher.on('agent-failed', ({ agentId, taskId, exitCode }) => {
      this.tasks.updateStatus(taskId, 'failed');
      this.agents.clearTask(agentId);
      this.emitEvent('task:failed', agentId, { taskId, exitCode });
    });

    this.dispatcher.on('slot-freed', () => {
      // Trigger next tick to fill the slot
      if (this.running) this.tick();
    });
  }

  start(goal?: string): Session {
    const session = this.sessions.create(goal || 'New session');
    this._sessionId = session.id;

    // Initialize all 11 agents
    this.agents.initializeForSession(session.id);

    this.running = true;
    this.emitEvent('system', null, { message: `Session started: ${session.id}` });

    if (goal) {
      // Async goal decomposition — don't await, let it run
      this.submitGoal(goal).catch(err => {
        this.emitEvent('system', null, { message: `Goal decomposition failed: ${err.message}` });
      });
    }

    return session;
  }

  resume(sessionId: string): boolean {
    const session = this.sessions.findById(sessionId);
    if (!session) return false;

    this._sessionId = session.id;
    this.running = true;

    // Verify agents exist
    const agents = this.agents.findBySession(session.id);
    if (agents.length === 0) {
      this.agents.initializeForSession(session.id);
    }

    this.emitEvent('system', null, { message: `Session resumed: ${session.id}` });
    return true;
  }

  stop(): void {
    this.running = false;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.dispatcher.killAll();
  }

  /** Chat with CEO Sage before starting a sprint */
  async chatWithCEO(message: string): Promise<CEOResponse> {
    if (!this._sessionId) {
      // Auto-start session for chatting
      this.start();
    }

    this.agents.updateStatus('sage', 'thinking');
    this.emitEvent('agent:status', 'sage', { status: 'thinking' });

    const response = await this.ceoBrain.chat(message);

    if (response.type === 'ready') {
      this.agents.updateStatus('sage', 'planning');
      this.emitEvent('agent:status', 'sage', { status: 'planning' });
      this.emitEvent('system', 'sage', { message: `Sage: "${response.message.slice(0, 200)}"` });
    } else {
      this.agents.updateStatus('sage', 'idle');
      this.emitEvent('agent:status', 'sage', { status: 'idle' });
      this.emitEvent('agent:narration', 'sage', { text: response.message.slice(0, 200) });
    }

    return response;
  }

  /** Start the sprint after CEO conversation — uses conversation context */
  async launchSprint(goal: string): Promise<void> {
    if (!this._sessionId) throw new Error('No active session');

    // Emit meeting event
    this.emitEvent('meeting:start', null, {
      agents: PERSONAS.map(p => p.id),
    });

    await this.submitGoal(goal);

    this.emitEvent('meeting:end', null, {});
  }

  async submitGoal(goal: string): Promise<void> {
    if (!this._sessionId) throw new Error('No active session');

    // Update agent status
    this.agents.updateStatus('sage', 'planning');
    this.emitEvent('agent:status', 'sage', { status: 'planning' });

    // Build roster for CEO
    const roster: AgentRoster[] = PERSONAS.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      skills: AGENT_SKILLS[p.id] || [],
    }));

    // Decompose goal
    const result = await this.ceoBrain.decompose(goal, roster);

    // Create sprint
    const sprint = this.sprints.create({
      name: result.sprint.name,
      goal: result.sprint.goal,
      sessionId: this._sessionId,
    });

    // Create tasks with dependency mapping
    const taskIdMap: Record<string, string> = {};

    for (let i = 0; i < result.tasks.length; i++) {
      const t = result.tasks[i];
      // Resolve depends_on from index references to real IDs
      const resolvedDeps = t.depends_on
        .map(dep => taskIdMap[dep])
        .filter(Boolean);

      const task = this.tasks.create({
        title: t.title,
        description: t.description,
        priority: t.priority,
        requiredSkills: t.required_skills,
        dependsOn: resolvedDeps,
        sprintId: sprint.id,
        sessionId: this._sessionId,
        assigneeId: t.assignee,
      });

      taskIdMap[`task-${i}`] = task.id;
    }

    // CEO done planning
    this.agents.updateStatus('sage', 'idle');
    this.emitEvent('system', null, {
      message: `Sprint "${result.sprint.name}" created with ${result.tasks.length} tasks`,
    });

    // Start tick loop if not running
    if (!this.tickTimer) {
      this.startTickLoop();
    }
  }

  private startTickLoop(): void {
    this.tickTimer = setInterval(() => {
      if (this.running) this.tick();
    }, 5000);
  }

  private tick(): void {
    if (!this._sessionId) return;

    const available = this.tasks.findAvailable(this._sessionId, this.dispatcher.availableSlots());
    if (available.length === 0) return;

    for (const task of available) {
      const agentId = task.assignee_id;
      if (!agentId) continue;

      const agent = this.agents.findById(agentId);
      if (!agent) continue;

      const persona = PERSONAS.find(p => p.id === agentId);
      if (!persona) continue;

      // Load skills for this task
      const requiredSkills: string[] = JSON.parse(task.required_skills || '[]');
      const loadedSkills = this.skillLoader.loadSkillsForTask(requiredSkills, 25000);
      const skillContents = loadedSkills.map(s => `## ${s.id} (${s.source})\n${s.content}`);

      // Build system prompt
      const systemPrompt = this.promptBuilder.build({
        agent: { id: persona.id, name: persona.name, role: persona.role, description: persona.description },
        company: { name: this.config.companyName, mission: this.config.mission },
        skills: skillContents,
        task: { title: task.title, description: task.description || '', requiredSkills },
      });

      // Determine working directory
      let cwd = process.cwd();
      if (this.config.autonomyMode === 'sandbox') {
        try {
          // Check if git is available in this directory
          const { execSync } = require('child_process');
          execSync('git rev-parse --git-dir', { cwd, stdio: 'pipe' });

          const taskSlug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
          cwd = this.prManager.createWorktree(agentId, task.id, taskSlug, cwd);
          // Make path absolute if relative
          if (!path.isAbsolute(cwd)) {
            cwd = path.join(process.cwd(), cwd);
          }
        } catch (err: any) {
          // No git or worktree failed — silently fall back to direct mode
          this.emitEvent('system', agentId, { message: `Using project dir (no git worktree)` });
        }
      }

      // Mark task as in_progress
      this.tasks.assign(task.id, agentId);
      this.agents.assignTask(agentId, task.id);

      // Spawn agent
      this.dispatcher.spawnAgent(
        agentId,
        task.id,
        systemPrompt,
        `Execute this task: ${task.title}\n\n${task.description || ''}`,
        cwd,
      ).catch(err => {
        this.emitEvent('system', agentId, { message: `Failed to spawn: ${err.message}` });
      });

      this.emitEvent('task:assigned', agentId, { taskId: task.id });
    }
  }

  private handleTaskComplete(taskId: string, agentId: string): void {
    this.tasks.updateStatus(taskId, 'completed');
    this.agents.clearTask(agentId);

    if (this._sessionId && this.config.autonomyMode === 'sandbox') {
      // Create PR record
      const task = this.tasks.findById(taskId);
      if (task) {
        const slug = this.prManager.slugify(task.title);
        const branch = this.prManager.branchName(agentId, slug);
        this.pullRequests.create({
          taskId,
          agentId,
          branch,
          sessionId: this._sessionId,
        });
        this.emitEvent('pr:created', agentId, { taskId, branch });
      }
    }

    // Check if sprint is complete
    this.checkSprintComplete();
  }

  private checkSprintComplete(): void {
    if (!this._sessionId) return;
    const tasks = this.tasks.findBySession(this._sessionId);
    const allDone = tasks.every((t: any) => t.status === 'completed' || t.status === 'failed');
    if (allDone && tasks.length > 0) {
      const sprint = this.sprints.findActive(this._sessionId);
      if (sprint) {
        this.sprints.complete(sprint.id);
        this.emitEvent('celebration:sprint-complete', null, {
          sprintId: sprint.id,
          tasksCompleted: tasks.filter((t: any) => t.status === 'completed').length,
        });
      }
    }
  }

  // Public API
  getAgents(): any[] {
    if (!this._sessionId) return [];
    return this.agents.findBySession(this._sessionId);
  }

  getAvailableTasks(limit: number): any[] {
    if (!this._sessionId) return [];
    return this.tasks.findAvailable(this._sessionId, limit);
  }

  getTasks(): any[] {
    if (!this._sessionId) return [];
    return this.tasks.findBySession(this._sessionId);
  }

  getPendingPRs(): any[] {
    if (!this._sessionId) return [];
    return this.pullRequests.findPending(this._sessionId);
  }

  async approvePR(prId: string): Promise<void> {
    this.pullRequests.updateStatus(prId, 'user_approved');
    const pr = this.pullRequests.findById(prId);
    if (pr) {
      // CEO merges
      this.pullRequests.updateStatus(prId, 'merged', { mergedBy: 'sage' });
      this.emitEvent('pr:merged', 'sage', { prId, branch: pr.branch });
      this.emitEvent('celebration:pr-merged', pr.agent_id, { prId });
    }
  }

  rejectPR(prId: string, feedback: string): void {
    this.pullRequests.updateStatus(prId, 'user_rejected', { feedback });
    const pr = this.pullRequests.findById(prId);
    if (pr && this._sessionId) {
      // Re-queue task with feedback
      this.tasks.updateStatus(pr.task_id, 'pending');
      this.emitEvent('pr:rejected', pr.agent_id, { prId, feedback });
    }
  }

  private emitEvent(type: string, agentId: string | null, data: Record<string, unknown>): void {
    if (this._sessionId) {
      this.events.log(type, agentId, data, this._sessionId);
    }
    this.emit('event', { type, agentId, data, timestamp: new Date().toISOString() });
  }
}
