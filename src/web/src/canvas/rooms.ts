// Room layout definitions — pixel art office inspired by Gather.town / The Sims

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
export const ROOMS: RoomDef[] = [
  { id: 'ceo-office',     label: 'CEO Office',     col: 0,  row: 0,  w: 4, h: 3, color: '#ffd700', floorColor: '#d4c4a0', wallColor: '#a0a0a8', icon: '\u{1F451}' },
  { id: 'cto-office',     label: 'CTO Office',     col: 5,  row: 0,  w: 4, h: 3, color: '#00bfff', floorColor: '#c0c4c8', wallColor: '#909098', icon: '\u{1F52C}' },
  { id: 'arch-lab',       label: 'Arch Lab',       col: 10, row: 0,  w: 4, h: 3, color: '#b57edc', floorColor: '#ccc0d4', wallColor: '#988ca0', icon: '\u{1F3DB}\uFE0F' },
  { id: 'dev-bullpen',    label: 'Dev Bullpen',    col: 0,  row: 4,  w: 6, h: 4, color: '#50c878', floorColor: '#c8d4c0', wallColor: '#909890', icon: '\u26A1' },
  { id: 'qa-lab',         label: 'QA Lab',         col: 7,  row: 4,  w: 4, h: 4, color: '#ff8c00', floorColor: '#d4c8b8', wallColor: '#a09888', icon: '\u{1F50D}' },
  { id: 'design-studio',  label: 'Design Studio',  col: 12, row: 4,  w: 4, h: 4, color: '#8a2be2', floorColor: '#d0c0d8', wallColor: '#9888a0', icon: '\u{1F3A8}' },
  { id: 'data-lab',       label: 'Data Lab',       col: 0,  row: 9,  w: 4, h: 3, color: '#708090', floorColor: '#c0c4c8', wallColor: '#888c90', icon: '\u{1F4CA}' },
  { id: 'meeting-room',   label: 'Meeting Room',   col: 5,  row: 9,  w: 5, h: 3, color: '#4169e1', floorColor: '#c4c8d4', wallColor: '#8890a0', icon: '\u{1F91D}' },
  { id: 'lounge',         label: 'Lounge',         col: 11, row: 9,  w: 5, h: 3, color: '#ff6347', floorColor: '#d8ccbc', wallColor: '#a09488', icon: '\u2615' },
  { id: 'crisis-room',    label: 'Crisis Room',    col: 5,  row: 13, w: 5, h: 3, color: '#dc143c', floorColor: '#d0c0c0', wallColor: '#a08888', icon: '\u{1F6A8}' },
];

/** Desk positions within rooms — where agents sit */
export interface SeatDef {
  room: string;
  seat: number;
  col: number;
  row: number;
}

export const SEATS: SeatDef[] = [
  { room: 'ceo-office', seat: 0, col: 2, row: 1 },
  { room: 'cto-office', seat: 0, col: 7, row: 1 },
  { room: 'arch-lab', seat: 0, col: 12, row: 1 },
  { room: 'dev-bullpen', seat: 0, col: 2, row: 5 },
  { room: 'dev-bullpen', seat: 1, col: 4, row: 6 },
  { room: 'qa-lab', seat: 0, col: 8, row: 5 },
  { room: 'qa-lab', seat: 1, col: 10, row: 6 },
  { room: 'design-studio', seat: 0, col: 13, row: 5 },
  { room: 'design-studio', seat: 1, col: 15, row: 6 },
  { room: 'data-lab', seat: 0, col: 2, row: 10 },
  { room: 'meeting-room', seat: 0, col: 7, row: 10 },
  { room: 'lounge', seat: 0, col: 13, row: 10 },
  { room: 'crisis-room', seat: 0, col: 7, row: 14 },
];

/** Furniture positions within rooms */
export interface FurnitureDef {
  room: string;
  type: 'desk' | 'monitor' | 'chair' | 'table' | 'plant' | 'shelf' | 'server' | 'whiteboard' | 'couch' | 'coffee' | 'rug';
  col: number;
  row: number;
}

