/**
 * 2D Office Map - ASCII art representation of the virtual office
 * Each agent has a designated desk area. The map updates in real-time
 * to show agent positions, statuses, and interactions.
 */

export const OFFICE_WIDTH = 52;
export const OFFICE_HEIGHT = 17;

// The base office layout - each character represents a tile
// Legend: ═║╔╗╚╝ = walls, ▓ = desk, · = floor, ░ = meeting room
export const OFFICE_LAYOUT = `
╔══════════════════════════════════════════════════╗
║  ┌─ARCHITECT─┐  ┌──CEO───┐  ┌───CTO───┐  ┌DATA┐║
║  │ ▓▓   Aria │  │ ▓▓Sage │  │ ▓▓ Nova │  │▓▓  │║
║  └───────────┘  └────────┘  └─────────┘  └Atlas┘║
║ ·················································║
║  ┌─SR.DEV──┐  ····HALLWAY····  ┌──QA───┐  ······║
║  │ ▓▓  Dex │  ···············  │ ▓▓Quinn│  ······║
║  └─────────┘  ···············  └────────┘  ······║
║ ·················································║
║  ┌─FULLSTK─┐  ░░░░░░░░░░░░░░  ┌─DEVOPS─┐  ·····║
║  │ ▓▓ Flux │  ░ MEETING ROOM░  │ ▓▓Gage │  ·····║
║  └─────────┘  ░░░░░░░░░░░░░░  └────────┘  ·····║
║ ·················································║
║  ┌─PRODUCT─┐  ┌──SCRUM──┐  ┌───UX────┐  ········║
║  │▓▓Morgan │  │▓▓ River │  │ ▓▓ Uma  │  ·LOUNGE║
║  └─────────┘  └─────────┘  └─────────┘  ········║
╚══════════════════════════════════════════════════╝
`.trim();

export function getOfficeLines(): string[] {
  return OFFICE_LAYOUT.split('\n');
}

export const ROOM_AREAS: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
  'ceo-office': { x1: 17, y1: 1, x2: 26, y2: 3 },
  'cto-office': { x1: 29, y1: 1, x2: 39, y2: 3 },
  'architect-office': { x1: 3, y1: 1, x2: 15, y2: 3 },
  'data-office': { x1: 42, y1: 1, x2: 48, y2: 3 },
  'dev-senior': { x1: 3, y1: 5, x2: 13, y2: 7 },
  'qa-office': { x1: 33, y1: 5, x2: 42, y2: 7 },
  'dev-fullstack': { x1: 3, y1: 9, x2: 13, y2: 11 },
  'meeting-room': { x1: 16, y1: 9, x2: 30, y2: 11 },
  'devops-office': { x1: 33, y1: 9, x2: 42, y2: 11 },
  'product-office': { x1: 3, y1: 13, x2: 13, y2: 15 },
  'scrum-office': { x1: 16, y1: 13, x2: 26, y2: 15 },
  'ux-office': { x1: 29, y1: 13, x2: 39, y2: 15 },
  'lounge': { x1: 42, y1: 13, x2: 50, y2: 15 },
};

export const STATUS_ANIMATIONS: Record<string, string[]> = {
  coding: ['[>>_]', '[>_>]', '[_>>]', '[>>>]'],
  thinking: ['(·  )', '( · )', '(  ·)', '( · )'],
  reviewing: ['[👀 ]', '[ 👀]', '[👀 ]', '[ 👀]'],
  testing: ['[✓ ✗]', '[✓ ✓]', '[✗ ✓]', '[✓ ✓]'],
  deploying: ['[▸   ]', '[▸▸  ]', '[▸▸▸ ]', '[▸▸▸▸]'],
  meeting: ['🗣️', '👂', '🗣️', '💬'],
  debugging: ['[🐛?]', '[🐛!]', '[🔍 ]', '[✨ ]'],
  idle: ['[zzz]'],
  break: ['[☕ ]'],
  'pair-programming': ['[👥💻]'],
  researching: ['[📚 ]', '[📖 ]'],
  'writing-docs': ['[📝 ]', '[✍️  ]'],
  brainstorming: ['[💡 ]', '[💡💡]', '[✨💡]', '[💡✨]'],
  planning: ['[📐 ]', '[📐·]', '[📐··]', '[📐✓]'],
  'executing-skill': ['[⚡ ]', '[⚡⚡]', '[⚡▸]', '[⚡✓]'],
  'security-audit': ['[🛡️ ]', '[🛡️🔍]', '[🛡️✓]', '[🛡️!]'],
  dispatching: ['[📡 ]', '[📡→]', '[📡→→]', '[📡✓]'],
};
