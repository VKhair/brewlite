# Use case đặt và thanh toán đơn BrewLite

## Tác nhân, kích hoạt và điều kiện

- **Tác nhân chính:** Khách hàng. VNPay Sandbox là tác nhân hỗ trợ khi bật chế độ Sandbox.
- **Kích hoạt:** Khách chọn thanh toán từ giỏ có ít nhất một món.
- **Tiền điều kiện:** Web kết nối được API, PostgreSQL có dữ liệu menu, và khách có phiên hợp lệ trước khi gửi đơn. VNPay cần cấu hình Sandbox và Return/IPN truy cập được. Xem [hướng dẫn chạy](../deployment.md).
- **Hậu điều kiện:** Khi thành công, đơn ở PAID, giao dịch ở SUCCESS và khách thấy xác nhận. Nếu dữ liệu đơn không hợp lệ, transaction tạo đơn rollback. Thiếu công thức hoặc tồn làm rollback transaction thanh toán. Nếu thanh toán thất bại sau tạo đơn, lịch sử ghi PAYMENT_FAILED, tồn đã giữ được hoàn và giỏ được giữ. Khi VNPay chưa xác nhận, đơn ở PENDING.
- **Mã yêu cầu:** FR-03/04 cho tùy chọn và giỏ, FR-06 cho xác thực, FR-07–10 cho tạo đơn và thanh toán, FR-12/15 cho tiến độ và hủy. Xem [ma trận truy vết](../traceability-matrix.md).

## Luồng chính

1. Người dùng mở /checkout. Nếu chưa đăng nhập, web chuyển đến /login với đường dẫn quay lại checkout.
2. Web gọi POST /orders với items. Mỗi dòng có productId, sizeId nếu chọn, toppingIds và quantity. Backend lấy lại dữ liệu danh mục, tính giá và lưu snapshot, đơn PENDING, lịch sử và điểm đã dùng trong một transaction. API cũng hỗ trợ couponCode và pointsUsed khi gọi trực tiếp.
3. Web gắn giỏ với UUID đơn và gọi POST /payments với orderId, paymentMethod và header Idempotency-Key dạng UUID v4. Ở chế độ mock, web gửi thêm mockOutcome. Trong transaction thanh toán, API kiểm tra chủ đơn, khóa và trạng thái, cộng định lượng công thức theo size, topping và số lượng, rồi trừ tồn có điều kiện. Biến động tiêu hao gắn với paymentId.
4. Với mock thành công, API ghi Payment SUCCESS, chuyển đơn sang PAID, ghi lịch sử và cộng điểm. Web chỉ xóa giỏ còn gắn với đơn này và mở /success/[id].
5. Với VNPay, API lưu Payment PENDING và trả checkoutUrl ký HMAC-SHA512 có hạn 15 phút. Web chuyển trình duyệt sang Sandbox. Return URL đã xác minh đưa trình duyệt về /success/[id]. IPN hợp lệ cập nhật thanh toán, trạng thái đơn và điểm trong transaction.
6. Trang kết quả đọc GET /orders/:id bằng JWT. Khi còn PENDING, trang hỏi lại khoảng hai giây một lần tối đa 30 giây. Khách có thể làm mới thủ công hoặc mở chi tiết đơn để theo dõi tiến độ và nhận món tại quầy.

## Luồng thay thế và lỗi

| Tình huống | Hành vi |
| --- | --- |
| Món hoặc tùy chọn không hợp lệ | POST /orders từ chối và rollback. Web báo lỗi và giữ giỏ. |
| Thiếu công thức hoặc nguyên liệu | POST /payments từ chối và rollback khoản trừ tồn, biến động kho và lần thử đang tạo. Đơn đã tạo vẫn giữ trạng thái trước request. |
| Mock hoặc IPN xác nhận thất bại | Payment FAILED và đơn PAYMENT_FAILED. API hoàn nguyên liệu đã trừ theo paymentId. Điểm đã đổi vẫn gắn với đơn để thử lại. Web giữ giỏ. |
| Thử lại sau thất bại | Lần thử mới dùng khóa mới. API kiểm tra lại món, tùy chọn và công thức hiện hành, chuyển về PENDING và trừ tồn cho lần thử mới. Giá thanh toán lấy từ đơn đã lưu. |
| Gửi lại request chưa rõ kết quả | Cùng khóa và payload trả kết quả đã ghi. Cùng khóa với payload khác trả 409. Checkout dùng key mới nếu đổi phương thức. Yêu cầu với key khác khi VNPay còn PENDING trả 409. |
| VNPay Return không xác minh được | Trình duyệt chuyển đến /orders?payment=unverified. Return chỉ điều hướng. |
| IPN không hợp lệ hoặc đã xử lý | API trả mã giao thức tương ứng. IPN thành công đến sau hủy được đánh dấu cần đối soát hoàn tiền thủ công. |
| Link VNPay hết hạn | Lần thử vẫn PENDING. Replay bỏ checkoutUrl và chủ đơn có thể hủy. |
| Khách hủy đơn PENDING | Chặn hủy nếu lần thử VNPay PENDING còn hạn. Nếu quá hạn, API đánh dấu lần thử FAILED và hoàn tồn theo paymentId. Transaction hoàn điểm đã dùng và chuyển đơn CANCELLED. |

## Tiêu chí đối chiếu

- Số tiền thanh toán lấy từ đơn đã lưu. Đơn có tối đa một lần thanh toán SUCCESS.
- Snapshot vẫn giữ giá, size và topping đã chốt nếu menu thay đổi.
- Thất bại, retry, nhận IPN và hủy phải tuân thủ [sơ đồ trạng thái trong kiến trúc](../architecture/architecture.md#5-luồng-đặt-món-và-thanh-toán).
- Route chi tiết đơn dùng UUID. Mã BL-… dùng để hiển thị.

Xem [use case PlantUML](../diagrams/BrewLite_DatVaThanhToan.puml), [activity](../diagrams/Activity_Dia.puml), [sequence](../diagrams/sequence-checkout.puml), [SRS](srs.md) và [kiểm thử tích hợp API](../../apps/api/test/prisma.integration.test.cjs).
