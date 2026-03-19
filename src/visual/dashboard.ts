import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { Orchestrator } from '../engine/orchestrator';
import { Agent } from '../agents/agent';
import { getOfficeLines, STATUS_ANIMATIONS, OFFICE_WIDTH, OFFICE_HEIGHT } from './office-map';
import { getSpriteForStatus, renderSprite } from './character-sprites';
import { CompanyConfig, AgentStatus, Task } from '../types';
import { getSkillById } from '../skills/registry';

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
      content: '{center}{bold}🏢 SAGE TEAM{/bold} — Autonomous AI Company [FULL AUTONOMY]{/center}',
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
      height: 16,
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
      top: 19,
      left: '60%',
      width: '40%',
      height: 12,
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
        this.chatBox.log(`{${color}-fg}{bold}${agent?.emoji || '?'} ${agent?.name || msg.from}{/bold}{/${color}-fg} → ${toAgent}: ${msg.content}`);
      }

      if (event.type === 'system' && this.chatBox) {
        this.chatBox.log(`{yellow-fg}{bold}⚙ SYSTEM:{/bold} ${(event.data as any).message}{/yellow-fg}`);
      }

      if (event.type === 'skill-activated' && this.chatBox) {
        const agent = this.orchestrator.getAgent(event.agentId || '');
        const color = agent?.state.persona.color || 'white';
        this.chatBox.log(`{${color}-fg}{bold}⚡ ${agent?.emoji || ''} ${agent?.name || ''}{/bold} activated skill: {cyan-fg}${(event.data as any).skillName}{/cyan-fg}{/${color}-fg}`);
      }

      if (event.type === 'autonomous-decision' && this.chatBox) {
        const agent = this.orchestrator.getAgent(event.agentId || '');
        const decision = (event.data as any).decision;
        if (decision && Math.random() > 0.5) { // Show 50% of decisions to avoid spam
          const color = agent?.state.persona.color || 'white';
          this.chatBox.log(`{${color}-fg}{bold}🧠 ${agent?.emoji || ''} ${agent?.name || ''}{/bold} decided: ${decision.action}{/${color}-fg}`);
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

    // Build a grid of tagged strings for each cell
    // We need a 2D array to overlay multi-line sprites
    const gridRows = lines.length;
    const gridCols = lines.reduce((max, l) => Math.max(max, l.length), 0);

    // Create base grid with colored map characters
    const taggedGrid: string[][] = [];
    for (let y = 0; y < gridRows; y++) {
      taggedGrid[y] = [];
      for (let x = 0; x < gridCols; x++) {
        const ch = lines[y]?.[x] || ' ';
        if (ch === '▓') {
          taggedGrid[y][x] = `{#555555-fg}▓{/#555555-fg}`;
        } else if (ch === '░') {
          taggedGrid[y][x] = `{#224466-fg}░{/#224466-fg}`;
        } else if ('═║╔╗╚╝┌┐└┘│─'.includes(ch)) {
          taggedGrid[y][x] = `{cyan-fg}${ch}{/cyan-fg}`;
        } else if (ch === '·') {
          taggedGrid[y][x] = `{#333333-fg}·{/#333333-fg}`;
        } else {
          taggedGrid[y][x] = ch;
        }
      }
    }

    // Overlay multi-line character sprites on the grid
    for (const agent of agents) {
      const pos = agent.state.position;
      const sprite = getSpriteForStatus(agent.status);
      const isSelected = this.selectedAgent === agent.id;
      const color = agent.state.persona.color;

      // Render sprite rows as tagged strings
      const spriteRows = renderSprite(sprite, color, isSelected);

      // Place sprite centered on agent position
      // Sprite anchor is at bottom-center, so the character "stands" at the position
      const startY = pos.y - sprite.height + 1;
      const startX = pos.x - Math.floor(sprite.width / 2);

      for (let sy = 0; sy < sprite.rows.length; sy++) {
        const gy = startY + sy;
        if (gy < 0 || gy >= gridRows) continue;

        // Place each pixel of the sprite
        for (let sx = 0; sx < sprite.rows[sy].length; sx++) {
          const gx = startX + sx;
          if (gx < 0 || gx >= gridCols) continue;

          const pixel = sprite.rows[sy][sx];
          if (pixel.type === 'empty') continue; // transparent

          const pixelColor = pixel.type === 'head' ? '#dddddd' :
            pixel.type === 'body' ? color :
            pixel.type === 'legs' ? '#555555' :
            pixel.type === 'desk' ? '#666666' :
            pixel.type === 'accessory' ? '#888888' : color;

          if (isSelected) {
            taggedGrid[gy][gx] = `{inverse}{${pixelColor}-fg}${pixel.char}{/${pixelColor}-fg}{/inverse}`;
          } else {
            taggedGrid[gy][gx] = `{${pixelColor}-fg}${pixel.char}{/${pixelColor}-fg}`;
          }
        }
      }

      // Draw agent name label above the sprite
      const nameTag = agent.name;
      const labelY = startY - 1;
      const labelX = pos.x - Math.floor(nameTag.length / 2);
      if (labelY >= 0 && labelY < gridRows) {
        for (let i = 0; i < nameTag.length; i++) {
          const lx = labelX + i;
          if (lx >= 0 && lx < gridCols) {
            taggedGrid[labelY][lx] = `{${color}-fg}{bold}${nameTag[i]}{/bold}{/${color}-fg}`;
          }
        }
      }
    }

    // Build final content from tagged grid
    let content = '';
    for (let y = 0; y < gridRows; y++) {
      content += taggedGrid[y].join('') + '\n';
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
    content += `{bold}Task:{/bold}    ${agent.state.currentTask || 'None'}\n`;
    content += `{bold}Autonomy:{/bold} {green-fg}${agent.state.persona.autonomyConfig.level.toUpperCase()}{/green-fg}\n\n`;

    // Active skills
    const activeSkills = agent.getActiveSkillNames();
    if (activeSkills.length > 0) {
      content += `{bold}⚡ Active Skills:{/bold}\n`;
      for (const name of activeSkills) {
        content += `  {cyan-fg}▸ ${name}{/cyan-fg}\n`;
      }
      content += '\n';
    }

    content += `{bold}── Stats ──{/bold}\n`;
    content += `Tasks: {green-fg}${s.tasksCompleted}{/green-fg}  Lines: {cyan-fg}${s.linesWritten}{/cyan-fg}  Reviews: {yellow-fg}${s.reviewsDone}{/yellow-fg}\n`;
    content += `Skills: {magenta-fg}${s.skillsExecuted}{/magenta-fg}  Decisions: {blue-fg}${s.autonomousDecisions}{/blue-fg}  Delegations: {white-fg}${s.delegationsMade}{/white-fg}\n`;
    content += `\n{bold}🧠 Skills ({/bold}${agent.state.persona.skillIds.length}{bold}):{/bold} `;
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
      `  │  👥 ${activeCount}/${agentCount}` +
      `  │  ✅ ${m.totalTasksCompleted} tasks` +
      `  │  ⚡ ${m.skillsExecuted} skills` +
      `  │  🧠 ${m.autonomousDecisions} decisions` +
      `  │  📝 ${m.totalLinesOfCode} LOC` +
      `  │  🚀 ${m.deployments} deploys`
    );
  }
}
