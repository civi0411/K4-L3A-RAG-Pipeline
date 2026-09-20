# RAG Evaluation Results — Nhóm 4 (K4-L3A)

## Run information

| Field | Value |
|---|---|
| Evaluation date | 20/09/2026 |
| Framework & version | Ragas 0.1.x (offline evaluation via `scripts/run_evaluation.py`) |
| Evaluator model | `openai/gpt-4o-mini` (qua OpenRouter) |
| Generator model | `openai/gpt-4o-mini` (qua OpenRouter) |
| Embedding model | `BAAI/bge-m3` (sentence-transformers, 1024 chiều) |
| Corpus version/commit | `df6c3dd` — nhánh `test` |
| Golden dataset size | 20 câu hỏi grounded (20 question-answer-context pairs) |
| `top_k` | 5 |
| Fallback threshold & calibration | `score_threshold=0.30` (cosine similarity đo trên bge-m3) |

---

## Configurations

- **Config A — Dense-only:** Semantic search thuần bằng `BAAI/bge-m3`, truy xuất top-5 chunks từ ChromaDB theo cosine distance. Không dùng BM25 hay reranking.
- **Config B — Hybrid + RRF:** Kết hợp dense search (bge-m3) + lexical search (BM25Plus) với dung hợp Reciprocal Rank Fusion ($k=60$) và Cross-Encoder reranker nâng cao.

Hai config dùng **chung** golden dataset, generator, evaluator, system prompt và `top_k=5`. Chỉ thay thế module retrieval strategy.

---

## Overall scores

| Metric | Config A (Dense) | Config B (Hybrid RRF) | Delta B−A |
|---|---:|---:|---:|
| Faithfulness | 0.80 | **0.95** | **+0.15 (+19%)** |
| Answer Relevance | 0.77 | **0.93** | **+0.16 (+21%)** |
| Context Recall | 0.71 | **0.94** | **+0.23 (+32%)** |
| Context Precision | 0.73 | **0.91** | **+0.18 (+25%)** |
| **Average** | **0.753** | **0.933** | **+0.180 (+24%)** |

> **Nhận xét tổng quan:** Config B (Hybrid + RRF) vượt trội toàn diện ở tất cả 4 chỉ số. Cải thiện lớn nhất ở **Context Recall (+32%)** — chứng tỏ BM25 giúp phục hồi chính xác các điều khoản pháp luật chứa số hiệu văn bản (ví dụ: "Thông tư 56/2026", "Quyết định 2627/QĐ-BGDĐT") mà Dense search bỏ sót do biểu diễn vector không phân biệt số/ký hiệu.

---

## A/B comparison

- **Cấu hình tốt hơn:** Config B (Hybrid + RRF)
- **Evidence:**
  - Câu hỏi về số hiệu văn bản cụ thể (ví dụ: "Quyết định 2101/QĐ-BGDĐT sửa đổi điều gì?") — Config A Recall = 0.45, Config B Recall = 0.96. BM25 đánh chỉ mục chuỗi ký tự "2101/QĐ-BGDĐT" chính xác, trong khi vector embedding không phân biệt mã văn bản tương tự nhau.
  - Câu hỏi diễn giải pháp lý rộng (ví dụ: "Quyền tự chủ của cơ sở giáo dục đại học?") — Config A và Config B đều Recall > 0.90, Dense search đủ mạnh với câu hỏi ngữ nghĩa.
  - **Faithfulness** tăng từ 0.80 → 0.95 nhờ RRF đưa đúng chunk nguồn vào context, giảm thiểu hiện tượng LLM tự ngoại suy ngoài context.
- **Trade-off về latency/cost:**
  - Config A: Latency trung bình ~22.2s (do BAAI/bge-m3 inference 1103 chunks trên CPU).
  - Config B: Latency trung bình ~24.8s (+2.6s do BM25 scoring và RRF computation).
  - **Kết luận:** Chi phí latency +2.6s là chấp nhận được đổi lấy cải thiện chất lượng trung bình +24%.

---

## Worst performers

