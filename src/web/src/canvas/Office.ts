import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TILE_W, TILE_H, toScreen } from './iso';
import { ROOMS, SEATS, FURNITURE, getSeatPosition, type RoomDef, type FurnitureDef } from './rooms';
import { AgentSprite, type AgentData } from './Agent';

const WALL_HEIGHT = 24;
const WALL_THICKNESS = 3;

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
      background: 0x06060e,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    this.app.stage.addChild(this.world);
    this.world.sortableChildren = true;

    this.centerCamera();
    this.drawAmbient();
    this.drawRooms();

    window.addEventListener('resize', () => this.centerCamera());
  }

  private centerCamera() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const center = toScreen(8, 8);
    this.world.x = sw / 2 - center.x;
    this.world.y = sh / 3.2 - center.y;
  }

  private drawAmbient() {
    // Subtle ambient floor glow beneath the whole office
    const ambient = new Graphics();
    const center = toScreen(8, 8);
    ambient.ellipse(center.x, center.y + 20, 450, 200);
    ambient.fill({ color: 0x0a1020, alpha: 0.5 });
    ambient.zIndex = -10;
    this.world.addChild(ambient);
  }

  private drawRooms() {
    for (const room of ROOMS) {
      this.drawRoom(room);
    }
  }

  private drawRoom(room: RoomDef) {
    const container = new Container();
    container.sortableChildren = true;
    const basePos = toScreen(room.col, room.row);
    container.zIndex = basePos.y;

    const floorColor = parseInt(room.floorColor.slice(1), 16);
    const wallColor = parseInt(room.wallColor.slice(1), 16);
    const accentColor = parseInt(room.color.slice(1), 16);

    // ── Floor shadow (depth effect) ──
    const tl = toScreen(room.col, room.row);
    const tr = toScreen(room.col + room.w, room.row);
    const br = toScreen(room.col + room.w, room.row + room.h);
    const bl = toScreen(room.col, room.row + room.h);
    const floorShadow = new Graphics();
    floorShadow.poly([
      { x: tl.x, y: tl.y + 3 },
      { x: tr.x, y: tr.y + 3 },
      { x: br.x, y: br.y + 3 },
      { x: bl.x, y: bl.y + 3 },
    ]);
    floorShadow.fill({ color: 0x000000, alpha: 0.35 });
    floorShadow.zIndex = -2;
    container.addChild(floorShadow);

    // ── Floor tiles ──
    for (let c = 0; c < room.w; c++) {
      for (let r = 0; r < room.h; r++) {
        const pos = toScreen(room.col + c, room.row + r);
        const tile = new Graphics();

        // Subtle checkerboard with slight color variation
        const isLight = (c + r) % 2 === 0;
        const shade = isLight ? 1.0 : 0.82;
        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.fill({ color: floorColor, alpha: shade });

        // Subtle inner highlight on light tiles
        if (isLight) {
          tile.poly([
            { x: 0, y: 2 },
            { x: TILE_W / 2 - 3, y: TILE_H / 2 },
            { x: 0, y: TILE_H - 2 },
            { x: -TILE_W / 2 + 3, y: TILE_H / 2 },
          ]);
          tile.fill({ color: 0xffffff, alpha: 0.03 });
        }

        tile.x = pos.x;
        tile.y = pos.y;
        container.addChild(tile);
      }
    }

    // ── Walls with 3D thickness ──
    // Left wall face
    const leftWall = new Graphics();
    leftWall.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: bl.x, y: bl.y - WALL_HEIGHT },
      { x: bl.x, y: bl.y },
    ]);
    leftWall.fill({ color: wallColor, alpha: 0.8 });
    // Wall texture lines (horizontal bricks/panels)
    for (let i = 1; i < 4; i++) {
      const y1 = tl.y - WALL_HEIGHT + (WALL_HEIGHT / 4) * i;
      const y2 = bl.y - WALL_HEIGHT + (WALL_HEIGHT / 4) * i;
      leftWall.moveTo(tl.x, y1);
      leftWall.lineTo(bl.x, y2);
      leftWall.stroke({ color: 0x000000, width: 0.5, alpha: 0.15 });
    }
    leftWall.zIndex = -1;
    container.addChild(leftWall);

    // Left wall top edge (3D thickness)
    const leftTop = new Graphics();
    leftTop.poly([
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: tl.x + WALL_THICKNESS, y: tl.y - WALL_HEIGHT - 1 },
      { x: bl.x + WALL_THICKNESS, y: bl.y - WALL_HEIGHT - 1 },
      { x: bl.x, y: bl.y - WALL_HEIGHT },
    ]);
    leftTop.fill({ color: accentColor, alpha: 0.25 });
    leftTop.zIndex = -1;
    container.addChild(leftTop);

    // Back wall face
    const backWall = new Graphics();
    backWall.poly([
      { x: tl.x, y: tl.y },
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: tr.x, y: tr.y - WALL_HEIGHT },
      { x: tr.x, y: tr.y },
    ]);
    backWall.fill({ color: wallColor, alpha: 0.55 });
    // Wall panel lines
    for (let i = 1; i < 4; i++) {
      const y1 = tl.y - WALL_HEIGHT + (WALL_HEIGHT / 4) * i;
      const y2 = tr.y - WALL_HEIGHT + (WALL_HEIGHT / 4) * i;
      backWall.moveTo(tl.x, y1);
      backWall.lineTo(tr.x, y2);
      backWall.stroke({ color: 0x000000, width: 0.5, alpha: 0.1 });
    }
    backWall.zIndex = -1;
    container.addChild(backWall);

    // Back wall top edge (3D thickness)
    const backTop = new Graphics();
    backTop.poly([
      { x: tl.x, y: tl.y - WALL_HEIGHT },
      { x: tl.x, y: tl.y - WALL_HEIGHT - WALL_THICKNESS },
      { x: tr.x, y: tr.y - WALL_HEIGHT - WALL_THICKNESS },
      { x: tr.x, y: tr.y - WALL_HEIGHT },
    ]);
    backTop.fill({ color: accentColor, alpha: 0.2 });
    backTop.zIndex = -1;
    container.addChild(backTop);

    // ── Room border glow ──
    const border = new Graphics();
    border.poly([tl, tr, br, bl]);
    border.stroke({ color: accentColor, width: 1.5, alpha: 0.3 });
    container.addChild(border);

    // Inner accent line (creates inset effect)
    const insetTL = toScreen(room.col + 0.15, room.row + 0.15);
    const insetTR = toScreen(room.col + room.w - 0.15, room.row + 0.15);
    const insetBR = toScreen(room.col + room.w - 0.15, room.row + room.h - 0.15);
    const insetBL = toScreen(room.col + 0.15, room.row + room.h - 0.15);
    const inset = new Graphics();
    inset.poly([insetTL, insetTR, insetBR, insetBL]);
    inset.stroke({ color: accentColor, width: 0.5, alpha: 0.12 });
    container.addChild(inset);

    // ── Corner accent markers ──
    for (const corner of [tl, tr, br, bl]) {
      const dot = new Graphics();
      // Outer glow
      dot.circle(corner.x, corner.y, 4);
      dot.fill({ color: accentColor, alpha: 0.15 });
      // Inner dot
      dot.circle(corner.x, corner.y, 1.5);
      dot.fill({ color: accentColor, alpha: 0.7 });
      container.addChild(dot);
    }

    // ── Room label ──
    const labelPos = toScreen(room.col + room.w / 2, room.row + 0.3);
    const label = new Text({
      text: `${room.icon}  ${room.label.toUpperCase()}`,
      style: new TextStyle({
        fontSize: 9,
        fill: room.color,
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontWeight: '700',
        letterSpacing: 2,
        align: 'center',
        dropShadow: {
          color: '#000000',
          blur: 6,
          distance: 0,
        },
      }),
    });
    label.anchor.set(0.5, 0.5);
    label.x = labelPos.x;
    label.y = labelPos.y - WALL_HEIGHT - 6;
    label.alpha = 0.75;
    container.addChild(label);

    // ── Furniture ──
    const roomFurniture = FURNITURE.filter(f => f.room === room.id);
    for (const furn of roomFurniture) {
      this.drawFurniture(container, furn, accentColor, room);
    }

    // ── Desk seat glow indicators ──
    const roomSeats = SEATS.filter((s) => s.room === room.id);
    for (const seat of roomSeats) {
      const sp = toScreen(seat.col, seat.row);
      const chairGlow = new Graphics();
      chairGlow.circle(sp.x, sp.y + 2, 6);
      chairGlow.fill({ color: accentColor, alpha: 0.06 });
      chairGlow.circle(sp.x, sp.y + 2, 3);
      chairGlow.fill({ color: accentColor, alpha: 0.08 });
      container.addChild(chairGlow);
    }

    this.world.addChild(container);
  }

  private drawFurniture(container: Container, furn: FurnitureDef, accent: number, room: RoomDef) {
    const pos = toScreen(furn.col, furn.row);
    const g = new Graphics();

    switch (furn.type) {
      case 'desk': {
        // Shadow
        g.poly([
          { x: pos.x + 2, y: pos.y - 3 },
          { x: pos.x + 22, y: pos.y + 7 },
          { x: pos.x + 2, y: pos.y + 17 },
          { x: pos.x - 18, y: pos.y + 7 },
        ]);
        g.fill({ color: 0x000000, alpha: 0.2 });

        // Desk surface — main
        g.poly([
          { x: pos.x, y: pos.y - 6 },
          { x: pos.x + 22, y: pos.y + 5 },
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x - 22, y: pos.y + 5 },
        ]);
        g.fill({ color: 0x4a3828, alpha: 0.95 });

        // Desk surface highlight
        g.poly([
          { x: pos.x, y: pos.y - 5 },
          { x: pos.x + 18, y: pos.y + 4 },
          { x: pos.x, y: pos.y + 13 },
          { x: pos.x - 18, y: pos.y + 4 },
        ]);
        g.fill({ color: 0x5a4838, alpha: 0.5 });

        // Front edge (thickness)
        g.poly([
          { x: pos.x + 22, y: pos.y + 5 },
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x, y: pos.y + 19 },
          { x: pos.x + 22, y: pos.y + 8 },
        ]);
        g.fill({ color: 0x3a2818, alpha: 0.9 });

        // Side edge
        g.poly([
          { x: pos.x, y: pos.y + 16 },
          { x: pos.x - 22, y: pos.y + 5 },
          { x: pos.x - 22, y: pos.y + 8 },
          { x: pos.x, y: pos.y + 19 },
        ]);
        g.fill({ color: 0x2a1808, alpha: 0.9 });

        // Legs
        g.rect(pos.x + 16, pos.y + 6, 2, 8);
        g.fill({ color: 0x2a1808, alpha: 0.7 });
        g.rect(pos.x - 18, pos.y + 6, 2, 8);
        g.fill({ color: 0x2a1808, alpha: 0.7 });
        break;
      }
      case 'monitor': {
        // Screen bezel
        g.rect(pos.x - 7, pos.y - 16, 14, 11);
        g.fill({ color: 0x111111, alpha: 0.95 });
        g.stroke({ color: 0x333333, width: 0.5, alpha: 0.5 });

        // Screen content
        g.rect(pos.x - 6, pos.y - 15, 12, 9);
        g.fill({ color: 0x0a1a2a, alpha: 0.95 });

        // Code lines on screen
        const lineColors = [accent, 0x00ff88, 0x00bfff, 0xffd700];
        for (let i = 0; i < 4; i++) {
          const lineW = 3 + Math.random() * 6;
          g.rect(pos.x - 5, pos.y - 14 + i * 2, lineW, 1);
          g.fill({ color: lineColors[i % lineColors.length], alpha: 0.4 + Math.random() * 0.3 });
        }

        // Screen glow
        g.rect(pos.x - 6, pos.y - 15, 12, 9);
        g.fill({ color: accent, alpha: 0.06 });

        // Stand
        g.poly([
          { x: pos.x - 1, y: pos.y - 5 },
          { x: pos.x + 1, y: pos.y - 5 },
          { x: pos.x + 2, y: pos.y - 1 },
          { x: pos.x - 2, y: pos.y - 1 },
        ]);
        g.fill({ color: 0x222222, alpha: 0.9 });

        // Base
        g.ellipse(pos.x, pos.y - 1, 4, 1.5);
        g.fill({ color: 0x222222, alpha: 0.8 });
        break;
      }
      case 'chair': {
        // Seat (isometric ellipse)
        g.ellipse(pos.x, pos.y + 1, 5, 3);
        g.fill({ color: 0x2a2a3a, alpha: 0.7 });
        // Back rest
        g.rect(pos.x - 4, pos.y - 4, 8, 2);
        g.fill({ color: 0x222230, alpha: 0.6 });
        // Wheel dots
        for (let a = 0; a < 5; a++) {
          const angle = (a / 5) * Math.PI + Math.PI;
          g.circle(pos.x + Math.cos(angle) * 5, pos.y + 4 + Math.sin(angle) * 2, 0.8);
          g.fill({ color: 0x333340, alpha: 0.5 });
        }
        break;
      }
      case 'table': {
        // Table shadow
        g.poly([
          { x: pos.x + 2, y: pos.y - 3 },
          { x: pos.x + 32, y: pos.y + 11 },
          { x: pos.x + 2, y: pos.y + 25 },
          { x: pos.x - 28, y: pos.y + 11 },
        ]);
        g.fill({ color: 0x000000, alpha: 0.2 });

        // Table surface
        g.poly([
          { x: pos.x, y: pos.y - 6 },
          { x: pos.x + 30, y: pos.y + 9 },
          { x: pos.x, y: pos.y + 24 },
          { x: pos.x - 30, y: pos.y + 9 },
        ]);
        g.fill({ color: 0x3a3528, alpha: 0.9 });
        g.stroke({ color: 0x4a4538, width: 0.5, alpha: 0.3 });

        // Highlight stripe
        g.poly([
          { x: pos.x - 20, y: pos.y + 4 },
          { x: pos.x + 20, y: pos.y + 4 },
          { x: pos.x + 18, y: pos.y + 6 },
          { x: pos.x - 18, y: pos.y + 6 },
        ]);
        g.fill({ color: 0xffffff, alpha: 0.04 });

        // Side edge
        g.poly([
          { x: pos.x + 30, y: pos.y + 9 },
          { x: pos.x, y: pos.y + 24 },
          { x: pos.x, y: pos.y + 27 },
          { x: pos.x + 30, y: pos.y + 12 },
        ]);
        g.fill({ color: 0x2a2518, alpha: 0.8 });
        break;
      }
      case 'plant': {
        // Pot shadow
        g.ellipse(pos.x, pos.y + 9, 5, 2);
        g.fill({ color: 0x000000, alpha: 0.2 });

        // Pot
        g.poly([
          { x: pos.x - 5, y: pos.y + 2 },
          { x: pos.x + 5, y: pos.y + 2 },
          { x: pos.x + 4, y: pos.y + 9 },
          { x: pos.x - 4, y: pos.y + 9 },
        ]);
        g.fill({ color: 0x7a4a2a, alpha: 0.9 });
        // Pot rim
        g.poly([
          { x: pos.x - 5.5, y: pos.y + 1 },
          { x: pos.x + 5.5, y: pos.y + 1 },
          { x: pos.x + 5, y: pos.y + 3 },
          { x: pos.x - 5, y: pos.y + 3 },
        ]);
        g.fill({ color: 0x8a5a3a, alpha: 0.9 });

        // Soil
        g.ellipse(pos.x, pos.y + 2, 4, 1.5);
        g.fill({ color: 0x3a2a1a, alpha: 0.8 });

        // Foliage layers (bottom to top for depth)
        g.circle(pos.x + 4, pos.y - 1, 5);
        g.fill({ color: 0x1a5a2a, alpha: 0.7 });
        g.circle(pos.x - 4, pos.y, 4.5);
        g.fill({ color: 0x1e6b3a, alpha: 0.75 });
        g.circle(pos.x, pos.y - 4, 6);
        g.fill({ color: 0x2d8a4e, alpha: 0.85 });
        g.circle(pos.x + 2, pos.y - 6, 4);
        g.fill({ color: 0x3ba55d, alpha: 0.8 });
        g.circle(pos.x - 2, pos.y - 3, 3.5);
        g.fill({ color: 0x45b868, alpha: 0.7 });

        // Leaf highlights
        g.circle(pos.x + 1, pos.y - 5, 2);
        g.fill({ color: 0x5fd87a, alpha: 0.3 });
        break;
      }
      case 'shelf': {
        // Shelf frame shadow
        g.rect(pos.x - 11, pos.y - 11, 22, 20);
        g.fill({ color: 0x000000, alpha: 0.15 });

        // Shelf frame
        g.rect(pos.x - 10, pos.y - 10, 20, 18);
        g.fill({ color: 0x2a2018, alpha: 0.9 });
        g.stroke({ color: 0x3a3028, width: 0.5, alpha: 0.5 });

        // Shelves
        g.rect(pos.x - 9, pos.y - 5, 18, 1.5);
        g.fill({ color: 0x3a3024, alpha: 0.9 });
        g.rect(pos.x - 9, pos.y + 2, 18, 1.5);
        g.fill({ color: 0x3a3024, alpha: 0.9 });

        // Books on top shelf
        const bookColors = [0x4a6fa5, 0xc44e52, 0x8fbc8f, 0xd4a574, 0x7b68ee];
        for (let i = 0; i < 5; i++) {
          const bx = pos.x - 8 + i * 4;
          const bh = 3 + Math.random() * 3;
          g.rect(bx, pos.y - 10 + (6 - bh), 2.5, bh);
          g.fill({ color: bookColors[i], alpha: 0.7 + Math.random() * 0.2 });
        }
        // Books on middle shelf
        for (let i = 0; i < 4; i++) {
          const bx = pos.x - 7 + i * 5;
          const bh = 2 + Math.random() * 3;
          g.rect(bx, pos.y - 4 + (5 - bh), 3, bh);
          g.fill({ color: bookColors[(i + 2) % 5], alpha: 0.6 + Math.random() * 0.2 });
        }
        break;
      }
      case 'server': {
        // Server shadow
        g.rect(pos.x - 6, pos.y - 12, 14, 22);
        g.fill({ color: 0x000000, alpha: 0.2 });

        // Server rack
        g.rect(pos.x - 6, pos.y - 16, 12, 22);
        g.fill({ color: 0x111122, alpha: 0.95 });
        g.stroke({ color: 0x222244, width: 0.8, alpha: 0.6 });

        // Front panel lines
        for (let i = 0; i < 5; i++) {
          const sy = pos.y - 14 + i * 4;
          g.rect(pos.x - 5, sy, 10, 3);
          g.fill({ color: 0x1a1a33, alpha: 0.8 });
          g.stroke({ color: 0x222244, width: 0.3, alpha: 0.3 });
        }

        // LED indicators
        for (let i = 0; i < 5; i++) {
          const ly = pos.y - 13.5 + i * 4;
          // Status LED
          g.circle(pos.x - 3, ly + 0.5, 1);
          g.fill({ color: i < 3 ? 0x00ff88 : 0x00bfff, alpha: 0.9 });
          // Activity LED (blinks)
          g.circle(pos.x + 3, ly + 0.5, 0.8);
          g.fill({ color: 0xff8c00, alpha: 0.3 + (i * 0.15) });
        }

        // Ventilation grille
        g.rect(pos.x - 4, pos.y + 2, 8, 3);
        g.fill({ color: 0x0a0a1a, alpha: 0.8 });
        for (let i = 0; i < 4; i++) {
          g.rect(pos.x - 3 + i * 2.2, pos.y + 2.5, 1.2, 2);
          g.fill({ color: 0x222244, alpha: 0.4 });
        }
        break;
      }
      case 'whiteboard': {
        // Board shadow
        g.rect(pos.x - 14, pos.y - 10, 28, 20);
        g.fill({ color: 0x000000, alpha: 0.15 });

        // Board frame
        g.rect(pos.x - 13, pos.y - 12, 26, 18);
        g.fill({ color: 0x444444, alpha: 0.6 });

        // White surface
        g.rect(pos.x - 12, pos.y - 11, 24, 16);
        g.fill({ color: 0xf0f0f0, alpha: 0.18 });

        // Content scribbles
        g.moveTo(pos.x - 9, pos.y - 8);
        g.lineTo(pos.x + 4, pos.y - 6);
        g.stroke({ color: accent, width: 1, alpha: 0.35 });
        g.moveTo(pos.x - 8, pos.y - 4);
        g.lineTo(pos.x + 8, pos.y - 3);
        g.stroke({ color: 0x00bfff, width: 0.8, alpha: 0.25 });
        g.moveTo(pos.x - 6, pos.y);
        g.lineTo(pos.x + 6, pos.y + 1);
        g.stroke({ color: 0x00ff88, width: 0.8, alpha: 0.2 });
        // Box diagram
        g.rect(pos.x - 4, pos.y + 2, 8, 4);
        g.stroke({ color: accent, width: 0.5, alpha: 0.2 });
        // Arrow
        g.moveTo(pos.x + 5, pos.y + 4);
        g.lineTo(pos.x + 10, pos.y + 4);
        g.stroke({ color: accent, width: 0.5, alpha: 0.2 });

        // Marker tray
        g.rect(pos.x - 8, pos.y + 5, 16, 1.5);
        g.fill({ color: 0x444444, alpha: 0.5 });
        // Markers
        g.rect(pos.x - 4, pos.y + 4, 1.5, 1.5);
        g.fill({ color: 0xff4444, alpha: 0.6 });
        g.rect(pos.x - 1, pos.y + 4, 1.5, 1.5);
        g.fill({ color: 0x00ff88, alpha: 0.6 });
        g.rect(pos.x + 2, pos.y + 4, 1.5, 1.5);
        g.fill({ color: 0x00bfff, alpha: 0.6 });
        break;
      }
      case 'couch': {
        // Shadow
        g.poly([
          { x: pos.x - 13, y: pos.y + 4 },
          { x: pos.x + 13, y: pos.y + 4 },
          { x: pos.x + 11, y: pos.y + 12 },
          { x: pos.x - 11, y: pos.y + 12 },
        ]);
        g.fill({ color: 0x000000, alpha: 0.2 });

        // Couch back
        g.roundRect(pos.x - 14, pos.y - 6, 28, 6, 2);
        g.fill({ color: 0x1a2838, alpha: 0.9 });

        // Seat cushions
        g.roundRect(pos.x - 13, pos.y - 1, 12, 8, 2);
        g.fill({ color: 0x253848, alpha: 0.85 });
        g.roundRect(pos.x + 1, pos.y - 1, 12, 8, 2);
        g.fill({ color: 0x253848, alpha: 0.85 });

        // Arm rests
        g.roundRect(pos.x - 15, pos.y - 4, 3, 10, 1);
        g.fill({ color: 0x1a2838, alpha: 0.85 });
        g.roundRect(pos.x + 12, pos.y - 4, 3, 10, 1);
        g.fill({ color: 0x1a2838, alpha: 0.85 });

        // Cushion seams
        g.moveTo(pos.x - 1, pos.y);
        g.lineTo(pos.x - 1, pos.y + 6);
        g.stroke({ color: 0x0a1828, width: 0.5, alpha: 0.4 });

        // Throw pillow
        g.roundRect(pos.x - 10, pos.y - 3, 6, 4, 1);
        g.fill({ color: accent, alpha: 0.2 });
        break;
      }
      case 'coffee': {
        // Table shadow
        g.ellipse(pos.x, pos.y + 6, 12, 5);
        g.fill({ color: 0x000000, alpha: 0.15 });

        // Table surface (isometric)
        g.poly([
          { x: pos.x, y: pos.y - 2 },
          { x: pos.x + 12, y: pos.y + 4 },
          { x: pos.x, y: pos.y + 10 },
          { x: pos.x - 12, y: pos.y + 4 },
        ]);
        g.fill({ color: 0x3a3024, alpha: 0.85 });
        g.stroke({ color: 0x4a4034, width: 0.5, alpha: 0.3 });

        // Edge thickness
        g.poly([
          { x: pos.x + 12, y: pos.y + 4 },
          { x: pos.x, y: pos.y + 10 },
          { x: pos.x, y: pos.y + 12 },
          { x: pos.x + 12, y: pos.y + 6 },
        ]);
        g.fill({ color: 0x2a2014, alpha: 0.7 });

        // Coffee cup
        g.circle(pos.x + 2, pos.y + 3, 2.5);
        g.fill({ color: 0xf0f0f0, alpha: 0.5 });
        g.circle(pos.x + 2, pos.y + 3, 1.8);
        g.fill({ color: 0x4a2a10, alpha: 0.6 });
        // Cup handle
        g.moveTo(pos.x + 4.5, pos.y + 2);
        g.bezierCurveTo(pos.x + 6, pos.y + 2, pos.x + 6, pos.y + 4.5, pos.x + 4.5, pos.y + 4.5);
        g.stroke({ color: 0xf0f0f0, width: 0.5, alpha: 0.4 });

        // Saucer (subtle)
        g.ellipse(pos.x - 4, pos.y + 4, 3, 1.2);
        g.fill({ color: 0xf0f0f0, alpha: 0.2 });
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
