import { useEffect, useRef } from 'react';
import { Office } from '../canvas/Office';
import { Effects } from '../canvas/Effects';
import { useStore, type WowEvent } from '../store';
import { toScreen } from '../canvas/iso';
import { ROOMS, getSeatPosition } from '../canvas/rooms';

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

        // Update agents
        office.updateAgents(
          state.agents.map((a) => ({
            id: a.id,
            name: a.name,
            status: a.status,
            position_room: a.position_room,
            position_seat: a.position_seat,
          })),
        );

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
      office.destroy();
    };
  }, [canvasId]);

  return { officeRef, effectsRef };
}

function handleWowEvent(event: WowEvent | undefined, effects: Effects) {
  if (!event) return;

  switch (event.type) {
    case 'pr:merged': {
      // Confetti at the dev bullpen
      const room = ROOMS.find((r) => r.id === 'dev-bullpen');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.confetti(pos.x, pos.y);
      }
      break;
    }

    case 'crisis:start': {
      // Red pulse at crisis room
      const room = ROOMS.find((r) => r.id === 'crisis-room');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.redPulse(pos.x, pos.y);
      }
      break;
    }

    case 'crisis:resolved': {
      // Green flash at crisis room
      const room = ROOMS.find((r) => r.id === 'crisis-room');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.greenFlash(pos.x, pos.y);
      }
      break;
    }

    case 'deploy:success': {
      // Confetti at QA lab (where Gage sits)
      const seat = getSeatPosition('qa-lab', 1);
      if (seat) {
        const pos = toScreen(seat.col, seat.row);
        effects.confetti(pos.x, pos.y);
        effects.greenFlash(pos.x, pos.y);
      }
      break;
    }

    case 'sprint:complete': {
      // Big confetti at lounge
      const room = ROOMS.find((r) => r.id === 'lounge');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.confetti(pos.x, pos.y);
        effects.confetti(pos.x + 30, pos.y - 10);
        effects.confetti(pos.x - 30, pos.y + 10);
      }
      break;
    }

    case 'meeting:start': {
      // Green flash at meeting room
      const room = ROOMS.find((r) => r.id === 'meeting-room');
      if (room) {
        const pos = toScreen(room.col + room.w / 2, room.row + room.h / 2);
        effects.greenFlash(pos.x, pos.y);
      }
      break;
    }
  }
}
