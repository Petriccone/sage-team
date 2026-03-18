/**
 * 2D ASCII Character Sprites for the office visualization.
 * Each agent gets a unique character design instead of emojis.
 * Characters have idle and talking animation frames.
 */

export interface CharacterSprite {
  /** The character rendered on the map (2 chars wide) */
  idle: string[];
  /** Animation frames when talking/interacting */
  talking: string[];
  /** Animation frames when walking */
  walking: string[];
}

// Each character is designed as a 2-char wide figure
// Using box-drawing and special chars to look like tiny 2D people

export const CHARACTER_SPRITES: Record<string, CharacterSprite> = {
  sage: {
    // CEO - distinguished figure with crown/hat
    idle:    ['oS'],
    talking: ['oS', '6S', 'oS', '6S'],
    walking: ['oS', 'os', 'oS', 'os'],
  },
  nova: {
    // CTO - smart look with glasses
    idle:    ['oN'],
    talking: ['oN', '6N', 'oN', '6N'],
    walking: ['oN', 'on', 'oN', 'on'],
  },
  dex: {
    // Senior Dev - energetic
    idle:    ['oD'],
    talking: ['oD', '6D', 'oD', '6D'],
    walking: ['oD', 'od', 'oD', 'od'],
  },
  flux: {
    // Full Stack - versatile
    idle:    ['oF'],
    talking: ['oF', '6F', 'oF', '6F'],
    walking: ['oF', 'of', 'oF', 'of'],
  },
  quinn: {
    // QA Lead - precise
    idle:    ['oQ'],
    talking: ['oQ', '6Q', 'oQ', '6Q'],
    walking: ['oQ', 'oq', 'oQ', 'oq'],
  },
  gage: {
    // DevOps - sturdy
    idle:    ['oG'],
    talking: ['oG', '6G', 'oG', '6G'],
    walking: ['oG', 'og', 'oG', 'og'],
  },
  morgan: {
    // Product Manager - organized
    idle:    ['oM'],
    talking: ['oM', '6M', 'oM', '6M'],
    walking: ['oM', 'om', 'oM', 'om'],
  },
  uma: {
    // UX Designer - creative
    idle:    ['oU'],
    talking: ['oU', '6U', 'oU', '6U'],
    walking: ['oU', 'ou', 'oU', 'ou'],
  },
  aria: {
    // Architect - structured
    idle:    ['oA'],
    talking: ['oA', '6A', 'oA', '6A'],
    walking: ['oA', 'oa', 'oA', 'oa'],
  },
  river: {
    // Scrum Master - flowing
    idle:    ['oR'],
    talking: ['oR', '6R', 'oR', '6R'],
    walking: ['oR', 'or', 'oR', 'or'],
  },
  atlas: {
    // Data Engineer - analytical
    idle:    ['oT'],
    talking: ['oT', '6T', 'oT', '6T'],
    walking: ['oT', 'ot', 'oT', 'ot'],
  },
};

/**
 * Interaction state for agent-to-agent communication.
 * When two agents are interacting, they move toward each other.
 */
export interface AgentInteraction {
  fromId: string;
  toId: string;
  startedAt: number;
  /** Duration in ms */
  duration: number;
  /** Meeting point (midpoint between the two agents) */
  meetingPoint: { x: number; y: number };
  /** Current phase: approach -> talk -> return */
  phase: 'approach' | 'talk' | 'return';
}

/**
 * Calculates the meeting point between two positions.
 * Prefers the meeting room area if both agents are nearby.
 */
export function calculateMeetingPoint(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): { x: number; y: number } {
  // Meeting room center
  const meetingRoomCenter = { x: 23, y: 10 };

  // If agents are reasonably close, meet in the hallway between them
  const midX = Math.round((pos1.x + pos2.x) / 2);
  const midY = Math.round((pos1.y + pos2.y) / 2);

  // Clamp to valid office bounds
  return {
    x: Math.max(2, Math.min(49, midX)),
    y: Math.max(1, Math.min(15, midY)),
  };
}

/**
 * Interpolates position for smooth movement animation.
 * Returns the current position based on progress (0-1).
 */
export function interpolatePosition(
  from: { x: number; y: number },
  to: { x: number; y: number },
  progress: number
): { x: number; y: number } {
  const p = Math.min(1, Math.max(0, progress));
  return {
    x: Math.round(from.x + (to.x - from.x) * p),
    y: Math.round(from.y + (to.y - from.y) * p),
  };
}

/**
 * Gets the sprite frame for a character given its current state.
 */
export function getCharacterFrame(
  agentId: string,
  state: 'idle' | 'talking' | 'walking',
  frameIndex: number
): string {
  const sprite = CHARACTER_SPRITES[agentId];
  if (!sprite) return '??';

  const frames = sprite[state];
  return frames[frameIndex % frames.length];
}
