# Hồ sơ nghiệm thu và bàn giao BrewLite

## Kiểm tra trên môi trường test

- CI chạy lint, build, unit API, integration, hai ca Playwright và kiểm tra migration chạy lại vẫn giữ đơn đã thanh toán.
- VNPay integration dùng IPN mô phỏng với dữ liệu test. Giao dịch Sandbox qua endpoint HTTPS được ghi riêng ở lần nghiệm thu production.

## Biên bản production cần điền sau khi chạy

- Tag, SHA và link CI/CD.
- Các URL HTTPS Web, API, health và kết quả smoke, kèm minh chứng PostgreSQL private đã che thông tin kết nối.
- Mã đơn giao dịch Sandbox, thời điểm nhận IPN và trạng thái đã xác nhận trong lịch sử. Chỉ dùng ảnh hoặc video đã che thông tin cá nhân và bí mật.
- Phiên bản trước/sau rollback và thời gian đến khi smoke đạt. Ngưỡng SRS dưới 5 phút.
- Release notes và link video demo hoặc thời gian demo trực tiếp.

## Sprint Review và Retrospective

Ghi ngày, người tham dự, các tính năng đã trình diễn, kết quả so với mục tiêu Sprint và phản hồi của người nghiệm thu. Ghi lại điều đã làm tốt, vướng mắc và hành động cải tiến đã được nhóm thống nhất, kèm người phụ trách. Nhóm điền sau buổi làm việc thực tế.
