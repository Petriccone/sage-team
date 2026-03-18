import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { Orchestrator } from '../engine/orchestrator';
import { Agent } from '../agents/agent';
import { getOfficeLines, STATUS_ANIMATIONS, OFFICE_WIDTH, OFFICE_HEIGHT } from './office-map';
import { CompanyConfig, AgentStatus, Task } from '../types';
import { getSkillById } from '../skills/registry';
import {
  CHARACTER_SPRITES,
  AgentInteraction,
  calculateMeetingPoint,
  interpolatePosition,
  getCharacterFrame,
} from './characters';

export class Dashboard {
  private screen: blessed.Widgets.Screen;
  private grid: any;
  private orchestrator: Orchestrator;
  private officeBox: blessed.Widgets.BoxElement | null = null;
  private chatBox: blessed.Widgets.Log | null = null;
  private taskBoard: blessed.Widgets.BoxElement | null = null;
  private metricsBar: any = null;
  private agentPanel: blessed.Widgets.BoxElement | null = null;
  private inputBox: blessed.Widgets.TextboxElement | null = null;
  private statusBar: blessed.Widgets.BoxElement | null = null;
  private animFrame: number = 0;
  private renderInterval: ReturnType<typeof setInterval> | null = null;
  private selectedAgent: string | null = null;
  private interactions: AgentInteraction[] = [];
  private agentOriginalPositions: Map<string, { x: number; y: number }> = new Map();

  constructor(orchestrator: Orchestrator, private config: CompanyConfig) {
    this.orchestrator = orchestrator;

    this.screen = blessed.screen({
      smartCSR: true,
      title: `Sage Team -- ${config.name}`,
      fullUnicode: true,
    });

    this.setupLayout();
    this.setupKeybindings();
    this.setupEventListeners();
  }

