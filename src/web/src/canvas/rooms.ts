// Room layout definitions — pixel art office inspired by Gather.town / The Sims
// Rooms are spaced with 2-3 tile gaps to avoid overlap in isometric projection

export interface RoomDef {
  id: string;
  label: string;
  col: number;
  row: number;
  w: number;
  h: number;
  color: string;       // accent color
  floorColor: string;  // tile color
  wallColor: string;   // wall color
  icon: string;
}

// Warm palette — beige floors, light gray walls, colored accents
// Row groups with 3-row gaps to prevent isometric overlap
export const ROOMS: RoomDef[] = [
  // Row 0 — Executive row
  { id: 'ceo-office',     label: 'CEO Office',     col: 0,  row: 0,  w: 4, h: 3, color: '#ffd700', floorColor: '#d4c4a0', wallColor: '#a0a0a8', icon: '\u{1F451}' },
  { id: 'cto-office',     label: 'CTO Office',     col: 6,  row: 0,  w: 4, h: 3, color: '#00bfff', floorColor: '#c0c4c8', wallColor: '#909098', icon: '\u{1F52C}' },
  { id: 'arch-lab',       label: 'Arch Lab',       col: 12, row: 0,  w: 4, h: 3, color: '#b57edc', floorColor: '#ccc0d4', wallColor: '#988ca0', icon: '\u{1F3DB}\uFE0F' },

  // Row 6 — Work row (3-row gap after exec row)
  { id: 'dev-bullpen',    label: 'Dev Bullpen',    col: 0,  row: 6,  w: 6, h: 4, color: '#50c878', floorColor: '#c8d4c0', wallColor: '#909890', icon: '\u26A1' },
  { id: 'qa-lab',         label: 'QA Lab',         col: 8,  row: 6,  w: 4, h: 4, color: '#ff8c00', floorColor: '#d4c8b8', wallColor: '#a09888', icon: '\u{1F50D}' },
  { id: 'design-studio',  label: 'Design Studio',  col: 14, row: 6,  w: 4, h: 4, color: '#8a2be2', floorColor: '#d0c0d8', wallColor: '#9888a0', icon: '\u{1F3A8}' },

  // Row 13 — Collab row (3-row gap after work row)
  { id: 'data-lab',       label: 'Data Lab',       col: 0,  row: 13, w: 4, h: 3, color: '#708090', floorColor: '#c0c4c8', wallColor: '#888c90', icon: '\u{1F4CA}' },
  { id: 'meeting-room',   label: 'Meeting Room',   col: 6,  row: 13, w: 5, h: 3, color: '#4169e1', floorColor: '#c4c8d4', wallColor: '#8890a0', icon: '\u{1F91D}' },
  { id: 'lounge',         label: 'Lounge',         col: 13, row: 13, w: 5, h: 3, color: '#ff6347', floorColor: '#d8ccbc', wallColor: '#a09488', icon: '\u2615' },

  // Row 19 — Special (3-row gap after collab row)
  { id: 'crisis-room',    label: 'Crisis Room',    col: 6,  row: 19, w: 5, h: 3, color: '#dc143c', floorColor: '#d0c0c0', wallColor: '#a08888', icon: '\u{1F6A8}' },
];

/** Desk positions within rooms — where agents sit */
export interface SeatDef {
  room: string;
  seat: number;
  col: number;
  row: number;
}

export const SEATS: SeatDef[] = [
  // Executive row (row 0)
  { room: 'ceo-office', seat: 0, col: 2, row: 1 },
  { room: 'cto-office', seat: 0, col: 8, row: 1 },
  { room: 'arch-lab', seat: 0, col: 14, row: 1 },

  // Work row (row 6)
  { room: 'dev-bullpen', seat: 0, col: 2, row: 7 },
  { room: 'dev-bullpen', seat: 1, col: 4, row: 8 },
  { room: 'qa-lab', seat: 0, col: 9, row: 7 },
  { room: 'qa-lab', seat: 1, col: 11, row: 8 },
  { room: 'design-studio', seat: 0, col: 15, row: 7 },
  { room: 'design-studio', seat: 1, col: 17, row: 8 },

  // Collab row (row 13)
  { room: 'data-lab', seat: 0, col: 2, row: 14 },
  { room: 'meeting-room', seat: 0, col: 8, row: 14 },
  { room: 'lounge', seat: 0, col: 15, row: 14 },

  // Crisis row (row 19)
  { room: 'crisis-room', seat: 0, col: 8, row: 20 },
];

/** Furniture positions within rooms */
export interface FurnitureDef {
  room: string;
  type: 'desk' | 'monitor' | 'chair' | 'table' | 'plant' | 'shelf' | 'server' | 'whiteboard' | 'couch' | 'coffee' | 'rug';
  col: number;
  row: number;
}

