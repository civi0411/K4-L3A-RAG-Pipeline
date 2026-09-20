// ============================================================
// LexAI — Vanilla JS Application
// app/frontend/assets/app.js
// ============================================================

(() => {
  'use strict';

  // ── State ────────────────────────────────────────────────
  const state = {
    history: [],          // [{role, content}] for API
    sessions: [],         // [{id, query, ts}] for sidebar
    isGenerating: false,
    lastSources: [],
    lastLatency: null,
    currentSessionId: null,
    config: {
      topK: 5,
      threshold: 0.30,
      hyde: true,
      memory: true,
      hybrid: true,
    }
  };

  // ── DOM refs ─────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const shell          = $('appShell');
  const sidebar        = document.querySelector('.sidebar');
  const sidebarToggle  = $('sidebarToggle');
  const dockEl         = $('dock');
  const dockToggle     = $('dockToggle');
  const messagesArea   = $('messagesArea');
  const welcomeScreen  = $('welcomeScreen');
  const chatForm       = $('chatForm');
  const chatInput      = $('chatInput');
  const sendBtn        = $('sendBtn');
  const themeBtn       = $('themeBtn');
  const newChatBtn     = $('newChatBtn');
  const historyList    = $('historyList');
  const historyEmpty   = $('historyEmpty');
  const clearBtn       = $('clearBtn');

  // Input chips
  const chkHyde    = $('chkHyde');
  const chkMemory  = $('chkMemory');
  const chkHybrid  = $('chkHybrid');
  const chkCompare = $('chkCompare');
  const topKInput  = $('topKInput');

  // Dock panels
  const sourcesEmpty = $('sourcesEmpty');
  const sourcesList  = $('sourcesList');
  const statLegal    = $('statLegal');
  const statNews     = $('statNews');
  const statChunks   = $('statChunks');
  const statSidebar  = $('statSidebar');
  const latRetrieval = $('latRetrieval');
  const latTotal     = $('latTotal');
  const latMethod    = $('latMethod');
  const hydeTrace    = $('hydeTrace');
  const hydeContent  = $('hydeContent');

  // A/B elements
  const abIdle    = $('abIdle');
  const abResult  = $('abResult');
  const ragasTable = $('ragasTable');
  const runAbBtn  = $('runAbBtn');

  // Config sliders
  const cfgTopK     = $('cfgTopK');
  const cfgTopKVal  = $('cfgTopKVal');
  const cfgThresh   = $('cfgThresh');
  const cfgThreshVal = $('cfgThreshVal');

  // ── Theme ────────────────────────────────────────────────
  const storedTheme = localStorage.getItem('lex_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', storedTheme);
  syncThemeIcons(storedTheme);

  function syncThemeIcons(theme) {
    const moon = themeBtn.querySelector('.icon-moon');
    const sun  = themeBtn.querySelector('.icon-sun');
    if (theme === 'dark') {
      moon.style.display = 'block';
      sun.style.display  = 'none';
    } else {
      moon.style.display = 'none';
      sun.style.display  = 'block';
    }
  }

  themeBtn.addEventListener('click', () => {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lex_theme', next);
    syncThemeIcons(next);
  });

  // ── Sidebar / Dock toggle ────────────────────────────────
  sidebarToggle.addEventListener('click', () => {
    shell.classList.toggle('sidebar-hidden');
  });
  dockToggle.addEventListener('click', () => {
    shell.classList.toggle('dock-hidden');
  });

  // ── Dock tabs ────────────────────────────────────────────
  $$('.dock-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.dock-tab').forEach(t => t.classList.remove('active'));
      $$('.dock-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panelId = 'panel' + tab.dataset.panel.charAt(0).toUpperCase() + tab.dataset.panel.slice(1);
      const panel = $(panelId);
      if (panel) panel.classList.add('active');
    });
  });

  // ── Topic nav ────────────────────────────────────────────
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      $$('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ── Config slider sync ───────────────────────────────────
  cfgTopK.addEventListener('input', () => {
    cfgTopKVal.textContent = cfgTopK.value;
    topKInput.value = cfgTopK.value;
    state.config.topK = parseInt(cfgTopK.value);
  });
  cfgThresh.addEventListener('input', () => {
    cfgThreshVal.textContent = parseFloat(cfgThresh.value).toFixed(2);
    state.config.threshold = parseFloat(cfgThresh.value);
  });
  topKInput.addEventListener('change', () => {
    const v = Math.min(10, Math.max(1, parseInt(topKInput.value) || 5));
    topKInput.value = v;
    cfgTopK.value = v;
    cfgTopKVal.textContent = v;
    state.config.topK = v;
  });

  // ── Config panel checkbox sync ───────────────────────────
  $('cfgHydeCheck').addEventListener('change', e  => { chkHyde.checked = e.target.checked; });
  $('cfgMemoryCheck').addEventListener('change', e => { chkMemory.checked = e.target.checked; });
  $('cfgHybridCheck').addEventListener('change', e => { chkHybrid.checked = e.target.checked; });
  chkHyde.addEventListener('change',   e => { $('cfgHydeCheck').checked = e.target.checked; });
  chkMemory.addEventListener('change', e => { $('cfgMemoryCheck').checked = e.target.checked; });
  chkHybrid.addEventListener('change', e => { $('cfgHybridCheck').checked = e.target.checked; });

  // Mode pills
  $$('.mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.mode-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (pill.dataset.mode === 'sota') {
        chkHyde.checked = true; chkMemory.checked = true; chkHybrid.checked = true;
        $('cfgHydeCheck').checked = true; $('cfgMemoryCheck').checked = true; $('cfgHybridCheck').checked = true;
      } else if (pill.dataset.mode === 'fast') {
        chkHyde.checked = false; chkMemory.checked = false; chkHybrid.checked = false;
        $('cfgHydeCheck').checked = false; $('cfgMemoryCheck').checked = false; $('cfgHybridCheck').checked = false;
      }
    });
  });

  // ── Auto-resize textarea ─────────────────────────────────
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
    sendBtn.disabled = chatInput.value.trim().length === 0 || state.isGenerating;
  });
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // ── Starter cards ────────────────────────────────────────
  $$('.starter-card').forEach(card => {
    card.addEventListener('click', () => {
      const q = card.dataset.q;
      if (q) {
        chatInput.value = q;
        chatInput.dispatchEvent(new Event('input'));
        chatInput.focus();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  // ── New chat ─────────────────────────────────────────────
  newChatBtn.addEventListener('click', () => {
    state.history = [];
    state.lastSources = [];
    state.lastLatency = null;
    state.isGenerating = false;
    messagesArea.innerHTML = '';
    messagesArea.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'flex';
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;
    clearSources();
    clearLatency();
  });

  clearBtn.addEventListener('click', () => {
    state.sessions = [];
    renderHistory();
    newChatBtn.click();
  });

  // ── Fetch corpus stats ───────────────────────────────────
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const d = await res.json();
      if (statLegal)   statLegal.textContent   = d.legal_documents ?? '—';
      if (statNews)    statNews.textContent     = d.news_documents  ?? '—';
      if (statChunks)  statChunks.textContent   = d.indexed_chunks  ?? '—';
      if (statSidebar) statSidebar.textContent  =
        `${d.indexed_chunks ?? '?'} chunks · ${d.legal_documents ?? '?'} văn bản pháp luật`;
    } catch (_) {}
  }
  loadStats();

  // ── History sidebar ──────────────────────────────────────
  function renderHistory() {
    historyList.querySelectorAll('.history-item').forEach(el => el.remove());
    if (state.sessions.length === 0) {
      historyEmpty.style.display = 'flex';
      return;
    }
    historyEmpty.style.display = 'none';
    state.sessions.slice().reverse().forEach(s => {
      const el = document.createElement('div');
      el.className = 'history-item' + (s.id === state.currentSessionId ? ' current' : '');
      el.textContent = s.query.length > 42 ? s.query.slice(0, 42) + '…' : s.query;
      el.title = s.query;
      historyList.appendChild(el);
    });
  }

  function addToHistory(query) {
    const id = Date.now().toString();
    state.currentSessionId = id;
    state.sessions.push({ id, query, ts: new Date().toISOString() });
    renderHistory();
  }

  // ── Markdown renderer (lightweight) ──────────────────────
  function renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)+/gs, '<ul>$&</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^(?!<[houbp])(.+)$/gm, (m) => m.startsWith('<') ? m : '<p>' + m + '</p>');
  }

  // ── Citation highlighting in answer text ─────────────────
  function addCitationTags(html, sources) {
    sources.forEach((src, idx) => {
      const num = idx + 1;
      const title = (src.metadata?.title || 'Nguồn').split(' ').slice(0, 4).join(' ');
      // Replace patterns like [X] or (**X**) with clickable tags
      html = html.replace(
        new RegExp(`\\[${num}\\]`, 'g'),
        `<span class="citation-tag" data-idx="${idx}" onclick="window._lexShowSource(${idx})">[${num}] ${title}</span>`
      );
    });
    return html;
  }

  // ── Append message to DOM ─────────────────────────────────
  function appendMessage(role, content, sources = [], latency = null, method = null, hydeDoc = null) {
    welcomeScreen.style.display = 'none';

    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    if (role === 'assistant') {
      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'avatar ai-avatar';
      avatar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
      row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = `bubble ${role === 'user' ? 'user-bubble' : 'ai-bubble'}`;

    if (role === 'user') {
      bubble.textContent = content;
    } else {
      let html = renderMarkdown(content);
      if (sources.length) html = addCitationTags(html, sources);
      bubble.innerHTML = html;
    }

    if (role === 'user') {
      const avatar = document.createElement('div');
      avatar.className = 'avatar user-avatar';
      avatar.textContent = 'U';
      row.appendChild(bubble);
      row.appendChild(avatar);
    } else {
      row.appendChild(bubble);
    }

    messagesArea.appendChild(row);

    // Meta row for assistant
    if (role === 'assistant' && (latency !== null || sources.length > 0)) {
      const meta = document.createElement('div');
      meta.className = 'message-meta';
      if (latency !== null)
        meta.innerHTML += `<span class="meta-latency">⏱ ${latency}ms</span>`;
      if (method)
        meta.innerHTML += `<span class="meta-method">${method.toUpperCase()}</span>`;
      if (sources.length)
        meta.innerHTML += `<button class="meta-source-btn" onclick="window._lexOpenSources()">📄 ${sources.length} nguồn trích dẫn</button>`;
      messagesArea.appendChild(meta);
    }

    messagesArea.scrollTop = messagesArea.scrollHeight;

    // Update sources panel
    if (sources.length) {
      state.lastSources = sources;
      renderSources(sources);
    }

    // Update metrics panel
    if (latency !== null) {
      updateLatency(latency, method);
    }

    // HyDE trace
    if (hydeDoc) {
      hydeTrace.style.display = 'block';
      hydeContent.textContent = hydeDoc;
    } else {
      hydeTrace.style.display = 'none';
    }
  }

  // ── Typing indicator ─────────────────────────────────────
  function showTyping() {
    const row = document.createElement('div');
    row.className = 'message-row assistant';
    row.id = 'typingRow';

    const avatar = document.createElement('div');
    avatar.className = 'avatar ai-avatar';
    avatar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble ai-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

    row.appendChild(avatar);
    row.appendChild(bubble);
    welcomeScreen.style.display = 'none';
    messagesArea.appendChild(row);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function removeTyping() {
    const row = $('typingRow');
    if (row) row.remove();
  }

  // ── Sources panel ────────────────────────────────────────
  function clearSources() {
    sourcesEmpty.style.display = 'flex';
    sourcesList.style.display  = 'none';
    sourcesList.innerHTML = '';
  }

  function renderSources(sources) {
    sourcesEmpty.style.display = 'none';
    sourcesList.style.display  = 'block';
    sourcesList.innerHTML = '';

    sources.forEach((src, idx) => {
      const meta     = src.metadata || {};
      const title    = meta.title || `Nguồn ${idx + 1}`;
      const score    = typeof src.score === 'number' ? src.score : 0;
      const method   = src.retrieval_method || 'hybrid';
      const excerpt  = src.content || '';
      const url      = meta.url;

      // Normalize score to 0–100% for bar
      let scoreWidth;
      if (score < 1) scoreWidth = Math.round(score * 100); // cosine 0-1
      else scoreWidth = Math.min(100, Math.round(score));   // or raw

      const card = document.createElement('div');
      card.className = 'source-card';
      card.innerHTML = `
        <div class="source-card-header">
          <div class="source-num">${idx + 1}</div>
          <div class="source-title" title="${title}">${title}</div>
        </div>
        <div class="source-score-bar">
          <div class="source-score-fill" style="width:${scoreWidth}%"></div>
        </div>
        <div class="source-excerpt">${excerpt.replace(/</g,'&lt;')}</div>
        <div class="source-footer">
          <span class="source-method">${method}</span>
          ${url ? `<a class="source-link" href="${url}" target="_blank" rel="noopener">↗ Xem gốc</a>` : ''}
        </div>`;
      sourcesList.appendChild(card);
    });

    // Switch dock to Sources tab
    activateDockTab('sources');
  }

  function activateDockTab(name) {
    $$('.dock-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.panel === name);
    });
    $$('.dock-panel').forEach(p => p.classList.remove('active'));
    const panel = $('panel' + name.charAt(0).toUpperCase() + name.slice(1));
    if (panel) panel.classList.add('active');
  }

  // Global hook for meta-bar button
  window._lexOpenSources = () => activateDockTab('sources');
  window._lexShowSource  = (idx) => {
    activateDockTab('sources');
    const cards = sourcesList.querySelectorAll('.source-card');
    if (cards[idx]) cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ── Latency / metrics ────────────────────────────────────
  function clearLatency() {
    if (latRetrieval) latRetrieval.textContent = '—';
    if (latTotal)     latTotal.textContent = '—';
    if (latMethod)    latMethod.textContent = '—';
  }
  function updateLatency(ms, method) {
    if (latRetrieval) latRetrieval.textContent = ms + ' ms';
    if (latTotal)     latTotal.textContent = ms + ' ms';
    if (latMethod)    latMethod.textContent = method ? method.toUpperCase() : '—';
  }

  // ── A/B Compare ──────────────────────────────────────────
  runAbBtn?.addEventListener('click', () => {
    const q = state.history.filter(m => m.role === 'user').slice(-1)[0]?.content;
    if (!q) { alert('Hãy gửi câu hỏi trước khi chạy A/B.'); return; }
    runABCompare(q);
  });

  async function runABCompare(query) {
    abIdle.style.display = 'none';
    abResult.style.display = 'grid';
    ragasTable.style.display = 'block';
    activateDockTab('compare');

    $('abItemsA').innerHTML = '<div class="ab-item" style="color:var(--text-muted)">Đang tải…</div>';
    $('abItemsB').innerHTML = '<div class="ab-item" style="color:var(--text-muted)">Đang tải…</div>';

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: state.config.topK }),
      });
      const d = await res.json();

      $('abLatA').textContent = (d.config_a?.latency_ms ?? '?') + ' ms';
      $('abLatB').textContent = (d.config_b?.latency_ms ?? '?') + ' ms';
      $('abNameA').textContent = d.config_a?.name || 'Dense-only';
      $('abNameB').textContent = d.config_b?.name || 'Hybrid RRF';

      const renderItems = (items, containerId) => {
        const el = $(containerId);
        el.innerHTML = '';
        (items || []).slice(0, 3).forEach(it => {
          const div = document.createElement('div');
          div.className = 'ab-item';
          div.textContent = (it.metadata?.title || it.id || '—').slice(0, 50);
          div.title = it.id || '';
          el.appendChild(div);
        });
      };
      renderItems(d.config_a?.results, 'abItemsA');
      renderItems(d.config_b?.results, 'abItemsB');

      // Ragas table
      const bench = d.ragas_benchmarks || {};
      const tbody = $('ragasTbody');
      tbody.innerHTML = '';
      const metrics = [
        ['Faithfulness', 'faithfulness'],
        ['Ans. Relevance', 'relevance'],
        ['Context Recall', 'recall'],
        ['Context Prec.', 'precision'],
      ];
      metrics.forEach(([label, key]) => {
        const m = bench[key] || {};
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${label}</td><td>${m.a ?? '—'}</td><td>${m.b ?? '—'}</td><td class="delta-positive">${m.delta ?? '—'}</td>`;
        tbody.appendChild(tr);
      });

      $('abAnalysis').textContent = d.analysis || '';
    } catch (err) {
      $('abItemsA').innerHTML = '<div class="ab-item" style="color:var(--red-text)">Lỗi tải dữ liệu</div>';
      $('abItemsB').innerHTML = '';
    }
  }

  // ── Main send ─────────────────────────────────────────────
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query || state.isGenerating) return;

    state.isGenerating = true;
    sendBtn.disabled = true;
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Add to history list
    addToHistory(query);

    // Append user message
    appendMessage('user', query);
    state.history.push({ role: 'user', content: query });

    // Show typing
    showTyping();

    const payload = {
      query,
      top_k:          state.config.topK,
      score_threshold: state.config.threshold,
      use_hyde:       chkHyde.checked,
      use_memory:     chkMemory.checked,
      use_reranking:  chkHybrid.checked,
      history:        chkMemory.checked ? state.history.slice(-8) : [],
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      removeTyping();
      appendMessage(
        'assistant',
        data.answer || '(Không có phản hồi)',
        data.sources || [],
        data.latency_ms ?? null,
        data.retrieval_source || null,
        data.hyde_document || null
      );

      state.history.push({ role: 'assistant', content: data.answer || '' });

      // Auto A/B if checkbox enabled
      if (chkCompare.checked) {
        await runABCompare(query);
      }

    } catch (err) {
      removeTyping();
      appendMessage('assistant', `**Lỗi kết nối:** ${err.message}\n\nKiểm tra server tại \`http://localhost:8080\`.`);
    } finally {
      state.isGenerating = false;
      sendBtn.disabled = chatInput.value.trim().length === 0;
    }
  });

  // ── Keyboard shortcut: / to focus ────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== chatInput) {
      e.preventDefault();
      chatInput.focus();
    }
    if (e.key === 'Escape' && document.activeElement === chatInput) {
      chatInput.blur();
    }
  });

  // ── Initial state ────────────────────────────────────────
  clearSources();
  clearLatency();
  renderHistory();

  console.log('[LexAI] Dark Academia Premium UI — Ready');
})();
