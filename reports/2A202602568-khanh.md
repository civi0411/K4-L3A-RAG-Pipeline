# Individual contribution report — Nguyễn Nam Khánh

## Thông tin

- Họ và tên: Nguyễn Nam Khánh
- Mã học viên: 2A202602568
- Nhóm: Nhóm 4 (K4-L3A)
- Repository: `K4-L3A-RAG-Pipeline`
- Branch: `khanh` (đã merge vào `main` và `test`)

---

## Phần việc đã thực hiện

| Module/deliverable | Việc tôi trực tiếp làm | File/commit/PR | Trạng thái |
|---|---|---|:---:|
| **Frontend UI (LexAI)** | Thiết kế và phát triển giao diện Dark Academia cho hệ thống LexAI với hiệu ứng trích dẫn thông minh và chuyển đổi chế độ tư vấn. | `app/frontend/index.html`, `app/frontend/styles.css`, `app/frontend/app.js` | **Done** |
| **Sơ đồ luồng A/B Architecture** | Trực quan hóa kiến trúc so sánh hai nhánh RAG (Dense-only vs Hybrid+RRF) tích hợp trong Learning Dock bên phải. | `app/frontend/index.html`, `app/frontend/styles.css` | **Done** |
| **Golden Dataset & Evaluation** | Thu thập, biên soạn bộ 20 câu hỏi và câu trả lời chuẩn (Ground Truth) bám sát các tình huống pháp lý sinh viên thường gặp. | `group_project/evaluation/golden_dataset.json` | **Done** |
| **Kịch bản & Slide thuyết trình** | Xây dựng slide báo cáo tổng kết đồ án, kịch bản thuyết trình và trực tiếp đảm nhiệm phần demo tương tác trước hội đồng. | `reports/GROUP_REPORT.md`, Slides bảo vệ | **Done** |

---

## Quyết định kỹ thuật quan trọng

1. **Quyết định:** Thiết kế giao diện theo phong cách thẩm mỹ Dark Academia (kết hợp bảng màu Antique Gold, Espresso Leather, Slate và font chữ serif Cinzel/EB Garamond) cùng bố cục Split-View mở rộng (420px Learning Dock).  
   **Lý do/evidence:** Sản phẩm hướng tới đối tượng người dùng tra cứu văn bản pháp quy giáo dục, cần tạo cảm giác học thuật, uy tín và chuyên nghiệp. Khung Learning Dock rộng giúp người xem trong buổi thuyết trình nhìn rõ toàn bộ trích dẫn và sơ đồ kiến trúc dữ liệu mà không bị che khuất nội dung chat.  
   **Trade-off:** Cần tùy biến CSS thủ công tỉ mỉ để giữ độ tương phản cao, tránh dùng các framework cồng kềnh nhằm giữ tốc độ tải trang dưới 50ms.

2. **Quyết định:** Thiết kế bộ câu hỏi Golden Dataset phân bổ theo 3 cấp độ phức tạp: (1) Khớp mã văn bản cụ thể; (2) Tra cứu điều kiện định lượng (tín chỉ, điểm số); (3) Tổng hợp đa điều khoản.  
   **Lý do/evidence:** Đảm bảo đánh giá khách quan và bộc lộ rõ rệt sự khác biệt giữa hai kiến trúc Dense-only (thất bại ở mức 1 & 3) và Hybrid RRF (vượt trội toàn diện).  
   **Trade-off:** Cần nhiều thời gian đọc và đối soát thủ công từng điều khoản trong Thông tư 56 và Quyết định 2627 để viết Ground Truth chuẩn xác.

---

## Kiểm thử và kết quả

- **Test đã dùng:** Kiểm thử giao diện người dùng trên nhiều độ phân giải màn hình và trình duyệt (Chrome, Safari, Firefox).
- **Kết quả:**
  - Giao diện phản hồi trơn tru, hỗ trợ hiển thị citation click-to-preview tài liệu gốc.
  - Bộ 20 câu hỏi Golden Dataset chạy qua pipeline đánh giá cho thấy kết quả Ragas nhất quán với lý thuyết.
- **Lỗi đã phát hiện và cách xử lý:** Ban đầu khung chat bên phải bị tràn chiều ngang khi mở rộng sơ đồ so sánh A/B; đã xử lý bằng grid layout 2 cột linh hoạt với `overflow-y: auto` và scrollbar đồng bộ.

---

## Điều còn hạn chế

- **Hạn chế cụ thể:** Giao diện hiện tối ưu chính cho Dark Mode học thuật, chưa có tùy chọn chuyển sang Light Mode.
- **Nếu có thêm thời gian:** Sẽ bổ sung tính năng một chạm xuất toàn bộ phiên hỏi đáp pháp lý kèm trích dẫn ra file PDF cho sinh viên lưu trữ.

---

## Xác nhận đóng góp

Tôi xác nhận nội dung trên phản ánh đúng phần việc của mình và sẽ trực tiếp điều khiển buổi demo, thuyết trình bảo vệ đồ án trước giảng viên và hội đồng.

- Ngày: 20/09/2026
- Tên thành viên: Nguyễn Nam Khánh
