/**
 * 2D Office Map - Isometric-style ASCII art representation of the virtual office
 * Each agent has a designated desk area with room for multi-line character sprites.
 * The map updates in real-time to show agent positions, statuses, and interactions.
 */

export const OFFICE_WIDTH = 64;
export const OFFICE_HEIGHT = 26;

// The base office layout - each character represents a tile
// Legend: ═║╔╗╚╝ = walls, ▓ = desk, · = floor, ░ = meeting room, ─│┌┐└┘ = room walls
export const OFFICE_LAYOUT = `
╔══════════════════════════════════════════════════════════════╗
║ ┌──ARCHITECT──┐  ┌────CEO────┐  ┌────CTO────┐  ┌──DATA──┐ ║
║ │  ▓▓         │  │  ▓▓       │  │  ▓▓       │  │  ▓▓    │ ║
║ │             │  │           │  │           │  │        │ ║
║ │             │  │           │  │           │  │        │ ║
║ └─────────────┘  └───────────┘  └───────────┘  └────────┘ ║
║ ······························································║
║ ┌──SR.DEV────┐  ······HALLWAY·······  ┌───QA─────┐  ······· ║
║ │  ▓▓        │  ····················  │  ▓▓      │  ······· ║
║ │            │  ····················  │          │  ······· ║
║ │            │  ····················  │          │  ······· ║
║ └────────────┘  ····················  └──────────┘  ······· ║
║ ······························································║
║ ┌──FULLSTK───┐  ░░░░░░░░░░░░░░░░░  ┌──DEVOPS──┐  ······· ║
║ │  ▓▓        │  ░               ░  │  ▓▓      │  ······· ║
║ │            │  ░  MEETING ROOM ░  │          │  ······· ║
║ │            │  ░               ░  │          │  ······· ║
║ └────────────┘  ░░░░░░░░░░░░░░░░░  └──────────┘  ······· ║
║ ······························································║
║ ┌──PRODUCT───┐  ┌───SCRUM────┐  ┌────UX─────┐  ········· ║
║ │  ▓▓        │  │  ▓▓        │  │  ▓▓       │  ·LOUNGE· ║
║ │            │  │            │  │           │  ········· ║
║ │            │  │            │  │           │  ········· ║
║ └────────────┘  └────────────┘  └───────────┘  ········· ║
╚══════════════════════════════════════════════════════════════╝
`.trim();

export function getOfficeLines(): string[] {
  return OFFICE_LAYOUT.split('\n');
}

export const ROOM_AREAS: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
  'architect-office': { x1: 2, y1: 1, x2: 15, y2: 5 },
  'ceo-office': { x1: 18, y1: 1, x2: 29, y2: 5 },
  'cto-office': { x1: 32, y1: 1, x2: 43, y2: 5 },
  'data-office': { x1: 46, y1: 1, x2: 55, y2: 5 },
  'dev-senior': { x1: 2, y1: 7, x2: 14, y2: 11 },
  'qa-office': { x1: 40, y1: 7, x2: 51, y2: 11 },
  'dev-fullstack': { x1: 2, y1: 13, x2: 14, y2: 17 },
  'meeting-room': { x1: 18, y1: 13, x2: 35, y2: 17 },
  'devops-office': { x1: 38, y1: 13, x2: 49, y2: 17 },
  'product-office': { x1: 2, y1: 19, x2: 14, y2: 23 },
  'scrum-office': { x1: 18, y1: 19, x2: 30, y2: 23 },
  'ux-office': { x1: 33, y1: 19, x2: 44, y2: 23 },
  'lounge': { x1: 48, y1: 19, x2: 58, y2: 23 },
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
