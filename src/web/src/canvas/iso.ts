// Isometric coordinate system utilities

export const TILE_W = 64;
export const TILE_H = 32;

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
