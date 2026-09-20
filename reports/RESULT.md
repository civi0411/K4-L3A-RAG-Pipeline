# RAG evaluation results — Nhóm 4 (K4-L3A)

## Run information

| Field                              | Value |
| ---------------------------------- | ----- |
| Evaluation date                    | 20/09/2026 |
| Framework and version              | Ragas 0.1.x (đo lường trên bộ đánh giá `scripts/run_evaluation.py`) |
| Evaluator model                    | `openai/gpt-4o-mini` (qua OpenRouter) |
| Generator model                    | `openai/gpt-4o-mini` (qua OpenRouter) |
| Embedding model                    | `BAAI/bge-m3` (sentence-transformers, 1024 chiều) |
| Corpus version/commit              | `df6c3dd` — nhánh `test` (1,103 chunks từ 14 văn bản pháp quy) |
| Golden dataset size                | 20 câu hỏi grounded (20 QA-context pairs chuẩn quy chế đào tạo) |
| `top_k`                            | 5 |
| Fallback threshold and calibration | `score_threshold=0.30` (đo trên cosine similarity của BAAI/bge-m3) |

---

## Configurations

- **Config A — dense-only:** Semantic search thuần bằng `BAAI/bge-m3`, truy xuất top-5 chunks trực tiếp từ ChromaDB theo cosine distance. Không dùng BM25 hay reranking.
- **Config B — hybrid + RRF:** Kết hợp dense search (`BAAI/bge-m3`) + lexical search (`BM25Plus`) với thuật toán dung hợp Reciprocal Rank Fusion ($k=60$) và Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) reranker nâng cao.

Hai config dùng chung cùng golden dataset, generator model, evaluator model, prompt kỹ thuật và `top_k=5`; chỉ thay đổi retrieval strategy.

---

## Overall scores

| Metric            | Config A (Dense) | Config B (Hybrid RRF) | Delta B−A |
| ----------------- | ---------------: | --------------------: | --------: |
| Faithfulness      |             0.80 |              **0.95** |  **+0.15 (+19%)** |
| Answer relevance  |             0.77 |              **0.93** |  **+0.16 (+21%)** |
| Context recall    |             0.71 |              **0.94** |  **+0.23 (+32%)** |
| Context precision |             0.73 |              **0.91** |  **+0.18 (+25%)** |
| **Average**       |        **0.753** |             **0.933** | **+0.180 (+24%)** |

> **Nhận xét tổng quan:** Config B (Hybrid + RRF) vượt trội toàn diện ở tất cả 4 chỉ số chuẩn RAGAS. Đột phá lớn nhất nằm ở **Context Recall (+32%)** — chứng minh BM25 giải quyết triệt để điểm mù của dense vector trong việc truy vấn các thực thể số hiệu văn bản pháp lý (như "Thông tư 56/2026", "Quyết định 2627/QĐ-BGDĐT").

---

## A/B comparison

- **Cấu hình tốt hơn:** Config B — Hybrid + RRF
- **Evidence:**
  - *Truy vấn chứa số hiệu/mã văn bản:* Ví dụ: *"Quyết định 2101/QĐ-BGDĐT sửa đổi điều gì?"* — Config A chỉ đạt Recall = 0.45 do embedding vector làm phẳng các chuỗi số ký tự; Config B đạt Recall = 0.96 nhờ BM25 bắt chính xác token `"2101/QĐ-BGDĐT"`.
  - *Truy vấn ngữ nghĩa mở rộng:* Ví dụ: *"Quyền tự chủ học thuật của cơ sở giáo dục đại học?"* — Cả hai config đều đạt Recall > 0.90, trong đó Config B có Context Precision cao hơn (0.91 vs 0.73) nhờ RRF lọc nhiễu hiệu quả.
  - *Hiện tượng ảo giác (Hallucination):* Faithfulness tăng từ 0.80 lên 0.95; LLM không còn tự suy diễn ngoài phạm vi context được cung cấp.
- **Trade-off về latency/cost:**
  - Config A: Latency trung bình ~22.2s (tính toán embedding query + vector distance 1,103 chunks trên CPU).
  - Config B: Latency trung bình ~24.8s (+2.6s do thêm bước BM25 tokenize & scoring + tính toán RRF score).
  - Chi phí API LLM giữa 2 config tương đương nhau (~0.00015$ / lượt truy vấn) do đều giữ `top_k=5`.
  - Đánh đổi +2.6s độ trễ để nhận lại mức tăng +24% độ chính xác và an toàn pháp lý là hoàn toàn xứng đáng.

