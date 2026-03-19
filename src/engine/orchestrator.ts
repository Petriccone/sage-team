import { EventEmitter } from 'eventemitter3';
import { Agent } from '../agents/agent';
import { AGENT_PERSONAS } from '../agents/personas';
import { ClaudeClient } from './claude-client';
import { PlaywrightBridge, ScreenshotResult } from '../browser/playwright-bridge';
import { getSkillById, getSkillsByTrigger } from '../skills/registry';
import {
  AgentPersona,
  Task,
  Sprint,
  CompanyConfig,
  EngineEvent,
  CompanyMetrics,
  AgentStatus,
  AgentDecision,
} from '../types';

export class Orchestrator extends EventEmitter {
  public agents: Map<string, Agent> = new Map();
  public tasks: Task[] = [];
  public currentSprint: Sprint | null = null;
  public events: EngineEvent[] = [];
  public metrics: CompanyMetrics;
  public browser: PlaywrightBridge;
  private claude: ClaudeClient;
  private config: CompanyConfig;
  private running: boolean = false;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private tickCount: number = 0;

  constructor(config: CompanyConfig) {
    super();
    this.config = config;
    this.claude = new ClaudeClient(config.apiKey, config.model);
    this.browser = new PlaywrightBridge(config.projectPath);
    this.metrics = {
      totalTasksCompleted: 0,
      totalLinesOfCode: 0,
      sprintVelocity: 0,
      teamMorale: 85,
      bugsFound: 0,
      bugsFixed: 0,
      deployments: 0,
      uptime: 99.9,
      skillsExecuted: 0,
      autonomousDecisions: 0,
    };

    this.initializeAgents();
    this.setupBrowserListeners();
  }

  private setupBrowserListeners(): void {
    this.browser.on('screenshot-taken', (result: ScreenshotResult) => {
      this.pushEvent({
        type: 'system',
        data: {
          message: `📸 Screenshot captured: "${result.label}" by ${result.agentId}`,
          screenshot: result,
        },
        timestamp: Date.now(),
      });
    });

    this.browser.on('navigated', (data: { url: string; title: string; agentId: string }) => {
      this.pushEvent({
        type: 'system',
        data: { message: `🌐 ${data.agentId} navigated to: ${data.title || data.url}` },
        timestamp: Date.now(),
      });
    });
  }

  async connectBrowser(): Promise<boolean> {
    const connected = await this.browser.connect();
    if (connected) {
      this.pushEvent({
        type: 'system',
        data: { message: '🎭 Playwright browser connected — visual tracking active' },
        timestamp: Date.now(),
      });
    }
    return connected;
  }

  async takeScreenshot(
    agentId: string,
    label: string,
    url?: string
  ): Promise<ScreenshotResult | null> {
    return this.browser.captureProgress(agentId, label, url);
  }

