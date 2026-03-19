import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import './ChatPanel.css';

const AGENT_COLOR: Record<string, string> = {
  sage: '#FFD700', nova: '#00BFFF', aria: '#FF69B4', dex: '#00FF88',
  flux: '#FF6B35', quinn: '#9B59B6', gage: '#34495E', morgan: '#E74C3C',
  uma: '#1ABC9C', river: '#3498DB', atlas: '#F39C12',
};

export function ChatPanel() {
  const messages = useStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="chat-panel">
      <div className="chat-header">Activity</div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">Waiting for activity...</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="chat-msg">
            <span
              className="chat-author"
              style={{ color: AGENT_COLOR[msg.from_agent] || '#888' }}
            >
              {msg.from_agent}
            </span>
            <span className="chat-content">{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
