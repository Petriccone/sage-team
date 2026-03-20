import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { toScreen } from './iso';
import { getSeatPosition } from './rooms';

const AGENT_COLORS: Record<string, number> = {
  sage: 0xffd700, nova: 0x00bfff, aria: 0xb57edc, dex: 0x50c878,
  flux: 0x4169e1, quinn: 0xff8c00, gage: 0x20b2aa, morgan: 0xff69b4,
  uma: 0x8a2be2, river: 0x00ced1, atlas: 0x708090,
};

const SKIN_TONES: Record<string, number> = {
  sage: 0xf0d0a0, nova: 0xd4a574, aria: 0xf5d6c3, dex: 0xc68642,
  flux: 0xf0d0a0, quinn: 0xe0c0a0, gage: 0xc68642, morgan: 0xf5d6c3,
  uma: 0xd4a574, river: 0xf0d0a0, atlas: 0xe0c0a0,
};

const HAIR_COLORS: Record<string, number> = {
  sage: 0x2a2a2a, nova: 0x1a1a3a, aria: 0x8a4a2a, dex: 0x1a1a1a,
  flux: 0x3a3a1a, quinn: 0x4a2a1a, gage: 0x1a1a1a, morgan: 0x6a2a1a,
  uma: 0x2a1a3a, river: 0x3a3a3a, atlas: 0x5a5a5a,
};

