import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { Orchestrator } from '../engine/orchestrator';
import { Agent } from '../agents/agent';
import { getOfficeLines, STATUS_ANIMATIONS, OFFICE_WIDTH, OFFICE_HEIGHT } from './office-map';
import { CompanyConfig, AgentStatus, Task } from '../types';

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

  constructor(orchestrator: Orchestrator, private config: CompanyConfig) {
    this.orchestrator = orchestrator;

    this.screen = blessed.screen({
      smartCSR: true,
      title: `🏢 Sage Team — ${config.name}`,
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
      content: '{center}{bold}🏢 SAGE TEAM{/bold} — AI Company Simulation{/center}',
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
      label: ' 🗺️  Office Floor Plan ',
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
      label: ' 👥 Team Status ',
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
      label: ' 📊 Sprint Board ',
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
      label: ' 💬 Team Chat ',
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
      label: ' 🎯 Enter Goal (press Enter to submit, Tab to focus) ',
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
      content: ' {bold}q{/bold}:Quit  {bold}Tab{/bold}:Input  {bold}↑↓{/bold}:Scroll  {bold}1-9{/bold}:Select Agent  {bold}g{/bold}:Submit Goal  {bold}p{/bold}:Pause',
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
        this.chatBox.log(`{${color}-fg}{bold}${agent?.emoji || '?'} ${agent?.name || msg.from}{/bold}{/${color}-fg} → ${toAgent}: ${msg.content}`);
      }

      if (event.type === 'system' && this.chatBox) {
        this.chatBox.log(`{yellow-fg}{bold}⚙ SYSTEM:{/bold} ${(event.data as any).message}{/yellow-fg}`);
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
      this.chatBox.log(`{white-fg}{bold}🎯 YOU:{/bold} ${goal}{/white-fg}`);
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

    const lines = getOfficeLines();
    const agents = this.orchestrator.getAgentList();
    const grid: string[][] = lines.map((line) => [...line]);

    // Overlay agents on the office map
    let content = '';
    for (let y = 0; y < grid.length; y++) {
      let line = '';
      for (let x = 0; x < grid[y].length; x++) {
        const agentHere = agents.find(
          (a) => a.state.position.x === x && a.state.position.y === y
        );

        if (agentHere) {
          const color = agentHere.state.persona.color;
          const isSelected = this.selectedAgent === agentHere.id;
          const char = agentHere.emoji;
          if (isSelected) {
            line += `{inverse}{${color}-fg}${char}{/${color}-fg}{/inverse}`;
          } else {
            line += `{${color}-fg}${char}{/${color}-fg}`;
          }
          // Skip next char since emoji takes 2 columns
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
        return `{${a.state.persona.color}-fg}${a.emoji}${frame}{/${a.state.persona.color}-fg}`;
      });
      content += ' ' + indicators.join(' ');
    }

    this.officeBox.setContent(content);
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
      const taskIndicator = a.state.currentTask ? '{green-fg}●{/green-fg}' : '{gray-fg}○{/gray-fg}';
      content += `{${color}-fg}{bold}${i + 1}.${a.emoji} ${a.name.padEnd(8)}{/bold}{/${color}-fg} ${statusIcon} ${a.getStatusText().padEnd(14)} ${taskIndicator}\n`;
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
    content += `{${color}-fg}{bold}${agent.emoji} ${agent.name} — ${agent.state.persona.title}{/bold}{/${color}-fg}\n`;
    content += `{gray-fg}${agent.state.persona.personality.slice(0, 60)}...{/gray-fg}\n\n`;
    content += `{bold}Status:{/bold}  ${agent.getStatusIcon()} ${agent.getStatusText()} ${frame}\n`;
    content += `{bold}Mood:{/bold}    ${agent.state.mood}\n`;
    content += `{bold}Task:{/bold}    ${agent.state.currentTask || 'None'}\n\n`;
    content += `{bold}── Stats ──{/bold}\n`;
    content += `Tasks: {green-fg}${s.tasksCompleted}{/green-fg}  Lines: {cyan-fg}${s.linesWritten}{/cyan-fg}  Reviews: {yellow-fg}${s.reviewsDone}{/yellow-fg}\n`;
    content += `Bugs Fixed: {red-fg}${s.bugsFixed}{/red-fg}  Meetings: {magenta-fg}${s.meetingsAttended}{/magenta-fg}\n`;
    content += `\n{gray-fg}Press 0 to go back{/gray-fg}`;

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
      'in-progress': '▶',
      'review': '👀',
      'todo': '○',
      'done': '✓',
    };

    for (const [status, group] of Object.entries(statusGroups)) {
      if (group.length === 0) continue;
      const color = statusColors[status] || 'white';
      const icon = statusIcons[status] || '?';
      content += `{${color}-fg}{bold}${icon} ${status.toUpperCase()} (${group.length}){/bold}{/${color}-fg}\n`;
      for (const task of group.slice(0, 3)) {
        const assignee = task.assignee
          ? this.orchestrator.getAgent(task.assignee)?.emoji || '?'
          : '·';
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
      `  │  👥 ${activeCount}/${agentCount} active` +
      `  │  ✅ ${m.totalTasksCompleted} tasks` +
      `  │  📝 ${m.totalLinesOfCode} lines` +
      `  │  😊 ${m.teamMorale}% morale` +
      `  │  🚀 ${m.deployments} deploys`
    );
  }
}
