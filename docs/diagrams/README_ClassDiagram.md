# BREWLITE – DOMAIN CLASS DIAGRAM

## 1. Giới thiệu

Class Diagram (sơ đồ lớp) mô tả cấu trúc tĩnh của hệ thống BrewLite, bao gồm các lớp nghiệp vụ, thuộc tính, phương thức, kiểu dữ liệu và mối quan hệ giữa các lớp.

Sơ đồ được xây dựng dựa trên:
- Software Requirements Specification (SRS).
- Use Case Diagram của hệ thống BrewLite.
- Sequence Diagram nghiệp vụ đặt hàng và thanh toán.

**Mục đích:** Mô hình hóa các thành phần dữ liệu và nghiệp vụ cốt lõi, làm cơ sở cho việc thiết kế cơ sở dữ liệu và triển khai Backend.

## 2. Danh sách các lớp

Class Diagram gồm 7 lớp chính:

| STT | Tên lớp | Mô tả |
|---|---|---|
| 1 | User | Quản lý thông tin tài khoản khách hàng và vai trò người dùng. |
| 2 | Product | Quản lý thông tin sản phẩm, giá bán và số lượng tồn kho. |
| 3 | Order | Quản lý đơn hàng, tổng tiền và trạng thái đơn hàng. |
| 4 | OrderItem | Lưu thông tin chi tiết từng sản phẩm trong đơn hàng. |
| 5 | Payment | Quản lý thông tin và trạng thái các lần thanh toán. |
| 6 | Promotion | Quản lý mã khuyến mãi và giá trị giảm giá. |
| 7 | LoyaltyTransaction | Lưu lịch sử cộng điểm và sử dụng điểm thưởng của khách hàng. |

## 3. Mô tả các lớp

### 3.1. User

Đại diện cho người dùng trong hệ thống BrewLite.

Các thuộc tính chính:
- id: Mã định danh người dùng.
- fullName: Họ và tên.
- email: Địa chỉ email, không được trùng lặp.
- passwordHash: Mật khẩu đã được mã hóa.
- phone: Số điện thoại.
- role: Vai trò người dùng.
- loyaltyPoints: Số điểm thưởng hiện có.
- createdAt: Thời gian tạo tài khoản.

Các phương thức:
- addLoyaltyPoints(): Cộng điểm thưởng.
- useLoyaltyPoints(): Sử dụng điểm thưởng.

### 3.2. Product

Đại diện cho sản phẩm đồ uống được kinh doanh trên hệ thống.

Các thuộc tính chính:
- id: Mã sản phẩm.
- name: Tên sản phẩm.
- description: Mô tả sản phẩm.
- basePrice: Giá bán cơ bản.
- imageUrl: Đường dẫn hình ảnh.
- category: Danh mục sản phẩm.
- stock: Số lượng tồn kho.
- isAvailable: Trạng thái kinh doanh.

Các phương thức:
- hasStock(): Kiểm tra số lượng tồn kho.
- decreaseStock(): Giữ/trừ số lượng tồn kho khi đơn được tạo.
- restoreStock(): Hoàn tồn kho đúng một lần khi thanh toán thất bại đã được xác minh.

### 3.3. Order

Đại diện cho đơn hàng do khách hàng tạo.

Các thuộc tính chính:
- id: Mã định danh đơn hàng.
- orderCode: Mã đơn hàng duy nhất.
- subtotalAmount: Tổng tiền trước khi giảm giá.
- promotionDiscount: Số tiền giảm từ khuyến mãi.
- loyaltyDiscount: Số tiền giảm từ điểm thưởng.
- totalAmount: Tổng tiền cần thanh toán.
- status: Trạng thái đơn hàng.
- createdAt: Thời gian tạo đơn.
- updatedAt: Thời gian cập nhật đơn.

Các phương thức:
- calculateTotal(): Tính tổng tiền đơn hàng.
- changeStatus(): Cập nhật trạng thái đơn hàng.
- canBeCancelled(): Kiểm tra khả năng hủy đơn.

### 3.4. OrderItem

Đại diện cho từng sản phẩm trong một đơn hàng.

