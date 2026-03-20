import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const AGENT_EMOJI: Record<string, string> = {
  sage: '\u{1F451}', nova: '\u{1F52C}', aria: '\u{1F3DB}\uFE0F', dex: '\u26A1',
  flux: '\u{1F30A}', quinn: '\u{1F50D}', gage: '\u{1F680}', morgan: '\u{1F4CB}',
  uma: '\u{1F3A8}', river: '\u{1F300}', atlas: '\u{1F4CA}',
};

const AGENT_NAME: Record<string, string> = {
  sage: 'Sage', nova: 'Nova', aria: 'Aria', dex: 'Dex',
  flux: 'Flux', quinn: 'Quinn', gage: 'Gage', morgan: 'Morgan',
  uma: 'Uma', river: 'River', atlas: 'Atlas',
};

const TOOL_VERB: Record<string, string> = {
  Edit: 'editing',
  Write: 'creating',
  Read: 'reading',
  Bash: 'running',
  Grep: 'searching for',
  Glob: 'looking for',
  Agent: 'delegating to sub-agent',
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
  const lastStatusRef = useRef<Record<string, string>>({});
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
        pushActivity({ agentId: null, icon: '\u{1F7E2}', text: 'Connected to Sage Team HQ', type: 'system' });
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

    function name(id: string): string {
      return AGENT_NAME[id] || id;
    }

    function label(id: string): string {
      return `${AGENT_EMOJI[id] || '\u{1F916}'} ${name(id)}`;
    }

    function buildToolMessage(agentId: string, tool: string, detail: string): string {
      const agentName = name(agentId);
      const verb = TOOL_VERB[tool] || `using ${tool}`;

      if (tool === 'Edit' || tool === 'Write' || tool === 'Read') {
        return detail
          ? `${agentName} ${verb} ${detail}`
          : `${agentName} ${verb} a file`;
      }
      if (tool === 'Bash') {
        if (!detail) return `${agentName} running a command`;
        // Truncate long commands
        const short = detail.length > 60 ? detail.slice(0, 57) + '...' : detail;
        return `${agentName} $ ${short}`;
      }
      if (tool === 'Grep' || tool === 'Glob') {
        return detail
          ? `${agentName} ${verb} "${detail}"`
          : `${agentName} searching the codebase`;
      }
      return `${agentName} ${verb}`;
    }

    function handleEvent(event: any) {
      const evType = event.type;
      const agentId = event.agentId;
      const data = event.data || {};

      switch (evType) {
        case 'snapshot':
          if (event.agents) setAgents(event.agents);
          if (event.tasks) setTasks(event.tasks);
          if (event.prs) setPRs(event.prs);
          pushActivity({
            agentId: null,
            icon: '\u{1F3E2}',
            text: `Office online \u2014 ${event.agents?.length || 0} agents, ${event.tasks?.length || 0} tasks loaded`,
            type: 'system',
          });
          break;

        case 'agent:status': {
          const status = data.status || event.status;
          updateAgent(agentId, { status });

          // Rich tool-based activity with detail
          if (data.tool && status !== 'idle') {
            const msg = buildToolMessage(agentId, data.tool, data.detail || '');
            // Avoid duplicate status spam — only emit if message differs
            if (lastStatusRef.current[agentId] !== msg) {
              lastStatusRef.current[agentId] = msg;
              pushActivity({
                agentId,
                icon: AGENT_EMOJI[agentId] || '\u{1F916}',
                text: msg,
                type: 'agent',
              });
            }
          } else if (status && status !== 'idle' && !data.tool) {
            const verb = STATUS_VERB[status] || `is ${status}`;
            const msg = `${name(agentId)} ${verb}`;
            if (lastStatusRef.current[agentId] !== msg) {
              lastStatusRef.current[agentId] = msg;
              pushActivity({ agentId, icon: AGENT_EMOJI[agentId] || '\u{1F916}', text: msg, type: 'agent' });
            }
          }
          break;
        }

        case 'agent:narration':
          // Agent's own words — show as quote
          pushActivity({
            agentId,
            icon: '\u{1F4AD}',
            text: `${name(agentId)}: "${data.text}"`,
            type: 'agent',
          });
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

        case 'task:assigned': {
          const taskId = data.taskId || event.taskId;
          updateTask(taskId, { assigned_to: agentId, status: 'in_progress' });
          updateAgent(agentId, { current_task_id: taskId, status: 'coding' });

          // Find the task title from store
          const tasks = useStore.getState().tasks;
          const task = tasks.find(t => t.id === taskId);
          const title = task?.title || 'a new task';

          pushActivity({
            agentId,
            icon: '\u{1F3AF}',
            text: `${label(agentId)} picked up: ${title}`,
            type: 'task',
          });
          break;
        }

        case 'task:completed': {
          const taskId = data.taskId || event.taskId;
          updateTask(taskId, { status: 'done' });

          const tasks = useStore.getState().tasks;
          const task = tasks.find(t => t.id === taskId);
          const title = task?.title || 'task';

          const cost = data.cost ? ` ($${(data.cost as number).toFixed(3)})` : '';
          const dur = data.duration ? ` in ${Math.round((data.duration as number) / 1000)}s` : '';

          pushActivity({
            agentId,
            icon: '\u2705',
            text: `${label(agentId)} completed "${title}"${dur}${cost}`,
            type: 'success',
          });

          // Show result summary if available
          if (data.result && (data.result as string).length > 10) {
            pushActivity({
              agentId,
              icon: '\u{1F4DD}',
              text: `Summary: ${(data.result as string).slice(0, 150)}`,
              type: 'info',
            });
          }

          lastStatusRef.current[agentId] = '';
          break;
        }

        case 'task:failed':
          pushActivity({
            agentId,
            icon: '\u274C',
            text: `${label(agentId)} task failed (exit ${data.exitCode || '?'})`,
            type: 'warning',
          });
          lastStatusRef.current[agentId] = '';
          break;

        case 'message':
          addMessage(event.message || data);
          break;

        case 'pr:created':
          addPR(event.pr || data);
          pushActivity({
            agentId: data.agentId || agentId,
            icon: '\u{1F4E6}',
            text: `${label(agentId)} opened PR on branch ${data.branch || '?'}`,
            type: 'info',
          });
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
          pushActivity({
            agentId: null,
            icon: '\u{1F3C1}',
            text: `Sprint "${(event.sprint || data).name}" created \u2014 let's go!`,
            type: 'system',
          });
          break;

        case 'sprint:completed':
          useStore.setState((s) => ({
            sprint: s.sprint ? { ...s.sprint, status: 'completed' } : null,
          }));
          useStore.getState().pushWow({ type: 'sprint:complete' });
          pushActivity({ agentId: null, icon: '\u{1F3C6}', text: 'Sprint completed! All tasks done.', type: 'success' });
          break;

        case 'system':
          pushActivity({ agentId, icon: '\u{1F4AC}', text: data.message || 'System event', type: 'system' });
          break;

        case 'meeting:start':
          useStore.getState().pushWow({ type: 'meeting:start', agents: event.agents || data.agents || [] });
          pushActivity({ agentId: null, icon: '\u{1F91D}', text: 'Team standup meeting started', type: 'info' });
          break;

        case 'meeting:end':
          useStore.getState().pushWow({ type: 'meeting:end' });
          pushActivity({ agentId: null, icon: '\u{1F44B}', text: 'Meeting ended \u2014 back to work!', type: 'info' });
          break;

        case 'crisis:start':
          useStore.getState().pushWow({ type: 'crisis:start', reason: event.reason || data.reason || '' });
          pushActivity({ agentId: null, icon: '\u{1F6A8}', text: `Crisis: ${data.reason || event.reason || 'unknown'}`, type: 'warning' });
          break;

        case 'crisis:resolved':
          useStore.getState().pushWow({ type: 'crisis:resolved' });
          pushActivity({ agentId: null, icon: '\u2705', text: 'Crisis resolved \u2014 all clear', type: 'success' });
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
