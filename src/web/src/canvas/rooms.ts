// Room layout definitions — The Sims style unified building
// All rooms share walls and form one continuous office floor
// No gaps between rooms — internal walls separate departments

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

// ── UNIFIED FLOOR PLAN ──────────────────────────────────────────
// The building is a continuous 18×12 grid
// Rooms are tightly packed with shared internal walls
//
//  Col: 0   3   6   9  12  15  18
//       ┌───┬───┬───┬───┬───┬───┐
//  R0   │CEO│CTO│ArchLab│MeetRm │  Row 0-3
//       │   │   │       │       │
//       ├───┼───┼───┬───┼───┬───┤
//  R3   │Dev Bullpen│QAL│Design │  Row 3-7
//       │           │   │Studio │
//       ├───┬───┬───┼───┼───┤   │
//  R7   │Dat│Cri│Lounge │   │   │  Row 7-10
//       │Lab│sis│       │   │   │
//       └───┴───┴───────┴───┴───┘
//

export const ROOMS: RoomDef[] = [
  // ── Top Row (Executive + Meeting) ──
  { id: 'ceo-office',    label: 'CEO Office',    col: 0,  row: 0,  w: 3, h: 3, color: '#ffd700', floorColor: '#d4c4a0', wallColor: '#a0a0a8', icon: '\u{1F451}' },
  { id: 'cto-office',    label: 'CTO Office',    col: 3,  row: 0,  w: 3, h: 3, color: '#00bfff', floorColor: '#c0c4c8', wallColor: '#909098', icon: '\u{1F52C}' },
  { id: 'arch-lab',      label: 'Arch Lab',      col: 6,  row: 0,  w: 4, h: 3, color: '#b57edc', floorColor: '#ccc0d4', wallColor: '#988ca0', icon: '\u{1F3DB}\uFE0F' },
  { id: 'meeting-room',  label: 'Meeting Room',  col: 10, row: 0,  w: 4, h: 3, color: '#4169e1', floorColor: '#c4c8d4', wallColor: '#8890a0', icon: '\u{1F91D}' },

  // ── Middle Row (Development) ──
  { id: 'dev-bullpen',   label: 'Dev Bullpen',   col: 0,  row: 3,  w: 6, h: 4, color: '#50c878', floorColor: '#c8d4c0', wallColor: '#909890', icon: '\u26A1' },
  { id: 'qa-lab',        label: 'QA Lab',        col: 6,  row: 3,  w: 4, h: 4, color: '#ff8c00', floorColor: '#d4c8b8', wallColor: '#a09888', icon: '\u{1F50D}' },
  { id: 'design-studio', label: 'Design Studio', col: 10, row: 3,  w: 4, h: 4, color: '#8a2be2', floorColor: '#d0c0d8', wallColor: '#9888a0', icon: '\u{1F3A8}' },

  // ── Bottom Row (Data + Support) ──
  { id: 'data-lab',      label: 'Data Lab',      col: 0,  row: 7,  w: 3, h: 3, color: '#708090', floorColor: '#c0c4c8', wallColor: '#888c90', icon: '\u{1F4CA}' },
  { id: 'crisis-room',   label: 'Crisis Room',   col: 3,  row: 7,  w: 3, h: 3, color: '#dc143c', floorColor: '#d0c0c0', wallColor: '#a08888', icon: '\u{1F6A8}' },
  { id: 'lounge',        label: 'Lounge',        col: 6,  row: 7,  w: 4, h: 3, color: '#ff6347', floorColor: '#d8ccbc', wallColor: '#a09488', icon: '\u2615' },
];

// ── BUILDING BOUNDS ──────────────────────────────────────────────
// The full building footprint for outer walls
export const BUILDING = {
  // Top-left corner of the building grid
  col: 0,
  row: 0,
  // Building dimensions (union of all rooms)
  w: 14,  // cols 0-13
  h: 10,  // rows 0-9
};

