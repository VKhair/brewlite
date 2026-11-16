# Ma trận truy vết BrewLite

Đối chiếu với [SRS](requirements/srs.md), [đặc tả checkout](requirements/BrewLite_DacTa_UseCase_DatVaThanhToan.md) và [sơ đồ](diagrams/). Đường dẫn `app/` và `lib/` thuộc `apps/web/src`. Tên tệp backend thuộc `apps/api/src`.

| Mã | Use-case/thiết kế | API hoặc mã nguồn | Kiểm chứng |
|---|---|---|---|
| FR-01 | UC-01 · Activity/Class | GET /products + app/menu | INT-02, E2E-01 |
| FR-02 | UC-03 · Activity/Class | GET /products/:id + app/product/[id] | E2E-01 |
| FR-03 | UC-04 · Activity/Class | app/product/[id] | E2E-01 |
| FR-04 | UC-06 · Activity/Class | app/cart + lib/store.tsx | E2E-01, E2E-02 |
| FR-05 | UC-08 · Class | POST /auth/register + app/register | INT-02, E2E-01 |
| FR-06 | UC-09 · Sequence | POST /auth/login + auth.ts + app/login | INT-02 |
| FR-07 | UC-11/12 · Sequence | POST /orders + orders.ts + app/checkout | INT-03, E2E-01 |
| FR-08 | UC-13/14 · Sequence | POST /payments + GET /payments/vnpay/ipn + payments.ts | INT-01, INT-03, E2E-01. Còn giao dịch Sandbox thật. |
| FR-09 | UC-17 · Activity/Sequence | POST /payments + app/checkout + app/orders/[id] | INT-03, E2E-02 |
| FR-10 | UC-18 · Sequence | app/success/[id] | E2E-01 |
| FR-11 | UC-21 · Class | GET /orders/me + app/orders | INT-03, E2E-01 |
| FR-12 | UC-19 · Class | GET /orders/:id + PATCH /orders/:id/status + order-state.ts + app/orders/[id] | E2E-01 xác nhận trạng thái đơn. Chuỗi cập nhật của nhân viên cần kiểm tra riêng. |
| FR-13 | UC-25 · Deployment | GET /health + app.controller.ts | INT-02, health Compose, smoke CD |
| FR-14 | UC-02 · Activity | app/menu lọc dữ liệu danh mục; products.ts | Kiểm tra thủ công tìm kiếm/lọc. |
| FR-15 | UC-20 · Class | PATCH /orders/:id/cancel + app/orders/[id] | Kiểm tra thủ công đơn PENDING và tồn kho. |
| FR-16 | UC-06 · Class | lib/store.tsx | E2E-01 tải lại giỏ |
| FR-17 | UC-15 · Class | GET /coupons/validate?code=&amount= + coupons/ + orders.ts | INT-04 kiểm tra API và DB. Kiểm tra phạm vi UI riêng. |
| FR-18 | UC-16 · Class | orders.ts + payments.ts | INT-04 kiểm tra API và DB. Kiểm tra phạm vi UI riêng. |
| FR-19 | SRS · Won’t | Thanh toán thật ngoài phạm vi | Sandbox được kiểm bằng INT-01. |
| FR-20 | SRS · Won’t | Native app ngoài phạm vi | Web/PWA |
| FR-21 | SRS · Won’t | Giao vận ngoài phạm vi | Nhận tại quầy |
| NFR-01 | Kiến trúc/Deployment | GET /products dưới 500 ms với tối thiểu 20 món | Đo API warm. |
| NFR-02 | Sequence | POST /orders và POST /payments dưới 1000 ms | Đo từng giao dịch API trong môi trường test. |
| NFR-03 | Kiến trúc | next.config.ts và app/menu | Lighthouse mobile 4G. FCP ≤ 1,8 s, LCP ≤ 2,5 s. |
| NFR-04 | ADR-0002/Sequence | auth.ts JWT và guard | INT-02 |
| NFR-05 | Class User | auth.ts bcrypt | Rà soát hệ số bcrypt và kiểm tra DB lưu hash. |
| NFR-06 | Kiến trúc | http.ts + dto.ts + Prisma | Rà soát validation, truy vấn tham số hóa và render React. |
| NFR-07 | Deployment | GitHub Environment production + endpoint Lightsail HTTPS | Kiểm tra cấu hình thật và log đã che bí mật. |
| NFR-08 | Sequence | orders.ts + payments.ts + Prisma | INT-01, INT-03 |
| NFR-09 | Activity/Sequence | app/checkout + lib/store.tsx | INT-03, E2E-02 |
| NFR-10 | Kiến trúc | app/manifest.ts + app/globals.css | E2E-01 viewport mobile. Kiểm tra cài PWA thủ công. |
| NFR-11 | Activity | app/menu + app/error.tsx + components/ui.tsx | Kiểm tra loading, empty và error thủ công cho từng màn hình. |
| NFR-12 | Deployment | docker-compose.yml + ci.yml + release.yml | CI xác minh migration và browser. Cần required checks và diễn tập rollback < 5 phút. |

## Bài kiểm thử trong repo

- INT-01 `VNPay signs checkout and settles only via a valid IPN, once per attempt`
- INT-02 `health, catalog, register/login and JWT authorization use Prisma`
- INT-03 `checkout, failed payment, retry and duplicate idempotency preserve stock and order state`
- INT-04 `coupon, points ledger and ingredient recipes are persisted transactionally`

Chạy INT-01 đến INT-04 với `npm run build:api` rồi `npm run test:integration`. Nguồn ở [prisma.integration.test.cjs](../apps/api/test/prisma.integration.test.cjs).

- E2E-01 `mobile checkout confirms the order and shows it in history`
- E2E-02 `failed payment preserves the cart and retries the same order`

Chạy E2E-01 và E2E-02 với `npm run test:e2e` trên Docker Compose test ở chế độ mock. Nguồn ở [checkout.spec.ts](../apps/web/tests/checkout.spec.ts).
