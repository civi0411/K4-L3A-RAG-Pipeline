# BÁO CÁO TỔNG KẾT ĐỒ ÁN RAG PIPELINE — NHÓM 4 (K4-L3A)

## ĐỀ TÀI: HỆ THỐNG TRUY XUẤT VÀ TƯ VẤN QUY CHẾ ĐÀO TẠO ĐẠI HỌC (LexAI RAG PIPELINE)

---

## 1. THÔNG TIN CHUNG

- **Tên dự án:** LexAI — Legal & Academic Regulation RAG Pipeline
- **Lớp / Khóa:** AI Talents Course (K4) — Lab 08
- **Nhóm thực hiện:** Nhóm 4 (K4-L3A)
- **Repository:** `https://github.com/civi0411/K4-L3A-RAG-Pipeline` (hoặc repo lab tương ứng)
- **Hệ thống phân nhánh (Branching Model):**
  - `main`: Nhánh production ổn định, chứa toàn bộ sản phẩm hoàn chỉnh và báo cáo.
  - `test`: Nhánh staging tích hợp và kiểm thử end-to-end.
  - `vi`: Nhánh phát triển của Leader Trần Chí Vĩ (Reranking, Generation, Pipeline, Backend, Docs).
  - `nhat`: Nhánh phát triển của Nguyễn Phi Nhật (Crawl PDF, News, Convert Markdown).
  - `tuan`: Nhánh phát triển của Hoàng Minh Tuấn (Chunking, VectorDB, BM25 Index, PageIndex).
  - `khanh`: Nhánh phát triển của Nguyễn Nam Khánh (Frontend UI, Visual Flow, Golden Dataset, Demo Slides).

### Bảng phân công nhân sự & Vai trò

| STT | Họ và tên | Mã học viên | Vai trò | Phần việc chính | Tỷ lệ đóng góp |
|:---:|---|:---:|---|---|:---:|
| 1 | **Trần Chí Vĩ** | **2A202602968** | **Team Leader & Tech Lead** | Thiết kế kiến trúc tổng thể, RRF Fusion, Retrieval Pipeline, Generation & Citation, Backend Server, Điều phối Git & Báo cáo tổng thể | 35% |
| 2 | **Nguyễn Phi Nhật** | **2A202602658** | **Data Engineer** | Thu thập dữ liệu (PDF, News), Xử lý và chuyển đổi PDF sang Markdown bảo toàn cấu trúc văn bản pháp quy | 25% |
| 3 | **Hoàng Minh Tuấn** | **2A202602758** | **ML/Search Engineer** | Chiến lược Chunking, Xây dựng Vector DB (BAAI/bge-m3, ChromaDB), BM25Plus Lexical Index, PageIndex Fallback | 25% |
| 4 | **Nguyễn Nam Khánh** | **2A202602568** | **UI/UX & Presenter** | Phát triển giao diện Dark Academia LexAI, Trực quan hóa kiến trúc A/B Flow, Xây dựng Golden Dataset, Thuyết trình bảo vệ đồ án | 15% |

---

## 2. BỐI CẢNH VÀ MỤC TIÊU BÀI TOÁN

### 2.1. Vấn đề thực tế
Hệ thống văn bản quy phạm pháp luật trong giáo dục đại học (các Thông tư, Quyết định của Bộ Giáo dục và Đào tạo) có khối lượng đồ sộ, ngôn ngữ hành chính phức tạp, nhiều điều khoản sửa đổi - bổ sung chồng chéo. Sinh viên, cán bộ quản lý đào tạo gặp nhiều khó khăn khi tra cứu các quy định về:
- Điều kiện tốt nghiệp, cảnh báo học tập, buộc thôi học.
- Chuẩn chương trình đào tạo kỹ sư STEM, vi mạch bán dẫn.
- Chuyển trường, học cùng lúc hai chương trình đào tạo.

### 2.2. Điểm yếu của LLM thuần túy và RAG đơn giản
- **LLM thuần túy:** Thường xuyên bịa đặt (hallucination) số hiệu văn bản, bịa số lượng tín chỉ hoặc áp dụng quy chế đã hết hiệu lực.
- **RAG Dense-only thông thường:** Nhúng ngữ nghĩa (dense vector) làm mất đi độ sắc nét của các từ khóa đặc thù như số hiệu thông tư (`"Thông tư 56/2026/TT-BGDĐT"`, `"Quyết định 2101/QĐ-BGDĐT"`), dẫn tới Context Recall thấp (< 72%).

