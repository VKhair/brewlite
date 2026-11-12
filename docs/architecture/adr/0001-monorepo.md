# ADR-0001: Duy trì monorepo cho BrewLite

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-12

## Bối cảnh

Repo đã có `apps/web`, `apps/api`, `docs` và `tests`. Web Next.js và API NestJS cùng phục vụ một sản phẩm, dùng chung SRS, domain model và hợp đồng API. Các thư mục ứng dụng hiện chưa có mã nguồn hoặc workspace manifest.

## Quyết định

Duy trì một repository cho Web, API, tài liệu và kiểm thử. Giữ ranh giới ứng dụng ở `apps/web` và `apps/api`; chia sẻ tài liệu/contract ở cấp repo. Chưa khóa package manager hay công cụ workspace cho đến khi khởi tạo ứng dụng và kiểm tra với quy trình CI.

## Phương án đã cân nhắc

- **Tách Web/API thành repositories:** tạo versioning và CI riêng nhưng làm tăng chi phí đồng bộ API contract, tài liệu và thay đổi phối hợp.
- **Monorepo hiện tại:** thay đổi liên quan FE/BE/docs có thể review cùng nhau; một pipeline có thể kiểm tra toàn bộ.

## Hệ quả

- PR cần nêu rõ phạm vi ứng dụng bị ảnh hưởng và chạy checks tương ứng.
- CI cần hỗ trợ build/test theo workspace khi workspace tool được chốt.
- Package manager, chia sẻ package và cache CI vẫn là quyết định triển khai còn mở.
