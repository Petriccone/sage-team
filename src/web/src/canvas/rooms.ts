// Room layout — Premium neon glass office
// Dark cyberpunk aesthetic with glowing accent colors

export interface RoomDef {
  id: string;
  label: string;
  col: number;
  row: number;
  w: number;
  h: number;
  color: string;       // neon accent color
  floorColor: string;  // dark floor tint
  wallColor: string;   // glass wall tint
  icon: string;
}

// ── FLOOR PLAN ──────────────────────────────────────────────────
// 16×11 building — spacious rooms with clean separation
//
//  Col: 0   4   8  12  16
//       ┌───┬───┬───┬───┐
//  R0   │CEO│CTO│Arc│Mtg│  Row 0-3
//       │4×3│4×3│4×3│4×3│
//       ├───┴───┼───┼───┤
//  R3   │Dev    │QA │Des│  Row 3-7
//       │  8×4  │4×4│4×4│
//       ├───┬───┼───┴───┤
//  R7   │Dat│War│Lounge │  Row 7-11
//       │4×4│4×4│  8×4  │
//       └───┴───┴───────┘

export const ROOMS: RoomDef[] = [
  // ── Top Row (Executive) ──
  { id: 'ceo-office',    label: 'CEO',           col: 0,  row: 0,  w: 4, h: 3, color: '#ffd700', floorColor: '#1e1c28', wallColor: '#2a2838', icon: '\u{1F451}' },
  { id: 'cto-office',    label: 'CTO',           col: 4,  row: 0,  w: 4, h: 3, color: '#00e5ff', floorColor: '#1a1e28', wallColor: '#282a38', icon: '\u{1F52C}' },
  { id: 'arch-lab',      label: 'Architecture',  col: 8,  row: 0,  w: 4, h: 3, color: '#d17efc', floorColor: '#221c28', wallColor: '#302838', icon: '\u{1F3DB}\uFE0F' },
  { id: 'meeting-room',  label: 'Meeting',       col: 12, row: 0,  w: 4, h: 3, color: '#4d8aff', floorColor: '#1a1c2a', wallColor: '#28283a', icon: '\u{1F91D}' },

  // ── Middle Row (Development) ──
  { id: 'dev-bullpen',   label: 'Development',   col: 0,  row: 3,  w: 8, h: 4, color: '#00ff88', floorColor: '#161e1a', wallColor: '#1e2e22', icon: '\u26A1' },
  { id: 'qa-lab',        label: 'QA Lab',        col: 8,  row: 3,  w: 4, h: 4, color: '#ff9b33', floorColor: '#1e1a16', wallColor: '#2e2618', icon: '\u{1F50D}' },
  { id: 'design-studio', label: 'Design',        col: 12, row: 3,  w: 4, h: 4, color: '#a855f7', floorColor: '#1e1828', wallColor: '#2e2038', icon: '\u{1F3A8}' },

  // ── Bottom Row (Support) ──
  { id: 'data-lab',      label: 'Data Lab',      col: 0,  row: 7,  w: 4, h: 4, color: '#94a3b8', floorColor: '#1a1c20', wallColor: '#282c32', icon: '\u{1F4CA}' },
  { id: 'crisis-room',   label: 'War Room',      col: 4,  row: 7,  w: 4, h: 4, color: '#ff3355', floorColor: '#201416', wallColor: '#341c1e', icon: '\u{1F6A8}' },
  { id: 'lounge',        label: 'Lounge',        col: 8,  row: 7,  w: 8, h: 4, color: '#ff7b54', floorColor: '#1e1a16', wallColor: '#2e2418', icon: '\u2615' },
];

// ── BUILDING BOUNDS ──
export const BUILDING = {
  col: 0,
  row: 0,
  w: 16,
  h: 11,
};

/** Desk positions within rooms */
export interface SeatDef {
  room: string;
  seat: number;
  col: number;
  row: number;
}

export const SEATS: SeatDef[] = [
  // Executive row
  { room: 'ceo-office', seat: 0, col: 2, row: 1.5 },
  { room: 'cto-office', seat: 0, col: 6, row: 1.5 },
  { room: 'arch-lab', seat: 0, col: 10, row: 1.5 },

  // Meeting room — seats around table
  { room: 'meeting-room', seat: 0,  col: 13.2, row: 0.8 },
  { room: 'meeting-room', seat: 1,  col: 14.8, row: 0.8 },
  { room: 'meeting-room', seat: 2,  col: 13.2, row: 2.2 },
  { room: 'meeting-room', seat: 3,  col: 14.8, row: 2.2 },
  { room: 'meeting-room', seat: 4,  col: 12.5, row: 1.5 },
  { room: 'meeting-room', seat: 5,  col: 15.5, row: 1.5 },
  { room: 'meeting-room', seat: 6,  col: 13.5, row: 0.4 },
  { room: 'meeting-room', seat: 7,  col: 14.5, row: 0.4 },
  { room: 'meeting-room', seat: 8,  col: 13.5, row: 2.6 },
  { room: 'meeting-room', seat: 9,  col: 14.5, row: 2.6 },
  { room: 'meeting-room', seat: 10, col: 14,   row: 1.5 },

  // Dev Bullpen — spacious
  { room: 'dev-bullpen', seat: 0, col: 2, row: 5 },
  { room: 'dev-bullpen', seat: 1, col: 5.5, row: 5.5 },

  // QA Lab
  { room: 'qa-lab', seat: 0, col: 9.5, row: 5 },
  { room: 'qa-lab', seat: 1, col: 11, row: 5.5 },

  // Design Studio
  { room: 'design-studio', seat: 0, col: 13.5, row: 5 },
  { room: 'design-studio', seat: 1, col: 15, row: 5.5 },

  // Data Lab
  { room: 'data-lab', seat: 0, col: 2, row: 9 },

  // Crisis Room
  { room: 'crisis-room', seat: 0, col: 6, row: 9 },

  // Lounge
  { room: 'lounge', seat: 0, col: 12, row: 9 },
];

