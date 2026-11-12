# BrewLite

Ứng dụng đặt đồ uống mobile-first/PWA. Stack mục tiêu: Next.js, NestJS, PostgreSQL và Docker.

## Repository

- `apps/web` – ứng dụng Web (đang chờ scaffold)
- `apps/api` – API (đang chờ scaffold)
- `docs/` – yêu cầu, sơ đồ, kiến trúc và backlog
- `tests/` – kiểm thử (đang chờ scaffold)
- `.github/` – hướng dẫn đóng góp, PR template và workflows

## Tài liệu dự án

- [Backlog Sprint 1–2](docs/backlog.md)
- [Yêu cầu và SRS](docs/requirements/srs.md)
- [Kiến trúc](docs/architecture/architecture.md)
- [Deployment target](docs/deployment.md)
- [Traceability matrix](docs/traceability-matrix.md)

## Cấu hình môi trường

Sao chép `.env.example` thành `.env` và thay các giá trị placeholder bằng cấu hình local của bạn. Không commit `.env` hoặc secret thật. Ứng dụng và hướng dẫn chạy local sẽ được bổ sung khi các package của Web/API được khởi tạo.

## Quy ước làm việc

Xem [hướng dẫn đóng góp](.github/CONTRIBUTING.md) và [PR template](.github/pull_request_template.md).
