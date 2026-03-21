import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TILE_W, TILE_H, toScreen } from './iso';
import { ROOMS, BUILDING, FURNITURE, type RoomDef, type FurnitureDef } from './rooms';
import { AgentSprite, type AgentData } from './Agent';

// Tall 3D walls like Gather.town / OpenClaw
const WALL_H = 52;
const WALL_THICKNESS = 4; // isometric depth of wall top face

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
      background: 0x1a1a28,
      antialias: false,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    this.app.stage.addChild(this.world);
    this.world.sortableChildren = true;

    this.centerCamera();
    this.drawBuilding();

    window.addEventListener('resize', () => this.centerCamera());
  }

  private centerCamera() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const center = toScreen(BUILDING.w / 2, BUILDING.h / 2);
    this.world.x = sw / 2 - center.x;
    this.world.y = sh / 2.5 - center.y;
  }

  private drawBuilding() {
    this.drawBuildingShell();
    for (const room of ROOMS) {
      this.drawRoomFloor(room);
    }
    this.drawInternalWalls();
    for (const room of ROOMS) {
      const accent = parseInt(room.color.slice(1), 16);
      for (const furn of FURNITURE.filter(f => f.room === room.id)) {
        this.drawFurniture(furn, accent, room);
      }
    }
    this.drawRoomLabels();
  }

  /** Solid 3D building shell — tall back wall + left wall with top face */
  private drawBuildingShell() {
    const c = new Container();
    c.sortableChildren = true;

    const { col, row, w, h } = BUILDING;
    const tl = toScreen(col, row);
    const tr = toScreen(col + w, row);
    const bl = toScreen(col, row + h);

    // ── Back wall face ──
    const back = new Graphics();
    back.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_H },
      { x: tr.x, y: tr.y - WALL_H },
      { x: tr.x, y: tr.y },
    ]);
    back.fill({ color: 0x5a5a6e });
    // Subtle horizontal lines for texture
    for (let i = 1; i <= 5; i++) {
      const frac = i / 6;
      back.moveTo(tl.x, tl.y - WALL_H * (1 - frac));
      back.lineTo(tr.x, tr.y - WALL_H * (1 - frac));
      back.stroke({ color: 0x505064, width: 1, alpha: 0.4 });
    }
    back.zIndex = -10;
    c.addChild(back);

    // ── Back wall top face (3D thickness) ──
    const backTop = new Graphics();
    backTop.poly([
      { x: tl.x, y: tl.y - WALL_H },
      { x: tl.x + WALL_THICKNESS, y: tl.y - WALL_H - WALL_THICKNESS / 2 },
      { x: tr.x + WALL_THICKNESS, y: tr.y - WALL_H - WALL_THICKNESS / 2 },
      { x: tr.x, y: tr.y - WALL_H },
    ]);
    backTop.fill({ color: 0x72728a });
    backTop.zIndex = -9;
    c.addChild(backTop);

    // ── Left wall face ──
    const left = new Graphics();
    left.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_H },
      { x: bl.x, y: bl.y - WALL_H },
      { x: bl.x, y: bl.y },
    ]);
    left.fill({ color: 0x4e4e62 });
    for (let i = 1; i <= 5; i++) {
      const frac = i / 6;
      left.moveTo(tl.x, tl.y - WALL_H * (1 - frac));
      left.lineTo(bl.x, bl.y - WALL_H * (1 - frac));
      left.stroke({ color: 0x444458, width: 1, alpha: 0.4 });
    }
    left.zIndex = -10;
    c.addChild(left);

    // ── Left wall top face ──
    const leftTop = new Graphics();
    leftTop.poly([
      { x: tl.x, y: tl.y - WALL_H },
      { x: tl.x + WALL_THICKNESS, y: tl.y - WALL_H - WALL_THICKNESS / 2 },
      { x: bl.x + WALL_THICKNESS, y: bl.y - WALL_H - WALL_THICKNESS / 2 },
      { x: bl.x, y: bl.y - WALL_H },
    ]);
    leftTop.fill({ color: 0x686880 });
    leftTop.zIndex = -9;
    c.addChild(leftTop);

    // ── Building sign ──
    const signPos = toScreen(col + w / 2, row);
    const sign = new Text({
      text: 'SAGE TEAM HQ',
      style: new TextStyle({
        fontSize: 12,
        fill: '#ffffff',
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '700',
        letterSpacing: 2,
        dropShadow: { color: '#000000', blur: 4, distance: 1, alpha: 0.8 },
        stroke: { color: '#000000', width: 2 },
      }),
    });
    sign.anchor.set(0.5, 0.5);
    sign.x = signPos.x;
    sign.y = signPos.y - WALL_H - 8;
    sign.zIndex = -8;
    c.addChild(sign);

    this.world.addChild(c);
  }

  /** Warm floor tiles — clean, subtle variation */
  private drawRoomFloor(room: RoomDef) {
    const c = new Container();
    c.sortableChildren = true;
    const brPos = toScreen(room.col + room.w, room.row + room.h);
    c.zIndex = brPos.y - 1000;

    const floorColor = parseInt(room.floorColor.slice(1), 16);

    for (let col = 0; col < room.w; col++) {
      for (let row = 0; row < room.h; row++) {
        const pos = toScreen(room.col + col, room.row + row);
        const tile = new Graphics();
        const isAlt = (col + row) % 2 === 0;

        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.fill({ color: isAlt ? floorColor : darken(floorColor, 0.05) });

        // Very subtle tile border
        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.stroke({ color: 0x000000, width: 0.5, alpha: 0.08 });

        tile.x = pos.x;
        tile.y = pos.y;
        c.addChild(tile);
      }
    }

    this.world.addChild(c);
  }

  /** Room labels — clean white text */
  private drawRoomLabels() {
    for (const room of ROOMS) {
      const pos = toScreen(room.col + room.w / 2, room.row + 0.4);

      const label = new Text({
        text: `${room.icon} ${room.label}`,
        style: new TextStyle({
          fontSize: 9,
          fill: '#ffffff',
          fontFamily: "'Courier New', 'Consolas', monospace",
          fontWeight: '700',
          letterSpacing: 0.5,
          dropShadow: { color: '#000000', blur: 3, distance: 1, alpha: 0.9 },
          stroke: { color: '#000000', width: 2.5 },
        }),
      });
      label.anchor.set(0.5, 0.5);
      label.x = pos.x;
      label.y = pos.y;
      label.zIndex = pos.y + 501;
      this.world.addChild(label);
    }
  }

  /** Solid 3D internal walls with top face and doorways */
  private drawInternalWalls() {
    const c = new Container();
    c.sortableChildren = true;

    const segments: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      side: 'h' | 'v';
    }> = [];

    for (let i = 0; i < ROOMS.length; i++) {
      for (let j = i + 1; j < ROOMS.length; j++) {
        const a = ROOMS[i];
        const b = ROOMS[j];

        // Horizontal edge (a bottom = b top)
        if (a.row + a.h === b.row) {
          const s = Math.max(a.col, b.col);
          const e = Math.min(a.col + a.w, b.col + b.w);
          if (s < e) segments.push({ from: toScreen(s, a.row + a.h), to: toScreen(e, a.row + a.h), side: 'h' });
        }
        if (b.row + b.h === a.row) {
          const s = Math.max(a.col, b.col);
          const e = Math.min(a.col + a.w, b.col + b.w);
          if (s < e) segments.push({ from: toScreen(s, b.row + b.h), to: toScreen(e, b.row + b.h), side: 'h' });
        }

        // Vertical edge
        if (a.col + a.w === b.col) {
          const s = Math.max(a.row, b.row);
          const e = Math.min(a.row + a.h, b.row + b.h);
          if (s < e) segments.push({ from: toScreen(a.col + a.w, s), to: toScreen(a.col + a.w, e), side: 'v' });
        }
        if (b.col + b.w === a.col) {
          const s = Math.max(a.row, b.row);
          const e = Math.min(a.row + a.h, b.row + b.h);
          if (s < e) segments.push({ from: toScreen(b.col + b.w, s), to: toScreen(b.col + b.w, e), side: 'v' });
        }
      }
    }

    for (const seg of segments) {
      const wh = WALL_H * 0.7; // Internal walls slightly shorter
      const wall = new Graphics();

      // Wall face — solid
      const faceColor = seg.side === 'h' ? 0x585868 : 0x505060;
      wall.poly([
        seg.from,
        { x: seg.from.x, y: seg.from.y - wh },
        { x: seg.to.x, y: seg.to.y - wh },
        seg.to,
      ]);
      wall.fill({ color: faceColor });

      // Subtle horizontal lines
      for (let i = 1; i <= 3; i++) {
        const frac = i / 4;
        wall.moveTo(seg.from.x, seg.from.y - wh * (1 - frac));
        wall.lineTo(seg.to.x, seg.to.y - wh * (1 - frac));
        wall.stroke({ color: darken(faceColor, 0.08), width: 1, alpha: 0.5 });
      }

      // Wall top face (3D depth)
      const topColor = seg.side === 'h' ? 0x6e6e80 : 0x666678;
      wall.poly([
        { x: seg.from.x, y: seg.from.y - wh },
        { x: seg.from.x + WALL_THICKNESS * 0.8, y: seg.from.y - wh - WALL_THICKNESS * 0.4 },
        { x: seg.to.x + WALL_THICKNESS * 0.8, y: seg.to.y - wh - WALL_THICKNESS * 0.4 },
        { x: seg.to.x, y: seg.to.y - wh },
      ]);
      wall.fill({ color: topColor });

      // Doorway — dark opening in center of wall
      const mx = (seg.from.x + seg.to.x) / 2;
      const my = (seg.from.y + seg.to.y) / 2;
      const dw = seg.side === 'h' ? 8 : 5;
      const dh = wh * 0.78;
      // Door opening
      wall.rect(mx - dw, my - dh, dw * 2, dh);
      wall.fill({ color: 0x12121e });
      // Door frame — thin border
      wall.rect(mx - dw - 1, my - dh - 1, dw * 2 + 2, 2);
      wall.fill({ color: 0x7a7a8e });

      wall.zIndex = Math.max(seg.from.y, seg.to.y) - 500;
      c.addChild(wall);
    }

    this.world.addChild(c);
  }

  /** Warm-toned furniture — brown wood desks, blue monitor screens */
  private drawFurniture(furn: FurnitureDef, accent: number, room: RoomDef) {
    const pos = toScreen(furn.col, furn.row);
    const g = new Graphics();
    g.zIndex = pos.y;

    switch (furn.type) {
      case 'desk': {
        // Brown wooden desk — isometric
        g.poly([
          { x: pos.x, y: pos.y - 5 },
          { x: pos.x + 24, y: pos.y + 7 },
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x - 24, y: pos.y + 7 },
        ]);
        g.fill({ color: 0x8b6f4a });
        // Surface highlight
        g.poly([
          { x: pos.x, y: pos.y - 4 },
          { x: pos.x + 20, y: pos.y + 6 },
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x - 20, y: pos.y + 6 },
        ]);
        g.fill({ color: 0xa08058 });
        // Front panel (right side)
        g.poly([
          { x: pos.x + 24, y: pos.y + 7 },
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x, y: pos.y + 22 },
          { x: pos.x + 24, y: pos.y + 10 },
        ]);
        g.fill({ color: 0x6b5030 });
        // Left panel
        g.poly([
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x - 24, y: pos.y + 7 },
          { x: pos.x - 24, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 22 },
        ]);
        g.fill({ color: 0x5a4028 });
        break;
      }

      case 'monitor': {
        // Monitor with blue/white screen
        const sw = 16, sh = 12;
        // Body
        g.rect(pos.x - sw / 2, pos.y - sh - 6, sw, sh);
        g.fill({ color: 0x2a2a2a });
        // Screen — bright blue/white
        g.rect(pos.x - sw / 2 + 1, pos.y - sh - 5, sw - 2, sh - 2);
        g.fill({ color: 0x1a3050 });
        // Code lines — bright and visible
        const lineColors = [0x66bbff, 0x88ddaa, 0xffaa66, 0x66bbff, 0xdddddd];
        for (let i = 0; i < 5; i++) {
          const lw = 3 + ((i * 7 + 3) % 9);
          g.rect(pos.x - sw / 2 + 3, pos.y - sh - 3 + i * 2.2, lw, 1);
          g.fill({ color: lineColors[i], alpha: 0.7 });
        }
        // Screen glow
        g.rect(pos.x - sw / 2 + 1, pos.y - sh - 5, sw - 2, sh - 2);
        g.fill({ color: 0x4488cc, alpha: 0.08 });
        // Stand
        g.rect(pos.x - 1, pos.y - 6, 3, 3);
        g.fill({ color: 0x333333 });
        g.rect(pos.x - 4, pos.y - 3, 9, 2);
        g.fill({ color: 0x333333 });
        break;
      }

      case 'plant': {
        // Green plant in brown pot
        g.poly([
          { x: pos.x - 4, y: pos.y + 2 },
          { x: pos.x + 4, y: pos.y + 2 },
          { x: pos.x + 3, y: pos.y + 9 },
          { x: pos.x - 3, y: pos.y + 9 },
        ]);
        g.fill({ color: 0x8b5a3a });
        g.rect(pos.x - 5, pos.y + 1, 10, 2);
        g.fill({ color: 0x9b6a4a });
        // Leaves
        g.circle(pos.x, pos.y - 3, 7);
        g.fill({ color: 0x2d8a4e, alpha: 0.85 });
        g.circle(pos.x - 3, pos.y - 1, 5);
        g.fill({ color: 0x228b22, alpha: 0.8 });
        g.circle(pos.x + 3, pos.y - 1, 5);
        g.fill({ color: 0x3cb371, alpha: 0.8 });
        g.circle(pos.x, pos.y - 7, 5);
        g.fill({ color: 0x45b868, alpha: 0.75 });
        break;
      }

      case 'server': {
        // Dark server rack with colored LEDs
        g.rect(pos.x - 6, pos.y - 16, 12, 22);
        g.fill({ color: 0x1a1a28 });
        g.stroke({ color: 0x2a2a3a, width: 1 });
        for (let i = 0; i < 5; i++) {
          const sy = pos.y - 14 + i * 4;
          g.rect(pos.x - 5, sy, 10, 3);
          g.fill({ color: 0x222233 });
        }
        // LEDs
        for (let i = 0; i < 5; i++) {
          const ly = pos.y - 13 + i * 4;
          g.rect(pos.x - 4, ly, 2, 2);
          g.fill({ color: i < 3 ? 0x00ff88 : 0x00bfff });
          g.rect(pos.x + 2, ly, 2, 2);
          g.fill({ color: 0xff8c00, alpha: 0.4 + i * 0.12 });
        }
        break;
      }

      case 'shelf': {
        g.rect(pos.x - 12, pos.y - 12, 24, 20);
        g.fill({ color: 0x5a4020 });
        g.stroke({ color: 0x6b5030, width: 1 });
        g.rect(pos.x - 11, pos.y - 4, 22, 2);
        g.fill({ color: 0x6b5030 });
        g.rect(pos.x - 11, pos.y + 3, 22, 2);
        g.fill({ color: 0x6b5030 });
        const bk = [0x4a6fa5, 0xc44e52, 0x8fbc8f, 0xd4a574, 0x7b68ee];
        for (let i = 0; i < 5; i++) {
          const bx = pos.x - 10 + i * 4.5;
          const bh = 4 + (i * 13 % 4);
          g.rect(bx, pos.y - 10 + (7 - bh), 3, bh);
          g.fill({ color: bk[i] });
        }
        for (let i = 0; i < 4; i++) {
          const bx = pos.x - 9 + i * 5.5;
          const bh = 3 + (i * 7 % 3);
          g.rect(bx, pos.y - 3 + (5 - bh), 3, bh);
          g.fill({ color: bk[(i + 2) % 5] });
        }
        break;
      }

      case 'whiteboard': {
        g.rect(pos.x - 14, pos.y - 12, 28, 20);
        g.fill({ color: 0x555560 });
        g.rect(pos.x - 12, pos.y - 10, 24, 16);
        g.fill({ color: 0xdddde0, alpha: 0.3 });
        // Scribbles
        g.rect(pos.x - 9, pos.y - 8, 12, 1);
        g.fill({ color: 0x4466aa, alpha: 0.5 });
        g.rect(pos.x - 7, pos.y - 5, 16, 1);
        g.fill({ color: 0x44aa66, alpha: 0.4 });
        g.rect(pos.x - 5, pos.y - 2, 10, 1);
        g.fill({ color: 0xaa4444, alpha: 0.35 });
        // Tray
        g.rect(pos.x - 9, pos.y + 6, 18, 2);
        g.fill({ color: 0x555560 });
        g.rect(pos.x - 3, pos.y + 6, 2, 2);
        g.fill({ color: 0xff4444 });
        g.rect(pos.x, pos.y + 6, 2, 2);
        g.fill({ color: 0x44bb44 });
        g.rect(pos.x + 3, pos.y + 6, 2, 2);
        g.fill({ color: 0x4488ff });
        break;
      }

      case 'table': {
        // Round-ish conference table — brown wood
        g.poly([
          { x: pos.x, y: pos.y - 5 },
          { x: pos.x + 30, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 25 },
          { x: pos.x - 30, y: pos.y + 10 },
        ]);
        g.fill({ color: 0x6b5a3a });
        // Surface
        g.poly([
          { x: pos.x, y: pos.y - 3 },
          { x: pos.x + 26, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 23 },
          { x: pos.x - 26, y: pos.y + 10 },
        ]);
        g.fill({ color: 0x8b7050 });
        // Front depth
        g.poly([
          { x: pos.x + 30, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 25 },
          { x: pos.x, y: pos.y + 28 },
          { x: pos.x + 30, y: pos.y + 13 },
        ]);
        g.fill({ color: 0x4a3a20 });
        break;
      }

      case 'couch': {
        // Warm brown couch
        g.roundRect(pos.x - 14, pos.y - 5, 28, 6, 2);
        g.fill({ color: 0x8b4513 });
        g.rect(pos.x - 13, pos.y + 1, 12, 7);
        g.fill({ color: 0xa0522d });
        g.rect(pos.x + 1, pos.y + 1, 12, 7);
        g.fill({ color: 0xa0522d });
        // Arms
        g.rect(pos.x - 15, pos.y - 3, 3, 10);
        g.fill({ color: 0x8b4513 });
        g.rect(pos.x + 12, pos.y - 3, 3, 10);
        g.fill({ color: 0x8b4513 });
        // Pillow
        g.rect(pos.x - 9, pos.y - 2, 6, 4);
        g.fill({ color: accent, alpha: 0.35 });
        break;
      }

      case 'coffee': {
        // Small wooden coffee table
        g.poly([
          { x: pos.x, y: pos.y - 1 },
          { x: pos.x + 12, y: pos.y + 5 },
          { x: pos.x, y: pos.y + 11 },
          { x: pos.x - 12, y: pos.y + 5 },
        ]);
        g.fill({ color: 0x6b5030 });
        g.poly([
          { x: pos.x + 12, y: pos.y + 5 },
          { x: pos.x, y: pos.y + 11 },
          { x: pos.x, y: pos.y + 13 },
          { x: pos.x + 12, y: pos.y + 7 },
        ]);
        g.fill({ color: 0x4a3820 });
        // Coffee cup
        g.rect(pos.x, pos.y + 1, 4, 4);
        g.fill({ color: 0xf0f0f0, alpha: 0.6 });
        g.rect(pos.x + 1, pos.y + 2, 2, 2);
        g.fill({ color: 0x5a3010, alpha: 0.7 });
        break;
      }

      case 'chair': {
        g.ellipse(pos.x, pos.y + 1, 6, 3);
        g.fill({ color: 0x333348 });
        g.rect(pos.x - 4, pos.y - 4, 8, 4);
        g.fill({ color: 0x2a2a40 });
        break;
      }

      case 'rug': {
        const rw = TILE_W * 1.2;
        const rh = TILE_H * 1.2;
        g.poly([
          { x: pos.x, y: pos.y },
          { x: pos.x + rw / 2, y: pos.y + rh / 2 },
          { x: pos.x, y: pos.y + rh },
          { x: pos.x - rw / 2, y: pos.y + rh / 2 },
        ]);
        g.fill({ color: accent, alpha: 0.08 });
        g.zIndex = pos.y - 1000;
        break;
      }
    }

    this.world.addChild(g);
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
