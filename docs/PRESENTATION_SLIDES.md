# KỊCH BẢN THUYẾT TRÌNH & DÀN Ý SLIDE BÁO CÁO NHÓM
## Đề tài: Hệ thống RAG Tra cứu Pháp luật & Quy chế Đào tạo Giáo dục Đại học (LexAI)
**Nhóm:** Nhóm 4 (K4-L3A)  
**Người thuyết trình chính & Điều phối Live Demo:** Nguyễn Nam Khánh (`2A202602568`)

---

## 1. PHÂN BỔ THỜI GIAN THUYẾT TRÌNH (Tổng: 10 phút)

| Mốc thời gian | Người trình bày | Nội dung chính | Slide tương ứng |
|---|---|---|:---:|
| **00:00 - 02:00** (2p) | **Khánh** *(Lead)* | Mở đầu, lý do chọn đề tài, bài toán thực tế & thách thức quy chế GDĐH | Slide 1 – 3 |
| **02:00 - 05:00** (3p) | **Tuấn & Vĩ** | Dữ liệu chuẩn hóa 10 văn bản, BGE-M3 Chunking & Kiến trúc Hybrid RRF + Reranker | Slide 4 – 7 |
| **05:00 - 08:00** (3p) | **Khánh** *(Lead)* | **Live Demo trực tiếp hệ thống LexAI**: Truy vấn tình huống, Source Citation & A/B Testing | Slide 8 – 9 + Web App |
| **08:00 - 10:00** (2p) | **Nhật & Khánh** | Kết quả thực nghiệm Ragas (4 metrics), Phân tích Worst Performers & Kết luận Q&A | Slide 10 – 12 |

---

## 2. DÀN Ý CHI TIẾT CÁC SLIDE (SLIDE DECK OUTLINE)

### Slide 1: Trang bìa (Title Slide)
- **Tiêu đề:** LexAI — Trợ lý Pháp luật & Quy chế Đào tạo Giáo dục Đại học
- **Hệ thống:** Multi-Stage Hybrid RAG Pipeline với BGE-M3, BM25Plus, RRF và Starlette App
- **Nhóm thực hiện:** Nhóm 4 (K4-L3A)
  - Vĩ (Trưởng nhóm & System Architect)
  - Hoàng Minh Tuấn (Data & Vector Database)
  - Nguyễn Phi Nhật (Search Algorithms & Evaluation)
  - Nguyễn Nam Khánh (Frontend UI & Lead Presenter)

### Slide 2: Bài toán thực tế & Động lực nghiên cứu
- **Bối cảnh:** Giai đoạn 2025–2026, Bộ GD&ĐT ban hành hàng loạt văn bản quy phạm pháp luật mới (Luật GDĐH 125/2025, Thông tư 56/2026 về quy chế đào tạo, Thông tư 53/2026 về tuyển sinh SĐH, các chuẩn CTĐT STEM, Bán dẫn, Vi mạch...).
- **Nỗi đau (Pain points):**
  - Sinh viên, giảng viên và cán bộ khảo thí mất hàng giờ để đối chiếu các văn bản chồng chéo.
  - LLM thông thường (ChatGPT/Claude gốc) bị **ảo giác (hallucination)** và không có căn cứ pháp lý chính xác theo từng Điều, Khoản.

### Slide 3: Mục tiêu & Giải pháp LexAI
- Xây dựng hệ thống RAG chuyên sâu với **10 văn bản luật gốc PDF chuẩn hóa** và 5 bài báo phân tích.
- Cam kết **100% câu trả lời có trích dẫn nguồn có thể kiểm chứng** `[Tên văn bản, Điều/Khoản]`.
- Không bịa đặt: Cơ chế Safe Refusal tự động từ chối nếu không đủ dữ liệu tin cậy trong kho lưu trữ.

### Slide 4: Thu thập & Tiền xử lý Dữ liệu (Tuấn)
- **Nguồn dữ liệu:** 10 văn bản quy phạm pháp luật PDF từ Cổng thông tin Bộ GD&ĐT + 5 bài báo định dạng chuẩn.
- **Quy trình chuẩn hóa:** Chuyển đổi PDF sang Markdown bảo toàn cấu trúc phân cấp Điều, Khoản (`MarkItDown` + `pypdfium2`).
- **Chiến lược Chunking:** Recursive Character Splitting (500 ký tự / overlap 50 ký tự), bảo toàn ngữ cảnh điều luật.
- **Index:** Embedding 1.024 chiều bằng mô hình `BAAI/bge-m3` vào ChromaDB với 1.103 chunks văn bản.

