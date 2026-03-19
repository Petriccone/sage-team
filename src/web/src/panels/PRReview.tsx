import { useStore } from '../store';
import './PRReview.css';

export function PRReview() {
  const prs = useStore((s) => s.prs);
  const selectedPR = useStore((s) => s.selectedPR);
  const setSelectedPR = useStore((s) => s.setSelectedPR);

  const pr = prs.find((p) => p.id === selectedPR);

  if (!pr) return null;

  async function handleAction(action: 'approve' | 'reject') {
    try {
      await fetch(`/api/pr/${pr!.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: '' }),
      });
      setSelectedPR(null);
    } catch {
      // ignore
    }
  }

  return (
    <div className="pr-overlay" onClick={() => setSelectedPR(null)}>
      <div className="pr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pr-modal-header">
          <h3>Pull Request Review</h3>
          <button className="pr-close" onClick={() => setSelectedPR(null)}>
            &times;
          </button>
        </div>
        <div className="pr-modal-body">
          <div className="pr-field">
            <span className="pr-label">Title:</span> {pr.title}
          </div>
          <div className="pr-field">
            <span className="pr-label">Branch:</span>{' '}
            <code>{pr.branch}</code>
          </div>
          <div className="pr-field">
            <span className="pr-label">Author:</span> {pr.author_agent}
          </div>
          <div className="pr-field">
            <span className="pr-label">Status:</span> {pr.status}
          </div>
          {pr.review_notes && (
            <div className="pr-review-notes">
              <div className="pr-label">Review Notes:</div>
              <pre>{pr.review_notes}</pre>
            </div>
          )}
        </div>
        <div className="pr-modal-actions">
          <button className="pr-btn approve" onClick={() => handleAction('approve')}>
            Approve & Merge
          </button>
          <button className="pr-btn reject" onClick={() => handleAction('reject')}>
            Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}
