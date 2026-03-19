import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const {
    setConnected,
    setAgents,
    setTasks,
    setPRs,
    addMessage,
    updateAgent,
    updateTask,
    addPR,
    updatePR,
  } = useStore.getState();

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);
      wsRef.current = ws;

      ws.onopen = () => {
        useStore.setState({ connected: true });
      };

      ws.onclose = () => {
        useStore.setState({ connected: false });
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          handleEvent(data);
        } catch {
          // ignore malformed messages
        }
      };
    }

    function handleEvent(event: any) {
      switch (event.type) {
        case 'snapshot':
          if (event.agents) setAgents(event.agents);
          if (event.tasks) setTasks(event.tasks);
          if (event.prs) setPRs(event.prs);
          break;

        case 'agent:status':
          updateAgent(event.agentId, { status: event.status });
          break;

        case 'agent:move':
          updateAgent(event.agentId, {
            position_room: event.room,
            position_seat: event.seat,
          });
          break;

        case 'task:status':
          updateTask(event.taskId, { status: event.status });
          break;

        case 'task:assigned':
          updateTask(event.taskId, {
            assigned_to: event.agentId,
            status: 'in_progress',
          });
          updateAgent(event.agentId, {
            current_task_id: event.taskId,
            status: 'coding',
          });
          break;

        case 'task:completed':
          updateTask(event.taskId, { status: 'done' });
          break;

        case 'message':
          addMessage(event.message);
          break;

        case 'pr:created':
          addPR(event.pr);
          break;

        case 'pr:updated':
          updatePR(event.prId, event.updates);
          break;

        case 'sprint:created':
          useStore.setState({ sprint: event.sprint });
          break;

        case 'sprint:completed':
          useStore.setState((s) => ({
            sprint: s.sprint ? { ...s.sprint, status: 'completed' } : null,
          }));
          useStore.getState().pushWow({ type: 'sprint:complete' });
          break;

        case 'meeting:start':
          useStore.getState().pushWow({ type: 'meeting:start', agents: event.agents || [] });
          break;

        case 'meeting:end':
          useStore.getState().pushWow({ type: 'meeting:end' });
          break;

        case 'crisis:start':
          useStore.getState().pushWow({ type: 'crisis:start', reason: event.reason || '' });
          break;

        case 'crisis:resolved':
          useStore.getState().pushWow({ type: 'crisis:resolved' });
          break;

        case 'pr:merged':
          useStore.getState().pushWow({ type: 'pr:merged', agentId: event.agentId, title: event.title });
          break;

        case 'deploy:success':
          useStore.getState().pushWow({ type: 'deploy:success' });
          break;

        case 'pair:start':
          useStore.getState().pushWow({ type: 'pair:start', agents: event.agents || [] });
          break;

        case 'pair:end':
          useStore.getState().pushWow({ type: 'pair:end' });
          break;
      }
    }

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, []);
}