### Slide 5: Kiến trúc Multi-Stage Hybrid Retrieval (Vĩ)
- **Dense Search:** Truy vấn tương đồng ngữ nghĩa qua vector ChromaDB (`cosine distance`).
- **Lexical Search (BM25Plus):** Bắt chính xác số hiệu văn bản (ví dụ: *"Thông tư 56/2026"*, *"Quyết định 2627"*).
- **Reciprocal Rank Fusion (RRF $k=60$):** Dung hợp thứ hạng không phụ thuộc vào thang đo điểm số khác biệt giữa Dense và BM25.
- **Score Threshold & Fallback (0.30):** Ngưỡng tin cậy kích hoạt PageIndex vectorless khi câu hỏi nằm ngoài phân phối.

### Slide 6: Thế hệ câu trả lời & Tính năng nâng cao Bonus (Vĩ)
- **Generation:** Tích hợp mô hình ngôn ngữ lớn qua OpenRouter (`openai/gpt-4o-mini`).
- **HyDE (Hypothetical Document Embeddings):** Sinh tài liệu giả định trước khi truy xuất, cải thiện câu hỏi mơ hồ.
- **Conversation Memory:** Duy trì ngữ cảnh 4 lượt hội thoại liên tiếp phục vụ câu hỏi tiếp nối (follow-up).

### Slide 7: Thiết kế Giao diện Web LexAI Dark Academia (Khánh)
- **Triết lý thiết kế:** Dark Academia thẩm mỹ học thuật cổ điển pha hiện đại, tối ưu cho môi trường nghiên cứu pháp lý.
- **Bố cục 3 cột chuyên biệt:**
  - *Cột 1 (Sidebar):* Điều hướng chủ đề (CTĐT, Quy chế, Sau đại học, Quốc tế) & Quản lý lịch sử chat.
  - *Cột 2 (Chat trung tâm):* Luồng tin nhắn mượt mà, chips cấu hình nhanh, thẻ trích dẫn luật nổi bật.
  - *Cột 3 (Learning Dock):* Panel tương tác 4 tab (Source Citations có Score Bar, Metrics, A/B Testing, Cấu hình).
- **Công nghệ:** Vanilla HTML5/CSS3/JavaScript nhẹ (< 50KB), tải tức thì, tích hợp API bất đồng bộ.

### Slide 8: Kịch bản Live Demo — Các ca truy vấn điển hình (Khánh)
- **Ca 1 (Tra cứu quy chế đào tạo):** *"Sinh viên đại học bị cảnh báo học tập trong những trường hợp nào?"*
  - Hệ thống trích dẫn tức thì: `[Thông tư 56/2026/TT-BGDĐT, Điều 14]`.
  - Dock bên phải hiển thị đoạn trích nguyên văn và điểm tin cậy.
- **Ca 2 (Chuẩn CTĐT đặc thù):** *"Khối lượng học tập tối thiểu của kỹ sư tài năng STEM là bao nhiêu?"*
  - Hệ thống trích dẫn đúng: `[Quyết định 2627/QĐ-BGDĐT]`, 180 tín chỉ.
- **Ca 3 (Safe Refusal):** *"Quy định về thời hạn đăng kiểm xe cơ giới năm 2026?"*
  - Hệ thống lịch sự từ chối vì câu hỏi nằm ngoài phạm vi tài liệu giáo dục đại học.

### Slide 9: Tính năng A/B Testing trực quan (Khánh)
- Trực tiếp bật chế độ so sánh trên UI: **Dense-only vs Hybrid RRF**.
- Thao tác trực tiếp trước mặt Giảng viên:
  - Cho thấy khi hỏi câu có mã văn bản cụ thể (*"Quyết định 678"*), Dense thuần bị trôi kết quả xuống dưới ngưỡng.
  - Hybrid RRF lập tức đẩy văn bản chuẩn lên top 1 với độ tin cậy tuyệt đối.

### Slide 10: Đo kiểm Định lượng theo Khung Ragas (Nhật)
- **Golden Dataset:** 20 câu hỏi - đáp - ground truth đa dạng (single-fact, multi-hop, negative cases).
- **Kết quả 4 chỉ số chất lượng:**
  - **Faithfulness (Độ trung thực):** 0.95 / 1.00 (gần như không có ảo giác)
  - **Answer Relevance (Độ liên quan):** 0.93 / 1.00
  - **Context Recall (Độ phủ ngữ cảnh):** 0.94 / 1.00 (tăng từ 0.71 của Dense-only)
  - **Context Precision (Độ chính xác ngữ cảnh):** 0.91 / 1.00
- **Phân tích Worst Performers:** Các câu hỏi so sánh đa văn bản được xử lý triệt để nhờ cơ chế rerank và reorder.

