import { useEffect, useRef } from 'react';
import { Office } from '../canvas/Office';
import { Effects } from '../canvas/Effects';
import { useStore, type WowEvent } from '../store';
import { toScreen } from '../canvas/iso';
import { ROOMS, getSeatPosition, AGENT_HOME, MEETING_SEATS } from '../canvas/rooms';

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

      // Animation loop — agents stay at their seats,
      // movement only happens when server events change position_room/seat
      office.app.ticker.add(() => {
        const state = useStore.getState();

        office.updateAgents(
          state.agents.map((a) => ({
            id: a.id,
            name: a.name,
            status: a.status,
            position_room: a.position_room,
            position_seat: a.position_seat,
          })),
        );

        // Process wow events (meetings, celebrations, crises)
        let wow = state.popWow();
        while (wow) {
          handleWowEvent(wow, effects);
          wow = state.popWow();
        }

        effects.tick();
      });
    });

    return () => {
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

      const room = ROOMS.find((r) => r.id === 'meeting-room');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.greenFlash(pos.x, pos.y);
      }
      break;
    }

    case 'meeting:end': {
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
