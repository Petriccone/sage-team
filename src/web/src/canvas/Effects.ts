import { Container, Graphics } from 'pixi.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  gfx: Graphics;
}

export class Effects {
  container: Container;
  private particles: Particle[] = [];

  constructor() {
    this.container = new Container();
  }

  /** Confetti burst at a position (PR merged) */
  confetti(x: number, y: number) {
    const colors = [0xffd700, 0x00ff88, 0x00bfff, 0xff69b4, 0xff6b35];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.addParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 2,
        60 + Math.random() * 40,
        colors[Math.floor(Math.random() * colors.length)],
        2 + Math.random() * 3,
      );
    }
  }

  /** Red pulse (crisis) */
  redPulse(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.addParticle(
        x, y,
        Math.cos(angle) * 1.5,
        Math.sin(angle) * 1.5,
        50,
        0xff4444,
        4,
      );
    }
  }

  /** Green flash (tests pass) */
  greenFlash(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.addParticle(
        x, y,
        Math.cos(angle) * 2,
        Math.sin(angle) * 2 - 1,
        40,
        0x00ff88,
        3,
      );
    }
  }

  private addParticle(
    x: number, y: number,
    vx: number, vy: number,
    life: number, color: number, size: number,
  ) {
    const gfx = new Graphics();
    gfx.rect(-size / 2, -size / 2, size, size);
    gfx.fill({ color });
    gfx.x = x;
    gfx.y = y;
    this.container.addChild(gfx);

    this.particles.push({ x, y, vx, vy, life, maxLife: life, color, size, gfx });
  }

  tick() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life--;

      p.gfx.x = p.x;
      p.gfx.y = p.y;
      p.gfx.alpha = p.life / p.maxLife;

      if (p.life <= 0) {
        this.container.removeChild(p.gfx);
        p.gfx.destroy();
        this.particles.splice(i, 1);
      }
    }
  }
}
