import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { toScreen } from './iso';
import { getSeatPosition } from './rooms';

// Pixel art agent colors (shirt/outfit)
const AGENT_COLORS: Record<string, number> = {
  sage: 0xffd700, nova: 0x00bfff, aria: 0xb57edc, dex: 0x50c878,
  flux: 0x4169e1, quinn: 0xff8c00, gage: 0x20b2aa, morgan: 0xff69b4,
  uma: 0x8a2be2, river: 0x00ced1, atlas: 0x708090,
};

// Pixel art skin tones
const SKIN_TONES: Record<string, number> = {
  sage: 0xf5d6b8, nova: 0xc69c6d, aria: 0xf5d6c3, dex: 0x8d5524,
  flux: 0xf5d6b8, quinn: 0xe8c49e, gage: 0x8d5524, morgan: 0xf5d6c3,
  uma: 0xc69c6d, river: 0xf5d6b8, atlas: 0xe8c49e,
};

// Pixel art hair colors
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

/** Pixel art style agent — blocky 8/16-bit inspired character */
export class AgentSprite {
  container: Container;
  private body: Graphics;
  private glow: Graphics;
  private statusBubble: Graphics;
  private label: Text;
  private statusLabel: Text;
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

    // Ground shadow (pixel-snapped ellipse)
    this.shadow = new Graphics();
    this.shadow.zIndex = 0;
    this.container.addChild(this.shadow);

    // Status glow ring
    this.glow = new Graphics();
    this.glow.zIndex = 1;
    this.glow.visible = false;
    this.container.addChild(this.glow);

    // Pixel art body
    this.body = new Graphics();
    this.drawPixelPerson(this.body, data.id);
    this.body.zIndex = 2;
    this.container.addChild(this.body);

    // Status thought bubble
    this.statusBubble = new Graphics();
    this.statusBubble.zIndex = 4;
    this.statusBubble.visible = false;
    this.container.addChild(this.statusBubble);

    // Name label (pixel font style)
    this.label = new Text({
      text: data.name,
      style: new TextStyle({
        fontSize: 8,
        fill: color,
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '700',
        letterSpacing: 0.5,
        dropShadow: {
          color: '#000000',
          blur: 2,
          distance: 1,
        },
      }),
    });
    this.label.anchor.set(0.5, 0);
    this.label.y = 14;
    this.label.zIndex = 5;
    this.container.addChild(this.label);

