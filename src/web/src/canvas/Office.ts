import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TILE_W, TILE_H, toScreen } from './iso';
import { ROOMS, SEATS, getSeatPosition, type RoomDef } from './rooms';
import { AgentSprite, type AgentData } from './Agent';

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
      background: 0x0a0a0f,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    this.app.stage.addChild(this.world);

    // Center the world
    this.centerCamera();
    this.drawRooms();

    // Handle resize
    window.addEventListener('resize', () => this.centerCamera());
  }

  private centerCamera() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    // Center on approximately the middle of the office grid
    const center = toScreen(8, 8);
    this.world.x = sw / 2 - center.x;
    this.world.y = sh / 4 - center.y;
  }

  private drawRooms() {
    for (const room of ROOMS) {
      this.drawRoom(room);
    }
  }

  private drawRoom(room: RoomDef) {
    const container = new Container();

    // Draw isometric floor tiles
    for (let c = 0; c < room.w; c++) {
      for (let r = 0; r < room.h; r++) {
        const pos = toScreen(room.col + c, room.row + r);
        const tile = new Graphics();
        const color = parseInt(room.floorColor.slice(1), 16);
        tile.poly([
          { x: 0, y: 0 },
          { x: TILE_W / 2, y: TILE_H / 2 },
          { x: 0, y: TILE_H },
          { x: -TILE_W / 2, y: TILE_H / 2 },
        ]);
        tile.fill({ color, alpha: 0.8 });
        tile.stroke({ color: parseInt(room.color.slice(1), 16), width: 1, alpha: 0.15 });
        tile.x = pos.x;
        tile.y = pos.y;
        container.addChild(tile);
      }
    }

    // Draw room border (outline)
    const tl = toScreen(room.col, room.row);
    const tr = toScreen(room.col + room.w, room.row);
    const br = toScreen(room.col + room.w, room.row + room.h);
    const bl = toScreen(room.col, room.row + room.h);

    const border = new Graphics();
    border.poly([
      { x: tl.x, y: tl.y },
      { x: tr.x, y: tr.y },
      { x: br.x, y: br.y },
      { x: bl.x, y: bl.y },
    ]);
    border.stroke({ color: parseInt(room.color.slice(1), 16), width: 1.5, alpha: 0.4 });
    container.addChild(border);

    // Room label
    const labelPos = toScreen(room.col + room.w / 2, room.row + 0.2);
    const label = new Text({
      text: room.label,
      style: new TextStyle({
        fontSize: 10,
        fill: room.color,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        align: 'center',
      }),
    });
    label.anchor.set(0.5, 0.5);
    label.x = labelPos.x;
    label.y = labelPos.y;
    label.alpha = 0.6;
    container.addChild(label);

    // Draw desk indicators at seat positions
    const roomSeats = SEATS.filter((s) => s.room === room.id);
    for (const seat of roomSeats) {
      const sp = toScreen(seat.col, seat.row);
      const desk = new Graphics();
      desk.poly([
        { x: 0, y: -2 },
        { x: 8, y: 2 },
        { x: 0, y: 6 },
        { x: -8, y: 2 },
      ]);
      desk.fill({ color: 0x333344, alpha: 0.6 });
      desk.x = sp.x;
      desk.y = sp.y;
      container.addChild(desk);
    }

    this.world.addChild(container);
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
