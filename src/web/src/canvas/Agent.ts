import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { toScreen } from './iso';
import { getSeatPosition } from './rooms';

// Agent outfit colors — bright, clearly visible on warm floors
const AGENT_COLORS: Record<string, number> = {
  sage: 0xffd700, nova: 0x00bfff, aria: 0xb57edc, dex: 0x50c878,
  flux: 0x4169e1, quinn: 0xff8c00, gage: 0x20b2aa, morgan: 0xff69b4,
  uma: 0x8a2be2, river: 0x00ced1, atlas: 0x708090,
};

// Skin tones
const SKIN_TONES: Record<string, number> = {
  sage: 0xf5d6b8, nova: 0xc69c6d, aria: 0xf5d6c3, dex: 0x8d5524,
  flux: 0xf5d6b8, quinn: 0xe8c49e, gage: 0x8d5524, morgan: 0xf5d6c3,
  uma: 0xc69c6d, river: 0xf5d6b8, atlas: 0xe8c49e,
};

// Hair colors
const HAIR_COLORS: Record<string, number> = {
  sage: 0x2a2a2a, nova: 0x1a1a3a, aria: 0x8a4a2a, dex: 0x0a0a0a,
  flux: 0x4a3a1a, quinn: 0x4a2a1a, gage: 0x0a0a0a, morgan: 0x8a2a1a,
  uma: 0x2a1a3a, river: 0x5a5a5a, atlas: 0x6a6a6a,
};

// Hair styles: 0=short, 1=medium, 2=long, 3=mohawk, 4=bun
const HAIR_STYLE: Record<string, number> = {
  sage: 0, nova: 0, aria: 2, dex: 3,
  flux: 0, quinn: 1, gage: 0, morgan: 2,
  uma: 4, river: 1, atlas: 0,
};

const STATUS_GLOW: Record<string, number> = {
  coding: 0x00ff88,
  reviewing: 0x00bfff,
  testing: 0x9b59b6,
  planning: 0xffd700,
  blocked: 0xff4444,
  deploying: 0xff6b35,
  thinking: 0xcccccc,
};

export interface AgentData {
  id: string;
  name: string;
  status: string;
  position_room: string;
  position_seat: number;
}

/** Pixel art agent — Gather.town style character */
export class AgentSprite {
  container: Container;
  private body: Graphics;
  private glow: Graphics;
  private statusBubble: Graphics;
  private label: Text;
  private statusLabel: Text;
  private shadow: Graphics;
  private statusDot: Graphics;
  private pulseOffset = Math.random() * Math.PI * 2;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private lastStatus = '';
  private lastRoom = '';
  private lastSeat = -1;

