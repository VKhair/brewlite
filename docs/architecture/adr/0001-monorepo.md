# ADR-0001 — Monorepo với npm workspaces

**Quyết định ban đầu ngày 12/11/2026. Trạng thái hiện tại đã triển khai.**

Web và API thay đổi cùng một hợp đồng HTTP. Dự án đặt cả hai ứng dụng trong một repository với npm workspaces apps/* và một lockfile. Lệnh gốc điều phối lint, test và build. Package của từng ứng dụng giữ lệnh riêng cho Next.js và NestJS. Thay đổi giao diện và API liên quan có thể được review trong cùng PR. Khi chạy, web và API vẫn là các tiến trình và image riêng.

Bằng chứng triển khai nằm trong [package gốc](../../../package.json), [package web](../../../apps/web/package.json), [package API](../../../apps/api/package.json), [CI](../../../.github/workflows/ci.yml) và [Compose](../../../docker-compose.yml).