export const FURNITURE: FurnitureDef[] = [
  // CEO Office — executive desk + plant + rug
  { room: 'ceo-office', type: 'rug', col: 2, row: 1.5 },
  { room: 'ceo-office', type: 'desk', col: 1.5, row: 1 },
  { room: 'ceo-office', type: 'monitor', col: 1.8, row: 0.8 },
  { room: 'ceo-office', type: 'chair', col: 2, row: 1.5 },
  { room: 'ceo-office', type: 'plant', col: 0.5, row: 0.3 },
  { room: 'ceo-office', type: 'shelf', col: 3.2, row: 0.3 },

  // CTO Office — monitors + server
  { room: 'cto-office', type: 'desk', col: 6.5, row: 1 },
  { room: 'cto-office', type: 'monitor', col: 6.8, row: 0.8 },
  { room: 'cto-office', type: 'monitor', col: 7.3, row: 0.8 },
  { room: 'cto-office', type: 'chair', col: 7, row: 1.5 },
  { room: 'cto-office', type: 'server', col: 8.3, row: 0.3 },

  // Arch Lab — whiteboard
  { room: 'arch-lab', type: 'desk', col: 11.5, row: 1 },
  { room: 'arch-lab', type: 'monitor', col: 11.8, row: 0.8 },
  { room: 'arch-lab', type: 'chair', col: 12, row: 1.5 },
  { room: 'arch-lab', type: 'whiteboard', col: 13, row: 0.3 },

  // Dev Bullpen — multiple desks
  { room: 'dev-bullpen', type: 'desk', col: 1.5, row: 5 },
  { room: 'dev-bullpen', type: 'monitor', col: 1.8, row: 4.8 },
  { room: 'dev-bullpen', type: 'chair', col: 2, row: 5.5 },
  { room: 'dev-bullpen', type: 'desk', col: 3.5, row: 6 },
  { room: 'dev-bullpen', type: 'monitor', col: 3.8, row: 5.8 },
  { room: 'dev-bullpen', type: 'chair', col: 4, row: 6.5 },
  { room: 'dev-bullpen', type: 'plant', col: 5, row: 4.3 },

  // QA Lab — testing stations
  { room: 'qa-lab', type: 'desk', col: 7.5, row: 5 },
  { room: 'qa-lab', type: 'monitor', col: 7.8, row: 4.8 },
  { room: 'qa-lab', type: 'desk', col: 9.5, row: 6 },
  { room: 'qa-lab', type: 'monitor', col: 9.8, row: 5.8 },
  { room: 'qa-lab', type: 'server', col: 10.5, row: 4.3 },

  // Design Studio
  { room: 'design-studio', type: 'desk', col: 12.5, row: 5 },
  { room: 'design-studio', type: 'monitor', col: 12.8, row: 4.8 },
  { room: 'design-studio', type: 'desk', col: 14.5, row: 6 },
  { room: 'design-studio', type: 'whiteboard', col: 15, row: 4.3 },

  // Data Lab
  { room: 'data-lab', type: 'desk', col: 1.5, row: 10 },
  { room: 'data-lab', type: 'monitor', col: 1.8, row: 9.8 },
  { room: 'data-lab', type: 'server', col: 3, row: 9.3 },
  { room: 'data-lab', type: 'server', col: 3.5, row: 9.3 },

  // Meeting Room — big table + chairs around
  { room: 'meeting-room', type: 'rug', col: 7.5, row: 10.5 },
  { room: 'meeting-room', type: 'table', col: 7, row: 10 },
  { room: 'meeting-room', type: 'chair', col: 6, row: 10 },
  { room: 'meeting-room', type: 'chair', col: 8, row: 10 },
  { room: 'meeting-room', type: 'chair', col: 7, row: 11 },
  { room: 'meeting-room', type: 'whiteboard', col: 5.5, row: 9.3 },
  { room: 'meeting-room', type: 'plant', col: 9.2, row: 9.3 },

  // Lounge — couches + coffee
  { room: 'lounge', type: 'rug', col: 13, row: 10.5 },
  { room: 'lounge', type: 'couch', col: 12, row: 10 },
  { room: 'lounge', type: 'couch', col: 14, row: 10 },
  { room: 'lounge', type: 'coffee', col: 13, row: 10.5 },
  { room: 'lounge', type: 'plant', col: 15, row: 9.3 },
  { room: 'lounge', type: 'plant', col: 11.3, row: 9.3 },

  // Crisis Room — screens + table
  { room: 'crisis-room', type: 'table', col: 7, row: 14 },
  { room: 'crisis-room', type: 'monitor', col: 5.5, row: 13.3 },
  { room: 'crisis-room', type: 'monitor', col: 6.5, row: 13.3 },
  { room: 'crisis-room', type: 'monitor', col: 7.5, row: 13.3 },
];

export function getSeatPosition(room: string, seat: number): SeatDef | undefined {
  return SEATS.find((s) => s.room === room && s.seat === seat);
}