export const FURNITURE: FurnitureDef[] = [
  // CEO Office (col 0, row 0) — executive desk + plant + rug
  { room: 'ceo-office', type: 'rug', col: 2, row: 1.5 },
  { room: 'ceo-office', type: 'desk', col: 1.5, row: 1 },
  { room: 'ceo-office', type: 'monitor', col: 1.8, row: 0.8 },
  { room: 'ceo-office', type: 'chair', col: 2, row: 1.5 },
  { room: 'ceo-office', type: 'plant', col: 0.5, row: 0.3 },
  { room: 'ceo-office', type: 'shelf', col: 3.2, row: 0.3 },

  // CTO Office (col 6, row 0) — monitors + server
  { room: 'cto-office', type: 'desk', col: 7.5, row: 1 },
  { room: 'cto-office', type: 'monitor', col: 7.8, row: 0.8 },
  { room: 'cto-office', type: 'monitor', col: 8.3, row: 0.8 },
  { room: 'cto-office', type: 'chair', col: 8, row: 1.5 },
  { room: 'cto-office', type: 'server', col: 9.3, row: 0.3 },

  // Arch Lab (col 12, row 0) — whiteboard
  { room: 'arch-lab', type: 'desk', col: 13.5, row: 1 },
  { room: 'arch-lab', type: 'monitor', col: 13.8, row: 0.8 },
  { room: 'arch-lab', type: 'chair', col: 14, row: 1.5 },
  { room: 'arch-lab', type: 'whiteboard', col: 15, row: 0.3 },

  // Dev Bullpen (col 0, row 6) — multiple desks
  { room: 'dev-bullpen', type: 'desk', col: 1.5, row: 7 },
  { room: 'dev-bullpen', type: 'monitor', col: 1.8, row: 6.8 },
  { room: 'dev-bullpen', type: 'chair', col: 2, row: 7.5 },
  { room: 'dev-bullpen', type: 'desk', col: 3.5, row: 8 },
  { room: 'dev-bullpen', type: 'monitor', col: 3.8, row: 7.8 },
  { room: 'dev-bullpen', type: 'chair', col: 4, row: 8.5 },
  { room: 'dev-bullpen', type: 'plant', col: 5, row: 6.3 },

  // QA Lab (col 8, row 6) — testing stations
  { room: 'qa-lab', type: 'desk', col: 8.5, row: 7 },
  { room: 'qa-lab', type: 'monitor', col: 8.8, row: 6.8 },
  { room: 'qa-lab', type: 'desk', col: 10.5, row: 8 },
  { room: 'qa-lab', type: 'monitor', col: 10.8, row: 7.8 },
  { room: 'qa-lab', type: 'server', col: 11.5, row: 6.3 },

  // Design Studio (col 14, row 6)
  { room: 'design-studio', type: 'desk', col: 14.5, row: 7 },
  { room: 'design-studio', type: 'monitor', col: 14.8, row: 6.8 },
  { room: 'design-studio', type: 'desk', col: 16.5, row: 8 },
  { room: 'design-studio', type: 'whiteboard', col: 17, row: 6.3 },

  // Data Lab (col 0, row 13)
  { room: 'data-lab', type: 'desk', col: 1.5, row: 14 },
  { room: 'data-lab', type: 'monitor', col: 1.8, row: 13.8 },
  { room: 'data-lab', type: 'server', col: 3, row: 13.3 },
  { room: 'data-lab', type: 'server', col: 3.5, row: 13.3 },

  // Meeting Room (col 6, row 13) — big table + chairs around
  { room: 'meeting-room', type: 'rug', col: 8.5, row: 14.5 },
  { room: 'meeting-room', type: 'table', col: 8, row: 14 },
  { room: 'meeting-room', type: 'chair', col: 7, row: 14 },
  { room: 'meeting-room', type: 'chair', col: 9, row: 14 },
  { room: 'meeting-room', type: 'chair', col: 8, row: 15 },
  { room: 'meeting-room', type: 'whiteboard', col: 6.5, row: 13.3 },
  { room: 'meeting-room', type: 'plant', col: 10.2, row: 13.3 },

  // Lounge (col 13, row 13) — couches + coffee
  { room: 'lounge', type: 'rug', col: 15, row: 14.5 },
  { room: 'lounge', type: 'couch', col: 14, row: 14 },
  { room: 'lounge', type: 'couch', col: 16, row: 14 },
  { room: 'lounge', type: 'coffee', col: 15, row: 14.5 },
  { room: 'lounge', type: 'plant', col: 17, row: 13.3 },
  { room: 'lounge', type: 'plant', col: 13.3, row: 13.3 },

  // Crisis Room (col 6, row 19) — screens + table
  { room: 'crisis-room', type: 'table', col: 8, row: 20 },
  { room: 'crisis-room', type: 'monitor', col: 6.5, row: 19.3 },
  { room: 'crisis-room', type: 'monitor', col: 7.5, row: 19.3 },
  { room: 'crisis-room', type: 'monitor', col: 8.5, row: 19.3 },
];

export function getSeatPosition(room: string, seat: number): SeatDef | undefined {
  return SEATS.find((s) => s.room === room && s.seat === seat);
}
