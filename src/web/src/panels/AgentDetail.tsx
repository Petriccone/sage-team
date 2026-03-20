import { useStore } from '../store';
import './AgentDetail.css';

const AGENT_EMOJI: Record<string, string> = {
  sage: '\u{1F451}', nova: '\u{1F52C}', aria: '\u{1F3DB}\uFE0F', dex: '\u26A1',
  flux: '\u{1F30A}', quinn: '\u{1F50D}', gage: '\u{1F680}', morgan: '\u{1F4CB}',
  uma: '\u{1F3A8}', river: '\u{1F300}', atlas: '\u{1F4CA}',
};

const AGENT_COLOR: Record<string, string> = {
  sage: '#FFD700', nova: '#00BFFF', aria: '#b57edc', dex: '#50c878',
  flux: '#4169e1', quinn: '#ff8c00', gage: '#20b2aa', morgan: '#ff69b4',
  uma: '#8a2be2', river: '#00ced1', atlas: '#708090',
};

const STATUS_COLOR: Record<string, string> = {
  idle: '#555', coding: '#00ff88', reviewing: '#00bfff', testing: '#9b59b6',
  planning: '#ffd700', blocked: '#ff4444', deploying: '#ff6b35', thinking: '#cccccc',
};

const STATUS_DESC: Record<string, string> = {
  idle: 'Waiting for tasks...',
  coding: 'Writing code — editing files, creating features',
  reviewing: 'Reviewing files — reading code, analyzing structure',
  testing: 'Running tests — executing commands, validating',
  planning: 'Planning — decomposing goals into tasks',
  blocked: 'Blocked — waiting for dependency or help',
  deploying: 'Deploying — pushing changes, configuring infra',
  thinking: 'Thinking — processing, reasoning about the problem',
};

export function AgentDetail() {
  const selectedAgent = useStore(s => s.selectedAgent);
  const agents = useStore(s => s.agents);
  const tasks = useStore(s => s.tasks);
  const activity = useStore(s => s.activity);
  const setSelectedAgent = useStore(s => s.setSelectedAgent);

  if (!selectedAgent) return null;

  const agent = agents.find(a => a.id === selectedAgent);
  if (!agent) return null;

  const color = AGENT_COLOR[agent.id] || '#888';
  const emoji = AGENT_EMOJI[agent.id] || '\u{1F916}';
  const statusColor = STATUS_COLOR[agent.status] || '#555';

  // Tasks assigned to this agent
  const agentTasks = tasks.filter(t => t.assigned_to === agent.id);
  const currentTask = agentTasks.find(t => t.status === 'in_progress');

  // Activity for this agent (last 30 entries)
  const agentActivity = activity
    .filter(a => a.agentId === agent.id)
    .slice(-30);

  return (
    <div className="agent-detail-overlay" onClick={() => setSelectedAgent(null)}>
      <div className="agent-detail-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="agent-detail-header" style={{ borderBottomColor: color + '40' }}>
          <button className="agent-detail-close" onClick={() => setSelectedAgent(null)}>&times;</button>
          <div className="agent-detail-avatar">
            <span className="agent-detail-emoji">{emoji}</span>
            <span className="agent-detail-status-ring" style={{ borderColor: statusColor }} />
          </div>
          <div className="agent-detail-info">
            <h2 className="agent-detail-name" style={{ color }}>{agent.name}</h2>
            <div className="agent-detail-role">{agent.role}</div>
            <div className="agent-detail-status" style={{ color: statusColor }}>
              <span className="agent-status-dot" style={{ background: statusColor }} />
              {agent.status}
            </div>
          </div>
        </div>

        {/* Status description */}
        <div className="agent-detail-desc">
          {STATUS_DESC[agent.status] || `Status: ${agent.status}`}
        </div>

        {/* Current task */}
        {currentTask && (
          <div className="agent-detail-section">
            <div className="section-label">Current Task</div>
            <div className="agent-current-task" style={{ borderLeftColor: color }}>
              <div className="current-task-title">{currentTask.title}</div>
              <div className="current-task-status">
                <span className="task-status-badge" style={{ background: statusColor + '30', color: statusColor }}>
                  {currentTask.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* All tasks */}
        {agentTasks.length > 0 && (
          <div className="agent-detail-section">
            <div className="section-label">Tasks ({agentTasks.filter(t => t.status === 'done' || t.status === 'completed').length}/{agentTasks.length} done)</div>
            <div className="agent-tasks-list">
              {agentTasks.map(t => (
                <div key={t.id} className={`agent-task-row ${t.status === 'done' || t.status === 'completed' ? 'done' : ''}`}>
                  <span className="agent-task-icon">
                    {t.status === 'done' || t.status === 'completed' ? '\u2705' : t.status === 'in_progress' ? '\u{1F528}' : '\u23F3'}
                  </span>
                  <span className="agent-task-title">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity log */}
        <div className="agent-detail-section agent-activity-section">
          <div className="section-label">Activity Log</div>
          <div className="agent-activity-log">
            {agentActivity.length === 0 && (
              <div className="agent-activity-empty">No activity yet</div>
            )}
            {agentActivity.map(entry => (
              <div key={entry.id} className="agent-activity-row">
                <span className="agent-activity-time">{entry.time}</span>
                <span className="agent-activity-icon">{entry.icon}</span>
                <span className="agent-activity-text">{entry.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="agent-detail-footer">
          <span className="agent-location">{'\u{1F4CD}'} {agent.position_room || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}
