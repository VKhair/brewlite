# MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENTS TRACEABILITY MATRIX)

> **Dự án:** BrewLite - Nền tảng đặt đồ uống trực tuyến Mobile-First (Assignment 2)  
> **Phạm vi:** Liên kết Yêu cầu nghiệp vụ (SRS) với Thiết kế mô hình, Mã nguồn triển khai và Ca kiểm thử

---

## 1. Bảng truy vết Yêu cầu Chức năng (Functional Requirements - FR)

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
|---|---|---|---|---|
| **FR-01** | US-01 / UC-01: Xem danh mục đồ uống | Activity-01, Class-01, UseCase-Overall | `GET /products`<br>`apps/web/src/app/menu` | `API-T01: test_get_products`<br>`UI-T01: test_menu_render` |
| **FR-02** | US-02 / UC-03: Xem thông tin chi tiết đồ uống | Activity-01, Class-01, UseCase-Overall | `GET /products/:id`<br>`apps/web/src/app/products/[id]` | `API-T02: test_get_product_detail`<br>`UI-T02: test_detail_modal` |
| **FR-03** | US-03 / UC-04: Tùy biến Size và Topping | Activity-01, Class-01 (Product, OrderItem), UseCase-Overall | `apps/web/src/components/ProductOptions` | `UNIT-T01: test_calc_item_price` |
| **FR-04** | US-04 / UC-06: Quản lý giỏ hàng & tính tổng tiền | Activity-01, Class-01, UseCase-Overall | `apps/web/src/hooks/useCart`<br>`apps/web/src/app/cart` | `UNIT-T02: test_cart_total_calc`<br>`UI-T03: test_cart_item_update` |
| **FR-05** | US-05 / UC-08: Đăng ký tài khoản người dùng | Class-01 (User), UseCase-Overall | `POST /auth/register`<br>`apps/web/src/app/register` | `API-T03: test_auth_register`<br>`INT-T01: test_register_duplicate` |
| **FR-06** | US-06 / UC-09: Đăng nhập và xác thực JWT | Sequence-01, Class-01 (User), UseCase-Overall | `POST /auth/login`<br>`apps/web/src/app/login` | `API-T04: test_auth_jwt_login`<br>`UNIT-T03: test_jwt_guard` |
| **FR-07** | US-07 / UC-11: Tạo đơn hàng (Checkout) & kiểm soát tồn kho | Activity-01, Sequence-01, Class-01 (Order, OrderItem), UseCase-Overall | `POST /orders`<br>`apps/web/src/app/checkout` | `INT-T02: test_create_order_tx`<br>`E2E-T01: test_checkout_flow` |
| **FR-08** | US-08 / UC-13: Thực hiện thanh toán mô phỏng thành công | Activity-01, Sequence-01, Class-01 (Payment, Order), UseCase-Overall | `POST /payments`<br>`apps/api/src/modules/payments` | `INT-T03: test_mock_payment_success`<br>`E2E-T01: test_checkout_flow` |
| **FR-09** | US-09 / UC-17: Xử lý thanh toán thất bại & bảo toàn giỏ hàng | Activity-01, Sequence-01, UseCase-Overall | `POST /payments`<br>`apps/web/src/app/payment/failed` | `INT-T04: test_mock_payment_failed`<br>`UI-T04: test_cart_preserved_on_fail` |
| **FR-10** | US-10 / UC-18: Xem xác nhận đơn hàng và mã tra cứu | Activity-01, Sequence-01, Class-01 (Order), UseCase-Overall | `apps/web/src/app/orders/success` | `UI-T05: test_order_confirmation` |
| **FR-11** | US-11 / UC-21: Xem danh sách lịch sử đơn hàng cá nhân | Class-01 (Order, User), UseCase-Overall | `GET /orders/me`<br>`apps/web/src/app/orders` | `API-T05: test_get_my_orders`<br>`UI-T06: test_order_history_list` |
| **FR-12** | US-12 / UC-19: Theo dõi trạng thái vòng đời đơn hàng (FSM) | Sequence-01, Class-01 (Order), UseCase-Overall | `GET /orders/:id`<br>`apps/web/src/app/orders/[id]` | `API-T06: test_order_lifecycle_fsm`<br>`UI-T07: test_order_status_stepper` |
| **FR-13** | US-13 / UC-25: Kiểm tra sức khỏe hệ thống (Health Check) | Deployment-01, UseCase-Overall | `GET /health` | `API-T07: test_health_endpoint`<br>`SMOKE-T01: test_prod_health` |
| **FR-14** | US-14 / UC-02: Tìm kiếm và lọc sản phẩm theo danh mục | Activity-01, Class-01, UseCase-Overall | `GET /products?search=&category=`<br>`apps/web/src/app/menu` | `UI-T08: test_search_and_filter` |
| **FR-15** | US-15 / UC-20: Hủy đơn hàng ở trạng thái chờ thanh toán (PENDING) | Class-01 (Order), UseCase-Overall | `PATCH /orders/:id/cancel` | `API-T08: test_cancel_pending_order` |
| **FR-16** | US-16 / UC-06: Lưu giỏ hàng tạm thời vào Local Storage | Class-01, UseCase-Overall | `apps/web/src/utils/cartStorage` | `UNIT-T04: test_local_storage_sync` |
| **FR-17** | US-17 / UC-15: Áp dụng mã khuyến mãi giảm giá (Promotion) | Class-01 (Promotion, Order), UseCase-Overall | `POST /promotions/validate` | `UNIT-T05: test_promotion_discount` |
| **FR-18** | US-18 / UC-16: Tích lũy và sử dụng điểm thưởng thành viên | Class-01 (LoyaltyTransaction, User), UseCase-Overall | `apps/api/src/modules/loyalty` | `UNIT-T06: test_loyalty_accrual` |

