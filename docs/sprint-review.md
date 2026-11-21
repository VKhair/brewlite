# Biên bản Sprint Review BrewLite

- **Ngày tổng hợp bằng chứng** 21/11/2026, múi giờ Việt Nam.
- **Thời gian họp, địa điểm và người tham dự thực tế** Chờ nhóm xác nhận.
- **Thành phần theo phân công** Viết Khải phụ trách nền tảng và vận hành. Kim Khương phụ trách tài khoản và E2E. Hải Yến phụ trách giỏ và vòng đời đơn. Quốc Huy phụ trách danh mục và kho. Huy Phát phụ trách menu và thanh toán. Đại diện nghiệm thu và phản hồi thực tế chờ xác nhận.

[Phân công và mục tiêu từng Sprint](backlog.md)

## Kết quả demo và đối chiếu nghiệm thu

| Sprint | Hạng mục và người trình bày theo phân công | Kết quả và bằng chứng |
| --- | --- | --- |
| 1 | Danh mục, dữ liệu mẫu và menu web — Quốc Huy, Huy Phát | Đã đối chiếu đọc menu và chi tiết món từ API. Playwright mở menu và chọn được size/topping trên dữ liệu seed. Báo cáo Postman ghi p95 GET /products đạt ngưỡng dưới 500 ms ở cả 1 và 3 VU. |
| 1 | Nền tảng CI — Viết Khải | Đã cấu hình hai check Quality và Browser E2E. Đợt kiểm tra local ghi nhận build web/API thành công. Chờ link chạy workflow trên GitHub. |
| 2 | Tài khoản, giỏ và thanh toán mock — Kim Khương, Hải Yến, Huy Phát | Playwright đã chạy đạt luồng menu → giỏ → đăng nhập → thanh toán thẻ mock → đối chiếu mã đơn trên trang xác nhận. |
| 2 | Vòng đời đơn, tồn kho và VNPay — Hải Yến, Quốc Huy, Huy Phát | Integration PostgreSQL đạt 8/8, bao gồm giữ tồn khi thanh toán, hoàn tồn, retry, xử lý IPN và hủy đơn VNPay quá hạn. Đây là bằng chứng local với VNPay mô phỏng callback. |
| 2 | Docker và bàn giao — Viết Khải | Hai image build thành công, Compose local trả status/database ok. Workflow phát hành tag v* đã có. Chờ bằng chứng deploy tag, health sau deploy và diễn tập rollback trên môi trường đích. |

[Ca Playwright](../apps/web/e2e/checkout.spec.ts) · [Suite integration](../apps/api/test/prisma.integration.test.cjs) · [Báo cáo Postman](../apps/api/postman/server-test-report.md) · [Ma trận truy vết](traceability-matrix.md)

## Phản hồi và xác nhận

- Audit yêu cầu đồng bộ đặc tả, sơ đồ và collection với schema kho theo lần thanh toán. Các tạo phẩm tương ứng đã cập nhật trong đợt bàn giao này.
- Audit yêu cầu bằng chứng browser E2E và quality gate. Đã bổ sung test và workflow. Kết quả chạy production cần đính kèm sau khi có run.
- Phản hồi từ người dự, quyết định nghiệm thu chính thức và chữ ký xác nhận chờ điền theo buổi họp thực tế.