/** Desk positions within rooms — where agents sit */
export interface SeatDef {
  room: string;
  seat: number;
  col: number;
  row: number;
}

export const SEATS: SeatDef[] = [
  // Executive row (row 0-2)
  { room: 'ceo-office', seat: 0, col: 1.5, row: 1.5 },
  { room: 'cto-office', seat: 0, col: 4.5, row: 1.5 },
  { room: 'arch-lab', seat: 0, col: 8, row: 1.5 },

  // Meeting room — multiple seats around the table for team meetings
  { room: 'meeting-room', seat: 0, col: 11, row: 1 },
  { room: 'meeting-room', seat: 1, col: 13, row: 1 },
  { room: 'meeting-room', seat: 2, col: 11, row: 2 },
  { room: 'meeting-room', seat: 3, col: 13, row: 2 },
  { room: 'meeting-room', seat: 4, col: 10.5, row: 1.5 },
  { room: 'meeting-room', seat: 5, col: 13.5, row: 1.5 },
  { room: 'meeting-room', seat: 6, col: 11.5, row: 0.5 },
  { room: 'meeting-room', seat: 7, col: 12.5, row: 0.5 },
  { room: 'meeting-room', seat: 8, col: 11.5, row: 2.5 },
  { room: 'meeting-room', seat: 9, col: 12.5, row: 2.5 },
  { room: 'meeting-room', seat: 10, col: 12, row: 1.5 },

  // Dev Bullpen (row 3-6) — multiple desks
  { room: 'dev-bullpen', seat: 0, col: 1.5, row: 4.5 },
  { room: 'dev-bullpen', seat: 1, col: 4, row: 5 },

  // QA Lab (row 3-6)
  { room: 'qa-lab', seat: 0, col: 7.5, row: 4.5 },
  { room: 'qa-lab', seat: 1, col: 9, row: 5 },

  // Design Studio (row 3-6)
  { room: 'design-studio', seat: 0, col: 11, row: 4.5 },
  { room: 'design-studio', seat: 1, col: 13, row: 5 },

  // Data Lab (row 7-9)
  { room: 'data-lab', seat: 0, col: 1.5, row: 8 },

  // Crisis Room (row 7-9)
  { room: 'crisis-room', seat: 0, col: 4.5, row: 8 },

  // Lounge (row 7-9)
  { room: 'lounge', seat: 0, col: 8, row: 8.5 },
];

/** Home room for each agent — where they go when idle */
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

/** Meeting room seat assignment for each agent during meetings */
export const MEETING_SEATS: Record<string, number> = {
  sage: 0, nova: 1, aria: 2, dex: 3, flux: 4,
  quinn: 5, gage: 6, morgan: 7, uma: 8, river: 9, atlas: 10,
};

/** Furniture positions within rooms */
export interface FurnitureDef {
  room: string;
  type: 'desk' | 'monitor' | 'chair' | 'table' | 'plant' | 'shelf' | 'server' | 'whiteboard' | 'couch' | 'coffee' | 'rug';
  col: number;
  row: number;
}

