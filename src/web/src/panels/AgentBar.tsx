import { useStore } from '../store';
import './AgentBar.css';

const AGENT_EMOJI: Record<string, string> = {
  sage: '\u{1F451}', nova: '\u{1F52C}', aria: '\u{1F3DB}\uFE0F', dex: '\u26A1', flux: '\u{1F30A}',
  quinn: '\u{1F50D}', gage: '\u2699\uFE0F', morgan: '\u{1F4CB}', uma: '\u{1F3A8}', river: '\u{1F300}', atlas: '\u{1F4CA}',
};

const AGENT_COLOR: Record<string, string> = {
  sage: '#FFD700', nova: '#00BFFF', aria: '#b57edc', dex: '#50c878',
  flux: '#4169e1', quinn: '#ff8c00', gage: '#20b2aa', morgan: '#ff69b4',
  uma: '#8a2be2', river: '#00ced1', atlas: '#708090',
};

const STATUS_DOT: Record<string, string> = {
  idle: '#555', coding: '#00ff88', reviewing: '#00bfff', testing: '#9b59b6',
  planning: '#ffd700', meeting: '#ff69b4', blocked: '#ff4444', deploying: '#ff6b35',
};

export function AgentBar() {
  const agents = useStore((s) => s.agents);
  const selectedAgent = useStore((s) => s.selectedAgent);
  const setSelectedAgent = useStore((s) => s.setSelectedAgent);

  return (
    <div className="agent-bar">
      <div className="agent-bar-logo">SAGE TEAM</div>
      <div className="agent-bar-list">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`agent-bar-item ${selectedAgent === agent.id ? 'selected' : ''} ${agent.status !== 'idle' ? 'active' : ''}`}
            style={selectedAgent === agent.id ? { borderColor: AGENT_COLOR[agent.id] || '#444' } : undefined}
            title={`${agent.name} — ${agent.role} (${agent.status})`}
            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
          >
            <span className="agent-emoji">{AGENT_EMOJI[agent.id] || '\u{1F916}'}</span>
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
