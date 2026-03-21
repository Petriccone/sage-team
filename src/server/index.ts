import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import type { Orchestrator } from '../engine/orchestrator';
import { createApiRouter } from './routes/api';

/** Check if a port is free by briefly opening a TCP server */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.listen(port, () => {
      tester.close(() => resolve(true));
    });
  });
}

/** Find a free port starting from the given port */
async function findFreePort(startPort: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isPortFree(startPort + i)) {
      return startPort + i;
    }
  }
  // Fallback: let OS pick
  return 0;
}

export async function createServer(orchestrator: Orchestrator, port: number): Promise<http.Server> {
  const app = express();
  app.use(express.json());

  // Static files (built frontend) — resolve from src or dist layout
  const srcWebDist = path.join(__dirname, '..', 'web', 'dist');
  const rootWebDist = path.resolve(__dirname, '..', '..', 'src', 'web', 'dist');
  const staticPath = require('fs').existsSync(srcWebDist) ? srcWebDist : rootWebDist;
  app.use(express.static(staticPath));

  // REST API
  app.use('/api', createApiRouter(orchestrator));

  // Fallback to index.html for SPA routing (Express 5 compatible)
  app.use((_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).json({ message: 'Sage Team API running. Frontend not built yet.' });
      }
    });
  });

  const server = http.createServer(app);

  // WebSocket
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    // Send current state snapshot
    ws.send(JSON.stringify({
      type: 'snapshot',
      agents: orchestrator.getAgents(),
      tasks: orchestrator.getTasks(),
      prs: orchestrator.getPendingPRs(),
      sprint: orchestrator.getSprint(),
    }));

    // Handle client messages
    ws.on('message', async (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'goal:submit' && msg.goal) {
          if (!orchestrator.sessionId) orchestrator.start();
          await orchestrator.launchSprint(msg.goal);
        } else if (msg.type === 'pr:approve' && msg.prId) {
          await orchestrator.approvePR(msg.prId);
        } else if (msg.type === 'pr:reject' && msg.prId) {
          orchestrator.rejectPR(msg.prId, msg.feedback || '');
        }
      } catch {
        // Ignore malformed messages
      }
    });
  });

  // Forward orchestrator events to all WebSocket clients
  orchestrator.on('event', (event: any) => {
    const message = JSON.stringify(event);
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Find a free port before binding
  const freePort = await findFreePort(port);

  return new Promise<http.Server>((resolve, reject) => {
    server.once('error', reject);
    server.listen(freePort, () => {
      server.removeAllListeners('error');
      resolve(server);
    });
  });
}