  private setupLayout(): void {
    // Header
    blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '{center}{bold}SAGE TEAM{/bold} -- Autonomous AI Company [FULL AUTONOMY]{/center}',
      tags: true,
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true,
      },
    });

    // Office Map (main visual area)
    this.officeBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '60%',
      height: OFFICE_HEIGHT + 4,
      label: ' [=] Office Floor Plan ',
      border: { type: 'line' },
      tags: true,
      style: {
        border: { fg: 'cyan' },
        label: { fg: 'cyan', bold: true },
      },
    });

    // Agent Detail Panel
    this.agentPanel = blessed.box({
      parent: this.screen,
      top: 3,
      left: '60%',
      width: '40%',
      height: 12,
      label: ' [oo] Team Status ',
      border: { type: 'line' },
      tags: true,
      scrollable: true,
      mouse: true,
      style: {
        border: { fg: 'green' },
        label: { fg: 'green', bold: true },
      },
    });

    // Metrics Dashboard
    this.taskBoard = blessed.box({
      parent: this.screen,
      top: 15,
      left: '60%',
      width: '40%',
      height: 9,
      label: ' [#] Sprint Board ',
      border: { type: 'line' },
      tags: true,
      scrollable: true,
      style: {
        border: { fg: 'yellow' },
        label: { fg: 'yellow', bold: true },
      },
    });

    // Chat / Activity Log
    this.chatBox = blessed.log({
      parent: this.screen,
      top: OFFICE_HEIGHT + 7,
      left: 0,
      width: '60%',
      height: '100%-' + (OFFICE_HEIGHT + 10),
      label: ' [<>] Team Chat ',
      border: { type: 'line' },
      tags: true,
      scrollable: true,
      mouse: true,
      scrollbar: {
        style: { bg: 'blue' },
      },
      style: {
        border: { fg: 'magenta' },
        label: { fg: 'magenta', bold: true },
      },
    }) as blessed.Widgets.Log;

    // Input Box
    this.inputBox = blessed.textbox({
      parent: this.screen,
      bottom: 1,
      left: 0,
      width: '100%',
      height: 3,
      label: ' [>] Enter Goal (press Enter to submit, Tab to focus) ',
      border: { type: 'line' },
      inputOnFocus: true,
      style: {
        border: { fg: 'white' },
        label: { fg: 'white', bold: true },
        focus: {
          border: { fg: 'yellow' },
        },
      },
    });

    // Status Bar
    this.statusBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: ' {bold}q{/bold}:Quit {bold}Tab{/bold}:Input {bold}1-9{/bold}:Agent {bold}g{/bold}:Goal {bold}s{/bold}:Screenshot',
      tags: true,
      style: {
        fg: 'white',
        bg: '#333333',
      },
    });
  }

  private setupKeybindings(): void {
    this.screen.key(['q', 'C-c'], () => {
      this.stop();
      process.exit(0);
    });

    this.screen.key(['tab'], () => {
      if (this.inputBox) {
        this.inputBox.focus();
      }
    });

    this.screen.key(['escape'], () => {
      this.screen.focusPop();
      this.screen.render();
    });

    this.screen.key(['g'], () => {
      if (this.inputBox) {
        this.inputBox.focus();
      }
    });

    // Number keys to select agents
    const agentKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const agentIds = ['sage', 'nova', 'dex', 'flux', 'quinn', 'gage', 'morgan', 'uma', 'aria'];

    for (let i = 0; i < agentKeys.length; i++) {
      const agentId = agentIds[i];
      this.screen.key([agentKeys[i]], () => {
        this.selectedAgent = this.selectedAgent === agentId ? null : agentId;
        this.renderAgentPanel();
        this.screen.render();
      });
    }

    this.screen.key(['0'], () => {
      this.selectedAgent = null;
      this.renderAgentPanel();
      this.screen.render();
    });

    if (this.inputBox) {
      this.inputBox.on('submit', (value: string) => {
        if (value.trim()) {
          this.onGoalSubmit(value.trim());
        }
        this.inputBox!.clearValue();
        this.inputBox!.cancel();
        this.screen.render();
      });

      this.inputBox.on('cancel', () => {
        this.screen.focusPop();
        this.screen.render();
      });
    }
  }

  private setupEventListeners(): void {
    this.orchestrator.on('event', (event) => {
      if (event.type === 'agent-message' && this.chatBox) {
        const msg = event.data.message as any;
        const agent = this.orchestrator.getAgent(msg.from);
        const toAgent = msg.to === 'all' ? '#general' : this.orchestrator.getAgent(msg.to)?.name || msg.to;
        const color = agent?.state.persona.color || 'white';
        const charFrame = agent ? getCharacterFrame(agent.id, 'talking', 0) : '??';
        this.chatBox.log(`{${color}-fg}{bold}${charFrame} ${agent?.name || msg.from}{/bold}{/${color}-fg} -> ${toAgent}: ${msg.content}`);

        // Trigger movement interaction when agents talk to each other (not broadcast)
        if (msg.to !== 'all' && agent) {
          const receiver = this.orchestrator.getAgent(msg.to);
          if (receiver) {
            this.startInteraction(agent, receiver);
          }
        }
      }

      if (event.type === 'system' && this.chatBox) {
        this.chatBox.log(`{yellow-fg}{bold}[=] SYSTEM:{/bold} ${(event.data as any).message}{/yellow-fg}`);
      }

      if (event.type === 'skill-activated' && this.chatBox) {
        const agent = this.orchestrator.getAgent(event.agentId || '');
        const color = agent?.state.persona.color || 'white';
        const charFrame = agent ? getCharacterFrame(agent.id, 'idle', 0) : '??';
        this.chatBox.log(`{${color}-fg}{bold}[^] ${charFrame} ${agent?.name || ''}{/bold} activated skill: {cyan-fg}${(event.data as any).skillName}{/cyan-fg}{/${color}-fg}`);
      }

      if (event.type === 'autonomous-decision' && this.chatBox) {
        const agent = this.orchestrator.getAgent(event.agentId || '');
        const decision = (event.data as any).decision;
        if (decision && Math.random() > 0.5) { // Show 50% of decisions to avoid spam
          const color = agent?.state.persona.color || 'white';
          const charFrame = agent ? getCharacterFrame(agent.id, 'idle', 0) : '??';
          this.chatBox.log(`{${color}-fg}{bold}[*] ${charFrame} ${agent?.name || ''}{/bold} decided: ${decision.action}{/${color}-fg}`);
        }
      }

      if (event.type === 'task-update') {
        this.renderTaskBoard();
      }
    });

    this.orchestrator.on('tick', () => {
      this.animFrame++;
      this.render();
    });
  }

  private async onGoalSubmit(goal: string): Promise<void> {
    if (this.chatBox) {
      this.chatBox.log(`{white-fg}{bold}[>] YOU:{/bold} ${goal}{/white-fg}`);
    }
    await this.orchestrator.submitGoal(goal);
  }

  start(): void {
    this.renderInterval = setInterval(() => {
      this.animFrame++;
      this.render();
    }, 500);
    this.render();
  }

  stop(): void {
    if (this.renderInterval) {
      clearInterval(this.renderInterval);
    }
    this.orchestrator.stop();
    this.screen.destroy();
  }

  private render(): void {
    this.renderOffice();
    this.renderAgentPanel();
    this.renderTaskBoard();
    this.renderMetricsBar();
    this.screen.render();
  }

  private renderOffice(): void {
    if (!this.officeBox) return;

    // Update interaction animations
    this.updateInteractions();

    const lines = getOfficeLines();
    const agents = this.orchestrator.getAgentList();
    const grid: string[][] = lines.map((line) => [...line]);

    // Build a position map for agents (considering interactions)
    const agentPositions = new Map<string, { x: number; y: number; state: 'idle' | 'talking' | 'walking' }>();
    for (const a of agents) {
      const interaction = this.interactions.find(
        (i) => i.fromId === a.id || i.toId === a.id
      );
      if (interaction) {
        const isFrom = interaction.fromId === a.id;
        const origPos = this.agentOriginalPositions.get(a.id) || a.state.position;
        const target = interaction.meetingPoint;

        if (interaction.phase === 'approach') {
          const elapsed = Date.now() - interaction.startedAt;
          const approachDuration = interaction.duration * 0.3;
          const progress = Math.min(1, elapsed / approachDuration);
          const pos = interpolatePosition(origPos, target, progress);
          agentPositions.set(a.id, { ...pos, state: 'walking' });
        } else if (interaction.phase === 'talk') {
          // Slight bobbing during conversation
          const offset = isFrom ? -1 : 1;
          agentPositions.set(a.id, {
            x: Math.max(2, Math.min(49, target.x + offset)),
            y: target.y,
            state: 'talking',
          });
        } else {
          // returning
          const elapsed = Date.now() - interaction.startedAt;
          const returnStart = interaction.duration * 0.7;
          const returnDuration = interaction.duration * 0.3;
          const progress = Math.min(1, (elapsed - returnStart) / returnDuration);
          const pos = interpolatePosition(target, origPos, progress);
          agentPositions.set(a.id, { ...pos, state: 'walking' });
        }
      } else {
        agentPositions.set(a.id, { ...a.state.position, state: 'idle' });
      }
    }

    // Overlay agents on the office map
    let content = '';
    for (let y = 0; y < grid.length; y++) {
      let line = '';
      for (let x = 0; x < grid[y].length; x++) {
        const agentHere = agents.find((a) => {
          const pos = agentPositions.get(a.id);
          return pos && pos.x === x && pos.y === y;
        });

        if (agentHere) {
          const color = agentHere.state.persona.color;
          const isSelected = this.selectedAgent === agentHere.id;
          const posInfo = agentPositions.get(agentHere.id)!;
          const charFrame = getCharacterFrame(agentHere.id, posInfo.state, this.animFrame);
          if (isSelected) {
            line += `{inverse}{${color}-fg}${charFrame}{/${color}-fg}{/inverse}`;
          } else {
            line += `{${color}-fg}${charFrame}{/${color}-fg}`;
          }
          // Skip next char since character takes 2 columns
          x++;
          if (x < grid[y].length) continue;
        } else {
          const ch = grid[y][x];
          if (ch === '▓') {
            line += `{gray-fg}▓{/gray-fg}`;
          } else if (ch === '░') {
            line += `{blue-fg}░{/blue-fg}`;
          } else if ('═║╔╗╚╝┌┐└┘│─'.includes(ch)) {
            line += `{cyan-fg}${ch}{/cyan-fg}`;
          } else if (ch === '·') {
            line += `{#444444-fg}·{/#444444-fg}`;
          } else {
            line += ch;
          }
        }
      }
      content += line + '\n';
    }

    // Add animation indicators below map
    content += '\n';
    const activeAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'break');
    if (activeAgents.length > 0) {
      const indicators = activeAgents.map((a) => {
        const anim = STATUS_ANIMATIONS[a.status] || ['[?]'];
        const frame = anim[this.animFrame % anim.length];
        const charFrame = getCharacterFrame(a.id, 'idle', this.animFrame);
        return `{${a.state.persona.color}-fg}${charFrame}${frame}{/${a.state.persona.color}-fg}`;
      });
      content += ' ' + indicators.join(' ');
    }

    // Show active interactions
    if (this.interactions.length > 0) {
      content += '\n';
      for (const inter of this.interactions) {
        const from = this.orchestrator.getAgent(inter.fromId);
        const to = this.orchestrator.getAgent(inter.toId);
        if (from && to) {
          const fc = from.state.persona.color;
          const tc = to.state.persona.color;
          const phaseIcon = inter.phase === 'approach' ? '>>' : inter.phase === 'talk' ? '<>' : '<<';
          content += ` {${fc}-fg}${from.name}{/${fc}-fg} ${phaseIcon} {${tc}-fg}${to.name}{/${tc}-fg}`;
        }
      }
    }

    this.officeBox.setContent(content);
  }

  /**
   * Start an interaction animation between two agents.
   */
  private startInteraction(from: Agent, to: Agent): void {
    // Don't duplicate existing interactions
    const existing = this.interactions.find(
      (i) =>
        (i.fromId === from.id && i.toId === to.id) ||
        (i.fromId === to.id && i.toId === from.id)
    );
    if (existing) return;

    // Save original positions
    this.agentOriginalPositions.set(from.id, { ...from.state.position });
    this.agentOriginalPositions.set(to.id, { ...to.state.position });

    const meetingPoint = calculateMeetingPoint(from.state.position, to.state.position);

    this.interactions.push({
      fromId: from.id,
      toId: to.id,
      startedAt: Date.now(),
      duration: 4000, // 4 seconds total interaction
      meetingPoint,
      phase: 'approach',
    });
  }

  /**
   * Update interaction states (phase transitions and cleanup).
   */
  private updateInteractions(): void {
    const now = Date.now();
    const toRemove: number[] = [];

    for (let i = 0; i < this.interactions.length; i++) {
      const inter = this.interactions[i];
      const elapsed = now - inter.startedAt;

      if (elapsed >= inter.duration) {
        // Interaction complete - restore positions
        const fromAgent = this.orchestrator.getAgent(inter.fromId);
        const toAgent = this.orchestrator.getAgent(inter.toId);
        const fromOrig = this.agentOriginalPositions.get(inter.fromId);
        const toOrig = this.agentOriginalPositions.get(inter.toId);

        if (fromAgent && fromOrig) fromAgent.moveTo(fromOrig.x, fromOrig.y);
        if (toAgent && toOrig) toAgent.moveTo(toOrig.x, toOrig.y);

        this.agentOriginalPositions.delete(inter.fromId);
        this.agentOriginalPositions.delete(inter.toId);
        toRemove.push(i);
      } else if (elapsed < inter.duration * 0.3) {
        inter.phase = 'approach';
      } else if (elapsed < inter.duration * 0.7) {
        inter.phase = 'talk';
      } else {
        inter.phase = 'return';
      }
    }

    // Remove completed interactions (reverse order)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.interactions.splice(toRemove[i], 1);
    }
  }

  private renderAgentPanel(): void {
    if (!this.agentPanel) return;

    if (this.selectedAgent) {
      const agent = this.orchestrator.getAgent(this.selectedAgent);
      if (agent) {
        this.renderAgentDetail(agent);
        return;
      }
    }

    // Show all agents overview
    const agents = this.orchestrator.getAgentList();
    let content = '';

    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const color = a.state.persona.color;
      const statusIcon = a.getStatusIcon();
      const charFrame = getCharacterFrame(a.id, 'idle', this.animFrame);
      const taskIndicator = a.state.currentTask ? '{green-fg}*{/green-fg}' : '{gray-fg}.{/gray-fg}';
      content += `{${color}-fg}{bold}${i + 1}.${charFrame} ${a.name.padEnd(8)}{/bold}{/${color}-fg} ${statusIcon} ${a.getStatusText().padEnd(14)} ${taskIndicator}\n`;
    }

    content += `\n{gray-fg}Press 1-9 to select agent, 0 to deselect{/gray-fg}`;
    this.agentPanel.setContent(content);
  }

  private renderAgentDetail(agent: Agent): void {
    if (!this.agentPanel) return;

    const color = agent.state.persona.color;
    const s = agent.state.stats;
    const statusAnim = STATUS_ANIMATIONS[agent.status] || ['[?]'];
    const frame = statusAnim[this.animFrame % statusAnim.length];

    let content = '';
    const charFrame = getCharacterFrame(agent.id, 'idle', this.animFrame);
    content += `{${color}-fg}{bold}${charFrame} ${agent.name} -- ${agent.state.persona.title}{/bold}{/${color}-fg}\n`;
    content += `{gray-fg}${agent.state.persona.personality.slice(0, 60)}...{/gray-fg}\n\n`;
    content += `{bold}Status:{/bold}  ${agent.getStatusIcon()} ${agent.getStatusText()} ${frame}\n`;
    content += `{bold}Mood:{/bold}    ${agent.state.mood}\n`;
    content += `{bold}Task:{/bold}    ${agent.state.currentTask || 'None'}\n`;
    content += `{bold}Autonomy:{/bold} {green-fg}${agent.state.persona.autonomyConfig.level.toUpperCase()}{/green-fg}\n\n`;

    // Active skills
    const activeSkills = agent.getActiveSkillNames();
    if (activeSkills.length > 0) {
      content += `{bold}[^] Active Skills:{/bold}\n`;
      for (const name of activeSkills) {
        content += `  {cyan-fg}▸ ${name}{/cyan-fg}\n`;
      }
      content += '\n';
    }

    content += `{bold}-- Stats --{/bold}\n`;
    content += `Tasks: {green-fg}${s.tasksCompleted}{/green-fg}  Lines: {cyan-fg}${s.linesWritten}{/cyan-fg}  Reviews: {yellow-fg}${s.reviewsDone}{/yellow-fg}\n`;
    content += `Skills: {magenta-fg}${s.skillsExecuted}{/magenta-fg}  Decisions: {blue-fg}${s.autonomousDecisions}{/blue-fg}  Delegations: {white-fg}${s.delegationsMade}{/white-fg}\n`;
    content += `\n{bold}[*] Skills ({/bold}${agent.state.persona.skillIds.length}{bold}):{/bold} `;
    content += agent.state.persona.skillIds.slice(0, 4).map((id) => {
      const skill = getSkillById(id);
      return skill ? `{gray-fg}${skill.name}{/gray-fg}` : '';
    }).filter(Boolean).join(', ');
    if (agent.state.persona.skillIds.length > 4) {
      content += ` {gray-fg}+${agent.state.persona.skillIds.length - 4} more{/gray-fg}`;
    }
    content += `\n\n{gray-fg}Press 0 to go back{/gray-fg}`;

    this.agentPanel.setContent(content);
  }

  private renderTaskBoard(): void {
    if (!this.taskBoard) return;

    const tasks = this.orchestrator.tasks;
    const sprint = this.orchestrator.currentSprint;

    let content = '';

    if (sprint) {
      content += `{bold}Sprint:{/bold} ${sprint.goal}\n`;
      content += `{gray-fg}${'─'.repeat(36)}{/gray-fg}\n`;
    }

    const statusGroups: Record<string, Task[]> = {
      'in-progress': [],
      'review': [],
      'todo': [],
      'done': [],
    };

    for (const task of tasks.slice(-15)) {
      const group = statusGroups[task.status];
      if (group) group.push(task);
    }

    const statusColors: Record<string, string> = {
      'in-progress': 'yellow',
      'review': 'cyan',
      'todo': 'white',
      'done': 'green',
    };

    const statusIcons: Record<string, string> = {
      'in-progress': '>',
      'review': 'o',
      'todo': '-',
      'done': 'V',
    };

    for (const [status, group] of Object.entries(statusGroups)) {
      if (group.length === 0) continue;
      const color = statusColors[status] || 'white';
      const icon = statusIcons[status] || '?';
      content += `{${color}-fg}{bold}${icon} ${status.toUpperCase()} (${group.length}){/bold}{/${color}-fg}\n`;
      for (const task of group.slice(0, 3)) {
        const assigneeAgent = task.assignee ? this.orchestrator.getAgent(task.assignee) : null;
        const assignee = assigneeAgent
          ? getCharacterFrame(assigneeAgent.id, 'idle', 0)
          : '..';
        content += `  ${assignee} ${task.title.slice(0, 30)}\n`;
      }
    }

    if (tasks.length === 0) {
      content += '{gray-fg}No tasks yet. Submit a goal to get started!{/gray-fg}';
    }

    this.taskBoard.setContent(content);
  }

  private renderMetricsBar(): void {
    if (!this.statusBar) return;

    const m = this.orchestrator.metrics;
    const agentCount = this.orchestrator.getAgentList().length;
    const activeCount = this.orchestrator.getAgentList().filter(
      (a) => a.status !== 'idle' && a.status !== 'break'
    ).length;

    this.statusBar.setContent(
      ` {bold}q{/bold}:Quit {bold}Tab{/bold}:Input {bold}1-9{/bold}:Agent` +
      `  | [oo] ${activeCount}/${agentCount}` +
      `  | [V] ${m.totalTasksCompleted} tasks` +
      `  | [^] ${m.skillsExecuted} skills` +
      `  | [*] ${m.autonomousDecisions} decisions` +
      `  | [_/] ${m.totalLinesOfCode} LOC` +
      `  | [=>] ${m.deployments} deploys`
    );
  }
}
