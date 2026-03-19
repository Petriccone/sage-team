import { useState } from 'react';
import { useStore } from '../store';
import { useOffice } from '../hooks/useOffice';
import './TaskBoard.css';

const STATUS_ICON: Record<string, string> = {
  pending: '⏳', in_progress: '🔨', done: '✅', blocked: '🚫', review: '👀',
};

export function TaskBoard() {
  const tasks = useStore((s) => s.tasks);
  const { sprint, progress } = useOffice();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="task-board collapsed" onClick={() => setCollapsed(false)}>
        <span className="collapse-icon">▶</span>
      </div>
    );
  }

  return (
    <div className="task-board">
      <div className="task-board-header" onClick={() => setCollapsed(true)}>
        <span className="collapse-icon">◀</span>
        <span className="task-board-title">Sprint</span>
      </div>

      {sprint && (
        <div className="sprint-info">
          <div className="sprint-name">{sprint.name}</div>
          <div className="sprint-progress-bar">
            <div
              className="sprint-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="sprint-progress-text">
            {Math.round(progress * 100)}% complete
          </div>
        </div>
      )}

      <div className="task-list">
        {tasks.length === 0 && (
          <div className="task-empty">No tasks yet. Submit a goal to start.</div>
        )}
        {tasks.map((task) => (
          <div key={task.id} className={`task-item status-${task.status}`}>
            <span className="task-status-icon">
              {STATUS_ICON[task.status] || '📦'}
            </span>
            <div className="task-info">
              <div className="task-title">{task.title}</div>
              {task.assigned_to && (
                <div className="task-assignee">{task.assigned_to}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
