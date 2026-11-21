# Ma trận truy vết BrewLite

Mã FR/NFR khớp [SRS](requirements/srs.md). Bảng ghi nguồn triển khai và ca tự động thực sự có trong repository. Những hành vi chỉ đối chiếu từ mã hoặc cần kiểm tra thủ công được ghi rõ.

Trong cột Thiết kế, FSM là [sơ đồ trạng thái đơn](architecture/architecture.md#5-luồng-đặt-món-và-thanh-toán). Kiến trúc web/API và các ADR mô tả ranh giới dịch vụ. Các mã sơ đồ còn lại liên kết ở cuối trang. Issue và chủ module dùng [Product Backlog](backlog.md).

## Bài kiểm thử hiện có

| Ký hiệu | Bài kiểm thử |
| --- | --- |
| INT-01 | Health, catalog, register/login and JWT authorization use Prisma. Đăng ký nằm ở phần chuẩn bị chung của suite. |
| INT-02 | Mock failure restores ingredients and a successful retry deducts once. |
| INT-03 | Coupon, points ledger and ingredient recipes are persisted transactionally. |
| INT-04 | VNPay signs checkout and settles only via a valid IPN, once per attempt. |
| INT-05 | Checkout cộng định lượng theo size và topping, kể cả khi tồn vừa đủ. |
| INT-06 | Thiếu công thức hoặc nguyên liệu không để lại giao dịch hay biến động kho dở dang. |
| INT-07 | Hai khách thanh toán đồng thời khi nguyên liệu chỉ đủ cho một đơn. |
| INT-08 | Migration chuyển lượng giữ sang lần thanh toán VNPay và hoàn lượng của đơn chưa thanh toán. |
| UNIT-01 | AppController, gồm phản hồi gốc và readiness DB. |
| UNIT-02 | OrderInventoryService, gồm gom định lượng và từ chối size hoặc topping thiếu công thức. |
| E2E-01 | GET / qua Supertest với PrismaService mock. |

Các bài INT ở [prisma.integration.test.cjs](../apps/api/test/prisma.integration.test.cjs). Xem thêm [unit controller](../apps/api/src/app.controller.spec.ts), [unit kho](../apps/api/src/inventory/order-inventory.service.spec.ts) và [API e2e](../apps/api/test/app.e2e-spec.ts).

E2E trình duyệt menu → xác nhận thuộc S2-M02 trong backlog. Khi có kết quả chạy, gắn minh chứng vào FR-01, FR-03–08 và FR-10 theo những bước mà test thực sự thực hiện.

## Yêu cầu chức năng

| Mã | Use case hoặc User Story | Thiết kế | Code/API | Test và minh chứng |
| --- | --- | --- | --- | --- |
| FR-01 | Khách xem thực đơn | UC tổng, Activity | [ProductsController](../apps/api/src/products/products.controller.ts), [MenuProducts](../apps/web/src/features/products/menu-products.tsx) | INT-01 kiểm tra API danh sách. |
| FR-02 | Khách xem chi tiết món | UC tổng, Class | [GET /products/:id](../apps/api/src/products/products.controller.ts), [trang sản phẩm](../apps/web/src/app/product) | INT-01 kiểm tra danh sách size. |
| FR-03 | Khách chọn size/topping | UC tổng, Activity, Class | [Trang sản phẩm](../apps/web/src/app/product), [snapshot](../apps/api/src/orders/orders.service.ts) | INT-02 kiểm tra đơn giá size mặc định. UI và tổ hợp topping cần kiểm tra riêng. |
| FR-04 | Khách thêm và sửa giỏ | UC checkout, Activity | [Cart](../apps/web/src/app/cart), [store](../apps/web/src/app/app-providers.tsx) | Kiểm tra thủ công. |
| FR-05 | Khách đăng ký | UC tổng, Class | [Đăng ký API](../apps/api/src/auth/auth.controller.ts), [form đăng ký](../apps/web/src/app/register) | INT-01 dùng tài khoản đăng ký trong setup. |
| FR-06 | Khách đăng nhập để đặt | UC checkout, Activity, Sequence | [Auth và JWT](../apps/api/src/auth/auth.service.ts), [login](../apps/web/src/app/login) | INT-01 kiểm tra login và request thiếu JWT. |
| FR-07 | Khách tạo đơn từ giỏ | UC checkout, Activity, Sequence, Class | [Tạo đơn](../apps/api/src/orders/orders.service.ts) | INT-02 và INT-03. |
| FR-08 | Khách thanh toán | UC checkout, Sequence, Class | [PaymentsService](../apps/api/src/payments/payments.service.ts), [VNPay](../apps/api/src/payments/providers/vnpay.provider.ts) | INT-02 cho mock, INT-04 cho VNPay, INT-05–07 cho kiểm tra nguyên liệu lúc thanh toán. |
| FR-09 | Khách thử lại khi thanh toán lỗi | UC checkout, Activity, Sequence | [Thanh toán](../apps/api/src/payments/payments.service.ts), [checkout](../apps/web/src/app/checkout) | INT-02 và INT-04 kiểm tra trạng thái và retry. Giỏ web cần kiểm tra thủ công. |
| FR-10 | Khách đọc kết quả và mã đơn | UC checkout, Sequence | [Trang kết quả](../apps/web/src/app/success) | INT-04 kiểm tra URL redirect và trạng thái đơn. Phần hiển thị cần kiểm tra thủ công. |
| FR-11 | Khách xem lịch sử | UC tổng, Class | [GET /orders/me](../apps/api/src/orders/orders.controller.ts), [trang lịch sử](../apps/web/src/app/orders) | INT-01 kiểm tra truy cập. [Smoke script](../apps/api/scripts/smoke-commerce.cjs) kiểm tra đơn mới có trong danh sách. |
| FR-12 | Khách theo dõi, nhân viên cập nhật | UC tổng, FSM | [Chi tiết và cập nhật](../apps/api/src/orders/orders.service.ts), [FSM](../apps/api/src/orders/order-state.ts) | INT-02 và INT-04 kiểm tra các trạng thái thanh toán. Chuyển pha chế cần kiểm tra riêng. |
| FR-13 | Vận hành kiểm tra hệ thống | Deployment | [GET /health](../apps/api/src/app.controller.ts) | UNIT-01 và INT-01. |
| FR-14 | Khách tìm và lọc thức uống | UC tổng | [Tìm và lọc menu](../apps/web/src/features/products/menu-products.tsx) | Kiểm tra thủ công. |
| FR-15 | Khách hủy đơn chưa thanh toán | UC checkout, FSM | [Hủy đơn](../apps/api/src/orders/orders.service.ts) | INT-04 kiểm tra từ chối khi VNPay còn PENDING. Hủy thành công cần kiểm tra riêng. |
| FR-16 | Khách mở lại giỏ trên thiết bị | UC tổng, kiến trúc web | [Store và localStorage](../apps/web/src/app/app-providers.tsx) | Kiểm tra thủ công. |
| FR-17 | Khách áp coupon qua API | UC tổng, Class | [CouponsService](../apps/api/src/coupons/coupons.service.ts), [POST /orders](../apps/api/src/orders/orders.controller.ts) | INT-03 kiểm tra mức giảm ghi vào đơn. |
| FR-18 | Khách tích và đổi điểm qua API | UC tổng, Class | [Sổ điểm](../apps/api/src/orders/order-loyalty.service.ts), [schema](../apps/api/prisma/schema.prisma) | INT-03 kiểm tra đổi điểm, INT-04 kiểm tra chỉ cộng một lần. Hoàn điểm cần kiểm tra riêng. |
| FR-19 | Quản trị viên cấu hình kho | UC tổng, Class | [Kho](../apps/api/src/inventory/inventory.controller.ts), [OrderInventoryService](../apps/api/src/inventory/order-inventory.service.ts) | INT-03 kiểm tra cấm CUSTOMER, tạo nguyên liệu, cấu hình công thức và giữ nguyên kho khi hủy đơn chưa thanh toán. UNIT-02 kiểm tra tổng định lượng. |

## Yêu cầu phi chức năng

| Mã | Use case hoặc User Story | Thiết kế | Code/API | Test và minh chứng |
| --- | --- | --- | --- | --- |
| NFR-01 | Khách tải menu nhanh | Kiến trúc API | [Đọc danh mục](../apps/api/src/products/products.service.ts) | INT-01 kiểm tra chức năng. Chưa có benchmark. |
| NFR-02 | Khách nhận phản hồi checkout kịp thời | Sequence | [Tạo đơn](../apps/api/src/orders/orders.service.ts), [thanh toán](../apps/api/src/payments/payments.service.ts) | INT-02 và INT-04 kiểm tra chức năng. Chưa có benchmark. |
| NFR-03 | Khách tải web trên di động | Kiến trúc web | [Next config](../apps/web/next.config.ts), [CSS](../apps/web/src/app/globals.css) | Chưa có phép đo Lighthouse trong repository. |
| NFR-04 | Người dùng chỉ thao tác trong quyền | UC tổng, Sequence | [JwtGuard](../apps/api/src/auth/jwt.guard.ts), [AdminGuard](../apps/api/src/auth/admin.guard.ts) | INT-01 và INT-03. |
| NFR-05 | Người dùng được bảo vệ mật khẩu | Class, ADR JWT | [bcrypt](../apps/api/src/auth/auth.service.ts) | INT-01 đi qua đăng ký và login. Cost 12 đối chiếu từ mã. |
| NFR-06 | API từ chối dữ liệu sai | Kiến trúc API, Sequence | [Parser](../apps/api/src/common/http/configure-http.ts), [validation](../apps/api/src/common/validation/validation.pipe.ts), [truy vấn](../apps/api/src/orders/orders.service.ts) | Kiểm tra từ mã. Chưa có suite riêng cho parser và truy vấn. |
| NFR-07 | Vận hành bảo vệ đường truyền và cấu hình | Deployment | [.env mẫu](../.env.example), [Compose local](../docker-compose.yml), [Lightsail](deployment.md#aws-lightsail) | HTTPS công khai trả `200`, HTTP chuyển hướng `308`. Docker chỉ publish cổng của Caddy trong stack. |
| NFR-08 | Khách gửi lại mà giao dịch vẫn nhất quán | Sequence, Class | [Đơn](../apps/api/src/orders/orders.service.ts), [thanh toán](../apps/api/src/payments/payments.service.ts), [migration](../apps/api/prisma/migrations) | INT-02, INT-03, INT-04, gồm IPN lặp đồng thời trong INT-04. |
| NFR-09 | Khách giữ giỏ sau lỗi và hệ thống hoàn tồn | Activity, Sequence, Class | [Kho](../apps/api/src/inventory/order-inventory.service.ts), [checkout](../apps/web/src/app/checkout) | INT-02 và INT-04 kiểm tra luồng lỗi. Chưa có test tự động cho giỏ hay retry với nguyên liệu. |
| NFR-10 | Khách dùng web trên điện thoại | Kiến trúc web | [Manifest](../apps/web/src/app/manifest.ts), [CSS](../apps/web/src/app/globals.css) | Kiểm tra thủ công trên thiết bị. |
| NFR-11 | Khách thấy trạng thái tải, rỗng và lỗi | Activity, kiến trúc web | [UI menu](../apps/web/src/features/products/menu-products.tsx), [checkout](../apps/web/src/app/checkout) | Kiểm tra thủ công. |
| NFR-12 | Vận hành phát hành và kiểm tra hệ thống | Deployment | [Compose](../docker-compose.yml), [CI](../.github/workflows/ci.yml), [hướng dẫn chạy](deployment.md) | UNIT-01, INT-01 và E2E-01 kiểm tra API. Kiểm tra Lightsail xác nhận container đang chạy và health công khai trả `200`. Chưa có workflow CD hoặc thử rollback. |

## Sơ đồ

[Use case tổng](diagrams/use-case-overall.puml) bao quát khách hàng và vận hành. [Use case checkout](diagrams/BrewLite_DatVaThanhToan.puml), [activity](diagrams/Activity_Dia.puml) và [sequence](diagrams/sequence-checkout.puml) liên quan FR-07 đến FR-10 và FR-15. [Mô hình dữ liệu](diagrams/ClassDiagram_BrewLite.puml) và [triển khai Lightsail](diagrams/deploymentDiagram.puml) mô tả các yêu cầu dữ liệu và vận hành.