export const FURNITURE: FurnitureDef[] = [
  // CEO Office (col 0-2, row 0-2)
  { room: 'ceo-office', type: 'rug', col: 1.5, row: 1.5 },
  { room: 'ceo-office', type: 'desk', col: 1, row: 1 },
  { room: 'ceo-office', type: 'monitor', col: 1.3, row: 0.8 },
  { room: 'ceo-office', type: 'chair', col: 1.5, row: 1.5 },
  { room: 'ceo-office', type: 'plant', col: 0.5, row: 0.3 },
  { room: 'ceo-office', type: 'shelf', col: 2.2, row: 0.3 },

  // CTO Office (col 3-5, row 0-2)
  { room: 'cto-office', type: 'desk', col: 4, row: 1 },
  { room: 'cto-office', type: 'monitor', col: 4.3, row: 0.8 },
  { room: 'cto-office', type: 'monitor', col: 4.8, row: 0.8 },
  { room: 'cto-office', type: 'chair', col: 4.5, row: 1.5 },
  { room: 'cto-office', type: 'server', col: 5.3, row: 0.3 },

  // Arch Lab (col 6-9, row 0-2)
  { room: 'arch-lab', type: 'desk', col: 7.5, row: 1 },
  { room: 'arch-lab', type: 'monitor', col: 7.8, row: 0.8 },
  { room: 'arch-lab', type: 'chair', col: 8, row: 1.5 },
  { room: 'arch-lab', type: 'whiteboard', col: 9, row: 0.3 },

  // Meeting Room (col 10-13, row 0-2)
  { room: 'meeting-room', type: 'rug', col: 12, row: 1.5 },
  { room: 'meeting-room', type: 'table', col: 12, row: 1.2 },
  { room: 'meeting-room', type: 'whiteboard', col: 10.5, row: 0.3 },
  { room: 'meeting-room', type: 'plant', col: 13.2, row: 0.3 },

  // Dev Bullpen (col 0-5, row 3-6)
  { room: 'dev-bullpen', type: 'desk', col: 1, row: 4 },
  { room: 'dev-bullpen', type: 'monitor', col: 1.3, row: 3.8 },
  { room: 'dev-bullpen', type: 'chair', col: 1.5, row: 4.5 },
  { room: 'dev-bullpen', type: 'desk', col: 3.5, row: 4.5 },
  { room: 'dev-bullpen', type: 'monitor', col: 3.8, row: 4.3 },
  { room: 'dev-bullpen', type: 'chair', col: 4, row: 5 },
  { room: 'dev-bullpen', type: 'plant', col: 5, row: 3.3 },

  // QA Lab (col 6-9, row 3-6)
  { room: 'qa-lab', type: 'desk', col: 7, row: 4 },
  { room: 'qa-lab', type: 'monitor', col: 7.3, row: 3.8 },
  { room: 'qa-lab', type: 'desk', col: 8.5, row: 4.5 },
  { room: 'qa-lab', type: 'monitor', col: 8.8, row: 4.3 },
  { room: 'qa-lab', type: 'server', col: 9.3, row: 3.3 },

  // Design Studio (col 10-13, row 3-6)
  { room: 'design-studio', type: 'desk', col: 10.5, row: 4 },
  { room: 'design-studio', type: 'monitor', col: 10.8, row: 3.8 },
  { room: 'design-studio', type: 'desk', col: 12.5, row: 4.5 },
  { room: 'design-studio', type: 'whiteboard', col: 13, row: 3.3 },

  // Data Lab (col 0-2, row 7-9)
  { room: 'data-lab', type: 'desk', col: 1, row: 7.5 },
  { room: 'data-lab', type: 'monitor', col: 1.3, row: 7.3 },
  { room: 'data-lab', type: 'server', col: 2, row: 7.3 },
  { room: 'data-lab', type: 'server', col: 2.5, row: 7.3 },

  // Crisis Room (col 3-5, row 7-9)
  { room: 'crisis-room', type: 'table', col: 4.5, row: 8 },
  { room: 'crisis-room', type: 'monitor', col: 3.5, row: 7.3 },
  { room: 'crisis-room', type: 'monitor', col: 4.5, row: 7.3 },
  { room: 'crisis-room', type: 'monitor', col: 5.5, row: 7.3 },

  // Lounge (col 6-9, row 7-9)
  { room: 'lounge', type: 'rug', col: 8, row: 8.5 },
  { room: 'lounge', type: 'couch', col: 7, row: 8 },
  { room: 'lounge', type: 'couch', col: 9, row: 8 },
  { room: 'lounge', type: 'coffee', col: 8, row: 8.5 },
  { room: 'lounge', type: 'plant', col: 9.5, row: 7.3 },
  { room: 'lounge', type: 'plant', col: 6.3, row: 7.3 },
];

export function getSeatPosition(room: string, seat: number): SeatDef | undefined {
  return SEATS.find((s) => s.room === room && s.seat === seat);
}
