import { useStore } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import { usePixiOffice } from './hooks/usePixiOffice';
import { AgentBar } from './panels/AgentBar';
import { ChatPanel } from './panels/ChatPanel';
import { TaskBoard } from './panels/TaskBoard';
import { PRReview } from './panels/PRReview';
import { GoalInput } from './panels/GoalInput';
import { AgentDetail } from './panels/AgentDetail';
import './App.css';

export function App() {
  const connected = useStore(s => s.connected);

  useWebSocket();
  usePixiOffice('office-canvas');

  return (
    <div className="app">
      <AgentBar />
      <div className="main-area">
        <TaskBoard />
        <div className="canvas-container">
          <canvas id="office-canvas" />
          {!connected && (
            <div className="connection-overlay">
              <span>Connecting to Sage Team...</span>
            </div>
          )}
        </div>
        <ChatPanel />
      </div>
      <GoalInput />
      <PRReview />
      <AgentDetail />
    </div>
  );
}
