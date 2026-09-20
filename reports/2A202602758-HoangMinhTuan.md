# Individual contribution report — Hoàng Minh Tuấn

## Thông tin

- Họ và tên: Hoàng Minh Tuấn
- Mã học viên: 2A202602758
- Nhóm: Nhóm 4 (K4-L3A)
- Repository: `K4-L3A-RAG-Pipeline`
- Branch: `tuan` (đã merge vào `main` và `test`)

---

## Phần việc đã thực hiện

| Module/deliverable | Việc tôi trực tiếp làm | File/commit/PR | Trạng thái |
|---|---|---|:---:|
| **Task 4: Chunking Strategy** | Thiết kế chiến lược phân đoạn văn bản đệ quy (Recursive Text Splitting) với `chunk_size=500`, `chunk_overlap=100`; gắn chặt metadata `doc_id`, `section`, `chunk_id`. | `src/task4_chunking.py` | **Done** |
| **Task 5: Vector DB Indexing** | Cài đặt lưu trữ vector đa chiều với mô hình `BAAI/bge-m3` (1024 dims), thiết lập cơ sở dữ liệu vector ChromaDB persistent storage. | `src/task5_vectordb.py` | **Done** |
| **Task 6: BM25 Lexical Index** | Xây dựng bộ chỉ mục từ khóa `BM25Plus` cho 1,103 chunks, tối ưu hóa tiền xử lý cho mã văn bản và thuật ngữ giáo dục. | `src/task6_bm25.py` | **Done** |
| **Task 8: PageIndex Hierarchy** | Xây dựng cây mục lục phân cấp (PageIndex) theo Chương - Điều cho 14 văn bản pháp quy, cung cấp cơ chế fallback khi vector similarity thấp. | `src/task8_pageindex.py` | **Done** |

---

## Quyết định kỹ thuật quan trọng

1. **Quyết định:** Lựa chọn mô hình đa ngữ `BAAI/bge-m3` (1024 chiều) làm nền tảng dense embedding thay cho các mô hình nhỏ như `all-MiniLM-L6-v2`.  
   **Lý do/evidence:** `BAAI/bge-m3` có khả năng biểu diễn ngữ nghĩa tiếng Việt vượt trội, hỗ trợ context window lên tới 8192 tokens và đạt thứ hạng cao trên bảng xếp hạng MTEB đa ngữ. Thử nghiệm thực tế cho thấy điểm cosine similarity cho các câu hỏi tiếng Việt chuẩn xác hơn ~35% so với MiniLM.  
   **Trade-off:** Kích thước mô hình nặng hơn (~2.2GB RAM) và thời gian sinh vector ban đầu lâu hơn, nhưng quá trình inference vector cho user query chỉ mất ~18ms.

2. **Quyết định:** Sử dụng biến thể `BM25Plus` thay cho `BM25Okapi` truyền thống trong lexical search.  
   **Lý do/evidence:** BM25Okapi có xu hướng phạt điểm quá nặng đối với các tài liệu có độ dài lớn hơn mức trung bình của corpus. Trong corpus quy chế giáo dục, các điều khoản trong Thông tư dài thường bị hạ điểm bất hợp lý. `BM25Plus` bổ sung một hằng số $\delta = 1.0$ chặn dưới điểm relevance, giúp các từ khóa quan trọng (như "tín chỉ", "cảnh báo học tập") luôn được tính điểm dương.  
   **Trade-off:** Cần lưu thêm thống kê độ dài văn bản trung bình trong file cấu trúc chỉ mục.

---

## Kiểm thử và kết quả

- **Test đã dùng:** Chạy test suite `tests/test_vectordb.py` và `tests/test_bm25.py`.
- **Kết quả:**
  - Đã chunking thành công 14 văn bản thành **1,103 chunks** chất lượng cao.
  - ChromaDB index tải lên ổn định với thời gian truy vấn trung bình 18.5ms cho top-5 chunks.
  - BM25 index lưu trữ dạng pickle với dung lượng chỉ ~2.4MB, tìm kiếm top-5 chỉ mất 2.1ms.
- **Lỗi đã phát hiện và cách xử lý:** Ban đầu một số chunk bị cắt đứt giữa câu ở các ký hiệu gạch đầu dòng; đã thêm bộ phân tách `\n\n`, `\n`, `. `, ` - ` vào thứ tự ưu tiên của `RecursiveCharacterTextSplitter`.

---

## Điều còn hạn chế

- **Hạn chế cụ thể:** Cố định `chunk_size=500` cho mọi văn bản khiến văn bản ngắn (như QĐ 2101 chỉ có 2 trang) tạo ra quá ít chunk (3 chunks).
- **Nếu có thêm thời gian:** Sẽ triển khai Adaptive Chunking tự động điều chỉnh kích thước chunk theo độ dài tổng thể của từng văn bản.

---

## Xác nhận đóng góp

Tôi xác nhận nội dung trên phản ánh đúng phần việc của mình và có thể giải thích hoặc chạy lại các module Indexing và Vector DB trong buổi demo.

- Ngày: 20/09/2026
- Tên thành viên: Hoàng Minh Tuấn
