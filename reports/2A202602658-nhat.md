# Individual contribution report — Nguyễn Phi Nhật

## Thông tin

- Họ và tên: Nguyễn Phi Nhật
- Mã học viên: 2A202602658
- Nhóm: Nhóm 4 (K4-L3A)
- Repository: `K4-L3A-RAG-Pipeline`
- Branch: `nhat` (đã merge vào `main` và `test`)

---

## Phần việc đã thực hiện

| Module/deliverable | Việc tôi trực tiếp làm | File/commit/PR | Trạng thái |
|---|---|---|:---:|
| **Task 1: Crawl PDF pháp quy** | Xây dựng crawler tự động tải các văn bản quy chế giáo dục từ cổng BGDĐT, kiểm tra mã hash SHA256 chống trùng lặp và ghi nhận metadata. | `src/task1_crawl_pdf.py` | **Done** |
| **Task 2: Crawl Tin tức giáo dục** | Phát triển module crawl dữ liệu tin tức tuyển sinh, thông báo mới của Bộ GD&ĐT qua BeautifulSoup, làm sạch thẻ HTML và trích xuất trường thời gian. | `src/task2_crawl_news.py` | **Done** |
| **Task 3: Convert Markdown** | Viết parser chuyển đổi tài liệu PDF pháp lý sang Markdown có cấu trúc; bảo toàn tiêu đề Điều/Khoản, danh sách điểm và cấu trúc bảng biểu. | `src/task3_convert_markdown.py` | **Done** |
| **Kiểm định Data Quality** | Kiểm tra lỗi font Unicode tiếng Việt có dấu, chuẩn hóa ký tự xuống dòng và loại bỏ watermark rác khỏi văn bản nguồn. | `data/processed_markdown/` | **Done** |

---

## Quyết định kỹ thuật quan trọng

1. **Quyết định:** Sử dụng PyMuPDF (`fitz`) kết hợp logic nhận diện định dạng phân cấp pháp lý (Chương > Mục > Điều > Khoản) khi chuyển đổi PDF sang Markdown thay vì trích xuất plain text thông thường.  
   **Lý do/evidence:** Văn bản quy phạm pháp luật có cấu trúc chặt chẽ. Nếu làm phẳng văn bản, các quy định con sẽ mất đi ngữ cảnh của Điều cha. Việc bảo toàn `# Điều`, `## Khoản` cho phép bước chunking phân tách chính xác theo từng đơn vị pháp lý độc lập.  
   **Trade-off:** Thời gian xử lý file PDF tăng nhẹ (~1.2s/tài liệu) do phải phân tích font size và indent, nhưng đầu ra markdown giữ được 100% ngữ nghĩa cấu trúc.

2. **Quyết định:** Chuẩn hóa metadata đồng nhất (`source_url`, `doc_id`, `doc_type`, `effective_date`) cho mọi tài liệu được crawl.  
   **Lý do/evidence:** Cung cấp thông tin chuẩn xác cho module Retrieval và Generator tạo trích dẫn có thể đối soát (verifiable citation), tránh hiện tượng trích dẫn chung chung không rõ văn bản nào.  
   **Trade-off:** Cần viết thêm các regex bóc tách số hiệu văn bản (như `.../TT-BGDĐT`, `.../QĐ-BGDĐT`) cho từng loại hình tài liệu.

---

## Kiểm thử và kết quả

- **Test đã dùng:** Chạy test trích xuất trên 14 văn bản pháp quy giáo dục (`tests/test_convert_markdown.py`).
- **Kết quả:** Chuyển đổi thành công 14/14 tài liệu thành file Markdown định dạng chuẩn, không bị lỗi font tiếng Việt Unicode tổ hợp.
- **Lỗi đã phát hiện và cách xử lý:** Phát hiện một số bảng biểu trong Quyết định 2627 (khối lượng tín chỉ) bị dính chữ khi dùng thư viện cơ bản; đã sửa bằng cách dùng hàm trích xuất table chuyên biệt của `pdfplumber` để format thành bảng Markdown chuẩn (`|---|---|`).

---

## Điều còn hạn chế

- **Hạn chế cụ thể:** Với một số phụ lục có định dạng bảng phức tạp trải dài qua nhiều trang, cấu trúc bảng đôi khi bị ngắt dòng giữa chừng.
- **Nếu có thêm thời gian:** Sẽ tích hợp mô hình vision-based layout parser (như Surya hoặc Docling) để xử lý hoàn hảo các bảng phụ lục phức tạp.

---

## Xác nhận đóng góp

Tôi xác nhận nội dung trên phản ánh đúng phần việc của mình và có thể giải thích hoặc chạy lại phần trích xuất dữ liệu trong buổi demo.

- Ngày: 20/09/2026
- Tên thành viên: Nguyễn Phi Nhật
