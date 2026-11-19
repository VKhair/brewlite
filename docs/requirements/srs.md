# Đặc tả yêu cầu phần mềm BrewLite

Tài liệu mô tả hành vi của phiên bản hiện tại và giữ các mã FR/NFR để nối với [ma trận truy vết](../traceability-matrix.md). Các tiêu chí hiệu năng và vận hành chưa có phép đo được ghi là mục tiêu. Xem [kiến trúc](../architecture/architecture.md) và [bối cảnh](context-and-scope.md).

## Ưu tiên MoSCoW

- **Must** là điều kiện nghiệm thu MVP. Luồng ví/thẻ mock thuộc Must trong FR-08.
- **Should** là hạng mục cần khi còn đủ năng lực trong Sprint. VNPay Sandbox là phần mở rộng của FR-08 và được kiểm tra riêng với mock.
- **Could** là phần mở rộng về coupon, điểm và kho có thể demo qua API.
- **Won’t** trong đợt bàn giao này gồm giao hàng, thanh toán tiền thật và đặt hàng offline. Xem [phạm vi](context-and-scope.md#phạm-vi-mở-rộng-và-ngoài-phạm-vi).

## Yêu cầu chức năng

| Mã | Ưu tiên | Yêu cầu | Hành vi và tiêu chí kiểm tra |
| --- | --- | --- | --- |
| FR-01 | Must | Duyệt thực đơn | GET /products trả món có isAvailable. Trang chủ và /menu đọc cùng endpoint và hiển thị giá gốc, ảnh và danh mục. |
| FR-02 | Must | Chi tiết món | /product/[id] dùng GET /products/:id với UUID. API trả size, chênh lệch giá và topping được gắn với món. Món không tồn tại hoặc ngừng bán trả 404. |
| FR-03 | Must | Tùy chọn món | Người dùng chọn size, topping khả dụng và số lượng. Giá dòng hàng bằng tổng giá gốc, chênh lệch size và giá topping nhân số lượng. API xác thực lại lựa chọn khi tạo đơn. |
| FR-04 | Must | Giỏ hàng | Thêm, gộp dòng theo tùy chọn, chỉnh số lượng, xóa và xem tổng tạm tính. Số lượng mỗi dòng ở web từ 1 đến 99. |
| FR-05 | Must | Đăng ký | POST /auth/register chuẩn hóa email, kiểm tra họ tên và mật khẩu, chấp nhận số điện thoại Việt Nam theo mẫu DTO nếu có. Mật khẩu từ 6 đến 72 ký tự, tối đa 72 byte UTF-8, có chữ và số. Email trùng trả 409. Đăng ký thành công trả phiên CUSTOMER. |
| FR-06 | Must | Đăng nhập | POST /auth/login trả access token và hồ sơ rút gọn. Thông tin đăng nhập sai hoặc token không hợp lệ trả 401. Web lưu phiên và xóa phiên cục bộ khi đăng xuất. |
| FR-07 | Must | Tạo đơn và giữ tồn | POST /orders nhận 1–50 dòng, mỗi dòng có UUID món và số lượng 1–99, size tùy chọn và tối đa 20 topping duy nhất. API tính lại giá, kiểm tra tồn món và nguyên liệu rồi tạo đơn PENDING, snapshot và lịch sử trong cùng transaction. Thiếu tồn làm rollback. |
| FR-08 | Must | Thanh toán | POST /payments yêu cầu JWT của chủ đơn và Idempotency-Key UUID v4. Mock hỗ trợ EWALLET và CARD. VNPay trả URL Sandbox có chữ ký và dùng IPN để chốt. Một đơn có tối đa một thanh toán SUCCESS. |
| FR-09 | Must | Thanh toán lỗi | Khi nhận kết quả thất bại được hỗ trợ, đơn sang PAYMENT_FAILED và hoàn tồn đã trừ. Web giữ giỏ. Người dùng có thể thử lại với khóa mới, API kiểm tra và giữ tồn lại. Xem các giới hạn ở phần dưới. |
| FR-10 | Must | Xác nhận và mã đơn | /success/[id] tải trạng thái bằng UUID đơn và hiển thị phần cuối mã BL-…. Khi PENDING, trang hỏi lại khoảng mỗi 2 giây trong tối đa 30 giây. Web xóa giỏ khi đơn đã thanh toán. |
| FR-11 | Must | Danh sách đơn cá nhân | GET /orders/me trả đơn của người dùng trong token, sắp xếp mới trước. /orders hiển thị danh sách đó. |
| FR-12 | Must | Theo dõi và cập nhật | GET /orders/:id trả snapshot, lịch sử và các lần thanh toán cho chủ đơn. STAFF và ADMIN dùng PATCH /orders/:id/status để chuyển lần lượt PAID → PREPARING → READY → COMPLETED. Chuyển sai trả 409. |
| FR-13 | Must | Health | GET /health chạy SELECT 1, trả status và database cùng giá trị ok khi sẵn sàng, hoặc HTTP 503 khi DB lỗi. |
| FR-14 | Should | Tìm và lọc | Web tải danh sách rồi lọc theo danh mục và tìm không phân biệt hoa thường theo tên hoặc danh mục trong trình duyệt. |
| FR-15 | Should | Hủy đơn | Chủ đơn dùng PATCH /orders/:id/cancel khi đơn PENDING và không có lần thử VNPay PENDING. API hoàn tồn món, hoàn nguyên liệu và hoàn điểm đã dùng trong transaction. |
| FR-16 | Should | Lưu giỏ | React Context khôi phục và lưu giỏ theo khóa brewlite-cart trong localStorage của trình duyệt. |
| FR-17 | Could | Coupon | GET /coupons liệt kê mã đang bật. GET /coupons/validate nhận code và amount. POST /orders tính lại mức giảm từ couponCode, có mức đơn tối thiểu và trần giảm nếu được cấu hình. |
| FR-18 | Could | Điểm thưởng | POST /orders nhận pointsUsed, trừ sau coupon ở mức 1.000 VND mỗi điểm, giới hạn bởi số dư và số tiền còn lại. Đơn thanh toán thành công cộng một điểm cho mỗi 10.000 VND trọn vẹn. Hủy hợp lệ hoàn điểm. |
| FR-19 | Could | Kho và công thức | ADMIN dùng /inventory để tạo và sửa nguyên liệu, nhập và điều chỉnh tồn, xem biến động gần đây và quản lý công thức món theo size hoặc topping. Dữ liệu nguyên liệu dùng số thập phân đến ba chữ số. |

FR-17 và FR-18 có hợp đồng API. Giao diện checkout hiện chỉ gửi các dòng hàng. FR-12 ở phía nhân viên và FR-19 thực hiện qua API. Các trường và giới hạn đầu vào được định nghĩa tại [DTO nghiệp vụ](../../apps/api/src/dto.ts) và [DTO kho](../../apps/api/src/inventory/inventory.dto.ts).

## Yêu cầu phi chức năng

| Mã | Ưu tiên | Yêu cầu | Tiêu chí chấp nhận và hiện trạng |
| --- | --- | --- | --- |
| NFR-01 | Should | Tốc độ đọc thực đơn | Mục tiêu đặc tả là dưới 500 ms cho `GET /products` khi API đã sẵn sàng. Repository chưa có benchmark hoặc số đo xác nhận. |
| NFR-02 | Should | Tốc độ tạo đơn và thanh toán | Mục tiêu đặc tả là dưới 1.000 ms cho mỗi request nghiệp vụ thông thường. Đo `POST /orders` và `POST /payments` riêng với thời gian chờ callback. Repository chưa có benchmark xác nhận. |
| NFR-03 | Should | Hiệu năng web di động | Mục tiêu đặc tả là FCP ≤ 1,8 giây và LCP ≤ 2,5 giây. Cần đo trên bản build với thiết bị và điều kiện mạng xác định. |
| NFR-04 | Must | Xác thực và phân quyền | Gọi route bảo vệ thiếu JWT hoặc token hết hạn phải trả 401. Gọi route kho bằng vai trò CUSTOMER trả 403. Kiểm tra quyền chủ sở hữu trên đơn. JWT HS256 có issuer, audience và hạn mặc định 1 ngày. |
| NFR-05 | Must | Bảo vệ mật khẩu lưu trữ | Sau đăng ký, bản ghi người dùng chỉ chứa passwordHash nhận diện bcrypt cost 12. Đăng nhập chấp nhận mật khẩu đúng và từ chối mật khẩu sai. |
| NFR-06 | Must | Xác thực input và truy vấn an toàn | Body vượt 64 KB trả 413. Trường ngoài DTO ở route JSON áp dụng validation trả 400. Review truy vấn dùng Prisma hoặc raw query dạng tagged template. |
| NFR-07 | Must | Cấu hình và đường truyền | Secret và thông tin kết nối truyền qua biến môi trường. Compose cục bộ publish vào loopback. Trên Lightsail, Caddy phục vụ HTTPS và nhận callback công khai. PostgreSQL của stack chỉ kết nối trong mạng Compose. |
| NFR-08 | Must | Nhất quán giao dịch | Recheck hai request giữ tồn khi chỉ còn một suất, một request phải thất bại và tồn không âm. Gửi lặp thanh toán cùng key và payload mô phỏng tường minh chỉ có một kết quả được ghi. IPN lặp không cộng điểm hai lần. |
| NFR-09 | Must | Giữ giỏ và hoàn tồn | Giữ giỏ khi thanh toán lỗi, hoàn tồn sau thất bại đã xác nhận. Retry với nguyên liệu đã ghi CONSUMPTION có thể gặp ràng buộc duy nhất. |
| NFR-10 | Must | Trải nghiệm di động và PWA | Mở menu và checkout ở viewport 360 px và desktop, các nút chính thao tác được, bố cục không tràn ngang và trình duyệt đọc được manifest. Luồng nghiệp vụ phụ thuộc API. |
| NFR-11 | Must | Phản hồi UI | Giả lập API chậm, trả danh sách trống và lỗi riêng để quan sát loading, empty, lỗi và thử lại. Checkout và lịch sử hiển thị trạng thái tải hoặc lỗi tương ứng. |
| NFR-12 | Must | Build, kiểm tra và vận hành | Có Dockerfiles, Compose, healthcheck và CI install/generate/lint/test/build. Stack Lightsail và health công khai đã được xác minh. Mục tiêu tự động triển khai và rollback dưới 5 phút chưa có workflow hoặc bằng chứng đo trong repository. |

## Giới hạn cần tính đến khi nghiệm thu

- VNPay Sandbox ghi nhận giao dịch qua IPN hợp lệ. Return URL chỉ điều hướng về web. Hết hạn URL không tự chuyển giao dịch PENDING sang FAILED.
- Tạo đơn và thanh toán là hai lời gọi riêng. Idempotency-Key chỉ áp dụng cho thanh toán, và mock replay có thể xung đột khi bỏ qua mockOutcome.
- Thử thanh toán lại một đơn đã có CONSUMPTION cho cùng nguyên liệu có thể rollback vì khóa duy nhất trong nhật ký kho. Phạm vi bài kiểm thử hiện có nằm trong [ma trận truy vết](../traceability-matrix.md).
