import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TILE_W, TILE_H, toScreen } from './iso';
import { ROOMS, BUILDING, SEATS, FURNITURE, getSeatPosition, type RoomDef, type FurnitureDef } from './rooms';
import { AgentSprite, type AgentData } from './Agent';

const WALL_HEIGHT = 28;
const PX = 2;

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
    // Center on the middle of the building
    const center = toScreen(BUILDING.w / 2, BUILDING.h / 2);
    this.world.x = sw / 2 - center.x;
    this.world.y = sh / 2.5 - center.y;
  }

  private drawBuilding() {
    // 1. Draw the outer building shell (floor + outer walls)
    this.drawBuildingShell();

    // 2. Draw each room's floor tiles and internal walls
    for (const room of ROOMS) {
      this.drawRoomFloor(room);
    }

    // 3. Draw internal wall dividers between rooms
    this.drawInternalWalls();

    // 4. Draw furniture in each room
    for (const room of ROOMS) {
      const roomFurniture = FURNITURE.filter(f => f.room === room.id);
      const accentColor = parseInt(room.color.slice(1), 16);
      for (const furn of roomFurniture) {
        this.drawFurniture(furn, accentColor, room);
      }
    }
  }

  /** Draw the outer shell of the building — back and left walls */
  private drawBuildingShell() {
    const container = new Container();
    container.sortableChildren = true;

    const { col, row, w, h } = BUILDING;

    // Corner positions of the entire building
    const tl = toScreen(col, row);
    const tr = toScreen(col + w, row);
    const bl = toScreen(col, row + h);
    const br = toScreen(col + w, row + h);

    // ── Outer back wall (top-left to top-right) ──
    const backWall = new Graphics();
    backWall.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: tr.x, y: tr.y - WALL_HEIGHT },
      { x: tr.x, y: tr.y },
    ]);
    backWall.fill({ color: 0x686878, alpha: 1 });
    // Horizontal panel lines
    for (let i = 1; i <= 4; i++) {
      const frac = i / 5;
      const y1 = tl.y - WALL_HEIGHT * (1 - frac);
      const y2 = tr.y - WALL_HEIGHT * (1 - frac);
      backWall.moveTo(tl.x, y1);
      backWall.lineTo(tr.x, y2);
      backWall.stroke({ color: 0x000000, width: 1, alpha: 0.06 });
    }
    // Top accent line
    backWall.moveTo(tl.x, tl.y - WALL_HEIGHT);
    backWall.lineTo(tr.x, tr.y - WALL_HEIGHT);
    backWall.stroke({ color: 0xffd700, width: 2, alpha: 0.4 });
    backWall.zIndex = -10;
    container.addChild(backWall);

    // ── Outer left wall (top-left to bottom-left) ──
    const leftWall = new Graphics();
    leftWall.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: bl.x, y: bl.y - WALL_HEIGHT },
      { x: bl.x, y: bl.y },
    ]);
    leftWall.fill({ color: 0x787888, alpha: 1 });
    for (let i = 1; i <= 4; i++) {
      const frac = i / 5;
      const y1 = tl.y - WALL_HEIGHT * (1 - frac);
      const y2 = bl.y - WALL_HEIGHT * (1 - frac);
      leftWall.moveTo(tl.x, y1);
      leftWall.lineTo(bl.x, y2);
      leftWall.stroke({ color: 0x000000, width: 1, alpha: 0.06 });
    }
    leftWall.moveTo(tl.x, tl.y - WALL_HEIGHT);
    leftWall.lineTo(bl.x, bl.y - WALL_HEIGHT);
    leftWall.stroke({ color: 0xffd700, width: 2, alpha: 0.3 });
    leftWall.zIndex = -10;
    container.addChild(leftWall);

    // ── Building sign ──
    const signPos = toScreen(col + w / 2, row);
    const sign = new Text({
      text: 'SAGE TEAM HQ',
      style: new TextStyle({
        fontSize: 11,
        fill: '#ffd700',
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '700',
        letterSpacing: 2,
        dropShadow: { color: '#000000', blur: 4, distance: 1, alpha: 1 },
        stroke: { color: '#000000', width: 2 },
      }),
    });
    sign.anchor.set(0.5, 0.5);
    sign.x = signPos.x;
    sign.y = signPos.y - WALL_HEIGHT - 10;
    sign.zIndex = -9;
    container.addChild(sign);

    // ── Floor outline (subtle border around entire building) ──
    const outline = new Graphics();
    outline.poly([tl, tr, br, bl]);
    outline.stroke({ color: 0xffd700, width: 1, alpha: 0.15 });
    outline.zIndex = -5;
    container.addChild(outline);

    this.world.addChild(container);
  }

  /** Draw floor tiles for a room with checkerboard pattern */
  private drawRoomFloor(room: RoomDef) {
    const container = new Container();
    container.sortableChildren = true;
    const brPos = toScreen(room.col + room.w, room.row + room.h);
    container.zIndex = brPos.y - 1000; // Floor below everything

    const floorColor = parseInt(room.floorColor.slice(1), 16);
    const accentColor = parseInt(room.color.slice(1), 16);

    // Floor tiles
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

        // Subtle grid
        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.stroke({ color: 0x000000, width: 0.5, alpha: 0.06 });

        tile.x = pos.x;
        tile.y = pos.y;
        container.addChild(tile);
      }
    }

    // Room accent border on floor (colored line around room boundary)
    const tl = toScreen(room.col, room.row);
    const tr = toScreen(room.col + room.w, room.row);
    const br = toScreen(room.col + room.w, room.row + room.h);
    const bl = toScreen(room.col, room.row + room.h);
    const border = new Graphics();
    border.poly([tl, tr, br, bl]);
    border.stroke({ color: accentColor, width: 1, alpha: 0.2 });
    container.addChild(border);

    // Room label — small, at the top-left corner of the room, out of the way
    const labelPos = toScreen(room.col + room.w / 2, room.row + 0.2);
    const label = new Text({
      text: `${room.icon} ${room.label}`,
      style: new TextStyle({
        fontSize: 9,
        fill: room.color,
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontWeight: '700',
        letterSpacing: 0.5,
        align: 'center',
        dropShadow: { color: '#000000', blur: 4, distance: 1, alpha: 1 },
        stroke: { color: '#000000', width: 2 },
      }),
    });
    label.anchor.set(0.5, 0.5);
    label.x = labelPos.x;
    label.y = labelPos.y;
    label.alpha = 0.9;
    container.addChild(label);

    this.world.addChild(container);
  }

  /** Draw internal wall dividers between adjacent rooms */
  private drawInternalWalls() {
    const container = new Container();
    container.sortableChildren = true;

    // Find internal boundaries by checking adjacent rooms
    // We draw thin wall segments where two rooms share an edge
    const wallSegments: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      color: number;
      side: 'horizontal' | 'vertical';
    }> = [];

    // Check each pair of rooms for shared edges
    for (let i = 0; i < ROOMS.length; i++) {
      for (let j = i + 1; j < ROOMS.length; j++) {
        const a = ROOMS[i];
        const b = ROOMS[j];
        const aColor = parseInt(a.color.slice(1), 16);
        const bColor = parseInt(b.color.slice(1), 16);
        const mixColor = blendColors(aColor, bColor, 0.5);

        // Check if rooms share a horizontal edge (same row boundary)
        // Room A bottom edge meets Room B top edge
        if (a.row + a.h === b.row) {
          const overlapStart = Math.max(a.col, b.col);
          const overlapEnd = Math.min(a.col + a.w, b.col + b.w);
          if (overlapStart < overlapEnd) {
            wallSegments.push({
              from: toScreen(overlapStart, a.row + a.h),
              to: toScreen(overlapEnd, a.row + a.h),
              color: mixColor,
              side: 'horizontal',
            });
          }
        }
        if (b.row + b.h === a.row) {
          const overlapStart = Math.max(a.col, b.col);
          const overlapEnd = Math.min(a.col + a.w, b.col + b.w);
          if (overlapStart < overlapEnd) {
            wallSegments.push({
              from: toScreen(overlapStart, b.row + b.h),
              to: toScreen(overlapEnd, b.row + b.h),
              color: mixColor,
              side: 'horizontal',
            });
          }
        }

        // Check if rooms share a vertical edge (same col boundary)
        if (a.col + a.w === b.col) {
          const overlapStart = Math.max(a.row, b.row);
          const overlapEnd = Math.min(a.row + a.h, b.row + b.h);
          if (overlapStart < overlapEnd) {
            wallSegments.push({
              from: toScreen(a.col + a.w, overlapStart),
              to: toScreen(a.col + a.w, overlapEnd),
              color: mixColor,
              side: 'vertical',
            });
          }
        }
        if (b.col + b.w === a.col) {
          const overlapStart = Math.max(a.row, b.row);
          const overlapEnd = Math.min(a.row + a.h, b.row + b.h);
          if (overlapStart < overlapEnd) {
            wallSegments.push({
              from: toScreen(b.col + b.w, overlapStart),
              to: toScreen(b.col + b.w, overlapEnd),
              color: mixColor,
              side: 'vertical',
            });
          }
        }
      }
    }

    // Draw each wall segment as a thin 3D wall
    for (const seg of wallSegments) {
      const wallH = WALL_HEIGHT * 0.7; // Internal walls slightly shorter than outer
      const wall = new Graphics();

      // Wall face — solid panel so rooms are clearly separated
      wall.poly([
        seg.from,
        { x: seg.from.x, y: seg.from.y - wallH },
        { x: seg.to.x, y: seg.to.y - wallH },
        seg.to,
      ]);
      const wallBase = seg.side === 'horizontal' ? 0x606070 : 0x585868;
      wall.fill({ color: wallBase, alpha: 1 });
      wall.stroke({ color: 0x484858, width: 1, alpha: 1 });

      // Horizontal panel lines for texture
      for (let i = 1; i <= 3; i++) {
        const frac = i / 4;
        const y1 = seg.from.y - wallH * (1 - frac);
        const y2 = seg.to.y - wallH * (1 - frac);
        wall.moveTo(seg.from.x, y1);
        wall.lineTo(seg.to.x, y2);
        wall.stroke({ color: 0x000000, width: 0.5, alpha: 0.08 });
      }

      // Top accent line
      wall.moveTo(seg.from.x, seg.from.y - wallH);
      wall.lineTo(seg.to.x, seg.to.y - wallH);
      wall.stroke({ color: seg.color, width: 1.5, alpha: 0.6 });

      // Doorway gap — cut a visible door opening in the wall center
      const midX = (seg.from.x + seg.to.x) / 2;
      const midY = (seg.from.y + seg.to.y) / 2;
      // Dark door opening
      const doorW = seg.side === 'horizontal' ? 6 : 3;
      const doorH = wallH * 0.75;
      wall.rect(midX - doorW, midY - doorH, doorW * 2, doorH);
      wall.fill({ color: 0x12121e, alpha: 0.95 });
      // Door frame accent
      wall.rect(midX - doorW - 1, midY - doorH, doorW * 2 + 2, 1);
      wall.fill({ color: seg.color, alpha: 0.5 });

      wall.zIndex = Math.max(seg.from.y, seg.to.y) - 500;
      container.addChild(wall);
    }

    this.world.addChild(container);
  }

  private drawFurniture(furn: FurnitureDef, accent: number, room: RoomDef) {
    const pos = toScreen(furn.col, furn.row);
    const g = new Graphics();
    // Set zIndex based on position for proper depth sorting
    g.zIndex = pos.y;

    switch (furn.type) {
      case 'rug': {
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
        g.zIndex = pos.y - 1000; // Rug below everything
        break;
      }
      case 'desk': {
        g.poly([
          { x: pos.x, y: pos.y - 4 },
          { x: pos.x + 20, y: pos.y + 6 },
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x - 20, y: pos.y + 6 },
        ]);
        g.fill({ color: 0x8b6f4a });
        g.poly([
          { x: pos.x - 14, y: pos.y + 3 },
          { x: pos.x + 14, y: pos.y + 3 },
          { x: pos.x + 12, y: pos.y + 5 },
          { x: pos.x - 12, y: pos.y + 5 },
        ]);
        g.fill({ color: 0xa08058, alpha: 0.6 });
        g.poly([
          { x: pos.x + 20, y: pos.y + 6 },
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x + 20, y: pos.y + 9 },
        ]);
        g.fill({ color: 0x6b5030 });
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
        g.rect(pos.x - 7, pos.y - 16, 14, 12);
        g.fill({ color: 0x222222 });
        g.rect(pos.x - 6, pos.y - 15, 12, 10);
        g.fill({ color: 0x0a1828 });
        const colors = [accent, 0x00ff88, 0x00bfff, 0xffa500];
        for (let i = 0; i < 5; i++) {
          const lw = 2 + (i * 7 + 3) % 8;
          g.rect(pos.x - 5, pos.y - 14 + i * 2, lw, 1);
          g.fill({ color: colors[i % colors.length], alpha: 0.5 });
        }
        g.rect(pos.x - 6, pos.y - 15, 12, 10);
        g.fill({ color: accent, alpha: 0.05 });
        g.rect(pos.x - 1, pos.y - 4, 2, 3);
        g.fill({ color: 0x333333 });
        g.rect(pos.x - 4, pos.y - 1, 8, 2);
        g.fill({ color: 0x333333 });
        break;
      }
      case 'chair': {
        g.ellipse(pos.x, pos.y + 1, 5, 3);
        g.fill({ color: 0x333348 });
        g.rect(pos.x - 3, pos.y - 3, 6, 3);
        g.fill({ color: 0x2a2a40 });
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
        g.poly([
          { x: pos.x, y: pos.y - 4 },
          { x: pos.x + 28, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 24 },
          { x: pos.x - 28, y: pos.y + 10 },
        ]);
        g.fill({ color: 0x6b5a3a });
        g.poly([
          { x: pos.x - 18, y: pos.y + 6 },
          { x: pos.x + 18, y: pos.y + 6 },
          { x: pos.x + 16, y: pos.y + 8 },
          { x: pos.x - 16, y: pos.y + 8 },
        ]);
        g.fill({ color: 0x8b7050, alpha: 0.5 });
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
        g.poly([
          { x: pos.x - 4, y: pos.y + 2 },
          { x: pos.x + 4, y: pos.y + 2 },
          { x: pos.x + 3, y: pos.y + 8 },
          { x: pos.x - 3, y: pos.y + 8 },
        ]);
        g.fill({ color: 0x8b5a3a });
        g.rect(pos.x - 5, pos.y + 1, 10, 2);
        g.fill({ color: 0x9b6a4a });
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
        g.rect(pos.x - 10, pos.y - 10, 20, 18);
        g.fill({ color: 0x5a4020 });
        g.stroke({ color: 0x6b5030, width: 1 });
        g.rect(pos.x - 9, pos.y - 4, 18, 2);
        g.fill({ color: 0x6b5030 });
        g.rect(pos.x - 9, pos.y + 3, 18, 2);
        g.fill({ color: 0x6b5030 });
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
        g.rect(pos.x - 5, pos.y - 14, 10, 20);
        g.fill({ color: 0x1a1a28 });
        g.stroke({ color: 0x2a2a40, width: 1 });
        for (let i = 0; i < 5; i++) {
          const sy = pos.y - 12 + i * 4;
          g.rect(pos.x - 4, sy, 8, 3);
          g.fill({ color: 0x222238 });
        }
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
        g.rect(pos.x - 12, pos.y - 10, 24, 16);
        g.fill({ color: 0x555560 });
        g.rect(pos.x - 11, pos.y - 9, 22, 14);
        g.fill({ color: 0xe8e8e8, alpha: 0.2 });
        g.rect(pos.x - 8, pos.y - 7, 10, 1);
        g.fill({ color: accent, alpha: 0.4 });
        g.rect(pos.x - 6, pos.y - 4, 14, 1);
        g.fill({ color: 0x00bfff, alpha: 0.3 });
        g.rect(pos.x - 4, pos.y - 1, 8, 1);
        g.fill({ color: 0x00ff88, alpha: 0.25 });
        g.rect(pos.x - 3, pos.y + 1, 6, 4);
        g.stroke({ color: accent, width: 1, alpha: 0.25 });
        g.rect(pos.x - 8, pos.y + 5, 16, 2);
        g.fill({ color: 0x555560 });
        g.rect(pos.x - 3, pos.y + 5, 2, 2);
        g.fill({ color: 0xff4444 });
        g.rect(pos.x, pos.y + 5, 2, 2);
        g.fill({ color: 0x00ff88 });
        g.rect(pos.x + 3, pos.y + 5, 2, 2);
        g.fill({ color: 0x00bfff });
        break;
      }
      case 'couch': {
        g.roundRect(pos.x - 12, pos.y - 4, 24, 5, 1);
        g.fill({ color: 0x8b4513 });
        g.rect(pos.x - 11, pos.y + 1, 10, 6);
        g.fill({ color: 0xa0522d });
        g.rect(pos.x + 1, pos.y + 1, 10, 6);
        g.fill({ color: 0xa0522d });
        g.rect(pos.x - 13, pos.y - 2, 3, 8);
        g.fill({ color: 0x8b4513 });
        g.rect(pos.x + 10, pos.y - 2, 3, 8);
        g.fill({ color: 0x8b4513 });
        g.rect(pos.x - 8, pos.y - 1, 5, 3);
        g.fill({ color: accent, alpha: 0.3 });
        break;
      }
      case 'coffee': {
        g.poly([
          { x: pos.x, y: pos.y - 1 },
          { x: pos.x + 10, y: pos.y + 4 },
          { x: pos.x, y: pos.y + 9 },
          { x: pos.x - 10, y: pos.y + 4 },
        ]);
        g.fill({ color: 0x6b5030 });
        g.poly([
          { x: pos.x + 10, y: pos.y + 4 },
          { x: pos.x, y: pos.y + 9 },
          { x: pos.x, y: pos.y + 11 },
          { x: pos.x + 10, y: pos.y + 6 },
        ]);
        g.fill({ color: 0x4a3820 });
        g.rect(pos.x, pos.y + 1, 4, 4);
        g.fill({ color: 0xf0f0f0, alpha: 0.6 });
        g.rect(pos.x + 1, pos.y + 2, 2, 2);
        g.fill({ color: 0x5a3010, alpha: 0.7 });
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

function blendColors(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const blue = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | blue;
}
