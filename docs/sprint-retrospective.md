# Biên bản Sprint Retrospective BrewLite

**Mốc tổng hợp** 21/11/2026. Thời gian họp, danh sách tham dự và quyết định chính thức chờ nhóm xác nhận. Các đề xuất dưới đây dựa trên kết quả audit và phân công hiện có. [Backlog](backlog.md)

## Điểm làm tốt

- Test integration dùng PostgreSQL thật và kiểm tra cùng lúc nhiều giao dịch, thiếu tồn, hoàn tồn và phát lại kết quả.
- Playwright đi qua cả web và API, dùng dữ liệu seed và đối chiếu mã đơn trên giao diện.
- CI tách kiểm tra chất lượng và kiểm thử trình duyệt. Quy trình đóng gói có thể truy cặp image về commit SHA.

## Vấn đề gặp phải

- Migration chuyển kho theo lần thanh toán trước khi SRS, sơ đồ và Postman bắt kịp. Hợp đồng cũ còn dùng tồn theo món, ID số và response shape cũ.
- Kiểm thử web ban đầu chỉ in thông báo. Tên job CI chưa khớp required checks, làm giảm giá trị minh chứng nghiệm thu.
- Cần ghi lại bằng chứng theo đúng môi trường. Mock checkout và Compose local đã được kiểm tra, còn deploy tag và rollback trên Lightsail cần lần chạy riêng.

## Hành động cải tiến

| Hành động | Phụ trách đề xuất | Mốc và tiêu chí hoàn tất |
| --- | --- | --- |
| Đối chiếu Prisma schema, test migration, seed và class diagram trong cùng PR thay đổi dữ liệu. | Quốc Huy | Từ PR schema kế tiếp. Review có liên kết diff schema và kiểm thử seed/migration. |
| Đối chiếu SRS, use case, FSM và Postman khi đổi hợp đồng đơn. | Hải Yến | Trước merge PR về đơn. Xác minh UUID, mã lỗi, snapshot và luồng hủy. |
| Gắn kết quả Playwright, phiên đăng nhập và các bước xác minh với mã FR trong ma trận. | Kim Khương | Trước nghiệm thu. Có link run Browser E2E và trace khi thất bại. |
| Đồng bộ activity và sequence khi đổi checkout. Kiểm tra replay, hoàn tồn và IPN muộn khi review thanh toán. | Huy Phát | Trong PR checkout tiếp theo. Có cập nhật nguồn SVG và test liên quan. |
| Kiểm tra required checks, lưu SHA cặp image, minh chứng health và kết quả diễn tập rollback. | Viết Khải | Trước ký bàn giao release. Gắn link run deploy và ghi thời gian rollback thực tế. |
