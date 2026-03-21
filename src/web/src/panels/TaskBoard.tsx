import { useState } from 'react';
import { useStore } from '../store';
import { useOffice } from '../hooks/useOffice';
import './TaskBoard.css';

const AGENT_EMOJI: Record<string, string> = {
  sage: '\u{1F451}', nova: '\u{1F52C}', aria: '\u{1F3DB}\uFE0F', dex: '\u26A1',
  flux: '\u{1F30A}', quinn: '\u{1F50D}', gage: '\u{1F680}', morgan: '\u{1F4CB}',
  uma: '\u{1F3A8}', river: '\u{1F300}', atlas: '\u{1F4CA}',
};

const AGENT_COLOR: Record<string, string> = {
  sage: '#ffd700', nova: '#00bfff', aria: '#b57edc', dex: '#50c878',
  flux: '#4169e1', quinn: '#ff8c00', gage: '#20b2aa', morgan: '#ff69b4',
  uma: '#8a2be2', river: '#00ced1', atlas: '#708090',
};

const STATUS_LABEL: Record<string, string> = {
  coding: 'Coding', reviewing: 'Reviewing', testing: 'Testing',
  planning: 'Planning', blocked: 'Blocked', deploying: 'Deploying',
  thinking: 'Thinking', idle: 'Idle',
};

