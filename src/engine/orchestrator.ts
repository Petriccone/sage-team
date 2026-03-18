import { EventEmitter } from 'eventemitter3';
import { Agent } from '../agents/agent';
import { AGENT_PERSONAS } from '../agents/personas';
import { ClaudeClient } from './claude-client';
import {
  AgentPersona,
  Task,
  Sprint,
  CompanyConfig,
  EngineEvent,
  CompanyMetrics,
  AgentStatus,
} from '../types';

export class Orchestrator extends EventEmitter {
  public agents: Map<string, Agent> = new Map();
  public tasks: Task[] = [];
  public currentSprint: Sprint | null = null;
  public events: EngineEvent[] = [];
  public metrics: CompanyMetrics;
  private claude: ClaudeClient;
  private config: CompanyConfig;
  private running: boolean = false;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private tickCount: number = 0;

  constructor(config: CompanyConfig) {
    super();
    this.config = config;
    this.claude = new ClaudeClient(config.apiKey, config.model);
    this.metrics = {
      totalTasksCompleted: 0,
      totalLinesOfCode: 0,
      sprintVelocity: 0,
      teamMorale: 85,
      bugsFound: 0,
      bugsFixed: 0,
      deployments: 0,
      uptime: 99.9,
    };

    this.initializeAgents();
  }

  private initializeAgents(): void {
    for (const persona of AGENT_PERSONAS) {
      const agent = new Agent(persona);
      this.setupAgentListeners(agent);
      this.agents.set(persona.id, agent);
    }
  }

  private setupAgentListeners(agent: Agent): void {
    agent.on('status-change', (data) => {
      this.pushEvent({
        type: 'agent-status',
        agentId: data.agentId,
        data: { from: data.from, to: data.to },
        timestamp: Date.now(),
      });
    });

    agent.on('move', (data) => {
      this.pushEvent({
        type: 'agent-move',
        agentId: data.agentId,
        data: { position: data.position },
        timestamp: Date.now(),
      });
    });

    agent.on('message', (msg) => {
      this.pushEvent({
        type: 'agent-message',
        agentId: msg.from,
        data: { message: msg },
        timestamp: Date.now(),
      });
      // Deliver to recipient
      if (msg.to !== 'all') {
        const recipient = this.agents.get(msg.to);
        if (recipient) {
          recipient.state.messages.push(msg);
        }
      }
    });

    agent.on('task-completed', (data) => {
      this.metrics.totalTasksCompleted++;
      this.pushEvent({
        type: 'task-update',
        agentId: data.agentId,
        data: { taskId: data.taskId, status: 'done' },
        timestamp: Date.now(),
      });
    });
  }

  private pushEvent(event: EngineEvent): void {
    this.events.push(event);
    if (this.events.length > 500) {
      this.events = this.events.slice(-300);
    }
    this.emit('event', event);
  }

  async start(): Promise<void> {
    this.running = true;
    this.pushEvent({
      type: 'system',
      data: { message: 'Sage Team is starting up...' },
      timestamp: Date.now(),
    });

    // Set initial agent statuses
    for (const [, agent] of this.agents) {
      agent.moveToDesk();
    }

    // Start the simulation tick
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 3000);