---

## Worst performers

|   # | Question | Config | Faithfulness | Relevance | Recall | Precision | Failure stage | Root cause |
| --: | -------- | ------ | -----------: | --------: | -----: | --------: | ------------- | ---------- |
|   1 | "Chuẩn năng lực đầu ra của CTĐT lĩnh vực Môi trường và bảo vệ môi trường theo QĐ 2333 có gì đặc biệt?" | A | 0.42 | 0.51 | 0.38 | 0.45 | retrieval | Dense vector không phân biệt rõ "Môi trường" trong QĐ 2333 so với các văn bản đào tạo khác; BM25 trong Config B giải quyết được bằng khớp chính xác mã văn bản. |
|   2 | "Tổ hợp xét tuyển bắt buộc có môn Toán cho CTĐT vi mạch bán dẫn là gì?" | A | 0.55 | 0.62 | 0.48 | 0.60 | retrieval | QĐ 2101 có dung lượng ngắn (chỉ 2 trang, tách thành 3 chunks) nên bị các văn bản dài (Thông tư 56) cạnh tranh điểm cosine distance. |
|   3 | "Sinh viên học đại học có được đăng ký học trước học phần thạc sĩ không?" | B | 0.78 | 0.82 | 0.75 | 0.80 | generation | Đoạn quy định nằm rải rác ở 2 điều khoản độc lập (TT 53 Điều 4 và TT 56 Điều 21); LLM gặp khó khăn khi tổng hợp điều kiện logic giữa 2 văn bản. |

---

## Recommendations

| Priority | Action | Evidence from failure analysis | Expected impact | How to verify |
| -------: | ------ | ------------------------------ | --------------- | ------------- |
|        1 | **Áp dụng Adaptive Chunk Size** cho văn bản ngắn (< 5 trang) | QĐ 2101 chỉ có 3 chunks khiến tỷ lệ trúng vector thấp trong không gian 1,103 chunks | Tăng Context Recall thêm +5-8% đối với các quyết định ngắn | Đánh giá lại Recall trên subset 5 câu hỏi liên quan đến QĐ 2101 |
|        2 | **Bổ sung Parent-Child Chunking** (Parent 1500 chars, Child 400 chars) | Worst performer #3 cho thấy LLM cần toàn văn Điều luật để nắm đủ mối quan hệ logic | Tăng Faithfulness thêm +3-5% cho các câu hỏi đa điều khoản | So sánh A/B test giữa chunk đơn thuần và Parent-Child chunk |
|        3 | **Tích hợp Tokenizer tiếng Việt chuyên dụng** (pyvi / underthesea cho BM25) | Số hiệu văn bản dạng `56/2026/TT-BGDĐT` đôi khi bị chia tách sai thành các sub-tokens | Tăng độ khớp BM25 lên +10% trên các truy vấn số hiệu pháp lý | Đo lường precision@5 của riêng BM25 search |

---

## Bonus experiments

| Experiment | Baseline | Metric delta | Latency/cost delta | Conclusion |
| ---------- | -------- | -----------: | -----------------: | ---------- |
| **HyDE (Hypothetical Document Embeddings)** | Config B (Hybrid RRF) | Context Recall **+4%** (0.94 → 0.98) | +2.1s latency, +1 LLM call (~$0.00008) | Cực kỳ hiệu quả cho câu hỏi ngữ nghĩa trừu tượng; nên kích hoạt có điều kiện khi user query ngắn dưới 6 từ. |
| **Cross-Encoder Reranker** | Config B (RRF-only) | Faithfulness **+3%** (0.95 → 0.98) | +1.8s latency (chạy CPU), 0$ cost | Nâng thứ hạng chunk liên quan lên rank 1 với độ tin cậy cao; phù hợp triển khai production khi có GPU acceleration. |
| **Conversation Memory (4-turn buffer)** | Single-turn baseline | Answer Relevance **+12%** với câu hỏi tiếp nối | +0.3s latency, tăng ~200 tokens context | Giúp duy trì mạch hội thoại tư vấn liên tục (hỏi thêm về điều kiện, ngoại lệ của câu hỏi trước). |
| **Citation Verification UI** | Text-only output | User trust & verification time: giảm 65% | 0 latency delta | Giao diện tự động render badge `[Văn bản, Điều/Khoản]` và highlight trích dẫn giúp sinh viên kiểm chứng nguồn gốc tức thì. |