### 2.3. Mục tiêu dự án
Xây dựng pipeline RAG hoàn chỉnh đạt chuẩn công nghiệp với các tiêu chí:
1. **Chính xác tuyệt đối:** Mọi câu trả lời phải kèm trích dẫn có thể đối soát `[Văn bản, Điều/Khoản]`.
2. **Hybrid Search + RRF:** Dung hợp Dense Vector và Lexical BM25 triệt tiêu điểm mù của nhau.
3. **Safe Refusal & Fallback:** Từ chối trả lời an toàn khi câu hỏi nằm ngoài phạm vi dữ liệu hoặc kích hoạt fallback theo cấu trúc PageIndex.
4. **Trải nghiệm người dùng:** Giao diện Dark Academia sang trọng, trực quan hóa luồng A/B testing phục vụ so sánh và trình diễn thực tế.

---

## 3. KIẾN TRÚC HỆ THỐNG TỔNG THỂ

Hệ thống LexAI RAG Pipeline bao gồm 5 tầng kiến trúc chính:

```
[ DỮ LIỆU PHÁP QUY (PDF, Cổng BGD&ĐT) ]
                   │
                   ▼  (Task 1, 2, 3: PyMuPDF / pdfplumber)
         [ CLEAN MARKDOWN CORPUS ]
                   │
                   ▼  (Task 4: RecursiveSplitter 500 chars, overlap 100)
             [ 1,103 CHUNKS ]
             ┌─────┴────────────────────────┐
             ▼                              ▼
    (Task 5: BAAI/bge-m3)         (Task 6: BM25Plus)
       [ ChromaDB VectorStore ]     [ BM25 Lexical Index ]
             │                              │
             └──────────────┬───────────────┘
                            ▼
              (Task 7: Reranking & Fusion)
           [ Reciprocal Rank Fusion (k=60) ]
           [ Cross-Encoder Verification   ]
                            │
                            ▼
              (Task 9: Retrieval Pipeline)
    [ Ngưỡng tin cậy score_threshold=0.30 & PageIndex Fallback ]
                            │
                            ▼  (Top-5 Chunks + Memory + HyDE)
              (Task 10: Generation Engine)
      [ OpenRouter: GPT-4o-mini + Strict Citation Rules ]
                            │
                            ▼
           [ LexAI Web Interface & REST API (Starlette) ]
```

### Chi tiết các thành phần công nghệ

1. **Tầng Ingestion (Task 1, 2, 3):**
   - Thu thập 14 văn bản pháp quy cốt lõi từ Bộ GD&ĐT (Thông tư 56, Quyết định 2627, Quyết định 2101, v.v.).
   - Bộ chuyển đổi PyMuPDF bảo toàn nguyên vẹn cấu trúc `# Điều`, `## Khoản`, `| Bảng biểu |`.
2. **Tầng Indexing (Task 4, 5, 6, 8):**
   - Phân đoạn thành 1,103 chunks với metadata gắn liền từng chunk (`doc_id`, `chunk_id`, `section`).
   - Dense Embedding: `BAAI/bge-m3` (1024 chiều, SOTA trên MTEB đa ngữ) lưu trong ChromaDB persistent.
   - Lexical Index: `BM25Plus` giải quyết điểm mù từ khóa chính xác và số hiệu văn bản.
   - PageIndex Hierarchy: Lưu trữ mục lục cấu trúc phục vụ điều hướng khi điểm semantic search thấp.
3. **Tầng Retrieval & Reranking (Task 7, 9):**
   - Song song truy xuất top-k Dense và top-k BM25.
   - Dung hợp bằng Reciprocal Rank Fusion với công thức: $RRF\_Score(d) = \sum \frac{1}{k + r(d)}$ với $k=60$.
   - Bộ lọc trùng lặp Deduplication và kiểm tra ngưỡng an toàn `score_threshold=0.30`.
4. **Tầng Generation (Task 10 & Bonus):**
   - LLM: `openai/gpt-4o-mini` qua cổng OpenRouter.
   - Ràng buộc trích dẫn bắt buộc `[Văn bản, Điều/Khoản]` trong từng ý trả lời.
   - Cơ chế từ chối trả lời an toàn khi context không chứa đủ căn cứ.
   - Thử nghiệm mở rộng: HyDE (Hypothetical Document Embeddings) và Bộ nhớ hội thoại 4 lượt (Conversation Memory).
5. **Tầng Ứng dụng & Demo (App & Backend):**
   - Server backend: Starlette asynchronous framework (port 8080).
   - Frontend: Dark Academia Web UI với tính năng so sánh trực tiếp A/B giữa Dense-only và Hybrid RRF.

---

## 4. KẾT QUẢ THỰC NGHIỆM VÀ ĐÁNH GIÁ (RAGAS BENCHMARK)

### 4.1. Bộ dữ liệu đánh giá (Golden Dataset)
- Gồm 20 bộ câu hỏi - câu trả lời chuẩn (Ground Truth) kèm ngữ cảnh trích xuất tương ứng.
- Bao phủ 3 nhóm câu hỏi điển hình:
  - *Nhóm 1:* Tra cứu số hiệu văn bản pháp luật chính xác.
  - *Nhóm 2:* Tra cứu điều kiện định lượng (số tín chỉ, điểm trung bình tích lũy, thời hạn đào tạo).
  - *Nhóm 3:* Suy luận và tổng hợp quy định từ nhiều điều khoản.

