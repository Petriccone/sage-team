import { useState } from 'react';
import { useStore } from '../store';
import './GoalInput.css';

export function GoalInput() {
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const connected = useStore((s) => s.connected);
  const prs = useStore((s) => s.prs);
  const setSelectedPR = useStore((s) => s.setSelectedPR);
  const pushActivity = useStore((s) => s.pushActivity);

  const pendingPRs = prs.filter(
    (p) => p.status === 'pending_review' || p.status === 'agent_reviewed',
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || `Server error (${res.status})`;
        setError(msg);
        pushActivity({ agentId: null, icon: '\u274C', text: `Goal failed: ${msg}`, type: 'warning' });
      } else {
        setGoal('');
        pushActivity({ agentId: null, icon: '\u{1F3AF}', text: `Goal submitted: "${goal.trim()}"`, type: 'system' });
      }
    } catch (err: any) {
      const msg = err.message || 'Network error';
      setError(msg);
      pushActivity({ agentId: null, icon: '\u274C', text: `Goal failed: ${msg}`, type: 'warning' });
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
      {error && <div className="goal-error">{error}</div>}
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
          onChange={(e) => { setGoal(e.target.value); setError(''); }}
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