    this.emit('started');
  }

  stop(): void {
    this.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    for (const [, agent] of this.agents) {
      agent.stopAutonomy();
    }
    this.emit('stopped');
  }

  private tick(): void {
    if (!this.running) return;
    this.tickCount++;

    // Simulate agent activities
    for (const [, agent] of this.agents) {
      this.simulateAgentActivity(agent);
    }

    // Periodic team interactions
    if (this.tickCount % 10 === 0) {
      this.simulateTeamInteraction();
    }

    this.emit('tick', { count: this.tickCount, metrics: this.metrics });
  }

  private simulateAgentActivity(agent: Agent): void {
    if (agent.state.currentTask) {
      // Agent is working on a task - cycle through statuses
      const workStatuses: AgentStatus[] = ['coding', 'thinking', 'researching', 'debugging'];
      const current = workStatuses.indexOf(agent.status);
      if (current >= 0 && Math.random() > 0.7) {
        const next = workStatuses[(current + 1) % workStatuses.length];
        agent.setStatus(next);
      }
      // Random chance to complete task
      if (Math.random() > 0.92) {
        agent.completeTask();
        this.metrics.totalLinesOfCode += Math.floor(Math.random() * 50) + 10;
      }
    } else {
      // Idle agent - pick up a task or do idle activities
      const idleActivities: AgentStatus[] = ['idle', 'researching', 'break', 'reviewing'];
      if (Math.random() > 0.8) {
        const activity = idleActivities[Math.floor(Math.random() * idleActivities.length)];
        agent.setStatus(activity);
      }

      // Try to pick up a task
      const available = this.tasks.find(
        (t) => t.status === 'todo' && !t.assignee
      );
      if (available && Math.random() > 0.6) {
        available.assignee = agent.id;
        available.status = 'in-progress';
        agent.assignTask(available);
      }
    }

    // Small random movement near desk
    if (Math.random() > 0.85) {
      const dx = Math.floor(Math.random() * 3) - 1;
      const dy = Math.floor(Math.random() * 3) - 1;
      agent.moveTo(
        Math.max(1, Math.min(49, agent.state.persona.desk.x + dx)),
        Math.max(1, Math.min(15, agent.state.persona.desk.y + dy))
      );
    }
  }

  private simulateTeamInteraction(): void {
    const agentList = Array.from(this.agents.values());
    const sender = agentList[Math.floor(Math.random() * agentList.length)];
    const receiver = agentList[Math.floor(Math.random() * agentList.length)];

    if (sender.id === receiver.id) return;

    const interactions = [
      `Hey ${receiver.name}, can you take a look at this when you have a moment?`,
      `${receiver.name}, I found an issue with the auth module. Let's sync.`,
      `Great work on that PR, ${receiver.name}! Clean implementation.`,
      `@${receiver.name} Sprint velocity is looking good this week.`,
      `${receiver.name}, I need your input on the database schema.`,
      `Quick question about the API design, ${receiver.name}?`,
      `${receiver.name}, tests are passing. Ready for review.`,
      `Let's do a quick sync about the deployment, ${receiver.name}.`,
      `${receiver.name}, I've updated the docs for the new feature.`,
      `Heads up team - deploying v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 50)} to staging.`,
    ];

    const msg = interactions[Math.floor(Math.random() * interactions.length)];
    sender.sendMessage(receiver.id, msg, 'general');
  }

  async submitGoal(goal: string): Promise<void> {
    const ceo = this.agents.get('sage');
    if (!ceo) return;

    ceo.setStatus('thinking');
    this.pushEvent({
      type: 'system',
      data: { message: `New goal received: "${goal}"` },
      timestamp: Date.now(),
    });

    try {
      const personas = Array.from(this.agents.values()).map((a) => a.state.persona);
      const response = await this.claude.delegate(ceo.state.persona, goal, personas);

      // Parse the delegation response
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[1]);
        if (plan.tasks) {
          for (const t of plan.tasks) {
            const task: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: t.title,
              description: t.description,
              assignee: t.assignee || null,
              status: t.assignee ? 'todo' : 'backlog',
              priority: t.priority || 'medium',
              createdBy: 'sage',
              createdAt: Date.now(),
              storyPoints: t.storyPoints || 3,
              subtasks: [],
              dependencies: t.dependencies || [],
            };
            this.tasks.push(task);

            // Assign to agent if specified
            if (task.assignee) {
              const agent = this.agents.get(task.assignee);
              if (agent) {
                task.status = 'in-progress';
                agent.assignTask(task);
              }
            }
          }

          // Create sprint
          this.currentSprint = {
            id: `sprint-${Date.now()}`,
            name: plan.sprintGoal || 'Sprint',
            tasks: this.tasks.filter((t) => t.status !== 'done'),
            startDate: Date.now(),
            endDate: Date.now() + this.config.sprintDurationDays * 86400000,
            goal: plan.sprintGoal || goal,
          };
        }
      }

      ceo.setStatus('idle');
      ceo.sendMessage('all', `Team, I've broken down our new goal and assigned tasks. Let's get to work!`, 'announcements');
    } catch (error) {
      ceo.setStatus('idle');
      this.pushEvent({
        type: 'system',
        data: { message: `Error processing goal: ${(error as Error).message}` },
        timestamp: Date.now(),
      });
    }
  }

  async executeAgentAction(agentId: string): Promise<string | null> {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.state.currentTask) return null;

    const task = this.tasks.find((t) => t.id === agent.state.currentTask);
    if (!task) return null;

    agent.setStatus('thinking');

    try {
      const teamContext = this.getTeamContext();
      const recentMessages = this.getRecentMessages(10);

      const response = await this.claude.agentThink(
        agent.state.persona,
        `${task.title}: ${task.description}`,
        teamContext,
        recentMessages
      );

      agent.setStatus('coding');
      this.metrics.totalLinesOfCode += Math.floor(Math.random() * 30) + 5;

      return response.content;
    } catch (error) {
      agent.setStatus('idle');
      return null;
    }
  }

  private getTeamContext(): string {
    const statuses = Array.from(this.agents.values())
      .map((a) => `${a.emoji} ${a.name} (${a.state.persona.title}): ${a.getStatusText()}`)
      .join('\n');

    const taskSummary = this.tasks
      .filter((t) => t.status !== 'done')
      .map((t) => `- [${t.status}] ${t.title} (assigned: ${t.assignee || 'unassigned'})`)
      .join('\n');

    return `## Team Status\n${statuses}\n\n## Active Tasks\n${taskSummary || 'No active tasks.'}`;
  }

  private getRecentMessages(count: number): import('../types').ChatMessage[] {
    const allMessages: import('../types').ChatMessage[] = [];
    for (const [, agent] of this.agents) {
      allMessages.push(...agent.state.messages);
    }
    return allMessages.sort((a, b) => b.timestamp - a.timestamp).slice(0, count);
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAgentList(): Agent[] {
    return Array.from(this.agents.values());
  }
}