Các thuộc tính chính:
- id: Mã chi tiết đơn hàng.
- productName: Tên sản phẩm tại thời điểm đặt.
- size: Kích thước đồ uống.
- toppingNames: Danh sách topping được chọn.
- note: Ghi chú của khách hàng.
- quantity: Số lượng sản phẩm.
- unitPrice: Đơn giá tại thời điểm đặt hàng.
- subtotal: Thành tiền của chi tiết đơn hàng.

Phương thức:
- calculateSubtotal(): Tính thành tiền dựa trên đơn giá và số lượng.

Lớp này lưu lại thông tin sản phẩm tại thời điểm đặt hàng để đảm bảo lịch sử đơn hàng không bị thay đổi khi thông tin sản phẩm được cập nhật.

### 3.5. Payment

Đại diện cho giao dịch thanh toán của đơn hàng.

Các thuộc tính chính:
- id: Mã thanh toán.
- amount: Số tiền thanh toán.
- paymentMethod: Phương thức thanh toán.
- status: Trạng thái thanh toán.
- idempotencyKey: Khóa chống xử lý yêu cầu thanh toán trùng lặp.
- gatewayTransactionId: Mã giao dịch từ cổng thanh toán.
- failureReason: Lý do thanh toán thất bại.
- createdAt: Thời gian tạo giao dịch.
- paidAt: Thời gian thanh toán thành công.

Các phương thức:
- markSuccess(): Đánh dấu thanh toán thành công.
- markFailed(): Đánh dấu thanh toán thất bại.

Lớp Payment hỗ trợ nhiều lần thử thanh toán cho một đơn hàng. Khi nhận lại yêu cầu có cùng Idempotency Key, hệ thống trả về kết quả đã được ghi nhận thay vì xử lý giao dịch trùng lặp.

### 3.6. Promotion

Đại diện cho chương trình khuyến mãi hoặc mã giảm giá.

Các thuộc tính chính:
- id: Mã khuyến mãi.
- code: Mã giảm giá duy nhất.
- type: Loại khuyến mãi.
- discountValue: Giá trị giảm giá.
- minOrderAmount: Giá trị đơn hàng tối thiểu.
- startAt: Thời gian bắt đầu.
- endAt: Thời gian kết thúc.
- usageLimit: Giới hạn lượt sử dụng.
- usedCount: Số lượt đã sử dụng.
- isActive: Trạng thái hoạt động.

Các phương thức:
- isValid(): Kiểm tra điều kiện áp dụng khuyến mãi.
- calculateDiscount(): Tính số tiền được giảm.

### 3.7. LoyaltyTransaction

Đại diện cho một giao dịch liên quan đến điểm thưởng của khách hàng.

Các thuộc tính chính:
- id: Mã giao dịch điểm thưởng.
- points: Số điểm được cộng hoặc sử dụng.
- type: Loại giao dịch.
- description: Mô tả giao dịch.
- createdAt: Thời gian phát sinh giao dịch.

Lớp này giúp lưu lại lịch sử biến động điểm thưởng, hỗ trợ theo dõi quá trình tích lũy và sử dụng điểm của khách hàng.

## 4. Các mối quan hệ giữa các lớp

| Quan hệ | Bội số | Ý nghĩa |
|---|---|---|
| User – Order | 1 – 0..* | Một người dùng có thể tạo nhiều đơn hàng. |
| Order – OrderItem | 1 – 1..* | Một đơn hàng chứa ít nhất một chi tiết đơn hàng. |
| Product – OrderItem | 1 – 0..* | Một sản phẩm có thể xuất hiện trong nhiều chi tiết đơn hàng. |
| Order – Payment | 1 – 0..* | Một đơn hàng có thể có nhiều lần thử thanh toán. |
| Promotion – Order | 0..1 – 0..* | Một đơn hàng có thể áp dụng tối đa một khuyến mãi. |
| User – LoyaltyTransaction | 1 – 0..* | Một người dùng có thể có nhiều giao dịch điểm thưởng. |
| Order – LoyaltyTransaction | 0..1 – 0..* | Một giao dịch điểm thưởng có thể liên quan đến một đơn hàng. |

## 5. Các Enumeration (Enum)

Sơ đồ sử dụng 6 enum để giới hạn các giá trị trạng thái và loại dữ liệu.

