import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TILE_W, TILE_H, toScreen } from './iso';
import { ROOMS, BUILDING, FURNITURE, type RoomDef, type FurnitureDef } from './rooms';
import { AgentSprite, type AgentData } from './Agent';

const WALL_H = 36;

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
      background: 0x0a0a18,
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
    this.drawAmbientGlow();
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

  /** Soft ambient glow beneath the building */
  private drawAmbientGlow() {
    const g = new Graphics();
    const center = toScreen(BUILDING.w / 2, BUILDING.h / 2);
    // Large soft glow
    g.ellipse(center.x, center.y + 20, 500, 250);
    g.fill({ color: 0x1a1a3a, alpha: 0.4 });
    g.ellipse(center.x, center.y + 20, 350, 180);
    g.fill({ color: 0x1e1e40, alpha: 0.3 });
    g.zIndex = -100;
    this.world.addChild(g);
  }

  /** Building shell — dark steel walls with neon gold accent */
  private drawBuildingShell() {
    const c = new Container();
    c.sortableChildren = true;

    const { col, row, w, h } = BUILDING;
    const tl = toScreen(col, row);
    const tr = toScreen(col + w, row);
    const bl = toScreen(col, row + h);
    const br = toScreen(col + w, row + h);

    // ── Back wall ──
    const back = new Graphics();
    back.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_H },
      { x: tr.x, y: tr.y - WALL_H },
      { x: tr.x, y: tr.y },
    ]);
    back.fill({ color: 0x16162a });
    // Subtle horizontal bands
    for (let i = 1; i <= 3; i++) {
      const frac = i / 4;
      back.moveTo(tl.x, tl.y - WALL_H * (1 - frac));
      back.lineTo(tr.x, tr.y - WALL_H * (1 - frac));
      back.stroke({ color: 0x222240, width: 1, alpha: 0.5 });
    }
    // Neon top accent
    back.moveTo(tl.x, tl.y - WALL_H);
    back.lineTo(tr.x, tr.y - WALL_H);
    back.stroke({ color: 0xffd700, width: 2, alpha: 0.8 });
    // Bottom edge glow
    back.moveTo(tl.x, tl.y);
    back.lineTo(tr.x, tr.y);
    back.stroke({ color: 0xffd700, width: 1, alpha: 0.15 });
    back.zIndex = -10;
    c.addChild(back);

    // ── Left wall ──
    const left = new Graphics();
    left.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_H },
      { x: bl.x, y: bl.y - WALL_H },
      { x: bl.x, y: bl.y },
    ]);
    left.fill({ color: 0x121228 });
    for (let i = 1; i <= 3; i++) {
      const frac = i / 4;
      left.moveTo(tl.x, tl.y - WALL_H * (1 - frac));
      left.lineTo(bl.x, bl.y - WALL_H * (1 - frac));
      left.stroke({ color: 0x1e1e3a, width: 1, alpha: 0.5 });
    }
    left.moveTo(tl.x, tl.y - WALL_H);
    left.lineTo(bl.x, bl.y - WALL_H);
    left.stroke({ color: 0xffd700, width: 2, alpha: 0.6 });
    left.zIndex = -10;
    c.addChild(left);

    // ── Building sign with glow backdrop ──
    const signPos = toScreen(col + w / 2, row);
    // Glow behind sign
    const signGlow = new Graphics();
    signGlow.roundRect(signPos.x - 70, signPos.y - WALL_H - 22, 140, 20, 4);
    signGlow.fill({ color: 0xffd700, alpha: 0.08 });
    signGlow.zIndex = -9;
    c.addChild(signGlow);

    const sign = new Text({
      text: '\u2727 SAGE TEAM HQ \u2727',
      style: new TextStyle({
        fontSize: 13,
        fill: '#ffd700',
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '700',
        letterSpacing: 3,
        dropShadow: { color: '#ffd700', blur: 8, distance: 0, alpha: 0.5 },
        stroke: { color: '#000000', width: 2 },
      }),
    });
    sign.anchor.set(0.5, 0.5);
    sign.x = signPos.x;
    sign.y = signPos.y - WALL_H - 12;
    sign.zIndex = -9;
    c.addChild(sign);

    // ── Floor outline ──
    const outline = new Graphics();
    outline.poly([tl, tr, br, bl]);
    outline.stroke({ color: 0xffd700, width: 1, alpha: 0.08 });
    outline.zIndex = -5;
    c.addChild(outline);

    this.world.addChild(c);
  }

  /** Room floor — clean flat fill with ambient glow, no checkerboard */
  private drawRoomFloor(room: RoomDef) {
    const c = new Container();
    c.sortableChildren = true;
    const brPos = toScreen(room.col + room.w, room.row + room.h);
    c.zIndex = brPos.y - 1000;

    const floorColor = parseInt(room.floorColor.slice(1), 16);
    const accent = parseInt(room.color.slice(1), 16);

    // Room floor — single clean diamond per tile, very subtle variation
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
        // Very subtle alternation — not a checkerboard, just depth
        tile.fill({ color: floorColor, alpha: isAlt ? 1.0 : 0.92 });

        // Hairline grid — barely visible
        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.stroke({ color: 0xffffff, width: 0.5, alpha: 0.03 });

        tile.x = pos.x;
        tile.y = pos.y;
        c.addChild(tile);
      }
    }

    // Ambient room glow — soft colored light on floor center
    const centerPos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
    const glow = new Graphics();
    glow.ellipse(centerPos.x, centerPos.y + TILE_H / 2, room.w * 18, room.h * 10);
    glow.fill({ color: accent, alpha: 0.04 });
    c.addChild(glow);

    // Room accent border — thin neon line
    const tl = toScreen(room.col, room.row);
    const tr = toScreen(room.col + room.w, room.row);
    const br = toScreen(room.col + room.w, room.row + room.h);
    const bl = toScreen(room.col, room.row + room.h);
    const border = new Graphics();
    border.poly([tl, tr, br, bl]);
    border.stroke({ color: accent, width: 1, alpha: 0.12 });
    c.addChild(border);

    this.world.addChild(c);
  }

  /** Room labels — clear, readable, with glow */
  private drawRoomLabels() {
    for (const room of ROOMS) {
      const accent = parseInt(room.color.slice(1), 16);
      const pos = toScreen(room.col + room.w / 2, room.row + 0.3);

      // Glow backdrop behind label
      const backdrop = new Graphics();
      backdrop.roundRect(pos.x - 40, pos.y - 8, 80, 16, 3);
      backdrop.fill({ color: 0x000000, alpha: 0.5 });
      backdrop.roundRect(pos.x - 40, pos.y - 8, 80, 16, 3);
      backdrop.stroke({ color: accent, width: 0.5, alpha: 0.3 });
      backdrop.zIndex = pos.y + 500;
      this.world.addChild(backdrop);

      const label = new Text({
        text: `${room.icon} ${room.label}`,
        style: new TextStyle({
          fontSize: 10,
          fill: '#ffffff',
          fontFamily: "'Courier New', 'Consolas', monospace",
          fontWeight: '700',
          letterSpacing: 0.8,
          dropShadow: { color: room.color, blur: 6, distance: 0, alpha: 0.6 },
          stroke: { color: '#000000', width: 2 },
        }),
      });
      label.anchor.set(0.5, 0.5);
      label.x = pos.x;
      label.y = pos.y;
      label.zIndex = pos.y + 501;
      this.world.addChild(label);
    }
  }

  /** Glass internal walls with neon accent edges */
  private drawInternalWalls() {
    const c = new Container();
    c.sortableChildren = true;

    const segments: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      color: number;
      side: 'h' | 'v';
    }> = [];

    for (let i = 0; i < ROOMS.length; i++) {
      for (let j = i + 1; j < ROOMS.length; j++) {
        const a = ROOMS[i];
        const b = ROOMS[j];
        const ca = parseInt(a.color.slice(1), 16);
        const cb = parseInt(b.color.slice(1), 16);
        const mix = blendColors(ca, cb, 0.5);

        // Horizontal shared edge (a bottom = b top)
        if (a.row + a.h === b.row) {
          const s = Math.max(a.col, b.col);
          const e = Math.min(a.col + a.w, b.col + b.w);
          if (s < e) segments.push({ from: toScreen(s, a.row + a.h), to: toScreen(e, a.row + a.h), color: mix, side: 'h' });
        }
        if (b.row + b.h === a.row) {
          const s = Math.max(a.col, b.col);
          const e = Math.min(a.col + a.w, b.col + b.w);
          if (s < e) segments.push({ from: toScreen(s, b.row + b.h), to: toScreen(e, b.row + b.h), color: mix, side: 'h' });
        }

        // Vertical shared edge (a right = b left)
        if (a.col + a.w === b.col) {
          const s = Math.max(a.row, b.row);
          const e = Math.min(a.row + a.h, b.row + b.h);
          if (s < e) segments.push({ from: toScreen(a.col + a.w, s), to: toScreen(a.col + a.w, e), color: mix, side: 'v' });
        }
        if (b.col + b.w === a.col) {
          const s = Math.max(a.row, b.row);
          const e = Math.min(a.row + a.h, b.row + b.h);
          if (s < e) segments.push({ from: toScreen(b.col + b.w, s), to: toScreen(b.col + b.w, e), color: mix, side: 'v' });
        }
      }
    }

    for (const seg of segments) {
      const wh = WALL_H * 0.65;
      const wall = new Graphics();

      // Glass wall panel — dark, semi-transparent
      wall.poly([
        seg.from,
        { x: seg.from.x, y: seg.from.y - wh },
        { x: seg.to.x, y: seg.to.y - wh },
        seg.to,
      ]);
      wall.fill({ color: seg.side === 'h' ? 0x181830 : 0x141428, alpha: 0.75 });

      // Glass highlight — very subtle vertical gradient illusion
      wall.poly([
        { x: seg.from.x, y: seg.from.y - wh },
        { x: seg.to.x, y: seg.to.y - wh },
        { x: seg.to.x, y: seg.to.y - wh * 0.6 },
        { x: seg.from.x, y: seg.from.y - wh * 0.6 },
      ]);
      wall.fill({ color: 0xffffff, alpha: 0.03 });

      // Neon top accent — bright colored line
      wall.moveTo(seg.from.x, seg.from.y - wh);
      wall.lineTo(seg.to.x, seg.to.y - wh);
      wall.stroke({ color: seg.color, width: 2, alpha: 0.7 });

      // Subtle bottom edge
      wall.moveTo(seg.from.x, seg.from.y);
      wall.lineTo(seg.to.x, seg.to.y);
      wall.stroke({ color: seg.color, width: 1, alpha: 0.1 });

      // Doorway — clean arch opening
      const mx = (seg.from.x + seg.to.x) / 2;
      const my = (seg.from.y + seg.to.y) / 2;
      const dw = seg.side === 'h' ? 8 : 5;
      const dh = wh * 0.8;
      // Dark opening
      wall.rect(mx - dw, my - dh, dw * 2, dh);
      wall.fill({ color: 0x08081a, alpha: 0.95 });
      // Door arch accent
      wall.roundRect(mx - dw - 1, my - dh - 2, dw * 2 + 2, 3, 1);
      wall.fill({ color: seg.color, alpha: 0.4 });

      wall.zIndex = Math.max(seg.from.y, seg.to.y) - 500;
      c.addChild(wall);
    }

    this.world.addChild(c);
  }

  /** Premium furniture rendering */
  private drawFurniture(furn: FurnitureDef, accent: number, room: RoomDef) {
    const pos = toScreen(furn.col, furn.row);
    const g = new Graphics();
    g.zIndex = pos.y;

    switch (furn.type) {
      case 'desk': {
        // Modern dark desk — clean isometric
        g.poly([
          { x: pos.x, y: pos.y - 5 },
          { x: pos.x + 24, y: pos.y + 7 },
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x - 24, y: pos.y + 7 },
        ]);
        g.fill({ color: 0x2a2a3e });
        // Desk surface highlight
        g.poly([
          { x: pos.x, y: pos.y - 5 },
          { x: pos.x + 22, y: pos.y + 6 },
          { x: pos.x, y: pos.y + 17 },
          { x: pos.x - 22, y: pos.y + 6 },
        ]);
        g.fill({ color: 0x36364e });
        // Accent edge strip
        g.moveTo(pos.x - 22, pos.y + 6);
        g.lineTo(pos.x, pos.y - 5);
        g.lineTo(pos.x + 22, pos.y + 6);
        g.stroke({ color: accent, width: 1, alpha: 0.2 });
        // Front panel
        g.poly([
          { x: pos.x + 24, y: pos.y + 7 },
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x, y: pos.y + 22 },
          { x: pos.x + 24, y: pos.y + 10 },
        ]);
        g.fill({ color: 0x1e1e30 });
        g.poly([
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x - 24, y: pos.y + 7 },
          { x: pos.x - 24, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 22 },
        ]);
        g.fill({ color: 0x18182a });
        break;
      }

      case 'monitor': {
        // Glowing monitor — the signature look
        const sw = 18, sh = 14;
        // Monitor body
        g.rect(pos.x - sw / 2, pos.y - sh - 6, sw, sh);
        g.fill({ color: 0x111122 });
        // Screen — glowing
        g.rect(pos.x - sw / 2 + 1, pos.y - sh - 5, sw - 2, sh - 2);
        g.fill({ color: 0x080818 });
        // Code lines on screen
        const lineColors = [accent, 0x00ff88, 0x00bfff, 0xffa500, accent];
        for (let i = 0; i < 5; i++) {
          const lw = 3 + ((i * 7 + 5) % 10);
          g.rect(pos.x - sw / 2 + 3, pos.y - sh - 3 + i * 2.5, lw, 1);
          g.fill({ color: lineColors[i], alpha: 0.6 });
        }
        // Screen glow overlay
        g.rect(pos.x - sw / 2 + 1, pos.y - sh - 5, sw - 2, sh - 2);
        g.fill({ color: accent, alpha: 0.06 });
        // Stand
        g.rect(pos.x - 1, pos.y - 6, 3, 4);
        g.fill({ color: 0x222238 });
        g.rect(pos.x - 5, pos.y - 2, 10, 2);
        g.fill({ color: 0x222238 });
        // Monitor screen light cast — subtle glow on desk
        g.ellipse(pos.x, pos.y + 4, 14, 5);
        g.fill({ color: accent, alpha: 0.04 });
        break;
      }

      case 'plant': {
        // Stylish plant with glow
        g.poly([
          { x: pos.x - 5, y: pos.y + 2 },
          { x: pos.x + 5, y: pos.y + 2 },
          { x: pos.x + 3, y: pos.y + 10 },
          { x: pos.x - 3, y: pos.y + 10 },
        ]);
        g.fill({ color: 0x2a2a3e });
        g.rect(pos.x - 6, pos.y + 1, 12, 2);
        g.fill({ color: 0x36364e });
        // Foliage with glow
        g.circle(pos.x, pos.y - 4, 8);
        g.fill({ color: 0x1a7a3a, alpha: 0.85 });
        g.circle(pos.x - 4, pos.y - 1, 5);
        g.fill({ color: 0x228b22, alpha: 0.8 });
        g.circle(pos.x + 4, pos.y - 1, 5);
        g.fill({ color: 0x2d9e4a, alpha: 0.8 });
        g.circle(pos.x, pos.y - 8, 5);
        g.fill({ color: 0x35b858, alpha: 0.75 });
        // Subtle green glow
        g.circle(pos.x, pos.y - 2, 12);
        g.fill({ color: 0x00ff44, alpha: 0.02 });
        break;
      }

      case 'server': {
        // Server rack with LED lights
        g.rect(pos.x - 6, pos.y - 18, 12, 24);
        g.fill({ color: 0x0e0e1e });
        g.stroke({ color: 0x1e1e38, width: 1 });
        for (let i = 0; i < 6; i++) {
          const sy = pos.y - 16 + i * 4;
          g.rect(pos.x - 5, sy, 10, 3);
          g.fill({ color: 0x141430 });
        }
        // LED lights
        for (let i = 0; i < 6; i++) {
          const ly = pos.y - 15 + i * 4;
          const isActive = i < 4;
          g.rect(pos.x - 4, ly, 2, 2);
          g.fill({ color: isActive ? 0x00ff88 : 0x333344 });
          g.rect(pos.x + 2, ly, 2, 2);
          g.fill({ color: 0x00bfff, alpha: 0.3 + i * 0.1 });
        }
        // Server glow
        g.ellipse(pos.x, pos.y + 8, 10, 4);
        g.fill({ color: 0x00ff88, alpha: 0.03 });
        break;
      }

      case 'shelf': {
        g.rect(pos.x - 12, pos.y - 14, 24, 22);
        g.fill({ color: 0x1e1e30 });
        g.stroke({ color: 0x2a2a40, width: 1 });
        // Shelves
        g.rect(pos.x - 11, pos.y - 5, 22, 2);
        g.fill({ color: 0x2a2a40 });
        g.rect(pos.x - 11, pos.y + 3, 22, 2);
        g.fill({ color: 0x2a2a40 });
        // Books
        const bk = [0x4a6fa5, 0xc44e52, 0x8fbc8f, 0xd4a574, 0x7b68ee];
        for (let i = 0; i < 5; i++) {
          const bx = pos.x - 10 + i * 4.5;
          const bh = 4 + (i * 13 % 4);
          g.rect(bx, pos.y - 12 + (8 - bh), 3, bh);
          g.fill({ color: bk[i] });
        }
        for (let i = 0; i < 4; i++) {
          const bx = pos.x - 9 + i * 5.5;
          const bh = 3 + (i * 7 % 3);
          g.rect(bx, pos.y - 4 + (6 - bh), 3, bh);
          g.fill({ color: bk[(i + 2) % 5] });
        }
        break;
      }

      case 'whiteboard': {
        // Sleek whiteboard
        g.rect(pos.x - 16, pos.y - 14, 32, 22);
        g.fill({ color: 0x1a1a30 });
        g.stroke({ color: 0x2a2a48, width: 1 });
        // Board surface
        g.rect(pos.x - 14, pos.y - 12, 28, 18);
        g.fill({ color: 0x0e0e22 });
        // Content lines
        g.rect(pos.x - 11, pos.y - 10, 12, 1);
        g.fill({ color: accent, alpha: 0.5 });
        g.rect(pos.x - 9, pos.y - 7, 18, 1);
        g.fill({ color: 0x00bfff, alpha: 0.35 });
        g.rect(pos.x - 7, pos.y - 4, 10, 1);
        g.fill({ color: 0x00ff88, alpha: 0.3 });
        // Diagram box
        g.rect(pos.x - 4, pos.y - 1, 8, 5);
        g.stroke({ color: accent, width: 1, alpha: 0.3 });
        // Marker tray
        g.rect(pos.x - 10, pos.y + 6, 20, 2);
        g.fill({ color: 0x2a2a40 });
        g.rect(pos.x - 4, pos.y + 6, 2, 2);
        g.fill({ color: 0xff4444 });
        g.rect(pos.x, pos.y + 6, 2, 2);
        g.fill({ color: 0x00ff88 });
        g.rect(pos.x + 4, pos.y + 6, 2, 2);
        g.fill({ color: 0x00bfff });
        break;
      }

      case 'table': {
        // Large conference/meeting table
        g.poly([
          { x: pos.x, y: pos.y - 5 },
          { x: pos.x + 32, y: pos.y + 11 },
          { x: pos.x, y: pos.y + 27 },
          { x: pos.x - 32, y: pos.y + 11 },
        ]);
        g.fill({ color: 0x222238 });
        // Surface highlight
        g.poly([
          { x: pos.x, y: pos.y - 3 },
          { x: pos.x + 28, y: pos.y + 11 },
          { x: pos.x, y: pos.y + 25 },
          { x: pos.x - 28, y: pos.y + 11 },
        ]);
        g.fill({ color: 0x2a2a42 });
        // Center accent
        g.poly([
          { x: pos.x, y: pos.y + 5 },
          { x: pos.x + 12, y: pos.y + 11 },
          { x: pos.x, y: pos.y + 17 },
          { x: pos.x - 12, y: pos.y + 11 },
        ]);
        g.stroke({ color: accent, width: 1, alpha: 0.15 });
        // Front panel
        g.poly([
          { x: pos.x + 32, y: pos.y + 11 },
          { x: pos.x, y: pos.y + 27 },
          { x: pos.x, y: pos.y + 30 },
          { x: pos.x + 32, y: pos.y + 14 },
        ]);
        g.fill({ color: 0x18182e });
        break;
      }

      case 'couch': {
        // Modern dark couch
        g.roundRect(pos.x - 14, pos.y - 5, 28, 6, 2);
        g.fill({ color: 0x2a2a42 });
        g.rect(pos.x - 13, pos.y + 1, 12, 7);
        g.fill({ color: 0x323250 });
        g.rect(pos.x + 1, pos.y + 1, 12, 7);
        g.fill({ color: 0x323250 });
        // Arms
        g.rect(pos.x - 15, pos.y - 3, 3, 10);
        g.fill({ color: 0x2a2a42 });
        g.rect(pos.x + 12, pos.y - 3, 3, 10);
        g.fill({ color: 0x2a2a42 });
        // Accent pillow
        g.rect(pos.x - 9, pos.y - 2, 6, 4);
        g.fill({ color: accent, alpha: 0.25 });
        break;
      }

      case 'coffee': {
        // Coffee table
        g.poly([
          { x: pos.x, y: pos.y - 1 },
          { x: pos.x + 12, y: pos.y + 5 },
          { x: pos.x, y: pos.y + 11 },
          { x: pos.x - 12, y: pos.y + 5 },
        ]);
        g.fill({ color: 0x222238 });
        g.poly([
          { x: pos.x + 12, y: pos.y + 5 },
          { x: pos.x, y: pos.y + 11 },
          { x: pos.x, y: pos.y + 13 },
          { x: pos.x + 12, y: pos.y + 7 },
        ]);
        g.fill({ color: 0x18182e });
        // Coffee cup
        g.rect(pos.x - 1, pos.y + 1, 5, 5);
        g.fill({ color: 0xf0f0f0, alpha: 0.5 });
        g.rect(pos.x, pos.y + 2, 3, 3);
        g.fill({ color: 0x5a3010, alpha: 0.6 });
        break;
      }

      case 'chair': {
        g.ellipse(pos.x, pos.y + 1, 6, 3);
        g.fill({ color: 0x1e1e36 });
        g.rect(pos.x - 4, pos.y - 4, 8, 4);
        g.fill({ color: 0x222240 });
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
        g.fill({ color: accent, alpha: 0.06 });
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

function blendColors(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const blue = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | blue;
}