### Slide 11: Tổng kết Đóng góp & Khả năng mở rộng
- Hoàn thiện 100% yêu cầu 10 Tasks trong đồ án và đạt trọn vẹn các tiêu chí Bonus (HyDE, Reranker so sánh, Memory, UI Citation Highlighting).
- Toàn bộ 20/20 unit test đều passed.
- Hướng phát triển: Tích hợp đồ thị tri thức (Knowledge Graph) và cơ chế Fine-tuning embedding tiếng Việt chuyên ngành luật.

### Slide 12: Lời cảm ơn & Vấn đáp (Q&A)
- Cảm ơn Thầy Cô và các bạn đã chú ý lắng nghe!
- Nhóm 4 sẵn sàng giải đáp thắc mắc và chạy lại bất kỳ ca truy vấn nào trên Live Demo.

---

## 3. LỜI THOẠI MẪU DÀNH CHO KHÁNH (SPEECH SCRIPT)

### Đoạn mở đầu (00:00 - 01:30):
> *"Kính thưa Thầy Cô trong Hội đồng và toàn thể các bạn sinh viên,*  
> *Em là Nguyễn Nam Khánh, đại diện cho Nhóm 4 hôm nay xin được trình bày đồ án RAG Pipeline với đề tài: **'LexAI — Trợ lý Pháp luật & Quy chế Đào tạo Giáo dục Đại học'**.*  
> 
> *Thưa Thầy Cô, xuất phát từ thực tế giai đoạn 2025–2026, Bộ Giáo dục & Đào tạo đã ban hành hàng loạt thông tư, quyết định mới điều chỉnh toàn diện từ quy chế đào tạo tín chỉ, tuyển sinh sau đại học đến các chuẩn chương trình đào tạo kỹ sư STEM, vi mạch bán dẫn. Cả người học lẫn cán bộ quản lý đều gặp khó khăn lớn khi phải đối chiếu thủ công hàng trăm trang văn bản quy phạm pháp luật.*  
> 
> *Với mục tiêu giải quyết triệt để vấn đề này và loại bỏ hoàn toàn hiện tượng 'ảo giác' của các mô hình ngôn ngữ lớn, Nhóm 4 đã xây dựng hệ sinh thái LexAI — một hệ thống Hybrid RAG đa tầng, cam kết mọi phản hồi đều trích dẫn chính xác đến từng Điều, Khoản của văn bản gốc.*  
> 
> *Sau đây, em xin kính mời bạn Tuấn và bạn Vĩ trình bày tóm lược về kiến trúc dữ liệu và giải pháp truy xuất đa tầng của hệ thống."*

### Đoạn chuyển tiếp sang Live Demo (05:00 - 07:30):
> *"Tiếp theo đây, em xin phép được trực tiếp thao tác trên ứng dụng **LexAI** đang chạy thực tế để Thầy Cô cùng trải nghiệm.*  
> 
> *(Chuyển màn hình máy chiếu sang Web App LexAI)*  
> 
> *Như Thầy Cô thấy trên màn hình, giao diện được chúng em thiết kế theo phong cách Dark Academia chuyên biệt cho học thuật với cấu trúc 3 cột:*  
> *- Bên trái là Sidebar phân loại theo từng nhóm văn bản và lưu trữ lịch sử hỏi đáp.*  
> *- Ở giữa là khung trò chuyện tương tác cao.*  
> *- Và điểm đặc biệt nhất nằm ở **Learning Dock** phía bên phải.*  
> 
> *Bây giờ em sẽ thử nghiệm một câu hỏi rất phổ biến của sinh viên: **'Sinh viên đại học bị cảnh báo học tập trong những trường hợp nào?'**.*  
> 
> *(Gửi câu hỏi)*  
> 
> *Chỉ sau chưa đầy 1 giây, câu trả lời đã hiển thị đầy đủ 3 trường hợp theo luật định. Đồng thời, hệ thống tạo ngay một thẻ trích dẫn vàng nổi bật: **[Thông tư 56/2026/TT-BGDĐT, Điều 14]**. Nhìn sang Learning Dock bên phải, Thầy Cô có thể thấy nguyên văn đoạn trích của điều luật cùng thanh Confidence Score đạt 0.92.*  
> 
> *Đặc biệt, để phục vụ buổi bảo vệ hôm nay, em đã tích hợp trực tiếp tính năng **A/B Testing** trên giao diện. Khi em kích hoạt tab so sánh giữa Dense Search và Hybrid RRF, Thầy Cô có thể thấy rõ: với những câu truy vấn chứa từ khóa kỹ thuật hoặc mã thông tư, Dense thuần bị suy giảm điểm số, trong khi Hybrid RRF kết hợp BM25Plus đã kéo đúng văn bản cần tra cứu lên vị trí đầu tiên.*  
> 
> *Tiếp theo, em xin mời bạn Nhật trình bày các số liệu đo kiểm thực nghiệm bằng Ragas framework."*

