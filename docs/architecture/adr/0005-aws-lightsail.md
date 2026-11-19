# ADR-0005 — AWS Lightsail instance với Docker Compose

**Quyết định nền tảng ngày 12/11/2026. Đã xác minh triển khai ngày 19/11/2026.**

Triển khai thực tế dùng một máy ảo Lightsail Ubuntu 24.04 LTS ở `ap-southeast-2`. Docker Compose chạy Caddy, Next.js, NestJS và PostgreSQL 16 trên cùng máy. PostgreSQL là container trong stack và lưu dữ liệu bằng Docker volume. Caddy publish cổng `80` và `443`, phục vụ HTTPS, chuyển request web đến Next.js và chuyển Return/IPN VNPay trực tiếp đến API.

Web, API và DB dùng mạng nội bộ Compose. Cấu hình API và dữ liệu phụ thuộc vào môi trường và volume của máy chủ. Bộ Compose triển khai nằm tại `/opt/brewlite`. GitHub Actions trong repository chạy kiểm tra chất lượng. Quy trình CD và rollback Lightsail chưa có bằng chứng trong workflow. Xem [triển khai và vận hành](../../deployment.md) và [sơ đồ AWS](../../diagrams/deploymentDiagram.puml).

Repository lưu [Compose cục bộ](../../../docker-compose.yml), [Dockerfile API](../../../apps/api/Dockerfile), [Dockerfile web](../../../apps/web/Dockerfile) và [workflow CI](../../../.github/workflows/ci.yml).
