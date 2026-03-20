import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const AGENT_EMOJI: Record<string, string> = {
  sage: '\u{1F451}', nova: '\u{1F52C}', aria: '\u{1F3DB}\uFE0F', dex: '\u26A1',
  flux: '\u{1F30A}', quinn: '\u{1F50D}', gage: '\u{1F680}', morgan: '\u{1F4CB}',
  uma: '\u{1F3A8}', river: '\u{1F300}', atlas: '\u{1F4CA}',
};

const STATUS_VERB: Record<string, string> = {
  coding: 'is writing code',
  reviewing: 'is reviewing files',
  testing: 'is running tests',
  planning: 'is planning the sprint',
  blocked: 'is blocked!',
  deploying: 'is deploying',
  thinking: 'is thinking...',
  idle: 'finished and is idle',
};

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const {
    setAgents,
    setTasks,
    setPRs,
    addMessage,
    updateAgent,
    updateTask,
    addPR,
    updatePR,
    pushActivity,
  } = useStore.getState();

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);
      wsRef.current = ws;

      ws.onopen = () => {
        useStore.setState({ connected: true });
        pushActivity({ agentId: null, icon: '\u{1F7E2}', text: 'Connected to Sage Team server', type: 'system' });
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

    function agentLabel(id: string): string {
      return `${AGENT_EMOJI[id] || '\u{1F916}'} ${id}`;
    }

    function handleEvent(event: any) {
      // All orchestrator events come wrapped as { type, agentId, data }
      const evType = event.type;
      const agentId = event.agentId;
      const data = event.data || {};

      switch (evType) {
        case 'snapshot':
          if (event.agents) setAgents(event.agents);
          if (event.tasks) setTasks(event.tasks);
          if (event.prs) setPRs(event.prs);
          pushActivity({ agentId: null, icon: '\u{1F4E1}', text: `Loaded ${event.agents?.length || 0} agents, ${event.tasks?.length || 0} tasks`, type: 'system' });
          break;

        case 'agent:status':
          updateAgent(agentId, { status: data.status || event.status });
          if (data.status && data.status !== 'idle') {
            const verb = STATUS_VERB[data.status] || `is ${data.status}`;
            pushActivity({ agentId, icon: AGENT_EMOJI[agentId] || '\u{1F916}', text: `${agentId} ${verb}`, type: 'agent' });
          }
          break;

        case 'agent:move':
          updateAgent(agentId, {
            position_room: data.room || event.room,
            position_seat: data.seat || event.seat,
          });
          break;

        case 'task:status':
          updateTask(data.taskId || event.taskId, { status: data.status || event.status });
          break;

        case 'task:assigned':
          updateTask(data.taskId || event.taskId, {
            assigned_to: agentId,
            status: 'in_progress',
          });
          updateAgent(agentId, {
            current_task_id: data.taskId || event.taskId,
            status: 'coding',
          });
          pushActivity({ agentId, icon: '\u{1F4DD}', text: `Task assigned to ${agentLabel(agentId)}`, type: 'task' });
          break;

        case 'task:completed':
          updateTask(data.taskId || event.taskId, { status: 'done' });
          pushActivity({ agentId, icon: '\u2705', text: `${agentLabel(agentId)} completed a task`, type: 'success' });
          break;

        case 'task:failed':
          pushActivity({ agentId, icon: '\u274C', text: `${agentLabel(agentId)} task failed`, type: 'warning' });
          break;

        case 'message':
          addMessage(event.message || data);
          break;

        case 'pr:created':
          addPR(event.pr || data);
          pushActivity({ agentId: data.agentId || agentId, icon: '\u{1F4E6}', text: `${agentLabel(agentId)} opened a pull request (branch: ${data.branch || '?'})`, type: 'info' });
          break;

        case 'pr:updated':
          updatePR(event.prId || data.prId, event.updates || data);
          break;

        case 'pr:merged':
          useStore.getState().pushWow({ type: 'pr:merged', agentId: agentId || data.agentId, title: data.title || event.title || '' });
          pushActivity({ agentId, icon: '\u{1F389}', text: `PR merged! ${data.title || ''}`, type: 'success' });
          break;

        case 'sprint:created':
          useStore.setState({ sprint: event.sprint || data });
          break;

        case 'sprint:completed':
          useStore.setState((s) => ({
            sprint: s.sprint ? { ...s.sprint, status: 'completed' } : null,
          }));
          useStore.getState().pushWow({ type: 'sprint:complete' });
          pushActivity({ agentId: null, icon: '\u{1F3C6}', text: 'Sprint completed!', type: 'success' });
          break;

        case 'system':
          pushActivity({ agentId, icon: '\u{1F4AC}', text: data.message || 'System event', type: 'system' });
          break;

        case 'meeting:start':
          useStore.getState().pushWow({ type: 'meeting:start', agents: event.agents || data.agents || [] });
          pushActivity({ agentId: null, icon: '\u{1F91D}', text: 'Meeting started', type: 'info' });
          break;

        case 'meeting:end':
          useStore.getState().pushWow({ type: 'meeting:end' });
          break;

        case 'crisis:start':
          useStore.getState().pushWow({ type: 'crisis:start', reason: event.reason || data.reason || '' });
          pushActivity({ agentId: null, icon: '\u{1F6A8}', text: `Crisis: ${data.reason || event.reason || 'unknown'}`, type: 'warning' });
          break;

        case 'crisis:resolved':
          useStore.getState().pushWow({ type: 'crisis:resolved' });
          pushActivity({ agentId: null, icon: '\u2705', text: 'Crisis resolved', type: 'success' });
          break;

        case 'deploy:success':
          useStore.getState().pushWow({ type: 'deploy:success' });
          pushActivity({ agentId: null, icon: '\u{1F680}', text: 'Deployment successful!', type: 'success' });
          break;

        case 'pair:start':
          useStore.getState().pushWow({ type: 'pair:start', agents: event.agents || data.agents || [] });
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