const AGENT_EMOJI: Record<string, string> = {
  sage: '\u{1F451}', nova: '\u{1F52C}', aria: '\u{1F3DB}\uFE0F', dex: '\u26A1',
  flux: '\u{1F30A}', quinn: '\u{1F50D}', gage: '\u{1F680}', morgan: '\u{1F4CB}',
  uma: '\u{1F3A8}', river: '\u{1F300}', atlas: '\u{1F4CA}',
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

export class AgentSprite {
  container: Container;
  private body: Graphics;
  private glow: Graphics;
  private statusRing: Graphics;
  private statusLabel: Text;
  private label: Text;
  private emojiLabel: Text;
  private shadow: Graphics;
  private bobOffset = Math.random() * Math.PI * 2;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private lastStatus = '';

  constructor(data: AgentData) {
    this.container = new Container();
    this.container.sortableChildren = true;

    const color = AGENT_COLORS[data.id] || 0xcccccc;

    // ── Ground shadow ──
    this.shadow = new Graphics();
    this.shadow.ellipse(0, 8, 10, 4);
    this.shadow.fill({ color: 0x000000, alpha: 0.35 });
    this.shadow.zIndex = 0;
    this.container.addChild(this.shadow);

    // ── Status glow (ambient light behind body) ──
    this.glow = new Graphics();
    this.glow.zIndex = 1;
    this.glow.visible = false;
    this.container.addChild(this.glow);

    // ── Agent body ──
    this.body = new Graphics();
    this.drawPerson(this.body, data.id);
    this.body.zIndex = 2;
    this.container.addChild(this.body);

    // ── Status ring ──
    this.statusRing = new Graphics();
    this.statusRing.zIndex = 3;
    this.statusRing.visible = false;
    this.container.addChild(this.statusRing);

    // ── Emoji above head ──
    this.emojiLabel = new Text({
      text: AGENT_EMOJI[data.id] || '\u25CF',
      style: new TextStyle({
        fontSize: 14,
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
      }),
    });
    this.emojiLabel.anchor.set(0.5, 0.5);
    this.emojiLabel.y = -30;
    this.emojiLabel.zIndex = 4;
    this.container.addChild(this.emojiLabel);

    // ── Name label ──
    this.label = new Text({
      text: data.name,
      style: new TextStyle({
        fontSize: 8,
        fill: color,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontWeight: '700',
        letterSpacing: 0.5,
        dropShadow: {
          color: '#000000',
          blur: 4,
          distance: 0,
        },
      }),
    });
    this.label.anchor.set(0.5, 0);
    this.label.y = 13;
    this.label.zIndex = 5;
    this.container.addChild(this.label);

    // ── Status text ──
    this.statusLabel = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 7,
        fill: 0x888888,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontWeight: '400',
        dropShadow: {
          color: '#000000',
          blur: 3,
          distance: 0,
        },
      }),
    });
    this.statusLabel.anchor.set(0.5, 0);
    this.statusLabel.y = 22;
    this.statusLabel.zIndex = 5;
    this.statusLabel.visible = false;
    this.container.addChild(this.statusLabel);

    // Initial position
    this.setPositionFromRoom(data.position_room, data.position_seat);
    this.currentX = this.targetX;
    this.currentY = this.targetY;
    this.container.x = this.currentX;
    this.container.y = this.currentY;
  }

  private drawPerson(g: Graphics, agentId: string) {
    const color = AGENT_COLORS[agentId] || 0xcccccc;
    const skin = SKIN_TONES[agentId] || 0xf0d0a0;
    const hair = HAIR_COLORS[agentId] || 0x2a2a2a;

    // ── Hair ──
    g.circle(0, -15, 5.5);
    g.fill({ color: hair, alpha: 0.9 });

    // ── Head ──
    g.circle(0, -14, 5);
    g.fill({ color: skin });
    g.stroke({ color: darken(skin, 0.2), width: 0.5, alpha: 0.4 });

    // ── Eyes (tiny dots) ──
    g.circle(-1.5, -14.5, 0.6);
    g.fill({ color: 0x222222, alpha: 0.8 });
    g.circle(1.5, -14.5, 0.6);
    g.fill({ color: 0x222222, alpha: 0.8 });

    // ── Neck ──
    g.rect(-1.5, -9.5, 3, 2);
    g.fill({ color: skin, alpha: 0.9 });

    // ── Torso (shirt) ──
    g.poly([
      { x: -7, y: -8 },
      { x: 7, y: -8 },
      { x: 6, y: 3 },
      { x: -6, y: 3 },
    ]);
    g.fill({ color });

    // Shirt collar/detail
    g.poly([
      { x: -3, y: -8 },
      { x: 0, y: -6 },
      { x: 3, y: -8 },
    ]);
    g.fill({ color: darken(color, 0.15), alpha: 0.5 });

    // Shirt shading (left side darker)
    g.poly([
      { x: -7, y: -8 },
      { x: -1, y: -8 },
      { x: -1, y: 3 },
      { x: -6, y: 3 },
    ]);
    g.fill({ color: 0x000000, alpha: 0.1 });

    // ── Arms ──
    // Left arm
    g.poly([
      { x: -7, y: -7 },
      { x: -9, y: -5 },
      { x: -8, y: 0 },
      { x: -6, y: 0 },
    ]);
    g.fill({ color: darken(color, 0.1) });
    // Left hand
    g.circle(-7, 0.5, 1.5);
    g.fill({ color: skin, alpha: 0.9 });

    // Right arm
    g.poly([
      { x: 7, y: -7 },
      { x: 9, y: -5 },
      { x: 8, y: 0 },
      { x: 6, y: 0 },
    ]);
    g.fill({ color: darken(color, 0.1) });
    // Right hand
    g.circle(7, 0.5, 1.5);
    g.fill({ color: skin, alpha: 0.9 });

    // ── Legs ──
    g.poly([
      { x: -5, y: 3 },
      { x: -1, y: 3 },
      { x: -1.5, y: 10 },
      { x: -5, y: 10 },
    ]);
    g.fill({ color: 0x222233, alpha: 0.9 });

    g.poly([
      { x: 1, y: 3 },
      { x: 5, y: 3 },
      { x: 5, y: 10 },
      { x: 1.5, y: 10 },
    ]);
    g.fill({ color: 0x2a2a3a, alpha: 0.9 });

    // ── Shoes ──
    g.ellipse(-3, 10.5, 2.5, 1.2);
    g.fill({ color: 0x1a1a1a, alpha: 0.8 });
    g.ellipse(3, 10.5, 2.5, 1.2);
    g.fill({ color: 0x1a1a1a, alpha: 0.8 });
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

    this.bobOffset += 0.03;
    const isActive = data.status !== 'idle';
    const bob = !isActive ? Math.sin(this.bobOffset) * 1.0 : 0;
    const workBounce = isActive ? Math.sin(this.bobOffset * 3) * 0.6 : 0;

    this.container.x = this.currentX;
    this.container.y = this.currentY + bob + workBounce;
    this.container.zIndex = this.currentY + 100;

    // Shadow scale when active
    this.shadow.clear();
    const shadowScale = isActive ? 0.85 : 1;
    this.shadow.ellipse(0, 8, 10 * shadowScale, 4 * shadowScale);
    this.shadow.fill({ color: 0x000000, alpha: isActive ? 0.25 : 0.35 });

    // Status glow
    const glowColor = STATUS_GLOW[data.status];
    if (glowColor && isActive) {
      this.glow.visible = true;
      this.glow.clear();
      const r = 16 + Math.sin(this.bobOffset * 2) * 3;
      this.glow.circle(0, -4, r);
      this.glow.fill({ color: glowColor, alpha: 0.1 + Math.sin(this.bobOffset * 2) * 0.05 });
      // Inner glow
      this.glow.circle(0, -4, r * 0.6);
      this.glow.fill({ color: glowColor, alpha: 0.06 });

      // Status ring around feet
      this.statusRing.visible = true;
      this.statusRing.clear();
      this.statusRing.ellipse(0, 8, 10, 4);
      this.statusRing.stroke({ color: glowColor, width: 1.5, alpha: 0.35 + Math.sin(this.bobOffset * 2) * 0.15 });
      // Inner ring
      this.statusRing.ellipse(0, 8, 7, 3);
      this.statusRing.stroke({ color: glowColor, width: 0.5, alpha: 0.2 });
    } else {
      this.glow.visible = false;
      this.statusRing.visible = false;
    }

    // Status label
    if (isActive && data.status !== this.lastStatus) {
      this.statusLabel.text = data.status;
      this.statusLabel.style.fill = glowColor || 0x888888;
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
