# ADR-0003: ORM cho PostgreSQL

- **Trạng thái:** Proposed – cần nhóm duyệt trước khi thêm dependency
- **Ngày:** 2026-11-12

## Bối cảnh

PostgreSQL đã được nêu trong README, `.env.example`, domain model và sequence diagram; tuy nhiên API, schema và ORM chưa được khởi tạo. Nhóm cần migrations có thể review và lặp lại ở local/staging/production, đồng thời API được viết bằng NestJS/TypeScript.

## Đề xuất

Dùng **Prisma ORM** cho truy vấn dữ liệu và quản lý schema/migrations PostgreSQL. Giữ database transaction ở application/repository boundary; dùng constraint/index PostgreSQL cho unique key, foreign key và idempotency. Với thao tác concurrency nhạy cảm như giữ tồn kho, cho phép migration/query SQL tường minh khi cần và yêu cầu review.

Prisma được NestJS hướng dẫn tích hợp qua provider/service; Prisma hỗ trợ PostgreSQL và lưu lịch sử migrations có thể review. Chốt phiên bản stable tương thích với Node/NestJS khi ứng dụng được khởi tạo; không ghi cứng lệnh CLI theo major chưa được cài trong repo.

## Phương án đã cân nhắc

- **TypeORM:** tích hợp quen thuộc với NestJS và decorators; mapping entity/migration rõ, nhưng lựa chọn chưa được phản ánh trong repo.
- **Prisma (đề xuất):** schema/contract và kiểu TypeScript có thể review, migrations được version-control; bổ sung toolchain riêng cần ghim version.
- **SQL/query builder trực tiếp:** kiểm soát query tốt nhưng tăng lượng mapping và boilerplate cho domain model.

## Hệ quả

- Đây chưa phải quyết định được nhóm chấp nhận; không tạo schema/migrations hay dependency trong ADR-only change.
- Nếu được duyệt, schema ORM phải khớp class diagram và SRS; migrations phải được review và chạy qua release pipeline.
- Cần benchmark/kiểm thử transaction tồn kho và unique constraint idempotency bằng PostgreSQL thật trước nghiệm thu.

## Tài liệu tham khảo

- [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma)
- [Prisma ORM documentation](https://www.prisma.io/docs/orm)
