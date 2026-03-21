// Isometric coordinate system utilities

export const TILE_W = 80;
export const TILE_H = 40;

/** Convert grid (col, row) to screen (x, y) */
export function toScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/** Convert screen (x, y) to grid (col, row) */
export function toGrid(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.round(x / TILE_W + y / TILE_H),
    row: Math.round(y / TILE_H - x / TILE_W),
  };
}

/** Draw an isometric diamond shape */
export function isoDiamond(x: number, y: number, w: number = TILE_W, h: number = TILE_H) {
  return [
    { x: x, y: y },
    { x: x + w / 2, y: y + h / 2 },
    { x: x, y: y + h },
    { x: x - w / 2, y: y + h / 2 },
  ];
}
