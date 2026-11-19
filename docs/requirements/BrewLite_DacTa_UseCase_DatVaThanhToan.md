# Use case đặt và thanh toán đơn BrewLite

## Tác nhân, kích hoạt và điều kiện

- **Tác nhân chính:** Khách hàng. VNPay Sandbox là tác nhân hỗ trợ khi bật chế độ Sandbox.
- **Kích hoạt:** Khách chọn thanh toán từ giỏ có ít nhất một món.
- **Tiền điều kiện:** Web kết nối được API, PostgreSQL có dữ liệu menu, và khách có phiên hợp lệ trước khi gửi đơn. VNPay cần cấu hình Sandbox và Return/IPN truy cập được. Xem [hướng dẫn chạy](../deployment.md).
- **Hậu điều kiện:** Khi thành công, đơn ở PAID, giao dịch ở SUCCESS và khách thấy xác nhận. Nếu dữ liệu hoặc tồn không hợp lệ, transaction tạo đơn rollback. Nếu thanh toán thất bại sau tạo đơn, lịch sử ghi PAYMENT_FAILED, tồn đã giữ được hoàn và giỏ được giữ. Khi VNPay chưa xác nhận, đơn ở PENDING.
- **Mã yêu cầu:** FR-03/04 cho tùy chọn và giỏ, FR-06 cho xác thực, FR-07–10 cho tạo đơn và thanh toán, FR-12/15 cho tiến độ và hủy. Xem [ma trận truy vết](../traceability-matrix.md).

## Luồng chính

1. Người dùng mở /checkout. Nếu chưa đăng nhập, web chuyển đến /login với đường dẫn quay lại checkout.
2. Web gọi POST /orders với items. Mỗi dòng có productId, sizeId nếu chọn, toppingIds và quantity. Backend lấy lại dữ liệu danh mục, tính giá, giữ tồn món và nguyên liệu, lưu snapshot và tạo đơn PENDING. API cũng hỗ trợ couponCode và pointsUsed khi gọi trực tiếp.
3. Web giữ UUID đơn trong trạng thái của trang và gọi POST /payments với orderId, paymentMethod và header Idempotency-Key dạng UUID v4. Ở chế độ mock, web gửi thêm mockOutcome.
4. Với mock thành công, API ghi Payment SUCCESS, chuyển đơn sang PAID, ghi lịch sử và cộng điểm. Web xóa giỏ và mở /success/[id].
5. Với VNPay, API lưu Payment PENDING và trả checkoutUrl ký HMAC-SHA512 có hạn 15 phút. Web chuyển trình duyệt sang Sandbox. Return URL đã xác minh đưa trình duyệt về /success/[id]. IPN hợp lệ cập nhật thanh toán, trạng thái đơn và điểm trong transaction.
6. Trang kết quả đọc GET /orders/:id bằng JWT. Khi còn PENDING, trang hỏi lại khoảng hai giây một lần tối đa 30 giây. Khách có thể làm mới thủ công hoặc mở chi tiết đơn để theo dõi tiến độ và nhận món tại quầy.

## Luồng thay thế và lỗi

| Tình huống | Hành vi |
| --- | --- |
| Món hoặc tùy chọn không hợp lệ, thiếu tồn hoặc thiếu nguyên liệu | API từ chối tạo đơn và rollback thay đổi dữ liệu. Web báo lỗi và giữ giỏ. |
| Mock hoặc IPN xác nhận thất bại | Đơn thành PAYMENT_FAILED, thanh toán thành FAILED. API hoàn tồn món và nguyên liệu. Điểm đã đổi gắn với đơn để thử lại. Web giữ giỏ. |
| Thử thanh toán lại | Web dùng khóa mới cho lần thử mới. Nếu đơn PAYMENT_FAILED, API kiểm tra lại tùy chọn, giữ tồn và chuyển về PENDING. Ràng buộc sổ kho có thể chặn retry khi nguyên liệu đã có CONSUMPTION. |
| Gửi lại request | API tìm khóa theo người dùng. Payload trùng trả kết quả đã ghi, payload khác trả 409. Mock mặc định có trường hợp xung đột khi bỏ mockOutcome. |
| VNPay Return không xác minh được | Trình duyệt được chuyển đến /orders?payment=unverified. Return không thay đổi dữ liệu thanh toán. |
| IPN không hợp lệ hoặc đã xử lý | API trả mã giao thức và giữ dữ liệu hiện có. Với mã trạng thái chưa được hỗ trợ, API trả RspCode 99. |
| Link VNPay hết hạn | Lần thử vẫn PENDING. API trả phản hồi không kèm checkoutUrl và tiếp tục chờ IPN. |
| Khách hủy | Chủ đơn có thể hủy PENDING khi không có thanh toán VNPay PENDING. API hoàn tồn, nguyên liệu và điểm đã dùng. |

## Tiêu chí đối chiếu

- Số tiền thanh toán lấy từ đơn đã lưu. Đơn có tối đa một lần thanh toán SUCCESS.
- Snapshot vẫn giữ giá, size và topping đã chốt nếu menu thay đổi.
- Thất bại, retry, nhận IPN và hủy phải tuân thủ [sơ đồ trạng thái trong kiến trúc](../architecture/architecture.md#5-luồng-đặt-món-và-thanh-toán).
- Route chi tiết đơn dùng UUID. Mã BL-… dùng để hiển thị.

Xem [use case PlantUML](../diagrams/BrewLite_DatVaThanhToan.puml), [activity](../diagrams/Activity_Dia.puml), [sequence](../diagrams/sequence-checkout.puml), [SRS](srs.md) và [kiểm thử tích hợp API](../../apps/api/test/prisma.integration.test.cjs).
