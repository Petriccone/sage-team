/**
 * Isometric Character Sprites - Pixel art style characters using Unicode block elements
 * Each sprite is a multi-row representation creating an isometric person effect
 * similar to games like OpenClaw, Habbo Hotel, etc.
 *
 * Sprites use Unicode block characters: █ ▀ ▄ ▌ ▐ ░ ▓
 * Each sprite row is an array of { char, colorType } segments
 */

import { AgentStatus } from '../types';

export interface SpritePixel {
  char: string;
  type: 'head' | 'body' | 'legs' | 'accessory' | 'empty' | 'desk';
}

export interface CharacterSprite {
  width: number;
  height: number;
  rows: SpritePixel[][];
}

// Isometric standing character (5 wide × 4 tall)
const SPRITE_IDLE: CharacterSprite = {
  width: 5,
  height: 4,
  rows: [
    // Row 0: top of head
    [
      { char: ' ', type: 'empty' },
      { char: '▄', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▄', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    // Row 1: face + shoulders
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    // Row 2: body/torso
    [
      { char: ' ', type: 'empty' },
      { char: '▐', type: 'body' },
      { char: '█', type: 'body' },
      { char: '▌', type: 'body' },
      { char: ' ', type: 'empty' },
    ],
    // Row 3: legs
    [
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
    ],
  ],
};

// Character sitting at desk / coding
const SPRITE_CODING: CharacterSprite = {
  width: 5,
  height: 4,
  rows: [
    [
      { char: ' ', type: 'empty' },
      { char: '▄', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▄', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: '▄', type: 'accessory' },
      { char: '█', type: 'body' },
      { char: '█', type: 'body' },
      { char: '█', type: 'body' },
      { char: '▄', type: 'accessory' },
    ],
    [
      { char: '▀', type: 'desk' },
      { char: '▀', type: 'desk' },
      { char: '▀', type: 'desk' },
      { char: '▀', type: 'desk' },
      { char: '▀', type: 'desk' },
    ],
  ],
};

// Character thinking / looking up
const SPRITE_THINKING: CharacterSprite = {
  width: 5,
  height: 4,
  rows: [
    [
      { char: ' ', type: 'empty' },
      { char: ' ', type: 'empty' },
      { char: '·', type: 'accessory' },
      { char: '°', type: 'accessory' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▄', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▄', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▐', type: 'body' },
      { char: '█', type: 'body' },
      { char: '▌', type: 'body' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
    ],
  ],
};

// Character in meeting - sitting pose
const SPRITE_MEETING: CharacterSprite = {
  width: 5,
  height: 4,
  rows: [
    [
      { char: ' ', type: 'empty' },
      { char: '▄', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▄', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'body' },
      { char: '█', type: 'body' },
      { char: '█', type: 'body' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'legs' },
      { char: '▀', type: 'legs' },
      { char: '█', type: 'legs' },
      { char: ' ', type: 'empty' },
    ],
  ],
};

// Character on break - relaxed pose with coffee
const SPRITE_BREAK: CharacterSprite = {
  width: 5,
  height: 4,
  rows: [
    [
      { char: ' ', type: 'empty' },
      { char: '▄', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▄', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '░', type: 'accessory' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▐', type: 'body' },
      { char: '█', type: 'body' },
      { char: '█', type: 'body' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
    ],
  ],
};

// Character deploying / working with energy
const SPRITE_DEPLOYING: CharacterSprite = {
  width: 5,
  height: 4,
  rows: [
    [
      { char: ' ', type: 'empty' },
      { char: '▄', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▄', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: '▌', type: 'accessory' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▐', type: 'accessory' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▐', type: 'body' },
      { char: '█', type: 'body' },
      { char: '▌', type: 'body' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
    ],
  ],
};

// Character reviewing/testing - arms crossed
const SPRITE_REVIEWING: CharacterSprite = {
  width: 5,
  height: 4,
  rows: [
    [
      { char: ' ', type: 'empty' },
      { char: '▄', type: 'head' },
      { char: '█', type: 'head' },
      { char: '▄', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: '█', type: 'head' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '█', type: 'body' },
      { char: '▓', type: 'body' },
      { char: '█', type: 'body' },
      { char: ' ', type: 'empty' },
    ],
    [
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
      { char: '▀', type: 'legs' },
      { char: ' ', type: 'empty' },
    ],
  ],
};

// Map agent statuses to sprite variants
const STATUS_SPRITE_MAP: Record<string, CharacterSprite> = {
  idle: SPRITE_IDLE,
  coding: SPRITE_CODING,
  thinking: SPRITE_THINKING,
  reviewing: SPRITE_REVIEWING,
  testing: SPRITE_REVIEWING,
  deploying: SPRITE_DEPLOYING,
  meeting: SPRITE_MEETING,
  break: SPRITE_BREAK,
  'pair-programming': SPRITE_CODING,
  researching: SPRITE_THINKING,
  'writing-docs': SPRITE_CODING,
  debugging: SPRITE_CODING,
  brainstorming: SPRITE_THINKING,
  planning: SPRITE_THINKING,
  'executing-skill': SPRITE_DEPLOYING,
  'security-audit': SPRITE_REVIEWING,
  dispatching: SPRITE_DEPLOYING,
};

export function getSpriteForStatus(status: AgentStatus | string): CharacterSprite {
  return STATUS_SPRITE_MAP[status] || SPRITE_IDLE;
}

/**
 * Color mappings for sprite pixel types
 * Returns blessed tag color strings for each pixel type
 */
export function getSpriteColors(agentColor: string): Record<string, string> {
  // Map base agent colors to skin/head tones and body colors
  const headColor = '#dddddd';
  const legColor = '#555555';

  // Accessory colors based on agent theme
  const accessoryColors: Record<string, string> = {
    yellow: '#ffcc00',
    cyan: '#00cccc',
    green: '#00cc66',
    blue: '#3388ff',
    red: '#ff4444',
    magenta: '#cc44cc',
    white: '#cccccc',
  };

  return {
    head: headColor,
    body: agentColor,
    legs: legColor,
    accessory: accessoryColors[agentColor] || '#888888',
    desk: '#666666',
    empty: '',
  };
}

/**
 * Render a sprite into an array of blessed-tagged strings
 * Each string represents one row of the sprite
 */
export function renderSprite(
  sprite: CharacterSprite,
  agentColor: string,
  isSelected: boolean
): string[] {
  const colors = getSpriteColors(agentColor);
  const rows: string[] = [];

  for (const row of sprite.rows) {
    let line = '';
    for (const pixel of row) {
      if (pixel.type === 'empty') {
        line += ' ';
      } else {
        const color = colors[pixel.type] || agentColor;
        if (isSelected) {
          line += `{inverse}{${color}-fg}${pixel.char}{/${color}-fg}{/inverse}`;
        } else {
          line += `{${color}-fg}${pixel.char}{/${color}-fg}`;
        }
      }
    }
    rows.push(line);
  }

  return rows;
}