### 4.2. Bảng so sánh hiệu năng A/B Testing

Đánh giá định lượng trên 4 tiêu chí cốt lõi của bộ chuẩn Ragas:

| Chỉ số đánh giá | Config A (Dense-only) | Config B (Hybrid + RRF) | Chênh lệch (Delta B−A) |
|---|:---:|:---:|:---:|
| **Faithfulness** (Độ trung thực, không bịa đặt) | 0.80 | **0.95** | **+0.15 (+19%)** |
| **Answer Relevance** (Độ phù hợp của câu trả lời) | 0.77 | **0.93** | **+0.16 (+21%)** |
| **Context Recall** (Độ bao phủ ngữ cảnh đúng) | 0.71 | **0.94** | **+0.23 (+32%)** |
| **Context Precision** (Độ chính xác của ngữ cảnh truy xuất) | 0.73 | **0.91** | **+0.18 (+25%)** |
| **Điểm trung bình (Average Score)** | **0.753** | **0.933** | **+0.180 (+24%)** |

### 4.3. Phân tích kết quả thực nghiệm
1. **Tại sao Context Recall tăng vọt (+32%)?**
   - Mô hình nhúng Dense Vector (`BAAI/bge-m3`) biểu diễn ngữ nghĩa dạng phân phối continuous, làm phẳng các chuỗi số ký tự đặc thù. Khi người dùng hỏi *"Quyết định 2101/QĐ-BGDĐT"*, Dense search dễ trả về chunks của Quyết định 2627 hoặc Thông tư 56 do cùng miền ngữ nghĩa đào tạo.
   - BM25Plus đánh chỉ mục exact match chuỗi ký tự, đẩy chính xác văn bản 2101 lên đầu bảng rank. RRF kết hợp đưa chunk vào top-5 một cách hoàn hảo.
2. **Tại sao Faithfulness tăng từ 0.80 lên 0.95?**
   - Khi Context Recall cao và Context Precision đạt 0.91, ngữ cảnh đưa vào prompt của LLM chứa đầy đủ căn cứ pháp lý trực tiếp. LLM không phải "đoán" hoặc dùng tri thức tiền huấn luyện (parametric memory) để lấp chỗ trống.

---

## 5. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY THỰC TẾ

### 5.1. Cài đặt môi trường
```bash
git clone https://github.com/civi0411/K4-L3A-RAG-Pipeline.git
cd K4-L3A-RAG-Pipeline

# Khởi tạo virtualenv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 5.2. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
# Điền API Key OpenRouter:
# OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
```

### 5.3. Chạy kiểm thử tự động
```bash
pytest -v tests/
# Đạt kết quả: 20 passed in ~4.5s
```

### 5.4. Khởi chạy Web UI Demo
```bash
# Chạy Backend Server
.venv/bin/python app/backend/server.py
```
Truy cập trình duyệt tại địa chỉ: `http://localhost:8080` để trải nghiệm giao diện Dark Academia LexAI và trình diễn A/B Testing.

---

## 6. KẾT LUẬN VÀ BÀI HỌC KINH NGHIỆM

### 6.1. Kết luận
Nhóm 4 đã hoàn thành xuất sắc toàn bộ 10 nhiệm vụ bắt buộc của đồ án Lab 08 RAG Pipeline, đồng thời hiện thực hóa các tính năng nâng cao (HyDE, Conversation Memory, Cross-Encoder Reranker, Web Interface chuẩn A/B testing). Sản phẩm giải quyết trọn vẹn bài toán tư vấn quy chế đào tạo đại học với độ tin cậy và tính minh chứng cao.

### 6.2. Bài học kinh nghiệm
- **Đừng chỉ dựa vào Semantic Search:** Trong miền dữ liệu pháp lý và kỹ thuật, sự kết hợp giữa Lexical Search (BM25) và Dense Embedding qua RRF là bắt buộc.
- **Ràng buộc trích dẫn là chìa khóa chống ảo giác:** Đưa quy tắc trích dẫn cứng `[Văn bản, Điều/Khoản]` vào System Prompt giúp kiểm soát chất lượng câu trả lời hiệu quả gấp nhiều lần so với việc chỉ dặn dò chung chung.
- **Phân công làm việc theo nhánh Git rõ ràng:** Việc quy hoạch các nhánh `vi`, `nhat`, `tuan`, `khanh` và tích hợp qua `test` trước khi lên `main` giúp nhóm 4 người làm việc ăn khớp, không xung đột mã nguồn và kiểm soát được tiến độ từng module.