  async getProgressReport(): Promise<string> {
    return this.browser.generateProgressReport();
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

    agent.on('skill-activated', (data) => {
      this.metrics.skillsExecuted++;
      this.pushEvent({
        type: 'skill-activated',
        agentId: data.agentId,
        data: { skillId: data.skillId, skillName: data.skillName },
        timestamp: Date.now(),
      });
    });

    agent.on('skill-completed', (data) => {
      this.pushEvent({
        type: 'skill-completed',
        agentId: data.agentId,
        data: { skillId: data.skillId, verified: data.verified, duration: data.duration },
        timestamp: Date.now(),
      });
    });

    agent.on('autonomous-decision', (data) => {
      this.metrics.autonomousDecisions++;
      this.pushEvent({
        type: 'autonomous-decision',
        agentId: data.agentId,
        data: { decision: data.decision, outcome: data.outcome },
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
      data: { message: 'Sage Team is starting up... [FULL AUTONOMY MODE]' },
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

    try {
      // Simulate autonomous agent activities
      for (const [, agent] of this.agents) {
        try {
          this.simulateAutonomousActivity(agent);
        } catch {
          // Skip agent on error to prevent cascade
        }
      }

      // Periodic team interactions with context
      if (this.tickCount % 8 === 0) {
        this.simulateTeamInteraction();
      }

      // Periodic skill activations
      if (this.tickCount % 12 === 0) {
        this.simulateSkillActivation();
      }

      // Periodic autonomous decisions
      if (this.tickCount % 15 === 0) {
        this.simulateAutonomousDecision();
      }
    } catch {
      // Prevent tick errors from crashing the simulation
    }

    this.emit('tick', { count: this.tickCount, metrics: this.metrics });
  }

  private simulateAutonomousActivity(agent: Agent): void {
    if (agent.state.currentTask) {
      // Agent is working on a task - cycle through contextual statuses
      const taskContext = this.tasks.find((t) => t.id === agent.state.currentTask);
      const workStatuses = this.getWorkStatusesForRole(agent.role);

      const current = workStatuses.indexOf(agent.status);
      if (current >= 0 && Math.random() > 0.7) {
        const next = workStatuses[(current + 1) % workStatuses.length];
        agent.setStatus(next);
      }

      // Task completion with skill-based probability
      const completionChance = agent.state.activeSkills.some((s) => s.status === 'running') ? 0.88 : 0.92;
      if (Math.random() > completionChance) {
        // Complete any running skills first
        for (const skill of agent.state.activeSkills.filter((s) => s.status === 'running')) {
          agent.completeSkill(skill.skillId, `Completed ${skill.skillId} successfully`, true);
        }
        agent.completeTask();
        this.metrics.totalLinesOfCode += Math.floor(Math.random() * 80) + 20;

        // Update task
        if (taskContext) {
          taskContext.status = 'done';
        }
      }
    } else {
      // Autonomous idle behavior based on role
      const idleActivities = this.getIdleActivitiesForRole(agent.role);
      if (Math.random() > 0.75) {
        const activity = idleActivities[Math.floor(Math.random() * idleActivities.length)];
        agent.setStatus(activity);
      }

      // Autonomous task pickup
      if (agent.state.persona.autonomyConfig.canSelfAssignTasks) {
        const available = this.findBestTaskForAgent(agent);
        if (available && Math.random() > 0.5) {
          available.assignee = agent.id;
          available.status = 'in-progress';
          agent.assignTask(available);

          // Auto-activate relevant skills
          if (available.requiredSkills && available.requiredSkills.length > 0) {
            for (const skillId of available.requiredSkills.slice(0, agent.state.persona.autonomyConfig.maxConcurrentSkills)) {
              agent.activateSkill(skillId);
            }
          }

          agent.sendMessage('all', `Picking up "${available.title}" — I have the right skills for this.`, 'work');
        }
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

  private getWorkStatusesForRole(role: string): AgentStatus[] {
    const roleStatuses: Record<string, AgentStatus[]> = {
      'ceo': ['thinking', 'planning', 'meeting', 'dispatching'],
      'cto': ['thinking', 'reviewing', 'coding', 'security-audit'],
      'dev-senior': ['coding', 'testing', 'debugging', 'reviewing'],
      'dev-fullstack': ['coding', 'testing', 'debugging', 'researching'],
      'qa-lead': ['testing', 'reviewing', 'debugging', 'writing-docs'],
      'devops': ['deploying', 'debugging', 'coding', 'security-audit'],
      'product-manager': ['thinking', 'writing-docs', 'brainstorming', 'meeting'],
      'ux-designer': ['brainstorming', 'coding', 'reviewing', 'researching'],
      'architect': ['thinking', 'planning', 'writing-docs', 'reviewing'],
      'scrum-master': ['meeting', 'planning', 'writing-docs', 'thinking'],
      'data-engineer': ['coding', 'testing', 'researching', 'debugging'],
    };
    return roleStatuses[role] || ['coding', 'thinking', 'researching', 'debugging'];
  }

  private getIdleActivitiesForRole(role: string): AgentStatus[] {
    const activities: Record<string, AgentStatus[]> = {
      'ceo': ['thinking', 'meeting', 'brainstorming'],
      'cto': ['reviewing', 'researching', 'security-audit'],
      'dev-senior': ['reviewing', 'researching', 'pair-programming'],
      'dev-fullstack': ['researching', 'reviewing', 'coding'],
      'qa-lead': ['reviewing', 'testing', 'writing-docs'],
      'devops': ['researching', 'security-audit', 'break'],
      'product-manager': ['brainstorming', 'researching', 'writing-docs'],
      'ux-designer': ['brainstorming', 'researching', 'break'],
      'architect': ['researching', 'writing-docs', 'reviewing'],
      'scrum-master': ['meeting', 'writing-docs', 'break'],
      'data-engineer': ['researching', 'reviewing', 'coding'],
    };
    return activities[role] || ['idle', 'researching', 'break'];
  }

  private findBestTaskForAgent(agent: Agent): Task | undefined {
    // Prune completed tasks to prevent unbounded growth
    if (this.tasks.length > 200) {
      const done = this.tasks.filter((t) => t.status === 'done');
      if (done.length > 100) {
        this.tasks = [
          ...this.tasks.filter((t) => t.status !== 'done'),
          ...done.slice(-50),
        ];
      }
    }

    const available = this.tasks.filter((t) => t.status === 'todo' && !t.assignee);
    if (available.length === 0) return undefined;

    // Score tasks based on skill match
    const scored = available.map((task) => {
      let score = 0;

      // Check required skills match
      if (task.requiredSkills) {
        const matching = task.requiredSkills.filter((s) =>
          agent.state.persona.skillIds.includes(s)
        );
        score += matching.length * 10;
      }

      // Priority bonus
      const priorityScores: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      score += priorityScores[task.priority] || 1;

      // Check if task description matches agent skills
      const desc = (task.title + ' ' + task.description).toLowerCase();
      for (const skill of agent.state.persona.skills) {
        if (desc.includes(skill.toLowerCase())) score += 5;
      }

      return { task, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].task : available[0];
  }

  private simulateSkillActivation(): void {
    const agents = Array.from(this.agents.values());
    const busyAgent = agents.find((a) =>
      a.state.currentTask && a.state.activeSkills.filter((s) => s.status === 'running').length === 0
    );

    if (busyAgent) {
      const task = this.tasks.find((t) => t.id === busyAgent.state.currentTask);
      if (task) {
        // Auto-detect which skill to activate based on task context
        const autoSkill = busyAgent.shouldAutoSelectSkill(task.title + ' ' + task.description);
        if (autoSkill) {
          busyAgent.activateSkill(autoSkill);
        } else if (busyAgent.state.persona.skillIds.length > 0) {
          // Activate a random skill from the agent's arsenal
          const randomSkill = busyAgent.state.persona.skillIds[
            Math.floor(Math.random() * busyAgent.state.persona.skillIds.length)
          ];
          busyAgent.activateSkill(randomSkill);
        }
      }
    }
  }

  private simulateAutonomousDecision(): void {
    const agents = Array.from(this.agents.values());
    const agent = agents[Math.floor(Math.random() * agents.length)];

    if (!agent.isAutonomous) return;

    const decisions: AgentDecision[] = [
      {
        type: 'work',
        action: `Optimizing current implementation using ${agent.state.persona.skills[0]} expertise`,
        reasoning: 'Proactively improving code quality',
        confidence: 0.85,
      },
      {
        type: 'review',
        action: 'Reviewing recent changes for quality',
        reasoning: 'Maintaining code standards as part of continuous review',
        confidence: 0.9,
      },
      {
        type: 'report',
        action: 'Sharing progress update with team',
        reasoning: 'Keeping team informed of status',
        confidence: 0.95,
      },
    ];

    if (agent.canDelegate) {
      decisions.push({
        type: 'delegate',
        action: 'Identified subtask that can be handled by a specialist',
        target: agents[Math.floor(Math.random() * agents.length)].id,
        reasoning: 'Better skill match for this specific task',
        confidence: 0.8,
      });
    }

    if (agent.canDispatch) {
      decisions.push({
        type: 'dispatch',
        action: 'Breaking work into parallel tasks',
        reasoning: 'Independent subtasks identified — can run concurrently',
        confidence: 0.75,
      });
    }

    const decision = decisions[Math.floor(Math.random() * decisions.length)];
    agent.recordDecision(decision, 'success');
  }

  private simulateTeamInteraction(): void {
    const agentList = Array.from(this.agents.values());
    const sender = agentList[Math.floor(Math.random() * agentList.length)];
    const receiver = agentList[Math.floor(Math.random() * agentList.length)];

    if (sender.id === receiver.id) return;

    // Context-aware interactions based on agent roles and skills
    const interactions = this.getContextualInteractions(sender, receiver);
    const msg = interactions[Math.floor(Math.random() * interactions.length)];
    sender.sendMessage(receiver.id, msg, 'general');
  }

  private getContextualInteractions(sender: Agent, receiver: Agent): string[] {
    const senderSkills = sender.getActiveSkillNames();
    const base = [
      `${receiver.name}, I'm using my ${sender.state.persona.skills[0]} expertise on this — mind reviewing?`,
      `Great work on that PR, ${receiver.name}! Clean implementation following our code standards.`,
      `@${receiver.name} Sprint velocity is up 15% this week. Team is operating well.`,
    ];

    // Role-specific interactions
    if (sender.role === 'qa-lead') {
      base.push(
        `${receiver.name}, found an edge case in the auth module. Running TDD protocol to write a failing test first.`,
        `${receiver.name}, all verification steps pass. CONFIRMED with fresh test run. Approving the PR.`,
        `Heads up ${receiver.name} — test coverage dropped below 80%. Let's fix this before merging.`,
      );
    }
    if (sender.role === 'devops') {
      base.push(
        `${receiver.name}, deploying v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 50)} to staging. Canary at 10%.`,
        `${receiver.name}, security scan passed. No vulnerabilities detected. Proceeding to production.`,
        `CI/CD pipeline green across all 10 stages. Ready for deployment approval.`,
      );
    }
    if (sender.role === 'architect') {
      base.push(
        `${receiver.name}, wrote an ADR for the new service boundary. Please review before implementation.`,
        `Proposing event-driven pattern for the notification system. Thoughts, ${receiver.name}?`,
      );
    }
    if (sender.role === 'ceo') {
      base.push(
        `Team, I've dispatched parallel tasks to ${receiver.name} and others. Let's move fast on this sprint.`,
        `${receiver.name}, your autonomous decision-making has been excellent. Keep it up.`,
      );
    }
    if (senderSkills.length > 0) {
      base.push(
        `${receiver.name}, currently executing skill: ${senderSkills[0]}. Will share results when verified.`,
      );
    }

    return base;
  }

  async submitGoal(goal: string): Promise<void> {
    const ceo = this.agents.get('sage');
    if (!ceo) return;

    ceo.setStatus('thinking');
    ceo.activateSkill('sp-brainstorming');

    this.pushEvent({
      type: 'system',
      data: { message: `New goal received: "${goal}" — CEO activating brainstorming protocol` },
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
              requiredSkills: t.requiredSkills || [],
            };
            this.tasks.push(task);

            // Assign to agent if specified
            if (task.assignee) {
              const agent = this.agents.get(task.assignee);
              if (agent) {
                task.status = 'in-progress';
                agent.assignTask(task);

                // Auto-activate required skills
                for (const skillId of task.requiredSkills.slice(0, agent.state.persona.autonomyConfig.maxConcurrentSkills)) {
                  agent.activateSkill(skillId);
                }

                agent.recordDecision({
                  type: 'work',
                  action: `Assigned: ${task.title}`,
                  reasoning: 'Task delegated by CEO based on skill match',
                  confidence: 0.9,
                }, 'pending');
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

      ceo.completeSkill('sp-brainstorming', 'Goal decomposed and delegated successfully', true);
      ceo.setStatus('idle');

      // CEO records delegation decision
      ceo.recordDecision({
        type: 'dispatch',
        action: `Decomposed goal into ${this.tasks.length} tasks and dispatched to team`,
        reasoning: `Matched tasks to agent expertise for optimal execution`,
        confidence: 0.9,
      }, 'success');

      ceo.sendMessage('all',
        `Team, I've analyzed our new goal and dispatched ${this.tasks.length} tasks. ` +
        `Each of you has been assigned work matching your skills. ` +
        `Operate autonomously — I trust your expertise. Report blockers immediately.`,
        'announcements'
      );
    } catch (error) {
      ceo.completeSkill('sp-brainstorming', 'Failed', false);
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

      // Try to parse decision from response
      try {
        const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const decision: AgentDecision = JSON.parse(jsonMatch[1]);
          agent.recordDecision(decision, 'success');

          // Handle delegation
          if (decision.type === 'delegate' && decision.target) {
            const target = this.agents.get(decision.target);
            if (target) {
              agent.sendMessage(decision.target, decision.action, 'delegation');
            }
          }

          // Handle skill execution
          if (decision.type === 'skill-execute' && decision.skillId) {
            agent.activateSkill(decision.skillId);
          }
        }
      } catch {
        // Non-JSON response, that's fine
      }

      agent.setStatus('coding');
      this.metrics.totalLinesOfCode += Math.floor(Math.random() * 50) + 10;

      return response.content;
    } catch (error) {
      agent.setStatus('idle');
      return null;
    }
  }

  private getTeamContext(): string {
    const statuses = Array.from(this.agents.values())
      .map((a) => {
        const skills = a.getActiveSkillNames();
        const skillInfo = skills.length > 0 ? ` [Skills: ${skills.join(', ')}]` : '';
        return `${a.emoji} ${a.name} (${a.state.persona.title}): ${a.getStatusText()}${skillInfo}`;
      })
      .join('\n');

    const taskSummary = this.tasks
      .filter((t) => t.status !== 'done')
      .map((t) => {
        const skills = t.requiredSkills?.length
          ? ` (skills: ${t.requiredSkills.join(', ')})`
          : '';
        return `- [${t.status}] ${t.title} (assigned: ${t.assignee || 'unassigned'})${skills}`;
      })
      .join('\n');

    return `## Team Status\n${statuses}\n\n## Active Tasks\n${taskSummary || 'No active tasks.'}\n\n## Metrics\n- Tasks completed: ${this.metrics.totalTasksCompleted}\n- Skills executed: ${this.metrics.skillsExecuted}\n- Autonomous decisions: ${this.metrics.autonomousDecisions}\n- Team morale: ${this.metrics.teamMorale}%`;
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
