/**
 * Isometric Office Renderer — HTML5 Canvas
 * Draws an isometric 2D office with pixel-art style agent characters.
 */

class OfficeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.agents = [];
    this.agentStates = new Map();
    this.frame = 0;
    this.hoveredAgent = null;
    this.selectedAgent = null;

    // Isometric settings
    this.tileW = 64;
    this.tileH = 32;
    this.gridCols = 10;
    this.gridRows = 9;
    this.offsetX = 0;
    this.offsetY = 80;

    // Animation
    this.animFrame = 0;
    this.lastTime = 0;
    this.fps = 12;

    // Furniture sprites (defined as pixel patterns)
    this._initColors();

    // Mouse tracking
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundClick = this._onClick.bind(this);
    canvas.addEventListener('mousemove', this._boundMouseMove);
    canvas.addEventListener('click', this._boundClick);
  }

  _initColors() {
    this.colors = {
      floorLight: '#1a2233',
      floorDark: '#151d2b',
      floorLine: '#253348',
      wallBase: '#2d333b',
      wallTop: '#3d444d',
      wallEdge: '#444c56',
      deskTop: '#4a3728',
      deskFront: '#3a2a1e',
      deskSide: '#2e2118',
      monitor: '#1c2128',
      monitorScreen: '#0d1117',
      monitorScreenOn: '#1a3a2a',
      chairSeat: '#2d333b',
      chairBack: '#3d444d',
      plant: '#2ea043',
      plantPot: '#6e4b3a',
      meetingTable: '#3a2a1e',
      whiteboard: '#e6edf3',
      whiteboardFrame: '#8b949e',
      carpet: '#1a2838',
      shadow: 'rgba(0,0,0,0.3)',
    };
  }

  resize() {
    const container = this.canvas.parentElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayW = w;
    this.displayH = h;
    this.offsetX = w / 2;
    this.offsetY = 80;
  }

  setAgents(agents) {
    this.agents = agents;
    agents.forEach(a => {
      if (!this.agentStates.has(a.id)) {
        this.agentStates.set(a.id, {
          status: 'idle',
          walkOffset: 0,
          bobPhase: Math.random() * Math.PI * 2,
          armPhase: Math.random() * Math.PI * 2,
        });
      }
    });
  }

  updateAgentStatus(agentId, status) {
    const st = this.agentStates.get(agentId);
    if (st) st.status = status;
  }

  // ── Coordinate conversion ──

  isoToScreen(col, row) {
    const x = (col - row) * (this.tileW / 2) + this.offsetX;
    const y = (col + row) * (this.tileH / 2) + this.offsetY;
    return { x, y };
  }

  screenToGrid(sx, sy) {
    const rx = sx - this.offsetX;
    const ry = sy - this.offsetY;
    const col = (rx / (this.tileW / 2) + ry / (this.tileH / 2)) / 2;
    const row = (ry / (this.tileH / 2) - rx / (this.tileW / 2)) / 2;
    return { col: Math.round(col), row: Math.round(row) };
  }

  // ── Main render ──

  render(timestamp) {
    if (timestamp - this.lastTime > 1000 / this.fps) {
      this.animFrame++;
      this.lastTime = timestamp;
    }
    this.frame++;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.displayW, this.displayH);

    this._drawFloor(ctx);
    this._drawWalls(ctx);
    this._drawRug(ctx);

    // Collect all drawable items for depth sorting
    const drawables = [];

    // Furniture
    this._getFurnitureDrawables(drawables);

    // Agents
    this.agents.forEach(agent => {
      const st = this.agentStates.get(agent.id) || { status: 'idle', bobPhase: 0, armPhase: 0 };
      drawables.push({
        col: agent.desk.col,
        row: agent.desk.row,
        type: 'agent',
        agent,
        state: st,
      });
    });

    // Sort by row then col for isometric depth
    drawables.sort((a, b) => (a.row + a.col) - (b.row + b.col));

    drawables.forEach(d => {
      if (d.type === 'agent') {
        this._drawAgent(ctx, d.agent, d.state);
      } else if (d.type === 'desk') {
        this._drawDesk(ctx, d.col, d.row, d.hasMonitor);
      } else if (d.type === 'plant') {
        this._drawPlant(ctx, d.col, d.row);
      } else if (d.type === 'meetingTable') {
        this._drawMeetingTable(ctx, d.col, d.row);
      } else if (d.type === 'whiteboard') {
        this._drawWhiteboard(ctx, d.col, d.row);
      } else if (d.type === 'chair') {
        this._drawChair(ctx, d.col, d.row);
      } else if (d.type === 'coffeeMachine') {
        this._drawCoffeeMachine(ctx, d.col, d.row);
      }
    });

    // Agent name labels on top
    this.agents.forEach(agent => {
      this._drawAgentLabel(ctx, agent);
    });
  }

  // ── Floor ──

  _drawFloor(ctx) {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const { x, y } = this.isoToScreen(col, row);
        const isLight = (col + row) % 2 === 0;
        ctx.fillStyle = isLight ? this.colors.floorLight : this.colors.floorDark;
        this._drawTile(ctx, x, y);
        ctx.strokeStyle = this.colors.floorLine;
        ctx.lineWidth = 0.5;
        this._strokeTile(ctx, x, y);
      }
    }
  }

  _drawTile(ctx, x, y) {
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;
    ctx.beginPath();
    ctx.moveTo(x, y - hh);
    ctx.lineTo(x + hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x - hw, y);
    ctx.closePath();
    ctx.fill();
  }

  _strokeTile(ctx, x, y) {
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;
    ctx.beginPath();
    ctx.moveTo(x, y - hh);
    ctx.lineTo(x + hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x - hw, y);
    ctx.closePath();
    ctx.stroke();
  }

  // ── Walls ──

  _drawWalls(ctx) {
    const wallH = 40;

    // Back wall (top-right edge)
    for (let col = 0; col < this.gridCols; col++) {
      const { x, y } = this.isoToScreen(col, 0);
      const hw = this.tileW / 2;
      const hh = this.tileH / 2;

      ctx.fillStyle = this.colors.wallBase;
      ctx.beginPath();
      ctx.moveTo(x, y - hh);
      ctx.lineTo(x + hw, y);
      ctx.lineTo(x + hw, y - wallH);
      ctx.lineTo(x, y - hh - wallH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = this.colors.wallTop;
      ctx.beginPath();
      ctx.moveTo(x - hw, y);
      ctx.lineTo(x, y - hh);
      ctx.lineTo(x, y - hh - wallH);
      ctx.lineTo(x - hw, y - wallH);
      ctx.closePath();
      ctx.fill();

      // Wall border
      ctx.strokeStyle = this.colors.wallEdge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - hh - wallH);
      ctx.lineTo(x + hw, y - wallH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - hh - wallH);
      ctx.lineTo(x - hw, y - wallH);
      ctx.stroke();
    }

    // Left wall (top-left edge)
    for (let row = 0; row < this.gridRows; row++) {
      const { x, y } = this.isoToScreen(0, row);
      const hw = this.tileW / 2;
      const hh = this.tileH / 2;

      ctx.fillStyle = this.colors.wallTop;
      ctx.beginPath();
      ctx.moveTo(x - hw, y);
      ctx.lineTo(x, y - hh);
      ctx.lineTo(x, y - hh - wallH);
      ctx.lineTo(x - hw, y - wallH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = this.colors.wallEdge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - hw, y - wallH);
      ctx.lineTo(x, y - hh - wallH);
      ctx.stroke();
    }
  }

  // ── Rug (meeting area) ──

  _drawRug(ctx) {
    // Draw a colored rug area at center
    ctx.fillStyle = this.colors.carpet;
    const corners = [
      this.isoToScreen(4, 3),
      this.isoToScreen(7, 3),
      this.isoToScreen(7, 6),
      this.isoToScreen(4, 6),
    ];
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.forEach(c => ctx.lineTo(c.x, c.y));
    ctx.closePath();
    ctx.fill();
  }

  // ── Furniture ──

  _getFurnitureDrawables(list) {
    // Desks for agents at their positions
    this.agents.forEach(a => {
      list.push({ col: a.desk.col, row: a.desk.row, type: 'desk', hasMonitor: true });
    });

    // Meeting table (center area)
    list.push({ col: 5, row: 4, type: 'meetingTable' });
    list.push({ col: 5, row: 5, type: 'meetingTable' });

    // Whiteboard
    list.push({ col: 5, row: 3, type: 'whiteboard' });

    // Plants (decoration)
    list.push({ col: 0, row: 0, type: 'plant' });
    list.push({ col: 9, row: 0, type: 'plant' });
    list.push({ col: 0, row: 8, type: 'plant' });
    list.push({ col: 9, row: 8, type: 'plant' });
    list.push({ col: 3, row: 3, type: 'plant' });

    // Coffee machine
    list.push({ col: 9, row: 4, type: 'coffeeMachine' });

    // Extra chairs at meeting table
    list.push({ col: 4, row: 4, type: 'chair' });
    list.push({ col: 6, row: 4, type: 'chair' });
    list.push({ col: 4, row: 5, type: 'chair' });
    list.push({ col: 6, row: 5, type: 'chair' });
  }

  _drawDesk(ctx, col, row) {
    const { x, y } = this.isoToScreen(col, row);
    const dw = 26;
    const dh = 6;
    const dDepth = 14;
    const dy = -4;

    // Desk top
    ctx.fillStyle = this.colors.deskTop;
    ctx.beginPath();
    ctx.moveTo(x, y - dDepth / 2 + dy);
    ctx.lineTo(x + dw, y + dy);
    ctx.lineTo(x, y + dDepth / 2 + dy);
    ctx.lineTo(x - dw, y + dy);
    ctx.closePath();
    ctx.fill();

    // Desk front
    ctx.fillStyle = this.colors.deskFront;
    ctx.beginPath();
    ctx.moveTo(x - dw, y + dy);
    ctx.lineTo(x, y + dDepth / 2 + dy);
    ctx.lineTo(x, y + dDepth / 2 + dh + dy);
    ctx.lineTo(x - dw, y + dh + dy);
    ctx.closePath();
    ctx.fill();

    // Desk side
    ctx.fillStyle = this.colors.deskSide;
    ctx.beginPath();
    ctx.moveTo(x, y + dDepth / 2 + dy);
    ctx.lineTo(x + dw, y + dy);
    ctx.lineTo(x + dw, y + dh + dy);
    ctx.lineTo(x, y + dDepth / 2 + dh + dy);
    ctx.closePath();
    ctx.fill();

    // Monitor
    this._drawMonitor(ctx, x - 4, y + dy - 10);
  }

  _drawMonitor(ctx, x, y) {
    const mw = 12;
    const mh = 10;

    // Monitor stand
    ctx.fillStyle = '#484f58';
    ctx.fillRect(x - 1, y + mh, 3, 4);

    // Monitor body
    ctx.fillStyle = this.colors.monitor;
    ctx.fillRect(x - mw / 2, y, mw, mh);

    // Screen
    const screenOn = this.animFrame % 4 !== 0;
    ctx.fillStyle = screenOn ? this.colors.monitorScreenOn : this.colors.monitorScreen;
    ctx.fillRect(x - mw / 2 + 1, y + 1, mw - 2, mh - 2);

    // Screen glow flicker
    if (screenOn && this.animFrame % 3 === 0) {
      ctx.fillStyle = '#2ea04333';
      ctx.fillRect(x - mw / 2 + 2, y + 2, mw - 4, 2);
    }
  }

  _drawPlant(ctx, col, row) {
    const { x, y } = this.isoToScreen(col, row);

    // Pot
    ctx.fillStyle = this.colors.plantPot;
    ctx.fillRect(x - 4, y - 4, 8, 6);

    // Plant leaves
    const sway = Math.sin(this.animFrame * 0.15 + col * 2) * 1.5;
    ctx.fillStyle = this.colors.plant;
    ctx.beginPath();
    ctx.arc(x + sway, y - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#238636';
    ctx.beginPath();
    ctx.arc(x - 3 + sway * 0.5, y - 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3 + sway * 0.7, y - 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#196c2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + sway * 0.3, y - 10);
    ctx.stroke();
  }

  _drawMeetingTable(ctx, col, row) {
    const { x, y } = this.isoToScreen(col, row);
    const tw = 28;
    const td = 16;
    const th = 5;

    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.moveTo(x, y - td / 2);
    ctx.lineTo(x + tw, y);
    ctx.lineTo(x, y + td / 2);
    ctx.lineTo(x - tw, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath();
    ctx.moveTo(x - tw, y);
    ctx.lineTo(x, y + td / 2);
    ctx.lineTo(x, y + td / 2 + th);
    ctx.lineTo(x - tw, y + th);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2e2118';
    ctx.beginPath();
    ctx.moveTo(x, y + td / 2);
    ctx.lineTo(x + tw, y);
    ctx.lineTo(x + tw, y + th);
    ctx.lineTo(x, y + td / 2 + th);
    ctx.closePath();
    ctx.fill();
  }

  _drawWhiteboard(ctx, col, row) {
    const { x, y } = this.isoToScreen(col, row);

    // Board frame
    ctx.fillStyle = this.colors.whiteboardFrame;
    ctx.fillRect(x - 16, y - 28, 32, 22);

    // White surface
    ctx.fillStyle = this.colors.whiteboard;
    ctx.fillRect(x - 14, y - 26, 28, 18);

    // Fake writing lines
    ctx.strokeStyle = '#58a6ff44';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 23 + i * 4);
      ctx.lineTo(x - 12 + Math.random() * 20 + 4, y - 23 + i * 4);
      ctx.stroke();
    }

    // Stand
    ctx.strokeStyle = '#8b949e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6);
    ctx.lineTo(x - 6, y + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x + 6, y + 2);
    ctx.stroke();
  }

  _drawChair(ctx, col, row) {
    const { x, y } = this.isoToScreen(col, row);

    // Seat
    ctx.fillStyle = this.colors.chairSeat;
    ctx.beginPath();
    ctx.arc(x, y - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Chair leg
    ctx.fillStyle = '#484f58';
    ctx.fillRect(x - 1, y + 1, 2, 3);
  }

  _drawCoffeeMachine(ctx, col, row) {
    const { x, y } = this.isoToScreen(col, row);

    // Machine body
    ctx.fillStyle = '#484f58';
    ctx.fillRect(x - 6, y - 16, 12, 14);

    // Top
    ctx.fillStyle = '#6e7681';
    ctx.fillRect(x - 7, y - 18, 14, 3);

    // Cup area
    ctx.fillStyle = '#1c2128';
    ctx.fillRect(x - 4, y - 6, 8, 4);

    // Steam animation
    if (this.animFrame % 6 < 3) {
      ctx.fillStyle = 'rgba(139, 148, 158, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y - 20 - (this.animFrame % 3) * 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // LED indicator
    ctx.fillStyle = '#3fb950';
    ctx.fillRect(x + 3, y - 14, 2, 2);
  }

  // ── Agent (pixel-art style character) ──

  _drawAgent(ctx, agent, state) {
    const { x, y } = this.isoToScreen(agent.desk.col, agent.desk.row);
    const color = agent.color;
    const status = state.status || 'idle';

    // Bob animation
    const bob = Math.sin(this.animFrame * 0.2 + state.bobPhase) * 1.5;
    const armSwing = Math.sin(this.animFrame * 0.25 + state.armPhase) * 2;

    const cx = x + 12; // Offset from desk
    const cy = y - 14 + bob;

    // Shadow
    ctx.fillStyle = this.colors.shadow;
    ctx.beginPath();
    ctx.ellipse(cx, y + 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#2d333b';
    const legSpread = status === 'idle' ? 0 : Math.sin(this.animFrame * 0.3) * 1;
    // Left leg
    ctx.fillRect(cx - 4 - legSpread, cy + 12, 3, 6);
    // Right leg
    ctx.fillRect(cx + 1 + legSpread, cy + 12, 3, 6);

    // Shoes
    ctx.fillStyle = '#1c2128';
    ctx.fillRect(cx - 5 - legSpread, cy + 17, 4, 2);
    ctx.fillRect(cx + 1 + legSpread, cy + 17, 4, 2);

    // Body / shirt
    ctx.fillStyle = color;
    ctx.fillRect(cx - 5, cy + 4, 10, 9);

    // Body shading
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(cx + 2, cy + 4, 3, 9);

    // Arms
    const isActive = status === 'coding' || status === 'debugging' || status === 'testing';
    ctx.fillStyle = color;
    if (isActive) {
      // Typing animation — arms forward
      const typing = Math.sin(this.animFrame * 0.5) * 2;
      ctx.fillRect(cx - 8, cy + 5 + typing, 3, 7);
      ctx.fillRect(cx + 5, cy + 5 - typing, 3, 7);
    } else if (status === 'thinking' || status === 'brainstorming') {
      // Hand on chin pose
      ctx.fillRect(cx - 8, cy + 3, 3, 6);
      ctx.fillRect(cx + 5, cy + 6, 3, 7);
    } else if (status === 'meeting') {
      // Arms gesturing
      ctx.save();
      ctx.translate(cx - 7, cy + 5);
      ctx.rotate(Math.sin(this.animFrame * 0.15) * 0.3);
      ctx.fillRect(0, 0, 3, 7);
      ctx.restore();
      ctx.fillRect(cx + 5, cy + 6 + armSwing, 3, 7);
    } else {
      // Idle arms at sides
      ctx.fillRect(cx - 8, cy + 5, 3, 8);
      ctx.fillRect(cx + 5, cy + 5, 3, 8);
    }

    // Hands
    ctx.fillStyle = '#f0d6b0';
    if (isActive) {
      const typing = Math.sin(this.animFrame * 0.5) * 2;
      ctx.fillRect(cx - 8, cy + 11 + typing, 3, 2);
      ctx.fillRect(cx + 5, cy + 11 - typing, 3, 2);
    } else {
      ctx.fillRect(cx - 8, cy + 12, 3, 2);
      ctx.fillRect(cx + 5, cy + 12, 3, 2);
    }

    // Head
    ctx.fillStyle = '#f0d6b0';
    ctx.fillRect(cx - 4, cy - 4, 8, 8);

    // Hair
    ctx.fillStyle = this._getHairColor(agent.id);
    ctx.fillRect(cx - 4, cy - 6, 8, 4);
    ctx.fillRect(cx - 5, cy - 5, 2, 3);

    // Eyes
    ctx.fillStyle = '#1c2128';
    const blink = this.animFrame % 40 < 2;
    if (!blink) {
      ctx.fillRect(cx - 3, cy - 1, 2, 2);
      ctx.fillRect(cx + 1, cy - 1, 2, 2);
    } else {
      ctx.fillRect(cx - 3, cy, 2, 1);
      ctx.fillRect(cx + 1, cy, 2, 1);
    }

    // Mouth (tiny pixel)
    ctx.fillStyle = '#c9726b';
    if (status === 'meeting') {
      // Talking — mouth opens and closes
      const mouthOpen = this.animFrame % 6 < 3;
      ctx.fillRect(cx - 1, cy + 2, 2, mouthOpen ? 2 : 1);
    } else {
      ctx.fillRect(cx - 1, cy + 2, 2, 1);
    }

    // Status indicator (floating dot)
    const statusColor = STATUS_COLORS[status] || '#484f58';
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(cx, cy - 10 + Math.sin(this.animFrame * 0.1) * 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Status indicator border
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Thought/action bubble for active statuses
    if (status === 'thinking' || status === 'brainstorming') {
      this._drawThoughtBubble(ctx, cx, cy - 16);
    } else if (status === 'coding') {
      this._drawCodeBubble(ctx, cx, cy - 16);
    }

    // Highlight on hover
    if (this.hoveredAgent === agent.id) {
      ctx.strokeStyle = agent.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 10, cy - 8, 20, 28);
    }
  }

  _getHairColor(agentId) {
    const hairColors = {
      sage: '#6e4b3a',
      nova: '#2d1b4e',
      aria: '#1a1a2e',
      atlas: '#4a3728',
      dex: '#8b4513',
      quinn: '#c9726b',
      flux: '#2d333b',
      gage: '#1c2128',
      morgan: '#6e4b3a',
      river: '#e3b341',
      uma: '#8b2252',
    };
    return hairColors[agentId] || '#2d333b';
  }

  _drawThoughtBubble(ctx, x, y) {
    ctx.fillStyle = 'rgba(88, 166, 255, 0.15)';
    ctx.strokeStyle = '#58a6ff44';
    ctx.lineWidth = 1;

    // Small dots leading to bubble
    ctx.beginPath();
    ctx.arc(x + 8, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 12, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Main bubble
    ctx.beginPath();
    ctx.arc(x + 18, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // "..." inside
    ctx.fillStyle = '#58a6ff';
    const dotPhase = this.animFrame % 12;
    for (let i = 0; i < 3; i++) {
      if (dotPhase > i * 3) {
        ctx.fillRect(x + 14 + i * 3, y - 9, 2, 2);
      }
    }
  }

  _drawCodeBubble(ctx, x, y) {
    ctx.fillStyle = 'rgba(63, 185, 80, 0.12)';
    ctx.strokeStyle = '#3fb95044';
    ctx.lineWidth = 1;

    // Bubble
    ctx.beginPath();
    ctx.roundRect(x + 10, y - 14, 22, 14, 3);
    ctx.fill();
    ctx.stroke();

    // Code lines
    ctx.fillStyle = '#3fb95088';
    const codeAnim = this.animFrame % 8;
    ctx.fillRect(x + 13, y - 12, 6 + (codeAnim % 3) * 2, 2);
    ctx.fillRect(x + 15, y - 8, 8 + (codeAnim % 2) * 3, 2);
    ctx.fillRect(x + 13, y - 4, 10, 2);
  }

  _drawAgentLabel(ctx, agent) {
    const { x, y } = this.isoToScreen(agent.desk.col, agent.desk.row);
    const cx = x + 12;
    const cy = y - 30;

    ctx.font = 'bold 9px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0d1117cc';
    const nameW = ctx.measureText(agent.name).width + 8;
    ctx.fillRect(cx - nameW / 2, cy - 7, nameW, 12);

    ctx.fillStyle = agent.color;
    ctx.fillText(agent.name, cx, cy + 2);
  }

  // ── Mouse interaction ──

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    this.agents.forEach(agent => {
      const { x, y } = this.isoToScreen(agent.desk.col, agent.desk.row);
      const cx = x + 12;
      const cy = y - 14;
      if (mx > cx - 12 && mx < cx + 12 && my > cy - 8 && my < cy + 20) {
        found = agent.id;
      }
    });

    this.hoveredAgent = found;
    this.canvas.style.cursor = found ? 'pointer' : 'default';
  }

  _onClick(e) {
    if (this.hoveredAgent) {
      this.selectedAgent = this.hoveredAgent;
      if (this.onAgentSelect) {
        this.onAgentSelect(this.hoveredAgent);
      }
    }
  }

  destroy() {
    this.canvas.removeEventListener('mousemove', this._boundMouseMove);
    this.canvas.removeEventListener('click', this._boundClick);
  }
}