---

## 2. Bảng truy vết Yêu cầu Phi Chức Năng (Non-Functional Requirements - NFR)

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
|---|---|---|---|---|
| **NFR-01** | Hiệu năng đọc danh mục (p95 <= 300ms) | Architecture-01, Deployment-01 | `GET /products` (NestJS Cache/Query) | `PERF-T01: k6_read_products_p95` |
| **NFR-02** | Hiệu năng ghi tạo đơn & thanh toán (p95 <= 800ms) | Architecture-01, Deployment-01 | `POST /orders`, `POST /payments/process` | `PERF-T02: k6_checkout_write_p95` |
| **NFR-03** | Core Web Vitals (FCP <= 1.5s, LCP <= 2.5s, JS <= 250KB) | Architecture-01 (Next.js SSR/PWA) | `apps/web/next.config.js` | `PERF-T03: lighthouse_audit_ci` |
| **NFR-04** | Xác thực phân quyền người dùng qua JWT | Architecture-01, Sequence-01 | `apps/api/src/modules/auth/jwt.strategy` | `SEC-T01: test_jwt_auth_guard` |
| **NFR-05** | Băm mật khẩu người dùng với bcrypt salt >= 10 | Class-01 (User) | `apps/api/src/modules/users/user.service` | `SEC-T02: test_bcrypt_hashing` |
| **NFR-06** | Ngăn ngừa SQL Injection và XSS | Architecture-01 | `NestJS ValidationPipe (whitelist: true)` | `SEC-T03: test_injection_prevention` |
| **NFR-07** | Mã hóa HTTPS và Quản lý biến môi trường .env | Deployment-01, ADR-002 | `.env.example`, Docker production config | `SEC-T04: gitleaks_secret_scan` |
| **NFR-08** | Giao dịch ACID và Idempotency key chống trừ tiền lặp | Sequence-01 (Transaction & Idempotency) | `apps/api/src/common/idempotency.guard` | `REL-T01: test_duplicate_payment_key` |
| **NFR-09** | Khả năng bảo toàn giỏ hàng khi thanh toán thất bại | Activity-01, Sequence-01 | `apps/web/src/hooks/useCart` | `REL-T02: test_cart_state_rollback` |
| **NFR-10** | Mobile-First Responsive và hỗ trợ PWA | Architecture-01 (Web PWA) | `apps/web/public/manifest.json` | `USA-T01: test_pwa_manifest_valid` |
| **NFR-11** | Đầy đủ 3 trạng thái giao diện: Loading, Empty, Error | Activity-01 | `apps/web/src/components/feedback/*` | `USA-T02: test_ui_states_render` |
| **NFR-12** | Đóng gói Docker, Automated CI PR Gate và Rollback | Architecture-01, Deployment-01 | `docker-compose.yml`, `.github/workflows/ci.yml` | `OPS-T01: ci_pipeline_automated_pass`<br>`OPS-T02: test_rollback_drill` |
