// Room layout definitions for the isometric office

export interface RoomDef {
  id: string;
  label: string;
  col: number;
  row: number;
  w: number;
  h: number;
  color: string;
  floorColor: string;
}

export const ROOMS: RoomDef[] = [
  { id: 'ceo-office',     label: 'CEO Office',     col: 0,  row: 0,  w: 4, h: 3, color: '#ffd700', floorColor: '#1a1508' },
  { id: 'cto-office',     label: 'CTO Office',     col: 5,  row: 0,  w: 4, h: 3, color: '#00bfff', floorColor: '#081418' },
  { id: 'arch-lab',       label: 'Arch Lab',        col: 10, row: 0,  w: 4, h: 3, color: '#ff69b4', floorColor: '#180d14' },
  { id: 'dev-bullpen',    label: 'Dev Bullpen',     col: 0,  row: 4,  w: 6, h: 4, color: '#00ff88', floorColor: '#081a0e' },
  { id: 'qa-lab',         label: 'QA Lab',          col: 7,  row: 4,  w: 4, h: 4, color: '#9b59b6', floorColor: '#120d18' },
  { id: 'design-studio',  label: 'Design Studio',   col: 12, row: 4,  w: 4, h: 4, color: '#e74c3c', floorColor: '#1a0c0a' },
  { id: 'data-lab',       label: 'Data Lab',        col: 0,  row: 9,  w: 4, h: 3, color: '#f39c12', floorColor: '#1a1408' },
  { id: 'meeting-room',   label: 'Meeting Room',    col: 5,  row: 9,  w: 5, h: 3, color: '#3498db', floorColor: '#0a1218' },
  { id: 'lounge',         label: 'Lounge',          col: 11, row: 9,  w: 5, h: 3, color: '#2ecc71', floorColor: '#0a1a0e' },
  { id: 'crisis-room',    label: 'Crisis Room',     col: 5,  row: 13, w: 5, h: 3, color: '#ff4444', floorColor: '#1a0808' },
];

/** Desk positions within rooms — where agents sit */
export interface SeatDef {
  room: string;
  seat: number;
  col: number;
  row: number;
}

export const SEATS: SeatDef[] = [
  // CEO Office
  { room: 'ceo-office', seat: 0, col: 2, row: 1 },
  // CTO Office
  { room: 'cto-office', seat: 0, col: 7, row: 1 },
  // Arch Lab
  { room: 'arch-lab', seat: 0, col: 12, row: 1 },
  // Dev Bullpen — 2 seats
  { room: 'dev-bullpen', seat: 0, col: 2, row: 5 },
  { room: 'dev-bullpen', seat: 1, col: 4, row: 6 },
  // QA Lab — 2 seats
  { room: 'qa-lab', seat: 0, col: 8, row: 5 },
  { room: 'qa-lab', seat: 1, col: 10, row: 6 },
  // Design Studio — 2 seats
  { room: 'design-studio', seat: 0, col: 13, row: 5 },
  { room: 'design-studio', seat: 1, col: 15, row: 6 },
  // Data Lab
  { room: 'data-lab', seat: 0, col: 2, row: 10 },
  // Meeting Room — center table area
  { room: 'meeting-room', seat: 0, col: 7, row: 10 },
  // Lounge
  { room: 'lounge', seat: 0, col: 13, row: 10 },
  // Crisis Room
  { room: 'crisis-room', seat: 0, col: 7, row: 14 },
];

export function getSeatPosition(room: string, seat: number): SeatDef | undefined {
  return SEATS.find((s) => s.room === room && s.seat === seat);
}
