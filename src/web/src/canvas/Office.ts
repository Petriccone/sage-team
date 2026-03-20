import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TILE_W, TILE_H, toScreen } from './iso';
import { ROOMS, SEATS, FURNITURE, getSeatPosition, type RoomDef, type FurnitureDef } from './rooms';
import { AgentSprite, type AgentData } from './Agent';

const WALL_HEIGHT = 18;
const PX = 2; // pixel art unit size

export class Office {
  app: Application;
  world: Container;
  agentSprites: Map<string, AgentSprite> = new Map();
  private initialized = false;

  constructor() {
    this.app = new Application();
    this.world = new Container();
  }

  async init(canvas: HTMLCanvasElement) {
    if (this.initialized) return;
    this.initialized = true;

    await this.app.init({
      canvas,
      resizeTo: canvas.parentElement!,
      background: 0x1a1a2e,
      antialias: false,       // pixel art = no antialiasing
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    this.app.stage.addChild(this.world);
    this.world.sortableChildren = true;

    this.centerCamera();
    this.drawRooms();

    window.addEventListener('resize', () => this.centerCamera());
  }

  private centerCamera() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const center = toScreen(9, 10);
    this.world.x = sw / 2 - center.x;
    this.world.y = sh / 3.5 - center.y;
  }

  private drawRooms() {
    for (const room of ROOMS) {
      this.drawRoom(room);
    }
  }

  private drawRoom(room: RoomDef) {
    const container = new Container();
    container.sortableChildren = true;
    // Use bottom-right corner for depth sort (back-to-front in isometric)
    const brPos = toScreen(room.col + room.w, room.row + room.h);
    container.zIndex = brPos.y;

    const floorColor = parseInt(room.floorColor.slice(1), 16);
    const wallColor = parseInt(room.wallColor.slice(1), 16);
    const accentColor = parseInt(room.color.slice(1), 16);

    // Corner positions
    const tl = toScreen(room.col, room.row);
    const tr = toScreen(room.col + room.w, room.row);
    const br = toScreen(room.col + room.w, room.row + room.h);
    const bl = toScreen(room.col, room.row + room.h);

    // ── Floor tiles (checkerboard) ──
    for (let c = 0; c < room.w; c++) {
      for (let r = 0; r < room.h; r++) {
        const pos = toScreen(room.col + c, room.row + r);
        const tile = new Graphics();
        const isLight = (c + r) % 2 === 0;

        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.fill({ color: floorColor, alpha: isLight ? 1.0 : 0.85 });

        // Grid lines for pixel art feel
        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.stroke({ color: 0x000000, width: 0.5, alpha: 0.08 });

        tile.x = pos.x;
        tile.y = pos.y;
        container.addChild(tile);
      }
    }

    // ── Walls (solid with pixel-art look) ──
    // Left wall
    const leftWall = new Graphics();
    leftWall.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: bl.x, y: bl.y - WALL_HEIGHT },
      { x: bl.x, y: bl.y },
    ]);
    leftWall.fill({ color: wallColor, alpha: 0.9 });
    // Horizontal panel lines (pixel art style)
    for (let i = 1; i <= 3; i++) {
      const frac = i / 4;
      const y1 = tl.y - WALL_HEIGHT * (1 - frac);
      const y2 = bl.y - WALL_HEIGHT * (1 - frac);
      leftWall.moveTo(tl.x, y1);
      leftWall.lineTo(bl.x, y2);
      leftWall.stroke({ color: 0x000000, width: 1, alpha: 0.1 });
    }
    // Wall top edge (accent color stripe)
    leftWall.moveTo(tl.x, tl.y - WALL_HEIGHT);
    leftWall.lineTo(bl.x, bl.y - WALL_HEIGHT);
    leftWall.stroke({ color: accentColor, width: 2, alpha: 0.5 });
    leftWall.zIndex = -1;
    container.addChild(leftWall);

    // Back wall
    const backWall = new Graphics();
    backWall.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: tr.x, y: tr.y - WALL_HEIGHT },
      { x: tr.x, y: tr.y },
    ]);
    backWall.fill({ color: darken(wallColor, 0.15), alpha: 0.9 });
    for (let i = 1; i <= 3; i++) {
      const frac = i / 4;
      const y1 = tl.y - WALL_HEIGHT * (1 - frac);
      const y2 = tr.y - WALL_HEIGHT * (1 - frac);
      backWall.moveTo(tl.x, y1);
      backWall.lineTo(tr.x, y2);
      backWall.stroke({ color: 0x000000, width: 1, alpha: 0.08 });
    }
    backWall.moveTo(tl.x, tl.y - WALL_HEIGHT);
    backWall.lineTo(tr.x, tr.y - WALL_HEIGHT);
    backWall.stroke({ color: accentColor, width: 2, alpha: 0.4 });
    backWall.zIndex = -1;
    container.addChild(backWall);

    // ── Floor border ──
    const border = new Graphics();
    border.poly([tl, tr, br, bl]);
    border.stroke({ color: accentColor, width: 1.5, alpha: 0.25 });
    container.addChild(border);

    // ── Room label ──
    const labelPos = toScreen(room.col + room.w / 2, room.row + 0.3);
    const label = new Text({
      text: `${room.icon}  ${room.label.toUpperCase()}`,
      style: new TextStyle({
        fontSize: 9,
        fill: room.color,
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '700',
        letterSpacing: 1.5,
        align: 'center',
        dropShadow: {
          color: '#000000',
          blur: 4,
          distance: 1,
        },
      }),
    });
    label.anchor.set(0.5, 0.5);
    label.x = labelPos.x;
    label.y = labelPos.y - WALL_HEIGHT - 6;
    label.alpha = 0.8;
    container.addChild(label);

    // ── Furniture ──
    const roomFurniture = FURNITURE.filter(f => f.room === room.id);
    for (const furn of roomFurniture) {
      this.drawFurniture(container, furn, accentColor, room);
    }

    this.world.addChild(container);
  }

  private drawFurniture(container: Container, furn: FurnitureDef, accent: number, room: RoomDef) {
    const pos = toScreen(furn.col, furn.row);
    const g = new Graphics();

    switch (furn.type) {
      case 'rug': {
        // Warm colored rug (isometric diamond)
        const rugW = TILE_W * 1.2;
        const rugH = TILE_H * 1.2;
        g.poly([
          { x: pos.x, y: pos.y },
          { x: pos.x + rugW / 2, y: pos.y + rugH / 2 },
          { x: pos.x, y: pos.y + rugH },
          { x: pos.x - rugW / 2, y: pos.y + rugH / 2 },
        ]);
        g.fill({ color: accent, alpha: 0.08 });
        g.poly([
          { x: pos.x, y: pos.y + 3 },
          { x: pos.x + rugW / 2 - 5, y: pos.y + rugH / 2 },
          { x: pos.x, y: pos.y + rugH - 3 },
          { x: pos.x - rugW / 2 + 5, y: pos.y + rugH / 2 },
        ]);
        g.stroke({ color: accent, width: 1, alpha: 0.1 });
        g.zIndex = -0.5;
        break;
      }
      case 'desk': {
        // Pixel art desk — wooden, blocky
        // Surface (isometric diamond)
        g.poly([
          { x: pos.x, y: pos.y - 4 },
          { x: pos.x + 20, y: pos.y + 6 },
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x - 20, y: pos.y + 6 },
        ]);
        g.fill({ color: 0x8b6f4a });

        // Surface highlight stripe
        g.poly([
          { x: pos.x - 14, y: pos.y + 3 },
          { x: pos.x + 14, y: pos.y + 3 },
          { x: pos.x + 12, y: pos.y + 5 },
          { x: pos.x - 12, y: pos.y + 5 },
        ]);
        g.fill({ color: 0xa08058, alpha: 0.6 });

        // Front edge
        g.poly([
          { x: pos.x + 20, y: pos.y + 6 },
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x + 20, y: pos.y + 9 },
        ]);
        g.fill({ color: 0x6b5030 });

        // Side edge
        g.poly([
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x - 20, y: pos.y + 6 },
          { x: pos.x - 20, y: pos.y + 9 },
          { x: pos.x, y: pos.y + 19 },
        ]);
        g.fill({ color: 0x5a4028 });
        break;
      }
      case 'monitor': {
        // Pixel art monitor — blocky rectangle with screen glow
        // Bezel
        g.rect(pos.x - 7, pos.y - 16, 14, 12);
        g.fill({ color: 0x222222 });

        // Screen
        g.rect(pos.x - 6, pos.y - 15, 12, 10);
        g.fill({ color: 0x0a1828 });

        // Code lines on screen (pixel art)
        const colors = [accent, 0x00ff88, 0x00bfff, 0xffa500];
        for (let i = 0; i < 5; i++) {
          const lw = 2 + (i * 7 + 3) % 8;
          g.rect(pos.x - 5, pos.y - 14 + i * 2, lw, 1);
          g.fill({ color: colors[i % colors.length], alpha: 0.5 });
        }

        // Screen glow
        g.rect(pos.x - 6, pos.y - 15, 12, 10);
        g.fill({ color: accent, alpha: 0.05 });

        // Stand (pixel art)
        g.rect(pos.x - 1, pos.y - 4, 2, 3);
        g.fill({ color: 0x333333 });
        // Base
        g.rect(pos.x - 4, pos.y - 1, 8, 2);
        g.fill({ color: 0x333333 });
        break;
      }
      case 'chair': {
        // Pixel art office chair — simple blocks
        // Seat
        g.ellipse(pos.x, pos.y + 1, 5, 3);
        g.fill({ color: 0x333348 });
        // Backrest
        g.rect(pos.x - 3, pos.y - 3, 6, 3);
        g.fill({ color: 0x2a2a40 });
        // Wheels (pixel dots)
        for (let a = 0; a < 4; a++) {
          const angle = (a / 4) * Math.PI + Math.PI * 0.75;
          g.rect(
            Math.round(pos.x + Math.cos(angle) * 5) - 1,
            Math.round(pos.y + 4 + Math.sin(angle) * 2) - 1,
            2, 2,
          );
          g.fill({ color: 0x444450, alpha: 0.6 });
        }
        break;
      }
      case 'table': {
        // Meeting table — larger, rounded corners feel via iso diamond
        g.poly([
          { x: pos.x, y: pos.y - 4 },
          { x: pos.x + 28, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 24 },
          { x: pos.x - 28, y: pos.y + 10 },
        ]);
        g.fill({ color: 0x6b5a3a });
        // Surface shine
        g.poly([
          { x: pos.x - 18, y: pos.y + 6 },
          { x: pos.x + 18, y: pos.y + 6 },
          { x: pos.x + 16, y: pos.y + 8 },
          { x: pos.x - 16, y: pos.y + 8 },
        ]);
        g.fill({ color: 0x8b7050, alpha: 0.5 });
        // Edge
        g.poly([
          { x: pos.x + 28, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 24 },
          { x: pos.x, y: pos.y + 27 },
          { x: pos.x + 28, y: pos.y + 13 },
        ]);
        g.fill({ color: 0x4a3a20 });
        break;
      }
      case 'plant': {
        // Pixel art potted plant
        // Pot (blocky trapezoid)
        g.poly([
          { x: pos.x - 4, y: pos.y + 2 },
          { x: pos.x + 4, y: pos.y + 2 },
          { x: pos.x + 3, y: pos.y + 8 },
          { x: pos.x - 3, y: pos.y + 8 },
        ]);
        g.fill({ color: 0x8b5a3a });
        // Pot rim
        g.rect(pos.x - 5, pos.y + 1, 10, 2);
        g.fill({ color: 0x9b6a4a });

        // Foliage (blocky circles — pixel art)
        g.circle(pos.x, pos.y - 3, 6);
        g.fill({ color: 0x2d8a4e, alpha: 0.85 });
        g.circle(pos.x - 3, pos.y - 1, 4);
        g.fill({ color: 0x228b22, alpha: 0.8 });
        g.circle(pos.x + 3, pos.y - 1, 4);
        g.fill({ color: 0x3cb371, alpha: 0.8 });
        g.circle(pos.x, pos.y - 6, 4);
        g.fill({ color: 0x45b868, alpha: 0.75 });
        break;
      }
      case 'shelf': {
        // Bookshelf — pixel art
        g.rect(pos.x - 10, pos.y - 10, 20, 18);
        g.fill({ color: 0x5a4020 });
        g.stroke({ color: 0x6b5030, width: 1 });

        // Shelf planks
        g.rect(pos.x - 9, pos.y - 4, 18, 2);
        g.fill({ color: 0x6b5030 });
        g.rect(pos.x - 9, pos.y + 3, 18, 2);
        g.fill({ color: 0x6b5030 });

        // Books (pixel blocks)
        const bookColors = [0x4a6fa5, 0xc44e52, 0x8fbc8f, 0xd4a574, 0x7b68ee];
        for (let i = 0; i < 5; i++) {
          const bx = pos.x - 8 + i * 4;
          const bh = 3 + (i * 13 % 4);
          g.rect(bx, pos.y - 10 + (6 - bh), 3, bh);
          g.fill({ color: bookColors[i] });
        }
        for (let i = 0; i < 4; i++) {
          const bx = pos.x - 7 + i * 5;
          const bh = 2 + (i * 7 % 3);
          g.rect(bx, pos.y - 3 + (5 - bh), 3, bh);
          g.fill({ color: bookColors[(i + 2) % 5] });
        }
        break;
      }
      case 'server': {
        // Server rack — pixel art with LED lights
        g.rect(pos.x - 5, pos.y - 14, 10, 20);
        g.fill({ color: 0x1a1a28 });
        g.stroke({ color: 0x2a2a40, width: 1 });

        // Drive bays
        for (let i = 0; i < 5; i++) {
          const sy = pos.y - 12 + i * 4;
          g.rect(pos.x - 4, sy, 8, 3);
          g.fill({ color: 0x222238 });
        }

        // LEDs (pixel dots)
        for (let i = 0; i < 5; i++) {
          const ly = pos.y - 11 + i * 4;
          g.rect(pos.x - 3, ly, 2, 2);
          g.fill({ color: i < 3 ? 0x00ff88 : 0x00bfff });
          g.rect(pos.x + 2, ly, 2, 2);
          g.fill({ color: 0xff8c00, alpha: 0.4 + i * 0.12 });
        }
        break;
      }
      case 'whiteboard': {
        // Whiteboard — pixel art
        g.rect(pos.x - 12, pos.y - 10, 24, 16);
        g.fill({ color: 0x555560 });
        // White surface
        g.rect(pos.x - 11, pos.y - 9, 22, 14);
        g.fill({ color: 0xe8e8e8, alpha: 0.2 });

        // Scribbles (pixel lines)
        g.rect(pos.x - 8, pos.y - 7, 10, 1);
        g.fill({ color: accent, alpha: 0.4 });
        g.rect(pos.x - 6, pos.y - 4, 14, 1);
        g.fill({ color: 0x00bfff, alpha: 0.3 });
        g.rect(pos.x - 4, pos.y - 1, 8, 1);
        g.fill({ color: 0x00ff88, alpha: 0.25 });
        // Box
        g.rect(pos.x - 3, pos.y + 1, 6, 4);
        g.stroke({ color: accent, width: 1, alpha: 0.25 });

        // Marker tray
        g.rect(pos.x - 8, pos.y + 5, 16, 2);
        g.fill({ color: 0x555560 });
        // Markers
        g.rect(pos.x - 3, pos.y + 5, 2, 2);
        g.fill({ color: 0xff4444 });
        g.rect(pos.x, pos.y + 5, 2, 2);
        g.fill({ color: 0x00ff88 });
        g.rect(pos.x + 3, pos.y + 5, 2, 2);
        g.fill({ color: 0x00bfff });
        break;
      }
      case 'couch': {
        // Pixel art couch — warm colored blocks
        // Back
        g.roundRect(pos.x - 12, pos.y - 4, 24, 5, 1);
        g.fill({ color: 0x8b4513 });
        // Cushions (two blocks)
        g.rect(pos.x - 11, pos.y + 1, 10, 6);
        g.fill({ color: 0xa0522d });
        g.rect(pos.x + 1, pos.y + 1, 10, 6);
        g.fill({ color: 0xa0522d });
        // Arms
        g.rect(pos.x - 13, pos.y - 2, 3, 8);
        g.fill({ color: 0x8b4513 });
        g.rect(pos.x + 10, pos.y - 2, 3, 8);
        g.fill({ color: 0x8b4513 });
        // Pillow
        g.rect(pos.x - 8, pos.y - 1, 5, 3);
        g.fill({ color: accent, alpha: 0.3 });
        break;
      }
      case 'coffee': {
        // Coffee table — small, warm wood
        g.poly([
          { x: pos.x, y: pos.y - 1 },
          { x: pos.x + 10, y: pos.y + 4 },
          { x: pos.x, y: pos.y + 9 },
          { x: pos.x - 10, y: pos.y + 4 },
        ]);
        g.fill({ color: 0x6b5030 });
        // Edge
        g.poly([
          { x: pos.x + 10, y: pos.y + 4 },
          { x: pos.x, y: pos.y + 9 },
          { x: pos.x, y: pos.y + 11 },
          { x: pos.x + 10, y: pos.y + 6 },
        ]);
        g.fill({ color: 0x4a3820 });

        // Coffee cup (pixel art)
        g.rect(pos.x, pos.y + 1, 4, 4);
        g.fill({ color: 0xf0f0f0, alpha: 0.6 });
        g.rect(pos.x + 1, pos.y + 2, 2, 2);
        g.fill({ color: 0x5a3010, alpha: 0.7 });
        break;
      }
    }

    container.addChild(g);
  }

  updateAgents(agents: AgentData[]) {
    for (const agentData of agents) {
      let sprite = this.agentSprites.get(agentData.id);
      if (!sprite) {
        sprite = new AgentSprite(agentData);
        this.agentSprites.set(agentData.id, sprite);
        this.world.addChild(sprite.container);
      }
      sprite.update(agentData);
    }
  }

  destroy() {
    window.removeEventListener('resize', () => this.centerCamera());
    this.app.destroy(true);
  }
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (color & 0xff) * (1 - amount));
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