    // Status text
    this.statusLabel = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 7,
        fill: 0x888888,
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '400',
        dropShadow: {
          color: '#000000',
          blur: 2,
          distance: 1,
        },
      }),
    });
    this.statusLabel.anchor.set(0.5, 0);
    this.statusLabel.y = 23;
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

  /** Draw a pixel art person — blocky 16-bit style character */
  private drawPixelPerson(g: Graphics, agentId: string) {
    const color = AGENT_COLORS[agentId] || 0xcccccc;
    const skin = SKIN_TONES[agentId] || 0xf5d6b8;
    const hair = HAIR_COLORS[agentId] || 0x2a2a2a;
    const hairStyle = HAIR_STYLE[agentId] || 0;
    const px = 2; // pixel size

    // Hair (varies by style)
    switch (hairStyle) {
      case 0: // Short
        g.rect(-3 * px, -12 * px, 6 * px, 3 * px);
        g.fill({ color: hair });
        break;
      case 1: // Medium
        g.rect(-3 * px, -12 * px, 6 * px, 4 * px);
        g.fill({ color: hair });
        g.rect(-4 * px, -11 * px, 1 * px, 4 * px);
        g.fill({ color: hair });
        g.rect(3 * px, -11 * px, 1 * px, 4 * px);
        g.fill({ color: hair });
        break;
      case 2: // Long
        g.rect(-3 * px, -12 * px, 6 * px, 3 * px);
        g.fill({ color: hair });
        g.rect(-4 * px, -11 * px, 1 * px, 7 * px);
        g.fill({ color: hair });
        g.rect(3 * px, -11 * px, 1 * px, 7 * px);
        g.fill({ color: hair });
        break;
      case 3: // Mohawk
        g.rect(-1 * px, -14 * px, 2 * px, 2 * px);
        g.fill({ color: hair });
        g.rect(-2 * px, -12 * px, 4 * px, 2 * px);
        g.fill({ color: hair });
        break;
      case 4: // Bun
        g.rect(-3 * px, -12 * px, 6 * px, 3 * px);
        g.fill({ color: hair });
        g.rect(-1 * px, -14 * px, 2 * px, 2 * px);
        g.fill({ color: hair });
        break;
    }

    // Head (3x3 pixel block)
    g.rect(-3 * px, -10 * px, 6 * px, 5 * px);
    g.fill({ color: skin });

    // Eyes (1px each)
    g.rect(-2 * px, -8 * px, 1 * px, 1 * px);
    g.fill({ color: 0x111111 });
    g.rect(1 * px, -8 * px, 1 * px, 1 * px);
    g.fill({ color: 0x111111 });

    // Mouth (1px)
    g.rect(-1 * px, -6 * px, 2 * px, 1 * px);
    g.fill({ color: darken(skin, 0.2) });

    // Torso/Shirt (blocky)
    g.rect(-4 * px, -5 * px, 8 * px, 6 * px);
    g.fill({ color });

    // Shirt collar
    g.rect(-2 * px, -5 * px, 4 * px, 1 * px);
    g.fill({ color: darken(color, 0.15) });

    // Left arm
    g.rect(-5 * px, -4 * px, 1 * px, 5 * px);
    g.fill({ color: darken(color, 0.1) });
    // Left hand
    g.rect(-5 * px, 1 * px, 1 * px, 1 * px);
    g.fill({ color: skin });

    // Right arm
    g.rect(4 * px, -4 * px, 1 * px, 5 * px);
    g.fill({ color: darken(color, 0.1) });
    // Right hand
    g.rect(4 * px, 1 * px, 1 * px, 1 * px);
    g.fill({ color: skin });

    // Pants/legs
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

    // Status icons as pixel art in thought bubble
    const icons: Record<string, string> = {
      coding: '</>', reviewing: 'eye', testing: 'bug',
      planning: '...', blocked: '!', deploying: '^',
      thinking: '?',
    };
    const icon = icons[status] || '?';

    // Bubble background
    g.roundRect(-12, -32, 24, 14, 3);
    g.fill({ color: 0x1a1a2a, alpha: 0.9 });
    g.stroke({ color, width: 1, alpha: 0.6 });

    // Bubble tail dots
    g.circle(0, -19, 2);
    g.fill({ color: 0x1a1a2a, alpha: 0.8 });
    g.circle(2, -16, 1);
    g.fill({ color: 0x1a1a2a, alpha: 0.6 });
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

    this.bobOffset += 0.04;
    const isActive = data.status !== 'idle';

    // Pixel-snapped bounce (whole pixel steps for retro feel)
    const bob = isActive ? Math.round(Math.sin(this.bobOffset * 3) * 1.5) : 0;

    this.container.x = this.currentX;
    this.container.y = this.currentY + bob;
    this.container.zIndex = this.currentY + 100;

    // Shadow
    this.shadow.clear();
    const shadowAlpha = isActive ? 0.2 : 0.3;
    this.shadow.ellipse(0, 8, 8, 3);
    this.shadow.fill({ color: 0x000000, alpha: shadowAlpha });

    // Status glow ring
    const glowColor = STATUS_GLOW[data.status];
    if (glowColor && isActive) {
      this.glow.visible = true;
      this.glow.clear();
      // Pixel-style ring (octagon instead of smooth circle)
      this.glow.ellipse(0, 0, 14, 14);
      this.glow.fill({ color: glowColor, alpha: 0.08 + Math.sin(this.bobOffset * 2) * 0.04 });
      // Ground ring
      this.glow.ellipse(0, 8, 10, 4);
      this.glow.stroke({ color: glowColor, width: 2, alpha: 0.3 + Math.sin(this.bobOffset * 2) * 0.15 });

      // Status bubble
      this.statusBubble.visible = true;
      this.drawStatusBubble(this.statusBubble, data.status, glowColor);
    } else {
      this.glow.visible = false;
      this.statusBubble.visible = false;
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
