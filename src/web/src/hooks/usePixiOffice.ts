import { useEffect, useRef } from 'react';
import { Office } from '../canvas/Office';
import { Effects } from '../canvas/Effects';
import { useStore, type WowEvent } from '../store';
import { toScreen } from '../canvas/iso';
import { ROOMS, getSeatPosition, AGENT_HOME, MEETING_SEATS, type RoomDef } from '../canvas/rooms';

// ── Agent-visits-agent simulation ──────────────────────────────────
// Agents walk to other agents to "talk", then walk back to their desk.
// This makes the office feel alive with constant movement.

interface WanderState {
  phase: 'at-desk' | 'walking-to-friend' | 'chatting' | 'walking-home';
  timer: number;
  friendId: string;       // who they're visiting
  friendCol: number;
  friendRow: number;
}

const WANDER_STATES = new Map<string, WanderState>();

/** Get all agent IDs except the given one */
function otherAgentIds(excludeId: string): string[] {
  const state = useStore.getState();
  return state.agents.filter((a) => a.id !== excludeId).map((a) => a.id);
}

/** Get another agent's current seat position */
function agentSeatPos(agentId: string): { col: number; row: number } | null {
  const state = useStore.getState();
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return null;
  const seat = getSeatPosition(agent.position_room, agent.position_seat);
  if (!seat) return null;
  // Stand next to the friend, not on top of them
  return {
    col: seat.col + (Math.random() - 0.5) * 1.2,
    row: seat.row + (Math.random() - 0.5) * 0.8,
  };
}

/** Run one frame of wandering simulation for all agents */
function simulateWandering(office: Office) {
  const state = useStore.getState();
  const agents = state.agents;

  for (const agent of agents) {
    const sprite = office.agentSprites.get(agent.id);
    if (!sprite) continue;

    let ws = WANDER_STATES.get(agent.id);

    // Initialize — each agent starts at desk with a staggered delay
    if (!ws) {
      ws = {
        phase: 'at-desk',
        timer: 180 + Math.floor(Math.random() * 420), // 3-10s before first wander
        friendId: '',
        friendCol: 0,
        friendRow: 0,
      };
      WANDER_STATES.set(agent.id, ws);
    }

    ws.timer--;

    // AT DESK — waiting, then decide to visit someone
    if (ws.phase === 'at-desk' && ws.timer <= 0) {
      const others = otherAgentIds(agent.id);
      if (others.length > 0) {
        const friendId = others[Math.floor(Math.random() * others.length)];
        const friendPos = agentSeatPos(friendId);
        if (friendPos) {
          ws.phase = 'walking-to-friend';
          ws.friendId = friendId;
          ws.friendCol = friendPos.col;
          ws.friendRow = friendPos.row;
          ws.timer = 600; // max 10s to arrive (safety timeout)

          const target = toScreen(friendPos.col, friendPos.row);
          sprite.setTarget(target.x, target.y);
        }
      }
    }

    // WALKING TO FRIEND — keep moving, check if arrived
    if (ws.phase === 'walking-to-friend') {
      // Check if sprite has arrived (distance < 3px)
      const target = toScreen(ws.friendCol, ws.friendRow);
      const dx = sprite.container.x - target.x;
      const dy = sprite.container.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4 || ws.timer <= 0) {
        // Arrived! Chat for a while
        ws.phase = 'chatting';
        ws.timer = 180 + Math.floor(Math.random() * 240); // 3-7s chat
      }
    }

    // CHATTING — stand near friend, then leave
    if (ws.phase === 'chatting' && ws.timer <= 0) {
      ws.phase = 'walking-home';
      ws.timer = 600; // safety timeout

      // Walk back to own seat
      const seat = getSeatPosition(agent.position_room, agent.position_seat);
      if (seat) {
        const target = toScreen(seat.col, seat.row);
        sprite.setTarget(target.x, target.y);
      }
    }

    // WALKING HOME — check if arrived back
    if (ws.phase === 'walking-home') {
      const seat = getSeatPosition(agent.position_room, agent.position_seat);
      if (seat) {
        const target = toScreen(seat.col, seat.row);
        const dx = sprite.container.x - target.x;
        const dy = sprite.container.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4 || ws.timer <= 0) {
          // Back at desk — clear wandering, sit for a while
          ws.phase = 'at-desk';
          ws.timer = 240 + Math.floor(Math.random() * 480); // 4-12s at desk
          sprite.clearWander();
        }
      } else {
        // No seat found, just reset
        ws.phase = 'at-desk';
        ws.timer = 300;
        sprite.clearWander();
      }
    }
  }
}

