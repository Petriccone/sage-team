import { useStore } from '../store';
import './AgentBar.css';

const AGENT_EMOJI: Record<string, string> = {
  sage: '👑', nova: '🔮', aria: '🏛️', dex: '⚡', flux: '🌊',
  quinn: '🔍', gage: '⚙️', morgan: '📋', uma: '🎨', river: '🌀', atlas: '📊',
};

const AGENT_COLOR: Record<string, string> = {
  sage: '#FFD700', nova: '#00BFFF', aria: '#FF69B4', dex: '#00FF88',
  flux: '#FF6B35', quinn: '#9B59B6', gage: '#34495E', morgan: '#E74C3C',
  uma: '#1ABC9C', river: '#3498DB', atlas: '#F39C12',
};

const STATUS_DOT: Record<string, string> = {
  idle: '#555', coding: '#00ff88', reviewing: '#00bfff', testing: '#9b59b6',
  planning: '#ffd700', meeting: '#ff69b4', blocked: '#ff4444', deploying: '#ff6b35',
};

export function AgentBar() {
  const agents = useStore((s) => s.agents);

  return (
    <div className="agent-bar">
      <div className="agent-bar-logo">SAGE TEAM</div>
      <div className="agent-bar-list">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="agent-bar-item"
            title={`${agent.name} — ${agent.role} (${agent.status})`}
          >
            <span className="agent-emoji">{AGENT_EMOJI[agent.id] || '🤖'}</span>
            <span
              className="agent-name"
              style={{ color: AGENT_COLOR[agent.id] || '#aaa' }}
            >
              {agent.name}
            </span>
            <span
              className="status-dot"
              style={{ background: STATUS_DOT[agent.status] || '#555' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
