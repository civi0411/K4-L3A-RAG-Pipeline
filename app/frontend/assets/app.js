// ==========================================================================
// LexAI Frontend Application Logic (Nhóm 4 - K4-L3A)
// ==========================================================================

let activeMode = "hybrid"; // "hybrid" or "dense"
let chatHistory = [];
let currentCitations = [];

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  fetchStats();
});

function initUI() {
  const chatForm = document.getElementById("chatForm");
  const queryInput = document.getElementById("queryInput");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const toggleDockBtn = document.getElementById("toggleDockBtn");
  const closeDockBtn = document.getElementById("closeDockBtn");
  const appLayout = document.querySelector(".app-layout");

  // Auto-resize textarea
  queryInput.addEventListener("input", () => {
    queryInput.style.height = "auto";
    queryInput.style.height = Math.min(queryInput.scrollHeight, 120) + "px";
  });

  // Enter to send
  queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  // Toggles
  toggleSidebarBtn.addEventListener("click", () => {
    appLayout.classList.toggle("sidebar-collapsed");
  });

  toggleDockBtn.addEventListener("click", () => {
    appLayout.classList.toggle("dock-collapsed");
  });

  closeDockBtn.addEventListener("click", () => {
    appLayout.classList.add("dock-collapsed");
  });

  // Dock Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPane = document.getElementById(`tab-${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Nav Items (Chế độ truy vấn)
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
      activeMode = item.dataset.mode;
      const label = document.getElementById("activePipelineLabel");
      if (activeMode === "hybrid") {
        label.textContent = "Hybrid + RRF + Citation Guard";
      } else {
        label.textContent = "Dense-only (bge-m3 Baseline)";
      }
    });
  });

  // Topic Chips
  document.querySelectorAll(".topic-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      queryInput.value = chip.dataset.query;
      queryInput.focus();
      queryInput.dispatchEvent(new Event("input"));
    });
  });

  // Form Submit
  chatForm.addEventListener("submit", handleChatSubmit);
}

async function fetchStats() {
  try {
    const res = await fetch("/api/stats");
    if (res.ok) {
      const data = await res.json();
      if (data.legal_documents) {
        document.getElementById("statDocs").textContent = `${data.legal_documents + (data.news_documents || 0)} văn bản`;
      }
      if (data.indexed_chunks) {
        document.getElementById("statChunks").textContent = `${data.indexed_chunks} chunks`;
      }
    }
  } catch (err) {
    console.warn("Could not load stats", err);
  }
}

