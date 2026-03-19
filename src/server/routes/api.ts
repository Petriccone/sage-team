import { Router } from 'express';
import type { Orchestrator } from '../../engine/orchestrator';

export function createApiRouter(orchestrator: Orchestrator): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      sessionId: orchestrator.sessionId,
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/agents', (_req, res) => {
    res.json({ agents: orchestrator.getAgents() });
  });

  router.get('/tasks', (_req, res) => {
    res.json({ tasks: orchestrator.getTasks() });
  });

  router.get('/sprint', (_req, res) => {
    // Return active sprint if available
    res.json({ sprint: null }); // TODO: expose sprint from orchestrator
  });

  router.get('/prs', (_req, res) => {
    res.json({ prs: orchestrator.getPendingPRs() });
  });

  router.get('/messages', (_req, res) => {
    res.json({ messages: [] }); // TODO: expose messages from orchestrator
  });

  router.post('/goal', async (req, res) => {
    const { goal } = req.body;
    if (!goal) {
      res.status(400).json({ error: 'Goal is required' });
      return;
    }
    try {
      await orchestrator.submitGoal(goal);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/pr/:id/approve', async (req, res) => {
    try {
      await orchestrator.approvePR(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/pr/:id/reject', (req, res) => {
    const { feedback } = req.body;
    orchestrator.rejectPR(req.params.id, feedback || '');
    res.json({ success: true });
  });

  return router;
}