  constructor(data: AgentData) {
    this.container = new Container();
    this.container.sortableChildren = true;

    const color = AGENT_COLORS[data.id] || 0xcccccc;

    // Ground shadow
    this.shadow = new Graphics();
    this.shadow.zIndex = 0;
    this.container.addChild(this.shadow);

    // Status glow ring
    this.glow = new Graphics();
    this.glow.zIndex = 1;
    this.glow.visible = false;
    this.container.addChild(this.glow);

    // Pixel art body (px=3 for visible characters)
    this.body = new Graphics();
    this.drawPixelPerson(this.body, data.id);
    this.body.zIndex = 2;
    this.container.addChild(this.body);

    // Status thought bubble
    this.statusBubble = new Graphics();
    this.statusBubble.zIndex = 4;
    this.statusBubble.visible = false;
    this.container.addChild(this.statusBubble);

    // Status dot (colored indicator next to name, like Gather.town)
    this.statusDot = new Graphics();
    this.statusDot.zIndex = 5;
    this.statusDot.visible = false;
    this.container.addChild(this.statusDot);

    // Name label — clean white, like the reference
    this.label = new Text({
      text: data.name,
      style: new TextStyle({
        fontSize: 10,
        fill: '#ffffff',
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '700',
        letterSpacing: 0.5,
        dropShadow: { color: '#000000', blur: 3, distance: 1, alpha: 0.9 },
        stroke: { color: '#000000', width: 2.5 },
      }),
    });
    this.label.anchor.set(0.5, 0);
    this.label.y = 18;
    this.label.zIndex = 5;
    this.container.addChild(this.label);

    // Status text
    this.statusLabel = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 8,
        fill: 0xcccccc,
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '400',
        dropShadow: { color: '#000000', blur: 3, distance: 1, alpha: 0.9 },
        stroke: { color: '#000000', width: 1.5 },
      }),
    });
    this.statusLabel.anchor.set(0.5, 0);
    this.statusLabel.y = 30;
    this.statusLabel.zIndex = 5;
    this.statusLabel.visible = false;
    this.container.addChild(this.statusLabel);

    // Initial position
    this.setPositionFromRoom(data.position_room, data.position_seat);
    this.currentX = this.targetX;
    this.currentY = this.targetY;
    this.container.x = this.currentX;
    this.container.y = this.currentY;
    this.lastRoom = data.position_room;
    this.lastSeat = data.position_seat;
  }

  private drawPixelPerson(g: Graphics, agentId: string) {
    const color = AGENT_COLORS[agentId] || 0xcccccc;
    const skin = SKIN_TONES[agentId] || 0xf5d6b8;
    const hair = HAIR_COLORS[agentId] || 0x2a2a2a;
    const hairStyle = HAIR_STYLE[agentId] || 0;
    const px = 3;

    // Hair
    switch (hairStyle) {
      case 0:
        g.rect(-3 * px, -12 * px, 6 * px, 3 * px);
        g.fill({ color: hair });
        break;
      case 1:
        g.rect(-3 * px, -12 * px, 6 * px, 4 * px);
        g.fill({ color: hair });
        g.rect(-4 * px, -11 * px, 1 * px, 4 * px);
        g.fill({ color: hair });
        g.rect(3 * px, -11 * px, 1 * px, 4 * px);
        g.fill({ color: hair });
        break;
      case 2:
        g.rect(-3 * px, -12 * px, 6 * px, 3 * px);
        g.fill({ color: hair });
        g.rect(-4 * px, -11 * px, 1 * px, 7 * px);
        g.fill({ color: hair });
        g.rect(3 * px, -11 * px, 1 * px, 7 * px);
        g.fill({ color: hair });
        break;
      case 3:
        g.rect(-1 * px, -14 * px, 2 * px, 2 * px);
        g.fill({ color: hair });
        g.rect(-2 * px, -12 * px, 4 * px, 2 * px);
        g.fill({ color: hair });
        break;
      case 4:
        g.rect(-3 * px, -12 * px, 6 * px, 3 * px);
        g.fill({ color: hair });
        g.rect(-1 * px, -14 * px, 2 * px, 2 * px);
        g.fill({ color: hair });
        break;
    }

    // Head
    g.rect(-3 * px, -10 * px, 6 * px, 5 * px);
    g.fill({ color: skin });
    // Eyes
    g.rect(-2 * px, -8 * px, 1 * px, 1 * px);
    g.fill({ color: 0x111111 });
    g.rect(1 * px, -8 * px, 1 * px, 1 * px);
    g.fill({ color: 0x111111 });
    // Mouth
    g.rect(-1 * px, -6 * px, 2 * px, 1 * px);
    g.fill({ color: darken(skin, 0.2) });

    // Body/shirt
    g.rect(-4 * px, -5 * px, 8 * px, 6 * px);
    g.fill({ color });
    g.rect(-2 * px, -5 * px, 4 * px, 1 * px);
    g.fill({ color: darken(color, 0.15) });

    // Arms
    g.rect(-5 * px, -4 * px, 1 * px, 5 * px);
    g.fill({ color: darken(color, 0.1) });
    g.rect(-5 * px, 1 * px, 1 * px, 1 * px);
    g.fill({ color: skin });
    g.rect(4 * px, -4 * px, 1 * px, 5 * px);
    g.fill({ color: darken(color, 0.1) });
    g.rect(4 * px, 1 * px, 1 * px, 1 * px);
    g.fill({ color: skin });

    // Pants
    g.rect(-3 * px, 1 * px, 3 * px, 4 * px);
    g.fill({ color: 0x222233 });
    g.rect(0, 1 * px, 3 * px, 4 * px);
    g.fill({ color: 0x2a2a3a });

    // Shoes
    g.rect(-4 * px, 5 * px, 3 * px, 1 * px);
    g.fill({ color: 0x1a1a1a });
    g.rect(1 * px, 5 * px, 3 * px, 1 * px);
    g.fill({ color: 0x1a1a1a });
  }

  private drawStatusBubble(g: Graphics, status: string, color: number) {
    g.clear();
    g.roundRect(-14, -42, 28, 16, 4);
    g.fill({ color: 0x222233, alpha: 0.9 });
    g.stroke({ color: 0x555566, width: 1 });
    // Pointer
    g.circle(0, -26, 2.5);
    g.fill({ color: 0x222233, alpha: 0.85 });
    g.circle(2, -22, 1.5);
    g.fill({ color: 0x222233, alpha: 0.7 });
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
    // Only update target when room/seat changes
    if (data.position_room !== this.lastRoom || data.position_seat !== this.lastSeat) {
      this.setPositionFromRoom(data.position_room, data.position_seat);
      this.lastRoom = data.position_room;
      this.lastSeat = data.position_seat;
    }

    // Smooth walk to target
    const dx = this.targetX - this.currentX;
    const dy = this.targetY - this.currentY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isWalking = dist > 1.5;

    if (isWalking) {
      const speed = dist > 80 ? 3 : dist > 30 ? 2 : Math.max(dist * 0.08, 0.6);
      this.currentX += (dx / dist) * speed;
      this.currentY += (dy / dist) * speed;
    } else {
      this.currentX = this.targetX;
      this.currentY = this.targetY;
    }

    this.pulseOffset += 0.03;
    const isActive = data.status !== 'idle';

    // Walk bob
    let bob = 0;
    if (isWalking) {
      bob = Math.round(Math.abs(Math.sin(this.pulseOffset * 6)) * 2);
    }

    this.container.x = this.currentX;
    this.container.y = this.currentY - bob;
    this.container.zIndex = this.currentY + 100;

    // Shadow
    this.shadow.clear();
    this.shadow.ellipse(0, 10, 9, 4);
    this.shadow.fill({ color: 0x000000, alpha: 0.25 });

    // Status glow ring (subtle, under character)
    const glowColor = STATUS_GLOW[data.status];
    if (glowColor && isActive) {
      this.glow.visible = true;
      this.glow.clear();
      const pulse = 0.15 + Math.sin(this.pulseOffset * 2) * 0.08;
      this.glow.ellipse(0, 10, 12, 5);
      this.glow.stroke({ color: glowColor, width: 1.5, alpha: pulse });

      this.statusBubble.visible = true;
      this.drawStatusBubble(this.statusBubble, data.status, glowColor);

      // Status dot next to name
      this.statusDot.visible = true;
      this.statusDot.clear();
      const nameWidth = this.label.width / 2 + 5;
      this.statusDot.circle(nameWidth, 23, 3);
      this.statusDot.fill({ color: glowColor });
    } else {
      this.glow.visible = false;
      this.statusBubble.visible = false;
      this.statusDot.visible = false;
    }

    // Status label
    if (isActive && data.status !== this.lastStatus) {
      this.statusLabel.text = data.status;
      this.statusLabel.style.fill = glowColor || 0xcccccc;
      this.statusLabel.visible = true;
    } else if (!isActive) {
      this.statusLabel.visible = false;
    }
    this.lastStatus = data.status;
  }
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (color & 0xff) * (1 - amount));
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