async function handleChatSubmit(e) {
  e.preventDefault();
  const queryInput = document.getElementById("queryInput");
  const query = queryInput.value.trim();
  if (!query) return;

  queryInput.value = "";
  queryInput.style.height = "auto";

  // Hide welcome hero if first message
  const welcomeHero = document.querySelector(".welcome-hero");
  if (welcomeHero) welcomeHero.style.display = "none";

  // Render user message
  appendMessage("user", query);

  // Render assistant loading skeleton
  const loadingId = "loading-" + Date.now();
  appendLoadingMessage(loadingId);

  const useHyde = document.getElementById("hydeToggle").checked;
  const useMemory = document.getElementById("memoryToggle").checked;

  try {
    let endpoint = "/api/chat";
    let payload = {
      query: query,
      top_k: 5,
      score_threshold: 0.30,
      use_hyde: useHyde,
      use_memory: useMemory,
      use_reranking: activeMode === "hybrid",
      history: chatHistory
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    removeLoadingMessage(loadingId);

    if (res.ok) {
      const answer = data.answer || "Không có phản hồi.";
      const sources = data.sources || [];
      const latency = data.latency_ms || 0;
      const method = data.retrieval_method || activeMode;

      currentCitations = sources;
      renderCitations(sources);

      appendMessage("assistant", answer, { latency, method, sources });
      chatHistory.push({ role: "user", content: query });
      chatHistory.push({ role: "assistant", content: answer });
    } else {
      appendMessage("assistant", `⚠️ Lỗi: ${data.error || "Không thể xử lý truy vấn"}`);
    }
  } catch (err) {
    removeLoadingMessage(loadingId);
    appendMessage("assistant", `⚠️ Lỗi kết nối máy chủ: ${err.message}`);
  }
}

function appendMessage(role, text, meta = {}) {
  const container = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "🧑‍🎓" : "⚖️";

  const content = document.createElement("div");
  content.className = "message-content";

  if (role === "assistant" && meta.latency !== undefined) {
    const headerInfo = document.createElement("div");
    headerInfo.className = "message-header-info";
    headerInfo.innerHTML = `
      <span class="badge-method">${meta.method === "hybrid" ? "Hybrid + RRF" : "Dense-only"}</span>
      <span>${meta.latency}ms</span>
    `;
    content.appendChild(headerInfo);
  }

  const textBody = document.createElement("div");
  textBody.className = "message-text";
  textBody.innerHTML = formatLegalText(text);
  content.appendChild(textBody);

  row.appendChild(avatar);
  row.appendChild(content);
  container.appendChild(row);

  container.scrollTop = container.scrollHeight;
}

function formatLegalText(text) {
  // Replace citation markers [Văn bản, Điều X] with interactive badge
  let html = text
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>")
    .replace(/\[([^\]]+, Điều [^\]]+)\]/g, (match, p1) => {
      return `<button class="citation-badge" onclick="openCitation('${escapeHtml(p1)}')">📑 ${p1}</button>`;
    })
    .replace(/\[([^\]]+, Mục [^\]]+)\]/g, (match, p1) => {
      return `<button class="citation-badge" onclick="openCitation('${escapeHtml(p1)}')">📑 ${p1}</button>`;
    });

  return html;
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'");
}

function openCitation(citationText) {
  // Ensure Learning dock is visible
  const appLayout = document.querySelector(".app-layout");
  appLayout.classList.remove("dock-collapsed");

  // Switch to citations tab
  const tabBtn = document.querySelector('.tab-btn[data-tab="citations"]');
  if (tabBtn) tabBtn.click();
}

function renderCitations(sources) {
  const list = document.getElementById("citationsList");
  const countLabel = document.getElementById("citationsCount");
  list.innerHTML = "";

  if (!sources || sources.length === 0) {
    countLabel.textContent = "0 trích dẫn";
    list.innerHTML = `
      <div class="empty-state">
        <span>📜</span>
        <p>Không có trích đoạn nào đáp ứng ngưỡng tương đồng.</p>
      </div>
    `;
    return;
  }

  countLabel.textContent = `${sources.length} trích dẫn`;

  sources.forEach((s, idx) => {
    const card = document.createElement("div");
    card.className = "citation-card";

    const title = s.metadata?.title || s.metadata?.doc_id || `Căn cứ pháp lý #${idx + 1}`;
    const section = s.metadata?.section || "";
    const score = (s.score !== undefined) ? Number(s.score).toFixed(4) : "N/A";
    const excerpt = s.content ? s.content.substring(0, 320) + "..." : "";

    card.innerHTML = `
      <div class="citation-card-title">📌 ${title} ${section ? `(${section})` : ""}</div>
      <div class="citation-card-excerpt">"${excerpt}"</div>
      <div class="citation-meta">
        <span>Phương thức: <code>${s.retrieval_method || "hybrid"}</code></span>
        <span>Relevance: <strong>${score}</strong></span>
      </div>
    `;
    list.appendChild(card);
  });
}

function appendLoadingMessage(id) {
  const container = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = "message-row assistant";
  row.id = id;

  row.innerHTML = `
    <div class="message-avatar">⚖️</div>
    <div class="message-content">
      <div style="display: flex; gap: 6px; align-items: center; color: var(--gold-glow); font-size: 13px;">
        <span class="pulse-dot"></span> Đang truy xuất văn bản và tổng hợp trích dẫn pháp lý...
      </div>
    </div>
  `;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function removeLoadingMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
