/**
 * Web Dashboard Server
 * Serves the isometric HTML5 Canvas dashboard and provides
 * real-time data via Server-Sent Events (SSE)
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../engine/orchestrator';
import { CompanyConfig } from '../types';

export class WebDashboardServer {
  private server: http.Server;
  private orchestrator: Orchestrator;
  private sseClients: Set<http.ServerResponse> = new Set();
  private port: number;

  constructor(orchestrator: Orchestrator, config: CompanyConfig, port: number = 3000) {
    this.orchestrator = orchestrator;
    this.port = port;

    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    this.setupOrchestratorListeners();
  }

  private setupOrchestratorListeners(): void {
    // Forward all orchestrator events to SSE clients
    this.orchestrator.on('event', (event) => {
      this.broadcast({ type: 'event', payload: event });
    });

    // Periodic full state push every 500ms
    setInterval(() => {
      this.broadcast({ type: 'state', payload: this.getFullState() });
    }, 500);
  }

  private getFullState(): any {
    const agents = this.orchestrator.getAgentList().map((agent) => ({
      id: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      role: agent.state.persona.role,
      title: agent.state.persona.title,
      color: agent.state.persona.color,
      status: agent.status,
      mood: agent.state.mood,
      position: agent.state.position,
      currentTask: agent.state.currentTask,
      stats: agent.state.stats,
      activeSkills: agent.getActiveSkillNames(),
      desk: agent.state.persona.desk,
    }));

    const tasks = this.orchestrator.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee,
    }));

    const recentMessages = this.orchestrator.events
      .filter((e) => e.type === 'agent-message')
      .slice(-30)
      .map((e) => {
        const msg = (e.data as any).message;
        const agent = this.orchestrator.getAgent(msg.from);
        return {
          from: agent?.name || msg.from,
          emoji: agent?.emoji || '?',
          color: agent?.state.persona.color || 'white',
          to: msg.to === 'all' ? '#general' : this.orchestrator.getAgent(msg.to)?.name || msg.to,
          content: msg.content,
          timestamp: e.timestamp,
        };
      });

    return {
      agents,
      tasks,
      messages: recentMessages,
      metrics: this.orchestrator.metrics,
      sprint: this.orchestrator.currentSprint
        ? { goal: this.orchestrator.currentSprint.goal, name: this.orchestrator.currentSprint.name }
        : null,
    };
  }

  private broadcast(data: any): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || '/';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url === '/' || url === '/index.html') {
      this.serveHTML(res);
    } else if (url === '/api/events') {
      this.handleSSE(req, res);
    } else if (url === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getFullState()));
    } else if (url === '/api/goal' && req.method === 'POST') {
      this.handleGoalSubmit(req, res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  private serveHTML(res: http.ServerResponse): void {
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    try {
      const html = fs.readFileSync(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end('Dashboard file not found');
    }
  }

  private handleSSE(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Send initial state
    const initialState = JSON.stringify({ type: 'state', payload: this.getFullState() });
    res.write(`data: ${initialState}\n\n`);

    this.sseClients.add(res);

    req.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  private handleGoalSubmit(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { goal } = JSON.parse(body);
        if (goal) {
          await this.orchestrator.submitGoal(goal);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing goal' }));
        }
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }

  stop(): void {
    for (const client of this.sseClients) {
      client.end();
    }
    this.sseClients.clear();
    this.server.close();
  }
}