### 5.1. UserRole
- CUSTOMER: Khách hàng.
- ADMIN: Quản trị viên.

### 5.2. OrderStatus
- PENDING: Đơn hàng đang chờ thanh toán.
- PAID: Đơn hàng đã thanh toán.
- PAYMENT_FAILED: Thanh toán thất bại.
- PREPARING: Đang chuẩn bị.
- READY: Đã sẵn sàng.
- COMPLETED: Đã hoàn thành.
- CANCELLED: Đã hủy.

### 5.3. PaymentMethod
- VNPAY: Thanh toán qua VNPay Sandbox; khách chọn nguồn tiền trên VNPay.

### 5.4. PaymentStatus
- PENDING: Đang chờ xử lý.
- SUCCESS: Thanh toán thành công.
- FAILED: Thanh toán thất bại.

### 5.5. PromotionType
- PERCENTAGE: Giảm theo phần trăm.
- FIXED_AMOUNT: Giảm theo số tiền cố định.

### 5.6. LoyaltyTransactionType
- EARN: Cộng điểm thưởng.
- REDEEM: Sử dụng điểm thưởng.

## 6. Đối chiếu với Sequence Diagram

Class Diagram được thiết kế để hỗ trợ các bước nghiệp vụ trong Sequence Diagram đặt hàng và thanh toán.

### 6.1. Kiểm tra và tạo đơn hàng

- NestJS API tiếp nhận yêu cầu tạo đơn hàng.
- Hệ thống kiểm tra thông tin sản phẩm và số lượng tồn kho.
- Product hỗ trợ kiểm tra và giảm tồn kho.
- Order lưu thông tin đơn hàng với trạng thái PENDING.
- OrderItem lưu các sản phẩm và tùy chọn trong đơn hàng.
- Nếu không đủ tồn kho, giao dịch cơ sở dữ liệu được rollback.

### 6.2. Xử lý thanh toán

- Payment lưu thông tin yêu cầu thanh toán.
- Hệ thống kiểm tra Idempotency Key để tránh xử lý trùng yêu cầu.
- Nếu khóa đã được ghi nhận, hệ thống trả lại kết quả thanh toán đã lưu.
- Nếu là yêu cầu mới, hệ thống tạo yêu cầu thanh toán và chuyển khách sang VNPay Sandbox.

### 6.3. Cập nhật trạng thái đơn hàng

Khi thanh toán thành công:
- Payment được cập nhật thành SUCCESS.
- Order được cập nhật thành PAID.
- Giao dịch cơ sở dữ liệu được commit.

Khi thanh toán thất bại:
- Payment được cập nhật thành FAILED.
- Order được cập nhật thành PAYMENT_FAILED.
- Giao dịch cơ sở dữ liệu được commit.

## 7. Một số quy tắc nghiệp vụ và thiết kế

1. Email của User phải là duy nhất.
2. Mỗi Order có một orderCode duy nhất.
3. Order phải có ít nhất một OrderItem.
4. Số lượng sản phẩm phải được kiểm tra trước khi tạo đơn.
5. Giá sản phẩm trong OrderItem được lưu tại thời điểm đặt hàng.
6. Idempotency Key được sử dụng để chống xử lý thanh toán trùng lặp.
7. Một đơn hàng có thể có nhiều lần thử thanh toán.
8. Mỗi giao dịch điểm thưởng phải thuộc về một người dùng.
9. Giỏ hàng được quản lý phía Next.js UI bằng Local Storage trong phạm vi MVP, không được mô hình hóa thành lớp lưu trữ riêng trong Class Diagram.

## 8. Kết luận

Class Diagram BrewLite mô hình hóa 7 lớp nghiệp vụ chính và 6 enum, thể hiện cấu trúc dữ liệu và các mối quan hệ giữa tài khoản, sản phẩm, đơn hàng, thanh toán, khuyến mãi và điểm thưởng.

Sơ đồ là cơ sở tham khảo cho việc thiết kế cơ sở dữ liệu, triển khai Backend bằng NestJS và PostgreSQL, đồng thời đảm bảo sự liên kết với nghiệp vụ đặt hàng và thanh toán được mô tả trong Sequence Diagram.
