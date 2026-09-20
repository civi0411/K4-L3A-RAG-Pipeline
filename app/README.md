# app/ — LexAI Demo Application

Thư mục `app/` chứa giao diện demo chuyên biệt, tách bạch hoàn toàn backend và frontend, chạy độc lập trên cổng **8080**.

```
app/
├── backend/
│   └── server.py          # Starlette HTTP server + toàn bộ API endpoints
└── frontend/
    ├── index.html          # Giao diện chính (Dark Academia 3-column layout)
    └── assets/
        ├── style.css       # Design system đầy đủ (CSS custom properties, dark/light)
        └── app.js          # Vanilla JS — state, chat, citations, A/B dock
```

---

## Khởi chạy

```bash
# Từ thư mục gốc của dự án (có .venv/)
python app/backend/server.py

# Truy cập
open http://localhost:8080
```

## Kiến trúc UI — Dark Academia Premium

### 3-Column Shell Layout

| Cột | Chiều rộng | Nội dung |
|-----|-----------|---------|
| **Sidebar trái** | 268px | Brand, điều hướng theo chủ đề, lịch sử hội thoại, stats corpus |
| **Chat chính** | flex-1 | Tin nhắn + welcome screen + input bar có config chips |
| **Learning Dock phải** | 320px | 4 tab: Nguồn trích dẫn · Metrics · A/B Compare · Cấu hình |

### Tính năng UI nổi bật
- **Dark/Light theme toggle** — lưu vào `localStorage`, chuyển mượt mà
- **Sidebar/Dock toggle** — ẩn/hiện bằng CSS Grid transitions
- **History sidebar** — lưu các phiên hội thoại trong tab hiện tại
- **Citation cards** — nguồn trích dẫn với score bar, excerpt và link gốc
- **A/B Dock** — đối chiếu Dense vs Hybrid RRF trực tiếp, bảng Ragas benchmarks
- **Typing indicator** — 3-dot animation khi chờ LLM
- **Auto-resize textarea** — tự co giãn theo nội dung
- **Keyboard shortcuts** — `/` để focus input, `Enter` để gửi, `Shift+Enter` xuống dòng

### Design System
| Token | Giá trị (dark) | Ý nghĩa |
|-------|---------------|---------|
| `--bg-base` | `#0C0C0F` | Nền sâu nhất |
| `--accent` | `#D4A843` | Gold/amber — brand accent |
| `--jade-text` | `#5DCEA0` | Màu AI bubble & badges |
| `--font-serif` | Playfair Display | Tiêu đề & brand |
| `--font-mono` | JetBrains Mono | Metrics, scores, code |

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/` | Phục vụ `frontend/index.html` |
| `GET` | `/assets/*` | CSS, JS tĩnh |
| `GET` | `/api/stats` | Thống kê corpus & vector store |
| `POST` | `/api/chat` | Chat chính (HyDE + Hybrid RAG + Citation) |
| `POST` | `/api/compare` | A/B: Dense-only vs Hybrid RRF |
| `POST` | `/api/rerank_compare` | RRF vs Cross-Encoder Neural Reranker |

## So sánh với `server.py` (cổng 8000)

| Điểm | `server.py` (8000) | `app/backend/server.py` (8080) |
|------|-------------------|-------------------------------|
| Frontend | `static/` | `app/frontend/` |
| Assets | `/static/*` | `/assets/*` |
| Design | ChatGPT 3:1 | Dark Academia 3-column |
| Tổ chức | Single file | Backend/Frontend tách rõ |
| Sidebar | Không có | ✅ Có lịch sử & topic nav |
| Citation cards | Pop-up | ✅ Dedicated panel với score bar |
