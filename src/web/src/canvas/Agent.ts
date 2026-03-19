import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { toScreen } from './iso';
import { getSeatPosition } from './rooms';

const AGENT_COLORS: Record<string, number> = {
  sage: 0xffd700, nova: 0x00bfff, aria: 0xff69b4, dex: 0x00ff88,
  flux: 0xff6b35, quinn: 0x9b59b6, gage: 0x34495e, morgan: 0xe74c3c,
  uma: 0x1abc9c, river: 0x3498db, atlas: 0xf39c12,
};

const AGENT_EMOJI: Record<string, string> = {
  sage: '\u{1F451}', nova: '\u{1F52E}', aria: '\u{1F3DB}', dex: '\u{26A1}',
  flux: '\u{1F30A}', quinn: '\u{1F50D}', gage: '\u{2699}', morgan: '\u{1F4CB}',
  uma: '\u{1F3A8}', river: '\u{1F300}', atlas: '\u{1F4CA}',
};

const STATUS_GLOW: Record<string, number> = {
  coding: 0x00ff88,
  reviewing: 0x00bfff,
  testing: 0x9b59b6,
  planning: 0xffd700,
  blocked: 0xff4444,
  deploying: 0xff6b35,
};

export interface AgentData {
  id: string;
  name: string;
  status: string;
  position_room: string;
  position_seat: number;
}

export class AgentSprite {
  container: Container;
  private body: Graphics;
  private glow: Graphics;
  private label: Text;
  private bobOffset = Math.random() * Math.PI * 2;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;

  constructor(data: AgentData) {
    this.container = new Container();
    this.container.sortableChildren = true;

    const color = AGENT_COLORS[data.id] || 0xcccccc;

    // Status glow (behind body)
    this.glow = new Graphics();
    this.glow.circle(0, 0, 10);
    this.glow.fill({ color: 0x00ff88, alpha: 0.3 });
    this.glow.zIndex = 0;
    this.glow.visible = false;
    this.container.addChild(this.glow);

    // Agent body — colored diamond
    this.body = new Graphics();
    this.body.poly([
      { x: 0, y: -10 },
      { x: 8, y: 0 },
      { x: 0, y: 6 },
      { x: -8, y: 0 },
    ]);
    this.body.fill({ color });
    this.body.stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
    this.body.zIndex = 1;
    this.container.addChild(this.body);

    // Name label
    this.label = new Text({
      text: `${AGENT_EMOJI[data.id] || ''} ${data.name}`,
      style: new TextStyle({
        fontSize: 9,
        fill: 0xcccccc,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      }),
    });
    this.label.anchor.set(0.5, 0);
    this.label.y = 8;
    this.label.zIndex = 2;
    this.container.addChild(this.label);

    // Initial position
    this.setPositionFromRoom(data.position_room, data.position_seat);
    this.currentX = this.targetX;
    this.currentY = this.targetY;
    this.container.x = this.currentX;
    this.container.y = this.currentY;
  }

  private setPositionFromRoom(room: string, seat: number) {
    const seatDef = getSeatPosition(room, seat);
    if (seatDef) {
      const pos = toScreen(seatDef.col, seatDef.row);
      this.targetX = pos.x;
      this.targetY = pos.y;
    }
  }

  update(data: AgentData) {
    this.setPositionFromRoom(data.position_room, data.position_seat);

    // Smooth movement
    const dx = this.targetX - this.currentX;
    const dy = this.targetY - this.currentY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const speed = Math.min(dist * 0.08, 3);
      this.currentX += (dx / dist) * speed;
      this.currentY += (dy / dist) * speed;
    } else {
      this.currentX = this.targetX;
      this.currentY = this.targetY;
    }

    // Idle bob animation
    this.bobOffset += 0.03;
    const bob = data.status === 'idle' ? Math.sin(this.bobOffset) * 1.5 : 0;

    this.container.x = this.currentX;
    this.container.y = this.currentY + bob;

    // Status glow
    const glowColor = STATUS_GLOW[data.status];
    if (glowColor && data.status !== 'idle') {
      this.glow.visible = true;
      this.glow.clear();
      this.glow.circle(0, 0, 12);
      this.glow.fill({ color: glowColor, alpha: 0.2 + Math.sin(this.bobOffset * 2) * 0.1 });
    } else {
      this.glow.visible = false;
    }
  }
}
