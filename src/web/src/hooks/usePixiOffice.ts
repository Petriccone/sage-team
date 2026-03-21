import { useEffect, useRef } from 'react';
import { Office } from '../canvas/Office';
import { Effects } from '../canvas/Effects';
import { useStore, type WowEvent } from '../store';
import { toScreen } from '../canvas/iso';
import { ROOMS, getSeatPosition, AGENT_HOME, MEETING_SEATS, type RoomDef } from '../canvas/rooms';

// ── Wandering simulation ──────────────────────────────────────────
// Makes agents walk around the office so it feels alive

interface WanderState {
  phase: 'sitting' | 'walking-to' | 'visiting';
  timer: number;        // frames remaining in this phase
  targetRoom: string;   // where they're walking to (or current room)
  targetCol: number;
  targetRow: number;
}

const WANDER_STATES = new Map<string, WanderState>();

/** Pick a random point inside a room */
function randomPointInRoom(room: RoomDef): { col: number; row: number } {
  return {
    col: room.col + 0.5 + Math.random() * (room.w - 1),
    row: room.row + 0.5 + Math.random() * (room.h - 1),
  };
}

/** Pick a neighboring or random room to visit */
function pickVisitRoom(currentRoom: string): RoomDef {
  // Weighted: 60% go to an adjacent room, 40% random
  const current = ROOMS.find((r) => r.id === currentRoom);
  if (!current) return ROOMS[Math.floor(Math.random() * ROOMS.length)];

  // Find adjacent rooms (share an edge)
  const adjacent = ROOMS.filter((r) => {
    if (r.id === currentRoom) return false;
    const shareH =
      (current.row + current.h === r.row || r.row + r.h === current.row) &&
      Math.max(current.col, r.col) < Math.min(current.col + current.w, r.col + r.w);
    const shareV =
      (current.col + current.w === r.col || r.col + r.w === current.col) &&
      Math.max(current.row, r.row) < Math.min(current.row + current.h, r.row + r.h);
    return shareH || shareV;
  });

  if (adjacent.length > 0 && Math.random() < 0.6) {
    return adjacent[Math.floor(Math.random() * adjacent.length)];
  }
  // Random room (not current)
  const others = ROOMS.filter((r) => r.id !== currentRoom);
  return others[Math.floor(Math.random() * others.length)];
}

/** Run one frame of wandering simulation for all agents */
function simulateWandering(office: Office) {
  const state = useStore.getState();
  const agents = state.agents;

  for (const agent of agents) {
    let ws = WANDER_STATES.get(agent.id);

    // Initialize wander state
    if (!ws) {
      ws = {
        phase: 'sitting',
        timer: 120 + Math.floor(Math.random() * 300), // 2-7 seconds before first wander
        targetRoom: agent.position_room,
        targetCol: 0,
        targetRow: 0,
      };
      WANDER_STATES.set(agent.id, ws);
    }

    ws.timer--;

    if (ws.phase === 'sitting' && ws.timer <= 0) {
      // Decide: wander within room or visit another room
      const goVisit = Math.random() < 0.35; // 35% chance to visit another room
      if (goVisit) {
        const visitRoom = pickVisitRoom(agent.position_room);
        const pt = randomPointInRoom(visitRoom);
        ws.phase = 'walking-to';
        ws.targetRoom = visitRoom.id;
        ws.targetCol = pt.col;
        ws.targetRow = pt.row;
        ws.timer = 180 + Math.floor(Math.random() * 240); // walk for 3-7 sec
      } else {
        // Wander within current room
        const room = ROOMS.find((r) => r.id === agent.position_room);
        if (room) {
          const pt = randomPointInRoom(room);
          ws.phase = 'walking-to';
          ws.targetRoom = room.id;
          ws.targetCol = pt.col;
          ws.targetRow = pt.row;
          ws.timer = 90 + Math.floor(Math.random() * 120); // shorter walk
        }
      }
    }

    if (ws.phase === 'walking-to') {
      // Set sprite target to the wander destination
      const sprite = office.agentSprites.get(agent.id);
      if (sprite) {
        const pos = toScreen(ws.targetCol, ws.targetRow);
        sprite.setTarget(pos.x, pos.y);
      }

      if (ws.timer <= 0) {
        ws.phase = 'visiting';
        ws.timer = 120 + Math.floor(Math.random() * 240); // hang out 2-6 sec
      }
    }

    if (ws.phase === 'visiting' && ws.timer <= 0) {
      // Go back to home seat
      ws.phase = 'sitting';
      ws.timer = 180 + Math.floor(Math.random() * 360); // sit for 3-9 sec

      // Reset sprite target to their actual seat
      const sprite = office.agentSprites.get(agent.id);
      if (sprite) {
        const seatDef = getSeatPosition(agent.position_room, agent.position_seat);
        if (seatDef) {
          const pos = toScreen(seatDef.col, seatDef.row);
          sprite.setTarget(pos.x, pos.y);
        }
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
