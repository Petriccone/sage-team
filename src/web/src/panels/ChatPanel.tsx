import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import './ChatPanel.css';

const TYPE_COLOR: Record<string, string> = {
  success: '#00ff88',
  warning: '#ff6b35',
  info: '#00bfff',
  agent: '#b0b0c0',
  task: '#ffd700',
  system: '#666',
};

const AGENT_COLOR: Record<string, string> = {
  sage: '#FFD700', nova: '#00BFFF', aria: '#b57edc', dex: '#50c878',
  flux: '#4169e1', quinn: '#ff8c00', gage: '#20b2aa', morgan: '#ff69b4',
  uma: '#8a2be2', river: '#00ced1', atlas: '#708090',
};

export function ChatPanel() {
  const activity = useStore((s) => s.activity);
  const agents = useStore((s) => s.agents);
  const tasks = useStore((s) => s.tasks);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activity.length]);

  const activeAgents = agents.filter(a => a.status !== 'idle');
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="chat-header-title">Live Activity</span>
        {totalTasks > 0 && (
          <span className="chat-header-stats">
            {completedTasks}/{totalTasks} tasks
          </span>
        )}
      </div>

      {/* Active agents strip */}
      {activeAgents.length > 0 && (
        <div className="active-agents-strip">
          {activeAgents.map(a => (
            <div key={a.id} className="active-agent-chip" style={{ borderColor: AGENT_COLOR[a.id] || '#444' }}>
              <span className="agent-dot" style={{ background: AGENT_COLOR[a.id] || '#888' }} />
              <span className="agent-chip-name">{a.id}</span>
              <span className="agent-chip-status">{a.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Activity feed */}
      <div className="chat-messages">
        {activity.length === 0 && (
          <div className="chat-empty">
            <div className="empty-icon">&#x1F3E2;</div>
            <div>Waiting for activity...</div>
            <div className="empty-hint">Start a session to see agents at work</div>
          </div>
        )}
        {activity.map((entry) => (
          <div key={entry.id} className={`activity-entry activity-${entry.type}`}>
            <span className="activity-time">{entry.time}</span>
            <span className="activity-icon">{entry.icon}</span>
            <span
              className="activity-text"
              style={{ color: entry.agentId ? (AGENT_COLOR[entry.agentId] || TYPE_COLOR[entry.type]) : TYPE_COLOR[entry.type] }}
            >
              {entry.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
