# ĐẶC TẢ USE CASE

**UC-01 – Đặt và thanh toán đơn hàng**

## 1. Thông tin tổng quan

| Thuộc tính | Mô tả |
| --- | --- |
| Mã / Tên | UC-01 – Đặt và thanh toán đơn hàng |
| Mục tiêu | Khách hàng tạo đơn và thanh toán không dùng tiền mặt qua Ví/Thẻ mô phỏng. |
| Actor chính | Khách hàng |
| Actor phụ | Cổng thanh toán mô phỏng (Mock Payment Gateway) |
| Trigger | Khách hàng chọn Thanh toán tại giỏ hàng. |
| Phạm vi | BrewLite MVP – checkout |
| Độ ưu tiên | Must |
| FR liên quan (đề xuất) | FR-03 Giỏ hàng; FR-04 Xác thực; FR-05 Đặt đơn; FR-06 Thanh toán; FR-07 Xác nhận/lịch sử đơn |

## 2. Tiền điều kiện và hậu điều kiện

### 2.1. Tiền điều kiện

- Hệ thống hoạt động và giỏ hàng có ít nhất một sản phẩm.
- Số lượng, size và topping của các sản phẩm hợp lệ.
- Khách hàng phải đăng nhập trước khi tạo đơn (có thể đăng nhập trong quá trình checkout).
- Dịch vụ thanh toán mô phỏng được cấu hình.

### 2.2. Hậu điều kiện

Thành công: Đơn được lưu; chuyển PENDING → PAID; giao dịch được ghi nhận; hiển thị mã đơn và trạng thái; đơn có trong lịch sử.

Thất bại: Nếu thanh toán bị từ chối, đơn ở PAYMENT_FAILED và giỏ hàng giữ nguyên. Nếu tạo đơn lỗi, không lưu đơn không hợp lệ; các thay đổi tồn kho phải nhất quán.

## 3. Luồng chính (Main Success Scenario)

| Bước | Thực hiện / Phản hồi |
| --- | --- |
| 1 | Khách hàng mở giỏ hàng. |
| 2 | Hệ thống hiển thị sản phẩm, số lượng, tùy chọn và tổng tiền. |
| 3 | Khách hàng chọn Thanh toán. |
| 4 | Hệ thống kiểm tra xác thực đăng nhập. |
| 5 | Hệ thống kiểm tra giỏ hàng, giá và tồn kho. |
| 6 | Khách hàng chọn Ví điện tử hoặc Thẻ. |
| 7 | Khách hàng xác nhận đặt và thanh toán. |
| 8 | Hệ thống gọi POST /orders; validate và tạo đơn PENDING trong giao dịch dữ liệu phù hợp. |
| 9 | Hệ thống gửi POST /payments với Idempotency-Key tới dịch vụ thanh toán mock. |
| 10 | Cổng thanh toán trả kết quả thành công. |
| 11 | Hệ thống ghi nhận thanh toán và cập nhật đơn thành PAID. |
| 12 | Hệ thống hiển thị mã đơn, tổng tiền, trạng thái PAID; khách hàng xem xác nhận. |

## 4. Luồng thay thế

| Mã | Điều kiện | Xử lý |
| --- | --- | --- |
| A1 | Chưa đăng nhập | Yêu cầu đăng nhập; thành công thì quay lại bước kiểm tra checkout. |
| A2 | Sửa giỏ hàng | Khách hàng điều chỉnh sản phẩm/số lượng/tùy chọn; hệ thống tính lại tổng tiền. |
| A3 | Đổi phương thức | Khách hàng chuyển giữa Ví và Thẻ trước khi xác nhận. |
| A4 | Thử thanh toán lại | Với đơn PAYMENT_FAILED hợp lệ, khách hàng thực hiện lần thử mới; tránh trừ tiền lặp. |

## 5. Luồng ngoại lệ

| Mã | Tình huống | Kết quả |
| --- | --- | --- |
| E1 | Giỏ hàng trống | Không cho tạo đơn; yêu cầu thêm sản phẩm. |
| E2 | Hết hàng/không đủ tồn kho | Không tạo đơn; thông báo và yêu cầu điều chỉnh giỏ. |
| E3 | Dữ liệu không hợp lệ | Backend từ chối và thông báo lỗi validation. |
| E4 | Thanh toán thất bại | Đơn PAYMENT_FAILED; giữ nguyên giỏ hàng. |
| E5 | Gửi trùng yêu cầu thanh toán | Dùng Idempotency-Key để không phát sinh giao dịch trùng. |
| E6 | Lỗi DB/hệ thống | Thông báo lỗi; bảo đảm dữ liệu đơn và tồn kho nhất quán. |
| E7 | Chưa rõ kết quả thanh toán do mất kết nối | Không tự suy diễn thất bại hay thành công; kiểm tra trạng thái trước khi thử lại (quy tắc triển khai cần nhóm chốt). |

## 6. Tiêu chí chấp nhận

| Mã | Điều kiện | Kỳ vọng |
| --- | --- | --- |
| AC-01 | Giỏ có sản phẩm hợp lệ | Hiển thị tổng tiền chính xác; cho phép checkout. |
| AC-02 | Chưa đăng nhập | Yêu cầu đăng nhập trước tạo đơn. |
| AC-03 | Đủ tồn kho | Tạo đơn PENDING. |
| AC-04 | Thanh toán thành công | Chuyển PAID, hiển thị mã đơn. |
| AC-05 | Thanh toán thất bại | PAYMENT_FAILED; giữ giỏ hàng. |
| AC-06 | Không đủ tồn kho | Từ chối tạo đơn. |
| AC-07 | Lặp Idempotency-Key | Không thanh toán trùng. |
| AC-08 | Đơn thành công | Có trong lịch sử đơn của người dùng. |

## 7. Liên kết yêu cầu – API – Use Case

| FR (đề xuất) | Chức năng | API / UC |
| --- | --- | --- |
| FR-03 | Giỏ hàng, tổng tiền | UC-03 – Kiểm tra giỏ hàng (frontend state) |
| FR-04 | Đăng nhập JWT | POST /auth/login; UC-02, UC-08 |
| FR-05 | Tạo đơn, kiểm tra tồn kho | POST /orders; UC-04, UC-05 |
| FR-06 | Thanh toán Ví/Thẻ | POST /payments; UC-06, UC-09, UC-10 |
| FR-07 | Xác nhận, lịch sử đơn | GET /orders/me; UC-07 |

## 8. Ghi chú mô hình hóa và phạm vi

Actor chính: Khách hàng. Actor phụ: Mock Payment Gateway. Các thao tác kiểm tra JWT, tồn kho và idempotency là chức năng nội bộ được biểu diễn để giải thích phạm vi checkout. Đăng nhập là nhánh có điều kiện; xử lý thanh toán lỗi là nhánh ngoại lệ.

Không bao gồm trong MVP: nhân viên pha chế tiếp nhận và cập nhật trạng thái tại quầy (phần mở rộng theo Assignment 1). Quy tắc thử lại khi cổng thanh toán không trả kết quả rõ ràng cần chốt ở Task 2/API contract.

## 9. Hướng dẫn sơ đồ

Sơ đồ Use Case Diagram của nghiệp vụ Đặt và thanh toán đơn hàng


*Hình 1.3 – Use Case Diagram: Đặt và thanh toán đơn hàng (BrewLite)*