import { useState } from 'react';
import { useStore } from '../store';
import './GoalInput.css';

export function GoalInput() {
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const connected = useStore((s) => s.connected);
  const prs = useStore((s) => s.prs);
  const setSelectedPR = useStore((s) => s.setSelectedPR);

  const pendingPRs = prs.filter(
    (p) => p.status === 'pending_review' || p.status === 'agent_reviewed',
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || submitting) return;

    setSubmitting(true);
    try {
      await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      setGoal('');
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="goal-bar">
      {pendingPRs.length > 0 && (
        <div className="pr-badges">
          {pendingPRs.map((pr) => (
            <button
              key={pr.id}
              className="pr-badge"
              onClick={() => setSelectedPR(pr.id)}
            >
              PR: {pr.title}
            </button>
          ))}
        </div>
      )}
      <form className="goal-form" onSubmit={handleSubmit}>
        <input
          className="goal-input"
          type="text"
          placeholder={
            connected
              ? 'Enter a goal for your team...'
              : 'Connecting...'
          }
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={!connected || submitting}
        />
        <button
          className="goal-submit"
          type="submit"
          disabled={!connected || submitting || !goal.trim()}
        >
          {submitting ? '...' : 'Go'}
        </button>
      </form>
    </div>
  );
}