export function TaskBoard() {
  const tasks = useStore((s) => s.tasks);
  const agents = useStore((s) => s.agents);
  const { sprint, progress } = useOffice();
  const [collapsed, setCollapsed] = useState(false);

  // Group tasks by status
  const todo = tasks.filter((t) => t.status === 'pending');
  const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'review');
  const done = tasks.filter((t) => t.status === 'done');
  const blocked = tasks.filter((t) => t.status === 'blocked' || t.status === 'failed');

  // Active agents (working on something)
  const activeAgents = agents.filter((a) => a.status !== 'idle');
  const idleAgents = agents.filter((a) => a.status === 'idle');

  const hasTasks = tasks.length > 0;

  if (collapsed) {
    return (
      <div className="task-board collapsed" onClick={() => setCollapsed(false)}>
        <span className="collapse-icon">▶</span>
      </div>
    );
  }

  return (
    <div className="task-board">
      {/* Header */}
      <div className="task-board-header" onClick={() => setCollapsed(true)}>
        <span className="collapse-icon">◀</span>
        <span className="task-board-title">Scrum Board</span>
        {hasTasks && (
          <span className="task-count-badge">
            {done.length}/{tasks.length}
          </span>
        )}
      </div>

      {/* Sprint info */}
      {sprint && (
        <div className="sprint-info">
          <div className="sprint-name">{sprint.name}</div>
          <div className="sprint-goal">{sprint.goal}</div>
          <div className="sprint-progress-bar">
            <div
              className="sprint-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="sprint-progress-text">
            {Math.round(progress * 100)}% — {done.length} done, {inProgress.length} active, {todo.length} queued
          </div>
        </div>
      )}

      {/* Scrum columns */}
      <div className="scrum-columns">
        {/* IN PROGRESS */}
        <div className="scrum-column">
          <div className="scrum-column-header doing">
            <span className="scrum-dot doing" />
            In Progress
            <span className="scrum-count">{inProgress.length + activeAgents.length}</span>
          </div>
          <div className="scrum-column-body">
            {/* Show active agents as cards even without formal tasks */}
            {activeAgents.map((agent) => {
              const matchingTask = inProgress.find((t) => t.assigned_to === agent.id);
              return (
                <div key={agent.id} className="scrum-card doing">
                  <div className="scrum-card-top">
                    <span className="scrum-card-emoji">{AGENT_EMOJI[agent.id] || '🤖'}</span>
                    <span
                      className="scrum-card-agent"
                      style={{ color: AGENT_COLOR[agent.id] || '#ccc' }}
                    >
                      {agent.name}
                    </span>
                    <span className="scrum-card-status">
                      {STATUS_LABEL[agent.status] || agent.status}
                    </span>
                  </div>
                  {matchingTask && (
                    <div className="scrum-card-title">{matchingTask.title}</div>
                  )}
                  {!matchingTask && agent.current_task_id && (
                    <div className="scrum-card-title">Working...</div>
                  )}
                  <div
                    className="scrum-card-bar"
                    style={{ background: AGENT_COLOR[agent.id] || '#555' }}
                  />
                </div>
              );
            })}

            {/* Show in-progress tasks without matching active agent */}
            {inProgress
              .filter((t) => !activeAgents.some((a) => a.id === t.assigned_to))
              .map((task) => (
                <div key={task.id} className="scrum-card doing">
                  <div className="scrum-card-top">
                    <span className="scrum-card-emoji">🔨</span>
                    <span className="scrum-card-title-inline">{task.title}</span>
                  </div>
                  {task.assigned_to && (
                    <div className="scrum-card-assignee">
                      {AGENT_EMOJI[task.assigned_to] || ''} {task.assigned_to}
                    </div>
                  )}
                  <div className="scrum-card-bar" style={{ background: '#50c878' }} />
                </div>
              ))}

            {activeAgents.length === 0 && inProgress.length === 0 && (
              <div className="scrum-empty">No active work</div>
            )}
          </div>
        </div>

        {/* TO DO */}
        <div className="scrum-column">
          <div className="scrum-column-header todo">
            <span className="scrum-dot todo" />
            To Do
            <span className="scrum-count">{todo.length}</span>
          </div>
          <div className="scrum-column-body">
            {todo.map((task) => (
              <div key={task.id} className="scrum-card todo">
                <div className="scrum-card-top">
                  <span className="scrum-card-emoji">⏳</span>
                  <span className="scrum-card-title-inline">{task.title}</span>
                </div>
                {task.assigned_to && (
                  <div className="scrum-card-assignee">
                    {AGENT_EMOJI[task.assigned_to] || ''} {task.assigned_to}
                  </div>
                )}
                <div className="scrum-card-bar" style={{ background: '#555' }} />
              </div>
            ))}
            {todo.length === 0 && (
              <div className="scrum-empty">Backlog empty</div>
            )}
          </div>
        </div>

        {/* BLOCKED */}
        {blocked.length > 0 && (
          <div className="scrum-column">
            <div className="scrum-column-header blocked">
              <span className="scrum-dot blocked" />
              Blocked
              <span className="scrum-count">{blocked.length}</span>
            </div>
            <div className="scrum-column-body">
              {blocked.map((task) => (
                <div key={task.id} className="scrum-card blocked">
                  <div className="scrum-card-top">
                    <span className="scrum-card-emoji">🚫</span>
                    <span className="scrum-card-title-inline">{task.title}</span>
                  </div>
                  <div className="scrum-card-bar" style={{ background: '#dc143c' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DONE */}
        <div className="scrum-column">
          <div className="scrum-column-header done">
            <span className="scrum-dot done" />
            Done
            <span className="scrum-count">{done.length}</span>
          </div>
          <div className="scrum-column-body">
            {done.map((task) => (
              <div key={task.id} className="scrum-card done">
                <div className="scrum-card-top">
                  <span className="scrum-card-emoji">✅</span>
                  <span className="scrum-card-title-inline">{task.title}</span>
                </div>
                {task.assigned_to && (
                  <div className="scrum-card-assignee">
                    {AGENT_EMOJI[task.assigned_to] || ''} {task.assigned_to}
                  </div>
                )}
                <div className="scrum-card-bar" style={{ background: '#00ff88' }} />
              </div>
            ))}
            {done.length === 0 && (
              <div className="scrum-empty">Nothing done yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Team status footer */}
      <div className="scrum-team-footer">
        <div className="scrum-team-label">Team</div>
        <div className="scrum-team-avatars">
          {agents.map((agent) => (
            <span
              key={agent.id}
              className={`scrum-avatar ${agent.status !== 'idle' ? 'active' : 'idle'}`}
              style={{
                borderColor: AGENT_COLOR[agent.id] || '#555',
                opacity: agent.status !== 'idle' ? 1 : 0.4,
              }}
              title={`${agent.name}: ${agent.status}`}
            >
              {AGENT_EMOJI[agent.id] || '🤖'}
            </span>
          ))}
        </div>
        <div className="scrum-team-summary">
          {activeAgents.length} working · {idleAgents.length} idle
        </div>
      </div>
    </div>
  );
}