export function usePixiOffice(canvasId: string) {
  const officeRef = useRef<Office | null>(null);
  const effectsRef = useRef<Effects | null>(null);

  useEffect(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;

    const office = new Office();
    const effects = new Effects();
    officeRef.current = office;
    effectsRef.current = effects;

    office.init(canvas).then(() => {
      office.world.addChild(effects.container);

      // Animation loop
      office.app.ticker.add(() => {
        const state = useStore.getState();

        // Update agents from store data (handles room changes from server)
        office.updateAgents(
          state.agents.map((a) => ({
            id: a.id,
            name: a.name,
            status: a.status,
            position_room: a.position_room,
            position_seat: a.position_seat,
          })),
        );

        // Simulate wandering — agents walk around the office
        simulateWandering(office);

        // Process wow events
        let wow = state.popWow();
        while (wow) {
          handleWowEvent(wow, effects);
          wow = state.popWow();
        }

        effects.tick();
      });
    });

    return () => {
      WANDER_STATES.clear();
      office.destroy();
    };
  }, [canvasId]);

  return { officeRef, effectsRef };
}

function handleWowEvent(event: WowEvent | undefined, effects: Effects) {
  if (!event) return;
  const { updateAgent } = useStore.getState();

  switch (event.type) {
    case 'pr:merged': {
      const room = ROOMS.find((r) => r.id === 'dev-bullpen');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.confetti(pos.x, pos.y);
      }
      break;
    }

    case 'crisis:start': {
      const room = ROOMS.find((r) => r.id === 'crisis-room');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.redPulse(pos.x, pos.y);
      }
      break;
    }

    case 'crisis:resolved': {
      const room = ROOMS.find((r) => r.id === 'crisis-room');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.greenFlash(pos.x, pos.y);
      }
      break;
    }

    case 'deploy:success': {
      const seat = getSeatPosition('qa-lab', 1);
      if (seat) {
        const pos = toScreen(seat.col, seat.row);
        effects.confetti(pos.x, pos.y);
        effects.greenFlash(pos.x, pos.y);
      }
      break;
    }

    case 'sprint:complete': {
      // All agents go to lounge to celebrate
      const agents = useStore.getState().agents;
      for (const agent of agents) {
        updateAgent(agent.id, {
          position_room: 'lounge',
          position_seat: 0,
        });
      }

      const room = ROOMS.find((r) => r.id === 'lounge');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.confetti(pos.x, pos.y);
        effects.confetti(pos.x + 30, pos.y - 10);
        effects.confetti(pos.x - 30, pos.y + 10);
      }

      // After 8 seconds, send everyone home
      setTimeout(() => {
        const agents = useStore.getState().agents;
        for (const agent of agents) {
          const home = AGENT_HOME[agent.id];
          if (home) {
            updateAgent(agent.id, {
              position_room: home.room,
              position_seat: home.seat,
            });
          }
        }
      }, 8000);
      break;
    }

    case 'meeting:start': {
      // Move ALL agents to the meeting room — visual team standup!
      const meetingAgents = event.agents || Object.keys(MEETING_SEATS);
      for (const agentId of meetingAgents) {
        const seat = MEETING_SEATS[agentId];
        if (seat !== undefined) {
          updateAgent(agentId, {
            position_room: 'meeting-room',
            position_seat: seat,
          });
        }
      }

      // Green flash at meeting room
      const room = ROOMS.find((r) => r.id === 'meeting-room');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.greenFlash(pos.x, pos.y);
      }
      break;
    }

    case 'meeting:end': {
      // Send everyone back to their home rooms
      const agents = useStore.getState().agents;
      for (const agent of agents) {
        const home = AGENT_HOME[agent.id];
        if (home) {
          updateAgent(agent.id, {
            position_room: home.room,
            position_seat: home.seat,
          });
        }
      }
      break;
    }

    case 'pair:start': {
      // Move paired agents to the same room (dev bullpen)
      if (event.agents && event.agents.length >= 2) {
        for (const agentId of event.agents) {
          updateAgent(agentId, {
            position_room: 'dev-bullpen',
            position_seat: event.agents.indexOf(agentId),
          });
        }
      }
      break;
    }

    case 'pair:end': {
      // Send paired agents home
      const agents = useStore.getState().agents;
      for (const agent of agents) {
        const home = AGENT_HOME[agent.id];
        if (home && agent.position_room === 'dev-bullpen') {
          updateAgent(agent.id, {
            position_room: home.room,
            position_seat: home.seat,
          });
        }
      }
      break;
    }
  }
}
