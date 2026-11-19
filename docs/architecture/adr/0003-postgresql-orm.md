# ADR-0003 — Prisma 7 trên PostgreSQL

**Đề xuất ban đầu ngày 12/11/2026. Prisma hiện đã được triển khai trong API.**

Prisma Client được sinh từ schema và sử dụng PostgreSQL qua adapter pg. Các service dùng Prisma transaction cho đơn, thanh toán, điểm và biến động kho. SQL trong migration bổ sung CHECK, khóa ngoại và chỉ mục, gồm chỉ mục duy nhất cho một lần thanh toán SUCCESS trên mỗi đơn. Truy vấn khóa dòng dùng raw query dạng tagged template ở nơi cần đồng bộ.

Prisma CLI dùng DATABASE_URL và thư mục prisma/migrations. Script db:setup chạy migration rồi seed. Script nhận diện một số schema UUID cũ để ghi nhận baseline nếu phù hợp. Dữ liệu mẫu được thêm theo khóa ổn định. Seed cần Prisma Client trong bản build API. Bộ kiểm thử tích hợp dùng PostgreSQL thật với schema riêng.

Xem [schema hiện hành](../../../apps/api/prisma/schema.prisma), [Prisma config](../../../apps/api/prisma.config.ts), [PrismaService](../../../apps/api/src/prisma/prisma.service.ts) và [script migration](../../../apps/api/scripts/migrate.cjs).
