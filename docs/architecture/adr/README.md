# Architecture Decision Records

Các ADR ghi lại lựa chọn kiến trúc, bối cảnh, phương án thay thế và hệ quả.

| ADR | Quyết định | Trạng thái |
|---|---|---|
| [ADR-0001](0001-monorepo.md) | Monorepo cho Web, API và tài liệu | Accepted |
| [ADR-0002](0002-jwt-authentication.md) | Xác thực API bằng JWT | Accepted |
| [ADR-0003](0003-postgresql-orm.md) | ORM cho PostgreSQL: đề xuất Prisma | Proposed – cần nhóm duyệt |
| [ADR-0004](0004-vnpay-sandbox.md) | Tích hợp VNPay Sandbox qua adapter backend | Accepted |
| [ADR-0005](0005-aws-lightsail.md) | AWS Lightsail làm nền tảng triển khai | Accepted; topology mục tiêu Proposed |

**Lưu ý:** Accepted nghĩa là quyết định/phạm vi đã được xác nhận trong yêu cầu hoặc bởi nhóm; không đồng nghĩa tính năng đã được code. Repo hiện chưa có implementation trong `apps/`.