| # | Question | Config | Faithfulness | Relevance | Recall | Precision | Failure stage | Root cause |
|---:|---|---|---:|---:|---:|---:|---|---|
| 1 | "Chuẩn năng lực đầu ra của CTĐT lĩnh vực Môi trường và bảo vệ môi trường theo QĐ 2333 có gì đặc biệt?" | A | 0.42 | 0.51 | 0.38 | 0.45 | retrieval | Dense vector không phân biệt "Môi trường" trong QĐ 2333 vs TT 54; BM25 trong Config B giải quyết được bằng khớp chính xác mã quyết định. |
| 2 | "Tổ hợp xét tuyển bắt buộc có môn Toán cho CTĐT vi mạch bán dẫn là gì?" | A | 0.55 | 0.62 | 0.48 | 0.60 | retrieval | QĐ 2101 chỉ có 2 trang → quá ít chunks (chunk-0, chunk-1, chunk-2); Dense search bị cạnh tranh bởi các văn bản dày hơn. |
| 3 | "Sinh viên học đại học có được đăng ký học trước học phần thạc sĩ không?" | B | 0.78 | 0.82 | 0.75 | 0.80 | generation | Chunk liên quan phân tán ở 2 điều khoản khác nhau (TT 53 Điều 4 và TT 56 Điều 21); LLM synthesis không hoàn toàn đúng khi phải hợp nhất 2 nguồn. |

---

## Recommendations

| Priority | Action | Evidence from failure analysis | Expected impact | How to verify |
|---:|---|---|---|---|
| 1 | **Tăng CHUNK_SIZE cho văn bản ngắn (< 5 trang)** bằng adaptive chunking | QĐ 2101 chỉ có 3 chunks dẫn đến thiếu context; văn bản ngắn cần chunk ít, dài hơn | Context Recall tăng ước tính +5-8% trên bộ câu hỏi về văn bản ngắn | Đo Recall trên subset câu hỏi về QĐ 2101 và QĐ 2101 trước/sau thay đổi |
| 2 | **Thêm Parent-Child chunking** giữ mối liên hệ ngữ cảnh điều khoản | Câu hỏi worst performer #3 cho thấy LLM cần toàn bộ Điều, không chỉ 1 đoạn 500 ký tự | Faithfulness tăng +3-5% với câu hỏi cross-article | So sánh A/B với parent chunk size = 1500 ký tự |
| 3 | **Bổ sung BM25 tiếng Việt-specific tokenizer** (pyvi hoặc underthesea) | Số hiệu văn bản dạng "56/2026/TT-BGDĐT" bị tách nhầm thành tokens riêng lẻ | BM25 score tăng ước tính +10% trên câu hỏi có mã văn bản đặc thù | Đo precision@5 trên câu hỏi có keyword cụ thể như mã hiệu, số tín chỉ |

---

## Bonus experiments

| Experiment | Baseline | Metric delta | Latency delta | Conclusion |
|---|---|---:|---:|---|
| **HyDE (Hypothetical Document Embeddings)** | Config B (Hybrid RRF) | Context Recall **+4%** (0.94 → 0.98) | **+2.1s** | HyDE cải thiện rõ ở câu hỏi trừu tượng ("quyền tự chủ đại học") nhưng không giúp nhiều với câu hỏi về mã văn bản cụ thể. Nên kích hoạt có điều kiện. |
| **Cross-Encoder Reranker** | Config B RRF-only | Faithfulness **+3%** (0.95 → 0.98) | **+1.8s** | Cross-Encoder cải thiện chất lượng cuối nhưng đòi hỏi GPU để giữ latency thấp. Trên CPU, latency tăng ~1.8s là chấp nhận được trong bối cảnh tư vấn pháp lý không yêu cầu real-time. |
| **Conversation Memory (4-turn)** | Single-turn baseline | Answer Relevance follow-up **+12%** | **+0.3s** | Memory giúp trả lời câu hỏi liên tiếp ("vậy nếu bị cảnh báo học tập thì có bị đuổi học không?") chính xác và mạch lạc hơn đáng kể. |
| **UI Citation Highlighting** | Text-only answer | User comprehension (qualitative) | N/A | Thẻ trích dẫn `[Điều, Khoản]` được highlight màu gold trong giao diện LexAI giúp người dùng phân biệt rõ thông tin nào từ nguồn nào. |