/** Home room for each agent */
export const AGENT_HOME: Record<string, { room: string; seat: number }> = {
  sage: { room: 'ceo-office', seat: 0 },
  nova: { room: 'cto-office', seat: 0 },
  aria: { room: 'arch-lab', seat: 0 },
  dex: { room: 'dev-bullpen', seat: 0 },
  flux: { room: 'dev-bullpen', seat: 1 },
  quinn: { room: 'qa-lab', seat: 0 },
  gage: { room: 'qa-lab', seat: 1 },
  uma: { room: 'design-studio', seat: 0 },
  morgan: { room: 'design-studio', seat: 1 },
  river: { room: 'lounge', seat: 0 },
  atlas: { room: 'data-lab', seat: 0 },
};

/** Meeting room seat assignment */
export const MEETING_SEATS: Record<string, number> = {
  sage: 0, nova: 1, aria: 2, dex: 3, flux: 4,
  quinn: 5, gage: 6, morgan: 7, uma: 8, river: 9, atlas: 10,
};

/** Furniture positions — minimal, premium placement */
export interface FurnitureDef {
  room: string;
  type: 'desk' | 'monitor' | 'chair' | 'table' | 'plant' | 'shelf' | 'server' | 'whiteboard' | 'couch' | 'coffee' | 'rug';
  col: number;
  row: number;
}

export const FURNITURE: FurnitureDef[] = [
  // CEO Office — executive, clean
  { room: 'ceo-office', type: 'desk', col: 1.5, row: 1 },
  { room: 'ceo-office', type: 'monitor', col: 1.8, row: 0.7 },
  { room: 'ceo-office', type: 'plant', col: 0.5, row: 0.4 },
  { room: 'ceo-office', type: 'shelf', col: 3.2, row: 0.4 },

  // CTO Office — tech-focused
  { room: 'cto-office', type: 'desk', col: 5.5, row: 1 },
  { room: 'cto-office', type: 'monitor', col: 5.8, row: 0.7 },
  { room: 'cto-office', type: 'monitor', col: 6.4, row: 0.7 },
  { room: 'cto-office', type: 'server', col: 7.2, row: 0.4 },

  // Architecture Lab
  { room: 'arch-lab', type: 'desk', col: 9.5, row: 1 },
  { room: 'arch-lab', type: 'monitor', col: 9.8, row: 0.7 },
  { room: 'arch-lab', type: 'whiteboard', col: 11.2, row: 0.5 },

  // Meeting Room — central table
  { room: 'meeting-room', type: 'table', col: 14, row: 1.3 },
  { room: 'meeting-room', type: 'whiteboard', col: 12.5, row: 0.3 },

  // Dev Bullpen — workstations
  { room: 'dev-bullpen', type: 'desk', col: 1.5, row: 4.5 },
  { room: 'dev-bullpen', type: 'monitor', col: 1.8, row: 4.2 },
  { room: 'dev-bullpen', type: 'desk', col: 5, row: 5 },
  { room: 'dev-bullpen', type: 'monitor', col: 5.3, row: 4.7 },
  { room: 'dev-bullpen', type: 'plant', col: 7, row: 3.4 },

  // QA Lab
  { room: 'qa-lab', type: 'desk', col: 9, row: 4.5 },
  { room: 'qa-lab', type: 'monitor', col: 9.3, row: 4.2 },
  { room: 'qa-lab', type: 'server', col: 11.2, row: 3.4 },

  // Design Studio
  { room: 'design-studio', type: 'desk', col: 13, row: 4.5 },
  { room: 'design-studio', type: 'monitor', col: 13.3, row: 4.2 },
  { room: 'design-studio', type: 'whiteboard', col: 15, row: 3.5 },

  // Data Lab — server heavy
  { room: 'data-lab', type: 'desk', col: 1.5, row: 8.5 },
  { room: 'data-lab', type: 'monitor', col: 1.8, row: 8.2 },
  { room: 'data-lab', type: 'server', col: 3, row: 7.5 },
  { room: 'data-lab', type: 'server', col: 3.5, row: 7.5 },

  // Crisis Room — command center
  { room: 'crisis-room', type: 'table', col: 6, row: 8.5 },
  { room: 'crisis-room', type: 'monitor', col: 5, row: 7.5 },
  { room: 'crisis-room', type: 'monitor', col: 7, row: 7.5 },

  // Lounge — relaxed
  { room: 'lounge', type: 'couch', col: 10, row: 8.5 },
  { room: 'lounge', type: 'couch', col: 14, row: 8.5 },
  { room: 'lounge', type: 'coffee', col: 12, row: 9 },
  { room: 'lounge', type: 'plant', col: 9, row: 7.5 },
  { room: 'lounge', type: 'plant', col: 15, row: 7.5 },
];

export function getSeatPosition(room: string, seat: number): SeatDef | undefined {
  return SEATS.find((s) => s.room === room && s.seat === seat);
}
