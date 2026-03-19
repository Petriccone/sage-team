/**
 * Sage Team — Web Dashboard Application
 * Wires the isometric renderer to agent data and UI panels.
 */

(function () {
  'use strict';

  // ── Initialize renderer ──
  const canvas = document.getElementById('office-canvas');
  const renderer = new OfficeRenderer(canvas);

  // Size canvas to container
  function handleResize() {
    renderer.resize();
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // ── Set agent data ──
  renderer.setAgents(AGENTS);

  // ── Simulation state ──
  const simState = {
    agentStatuses: {},
    chatIndex: 0,
    tick: 0,
  };

  // Initialize all agents as idle
  AGENTS.forEach(a => {
    simState.agentStatuses[a.id] = 'idle';
  });

  // ── Build sidebar: Team Panel ──
  const agentListEl = document.getElementById('agent-list');

  function buildTeamPanel() {
    agentListEl.innerHTML = '';
    AGENTS.forEach(agent => {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.id = `card-${agent.id}`;
      card.onclick = () => selectAgent(agent.id);

      const status = simState.agentStatuses[agent.id] || 'idle';
      const statusColor = STATUS_COLORS[status] || '#484f58';
      const statusLabel = STATUS_LABELS[status] || status;

      card.innerHTML = `
        <div class="agent-avatar" style="background:${agent.color}">${agent.name[0]}</div>
        <div class="agent-info">
          <div class="agent-name">${agent.name}</div>
          <div class="agent-role">${agent.role}</div>
          <div class="agent-status-text" id="status-${agent.id}">${statusLabel}</div>
        </div>
        <div class="agent-status-dot" style="background:${statusColor}" id="dot-${agent.id}"></div>
      `;
      agentListEl.appendChild(card);
    });
  }

  buildTeamPanel();

  // ── Build sidebar: Agent Badges (top of canvas) ──
  const badgesEl = document.getElementById('agent-badges');

  function buildBadges() {
    badgesEl.innerHTML = '';
    AGENTS.forEach(agent => {
      const badge = document.createElement('div');
      badge.className = 'agent-badge';
      badge.style.background = agent.color + '22';
      badge.style.color = agent.color;
      badge.onclick = () => selectAgent(agent.id);
      badge.innerHTML = `<span class="badge-dot" style="background:${agent.color}"></span>${agent.name}`;
      badgesEl.appendChild(badge);
    });
  }

  buildBadges();

  // ── Chat Panel ──
  const chatLogEl = document.getElementById('chat-log');

  function addChatMessage(msg) {
    const agent = AGENTS.find(a => a.id === msg.from);
    if (!agent) return;

    const el = document.createElement('div');
    el.className = 'chat-msg';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `<span class="sender" style="color:${agent.color}">${agent.name}:</span>${msg.text}<span class="time">${time}</span>`;
    chatLogEl.appendChild(el);

    // Keep max 50 messages
    while (chatLogEl.children.length > 50) {
      chatLogEl.removeChild(chatLogEl.firstChild);
    }

    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  // ── Agent selection ──
  function selectAgent(agentId) {
    // Highlight card
    document.querySelectorAll('.agent-card').forEach(c => c.classList.remove('active'));
    const card = document.getElementById(`card-${agentId}`);
    if (card) card.classList.add('active');

    renderer.selectedAgent = agentId;
  }

  renderer.onAgentSelect = selectAgent;

  // ── Simulation tick ──
  function simulationTick() {
    simState.tick++;

    // Randomly change 2-3 agent statuses each tick
    const changeCt = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < changeCt; i++) {
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const newStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      simState.agentStatuses[agent.id] = newStatus;
      renderer.updateAgentStatus(agent.id, newStatus);

      // Update sidebar
      const statusEl = document.getElementById(`status-${agent.id}`);
      const dotEl = document.getElementById(`dot-${agent.id}`);
      if (statusEl) statusEl.textContent = STATUS_LABELS[newStatus] || newStatus;
      if (dotEl) dotEl.style.background = STATUS_COLORS[newStatus] || '#484f58';
    }

    // Update header stats
    const activeCount = Object.values(simState.agentStatuses).filter(s => s !== 'idle' && s !== 'break').length;
    document.getElementById('stat-active').textContent = activeCount;
    document.getElementById('stat-tasks').textContent = Math.floor(simState.tick / 3);
    document.getElementById('stat-sprint').textContent = `S${Math.ceil(simState.tick / 20)}`;

    // Add a chat message occasionally
    if (simState.tick % 3 === 0) {
      const msg = CHAT_MESSAGES[simState.chatIndex % CHAT_MESSAGES.length];
      addChatMessage(msg);
      simState.chatIndex++;
    }
  }

  // Run simulation every 3 seconds
  setInterval(simulationTick, 3000);
  // Initial tick
  simulationTick();

  // ── Render loop ──
  function renderLoop(timestamp) {
    renderer.render(timestamp);
    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);

  // ── Initial chat messages ──
  addChatMessage(CHAT_MESSAGES[0]);
  addChatMessage(CHAT_MESSAGES[1]);
  addChatMessage(CHAT_MESSAGES[2]);
  simState.chatIndex = 3;
})();
