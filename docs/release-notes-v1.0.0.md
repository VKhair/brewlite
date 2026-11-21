# BrewLite v1.0.0

Ghi chú dùng cho GitHub Release của tag `v1.0.0`. Điền commit SHA, link run và trạng thái production khi phát hành.

## Tính năng MVP

- Menu, tìm món, chọn size và topping, giỏ hàng và xác thực JWT.
- Checkout, thanh toán thẻ/ví mô phỏng ở môi trường kiểm thử và VNPay Sandbox ở production.
- Trang xác nhận có mã đơn, lịch sử đơn và tiến độ pha chế. Chủ đơn có thể hủy đơn PENDING đủ điều kiện.
- Quản lý nguyên liệu và công thức theo vai trò admin. Giỏ được xóa theo đúng đơn đã thanh toán.

## Dữ liệu và tương thích

- Tạo đơn ghi snapshot, lịch sử và trạng thái PENDING. Transaction thanh toán kiểm tra công thức theo size/topping và trừ tồn nguyên liệu. Tiêu hao và hoàn kho gắn với paymentId.
- Migration `20261121000000_payment_ingredient_inventory` bỏ cột tồn theo món và chuyển dữ liệu giữ tồn cũ. Seed bổ sung công thức và tồn khởi tạo cho món mẫu trên DB mới, đồng thời giữ số dư và công thức đã cấu hình khi chạy lại.
- Hủy VNPay quá hạn hoàn nguyên liệu và điểm đã dùng. IPN thành công đến sau hủy cần đối soát hoàn tiền thủ công.

[Migration](../apps/api/prisma/migrations/20261121000000_payment_ingredient_inventory/migration.sql) · [Cấu hình và vận hành](deployment.md)

## Kiểm thử

Kết quả local đã ghi nhận gồm build API/web thành công, 5 unit API, 8 integration PostgreSQL, 1 API E2E, 1 Playwright E2E và Compose health trả `status: ok`, `database: ok`. Gắn kết quả hai job Quality và Browser E2E của commit phát hành khi tạo release. [Workflow](../.github/workflows/ci.yml) · [Playwright checkout](../apps/web/e2e/checkout.spec.ts)

## Triển khai và rollback

1. Xác nhận tag `v1.0.0` trỏ vào commit bàn giao. Lưu overlay release ổn định cũ, hai image SHA và điểm phục hồi PostgreSQL.
2. Push tag để GitHub Actions chạy quality gate, đưa image theo commit SHA lên GHCR và deploy qua SSH vào Lightsail. Kiểm tra job đã đối chiếu cả hai image và nhận health HTTPS với API và PostgreSQL sẵn sàng.
3. Nếu cần rollback, dùng lại overlay và cặp image SHA đã lưu khi tương thích với schema. Nếu schema không tương thích, áp dụng phương án phục hồi riêng của migration trước khi khởi động bản cũ. Kiểm tra lại readiness qua HTTPS.

[Hướng dẫn deploy và rollback](../README.md#5-triển-khai-deployment-và-kế-hoạch-phục-hồi-rollback) · [Health production](https://brewlite.vkhair.dev/api/backend/health)
