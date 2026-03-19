import { useStore } from '../store';

export function useOffice() {
  const agents = useStore((s) => s.agents);
  const tasks = useStore((s) => s.tasks);
  const sprint = useStore((s) => s.sprint);

  const activeAgents = agents.filter((a) => a.status !== 'idle');
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const agentsByRoom = agents.reduce(
    (acc, agent) => {
      const room = agent.position_room;
      if (!acc[room]) acc[room] = [];
      acc[room].push(agent);
      return acc;
    },
    {} as Record<string, typeof agents>,
  );

  return {
    agents,
    activeAgents,
    agentsByRoom,
    completedTasks,
    totalTasks,
    progress,
    sprint,
  };
}
