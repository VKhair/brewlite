# TASK 1.3 – ĐẶC TẢ USE-CASE TRỌNG TÂM

## Đặt và thanh toán đơn hàng – Hệ thống BrewLite

**Tài liệu đối chiếu:** `srs.md` (quy ước FR-xx, AC-xx.y), `use-case-overall.puml` (quy ước UC-01 đến UC-25).  
**Sơ đồ chi tiết:** `docs/diagrams/BrewLite_DatVaThanhToan.puml` và `docs/diagrams/BrewLite_DatVaThanhToan.svg`.

## 1. Thông tin tổng quan

| Thuộc tính | Nội dung |
| --- | --- |
| Tên nghiệp vụ trọng tâm | Đặt và thanh toán đơn hàng |
| Use-case chính trong sơ đồ tổng quát | **UC-11 – Tạo đơn hàng (Checkout)**; **UC-13 – Thanh toán qua VNPay Sandbox** |
| Use-case liên quan | UC-06, UC-09, UC-12, UC-14, UC-15, UC-16, UC-17, UC-18, UC-21 |
| Tác nhân chính | Khách hàng đã đăng nhập (Member Customer) |
| Tác nhân phụ | VNPay Sandbox (hệ thống ngoài) |
| Mục tiêu | Tạo đơn có mã tra cứu, chuyển khách sang VNPay Sandbox để chọn nguồn tiền, xác minh kết quả và xác nhận đơn |
| Trigger | Khách hàng chọn **Tiến hành thanh toán** từ giỏ hàng có sản phẩm |
| Phạm vi | BrewLite – phân hệ giỏ hàng, đặt đơn, thanh toán và xác nhận |
| Mức ưu tiên | Must-have |
| Yêu cầu chức năng trọng tâm | **FR-07, FR-08, FR-09, FR-10** |
| Yêu cầu liên quan | FR-04, FR-06, FR-11; FR-17 (Should-have), FR-18 (Could-have) |

**Ranh giới nghiệp vụ:** Checkout tạo đơn `PENDING`; thanh toán qua VNPay Sandbox chuyển đơn sang `PAID` khi backend xác minh thành công hoặc `PAYMENT_FAILED` khi xác minh thất bại. Sandbox không phải production và không thu tiền thật (FR-19). URL Return chỉ phục vụ điều hướng; backend xác minh IPN/chữ ký trước khi chốt trạng thái. Tác vụ pha chế, giao đồ uống và quản trị kho không thuộc luồng tương tác chính.

## 2. Tác nhân, tiền điều kiện và hậu điều kiện

### 2.1. Tác nhân

- **Member Customer:** Xem giỏ, chọn phương thức, xác nhận thanh toán và xem kết quả.
- **VNPay Sandbox:** Hệ thống thanh toán ngoài BrewLite. Backend tạo URL thanh toán và nhận thông báo IPN; xác minh chữ ký, mã tham chiếu, số tiền và trạng thái trước khi cập nhật đơn. Không đưa secret VNPay ra frontend.

### 2.2. Tiền điều kiện

1. Giỏ hàng có ít nhất một dòng sản phẩm, bao gồm số lượng, size/topping đã chọn.
2. Khách hàng đã đăng nhập và có JWT hợp lệ khi yêu cầu tạo đơn (`POST /orders`). Đây là tiền điều kiện của UC-11; nếu phiên chưa xác thực, khách hoàn tất UC-09 rồi tiếp tục checkout. Phiên JWT còn hiệu lực không phải đăng nhập lại.
3. Backend, cơ sở dữ liệu và cấu hình VNPay Sandbox (merchant code, secret, Return URL, IPN URL) sẵn sàng; secret được cấu hình qua biến môi trường.
4. Sản phẩm, tùy chọn và tồn kho **sẽ được backend xác minh lại** khi tạo đơn; dữ liệu hiển thị ở client không được xem là kết quả xác minh cuối cùng.

### 2.3. Hậu điều kiện

**Thành công:** Đơn hàng được lưu với mã định danh/mã tra cứu duy nhất; trạng thái `PENDING → PAID`; giao dịch thanh toán được ghi nhận; giỏ hàng được xóa; màn hình xác nhận hiển thị mã đơn, tổng tiền, trạng thái và khách hàng có thể xem đơn trong lịch sử.

**Không thành công:** Nếu dữ liệu/tồn kho không hợp lệ, không tạo đơn dở dang và transaction tạo đơn được hoàn tác. Khi VNPay xác nhận thanh toán thất bại, Payment attempt được lưu, đơn chuyển `PAYMENT_FAILED`, tồn kho/điểm đã giữ được hoàn đúng một lần và giỏ hàng được bảo toàn. UC-18 chỉ hiển thị xác nhận `PAID` khi backend xác minh thanh toán thành công.

## 3. Luồng chính (Main Success Scenario)

| Bước | Tác nhân | Hành động / Phản hồi |
| --- | --- | --- |
| 1 | Khách hàng | Mở giỏ hàng và xem món, size, topping, số lượng, tổng tiền. |
| 2 | Khách hàng | Chọn **Tiến hành thanh toán**. |
| 3 | Hệ thống | Kiểm tra phiên hiện tại; chỉ tiếp tục khi JWT hợp lệ. Nếu chưa xác thực, chuyển sang UC-09 rồi quay lại checkout. |
| 4 | Hệ thống | Hiển thị thông tin đơn và phương thức **Thanh toán qua VNPay**. |
| 5 | Khách hàng | Chọn VNPay và xác nhận đặt, thanh toán đơn hàng. |
| 6 | Next.js → NestJS | Gửi `POST /orders` kèm JWT và thông tin giỏ hàng. |
| 7 | NestJS API | Kiểm tra JWT, kiểm tra sản phẩm/size/topping/số lượng, tính lại tổng tiền trên server và đối chiếu tồn kho. |
| 8 | NestJS → PostgreSQL | Thực hiện transaction, ghi nhận đơn hàng `PENDING` và giữ/trừ tồn kho; hoàn tác nếu có lỗi. |
| 9 | NestJS → Next.js | Trả thông tin đơn: `orderId`, `orderCode`, `totalAmount`, `status: PENDING`. |
| 10 | Next.js → NestJS | Gửi `POST /payments` với `orderId`, `paymentMethod: VNPAY` và `Idempotency-Key`. |
| 11 | NestJS → VNPay Sandbox | Tạo yêu cầu thanh toán từ số tiền server-side, mã tham chiếu và chữ ký; trả URL thanh toán cho frontend. |
| 12 | Khách hàng ↔ VNPay Sandbox | Chuyển hướng khách sang VNPay để chọn nguồn tiền và thực hiện giao dịch thử nghiệm. |
| 13 | VNPay Sandbox → NestJS | Gửi IPN; backend xác minh chữ ký, mã tham chiếu, số tiền, đơn và trạng thái, rồi lưu kết quả Payment. Giao dịch thành công chuyển đơn `PENDING → PAID`; thất bại chuyển `PENDING → PAYMENT_FAILED` và hoàn tồn kho. |
| 14 | Next.js | Chỉ sau khi backend xác nhận `PAID`, xóa giỏ và hiển thị mã đơn, tổng thanh toán, trạng thái và thông điệp nhận nước tại quầy. |
| 15 | Khách hàng | Xem xác nhận đơn và có thể truy cập lịch sử đơn hàng. |

**Điểm kết thúc thành công:** Đơn `PAID`, đã ghi nhận Payment, có mã tra cứu và giỏ hàng được xóa.

## 4. Luồng thay thế (Alternative Flows)

| Mã | Tại bước | Điều kiện và xử lý | Điểm tiếp tục |
| --- | --- | --- | --- |
| AF-01 | 3 | Nếu chưa có JWT hợp lệ, khách hoàn tất UC-09; nếu phiên đã hợp lệ thì tiếp tục mà không đăng nhập lại. UC-09 là luồng riêng, không được include bắt buộc trong UC-11. | Bước 4 |
| AF-02 | 1–5 | Khách thay đổi món, size/topping hoặc số lượng; hệ thống cập nhật giỏ và tổng tiền tạm tính. | Bước 1 hoặc 4 |
| AF-03 | 4–5 | Khách chọn VNPay; chọn ngân hàng/nguồn tiền trên trang VNPay Sandbox. | Bước 5 |
| AF-04 | 4–5 | Nếu áp dụng coupon (UC-15/FR-17), hệ thống xác minh mã và tính lại tiền; coupon không hợp lệ không được giảm giá. | Bước 5 |
| AF-05 | 4–5 | Nếu sử dụng điểm (UC-16/FR-18), hệ thống kiểm tra điểm hợp lệ và tính giảm trừ. | Bước 5 |
| AF-06 | 10–13 | Client gửi lại **cùng `Idempotency-Key` cho cùng Payment attempt**: API trả trạng thái/URL của yêu cầu cũ, không tạo yêu cầu VNPay mới. Dùng khóa mới chỉ khi bắt đầu Payment attempt mới sau khi lần trước đã xác nhận thất bại. | Kiểm tra trạng thái; không kết luận từ Return URL |

## 5. Luồng ngoại lệ (Exception Flows)

| Mã | Tại bước | Tình huống | Kết quả và xử lý |
| --- | --- | --- | --- |
| EF-01 | 3, 6 | JWT hết hạn, thiếu hoặc sai | Từ chối tạo đơn (`401`), yêu cầu đăng nhập lại; không tạo đơn. |
| EF-02 | 1–2 | Giỏ hàng trống | Vô hiệu hóa nút checkout; hướng khách quay lại menu. |
| EF-03 | 7 | Dữ liệu sản phẩm, size, topping hoặc số lượng không hợp lệ | Backend báo lỗi validation; người dùng sửa giỏ; không tạo đơn. |
| EF-04 | 7–8 | Thiếu hàng/nguyên liệu hoặc xung đột cập nhật đồng thời | Transaction hoàn tác, không tạo đơn dở dang/không tiêu hao vượt tồn; báo khách sửa giỏ. |
| EF-05 | 11–13 | VNPay xác nhận thất bại (IPN hợp lệ) | Lưu Payment attempt thất bại; chuyển đơn `PAYMENT_FAILED`; hoàn tồn kho/điểm đã dùng đúng một lần; giữ giỏ. Thử lại trên cùng đơn cần kiểm tra và giữ tồn kho lại, chuyển trạng thái về `PENDING`, tạo attempt và khóa mới. Hiển thị **Thử lại** và **Quay lại giỏ**. |
| EF-06 | 11 | `Idempotency-Key` đã gắn với **đơn khác** | API từ chối sử dụng lại khóa cho đơn khác, không xử lý thanh toán. |
| EF-07 | 8, 12 | Lỗi máy chủ/DB | Báo lỗi; transaction của thao tác bị lỗi được hoàn tác, không xác nhận thành công khi chưa có kết quả bền vững. |
| EF-08 | 10–14 | Mất phản hồi, chưa rõ giao dịch VNPay thành công hay không | Không coi timeout hay trình duyệt quay về là kết quả cuối. Tra cứu trạng thái/chờ IPN. Gửi lại cùng yêu cầu dùng cùng `Idempotency-Key`; không tạo yêu cầu mới cho đến khi lần hiện tại được xác định. |
| EF-09 | 13 | IPN sai chữ ký, mã tham chiếu, số tiền hoặc đơn không khớp | Không cập nhật đơn/thanh toán; ghi nhận sự kiện an toàn để đối soát và trả phản hồi giao thức phù hợp. IPN lặp trả lại kết quả đã lưu, không áp dụng nghiệp vụ lần hai. |

**Quy tắc thử lại:** Timeout/mất phản hồi là cùng một Payment attempt nên phải dùng lại khóa cũ và đối soát trạng thái; sau khi VNPay xác nhận thất bại, khách có thể thử trên cùng đơn nhưng đó là Payment attempt mới, dùng khóa mới. Trước attempt mới, backend phải giữ tồn kho lại nguyên tử; không đủ hàng thì từ chối thử lại.

## 6. Tiêu chí chấp nhận để viết kiểm thử

Các tiêu chí dưới đây **truy vết về mã AC có sẵn trong SRS**, không tự đặt `AC-01` khác hệ thống mã hóa của SRS.

| Mã SRS | Điều kiện kiểm thử | Kết quả mong đợi |
| --- | --- | --- |
| AC-04.5, AC-04.6 | Giỏ có món / giỏ rỗng | Tổng tiền đúng; giỏ rỗng không cho checkout. |
| AC-07.1, AC-06.4 | JWT thiếu/sai/hết hạn | Không tạo đơn; yêu cầu xác thực lại. |
| AC-07.2 | Dữ liệu hoặc tồn kho không đáp ứng | API từ chối, không tạo đơn dở dang, tồn kho nhất quán. |
| AC-07.3, AC-07.4 | Tạo đơn thành công | Đơn `PENDING`, có `orderId`, `orderCode` và tổng tiền. |
| AC-08.1, AC-08.2 | VNPay Sandbox xác nhận giao dịch thành công với IPN hợp lệ | Ghi Payment, đơn `PAID`, xóa giỏ và chuyển màn hình xác nhận. |
| AC-08.3 | Gửi cùng khóa cho cùng đơn hai lần | Chỉ ghi nhận/xử lý một giao dịch. |
| AC-09.1, AC-09.2, AC-09.3 | Thanh toán lỗi | Đơn `PAYMENT_FAILED`, giữ giỏ và có tùy chọn xử lý tiếp. |
| AC-10.1, AC-10.2 | Thanh toán thành công | Màn hình hiện mã đơn, `PAID`, thông tin món và điều hướng phù hợp. |
| AC-11.1, AC-11.2 | Xem lịch sử sau thanh toán | Khách xem được đơn thuộc tài khoản mình. |

## 7. Ma trận liên kết Use-case – yêu cầu – API

| Use-case theo sơ đồ tổng quát | Yêu cầu SRS | API / Thành phần | Vai trò trong Task 1.3 |
| --- | --- | --- | --- |
| UC-06 – Quản lý giỏ hàng | FR-04; FR-16 (Should) | Zustand/localStorage phía web | Chuẩn bị giỏ; giữ/xóa giỏ theo kết quả |
| UC-09 – Đăng nhập & JWT | FR-06 | `POST /auth/login`; JWT Guard | Tiền điều kiện cho UC-11; hoàn tất nếu phiên chưa xác thực |
| **UC-11 – Tạo đơn hàng** | **FR-07** | `POST /orders` | Luồng chính |
| UC-12 – Kiểm tra dữ liệu & tồn kho | FR-07; NFR-08 | OrdersService, transaction/InventoryService | `include` của UC-11 |
| **UC-13 – Thanh toán VNPay Sandbox** | **FR-08** | `POST /payments`; VNPay Return/IPN | `include` của UC-11; luồng chính |
| UC-14 – Xử lý thanh toán chống lặp | FR-08; NFR-08 | PaymentsService / `Idempotency-Key` | `include` của UC-13 |
| UC-15 – Khuyến mãi | FR-17 (Should) | Kiểm tra coupon phía backend | `extend` của UC-11 |
| UC-16 – Tích lũy & sử dụng điểm thưởng | FR-18 (Could) | Loyalty phía backend | `extend` của UC-13 |
| UC-17 – Thanh toán thất bại | FR-09; NFR-09 | Payment + trạng thái đơn + client cart | `extend` của UC-13 khi thất bại |
| UC-18 – Xem xác nhận | FR-10 | Giao diện xác nhận đơn | `extend` UC-13 khi giao dịch được backend xác minh thành công |
| UC-21 – Lịch sử đơn | FR-11 | `GET /orders/me` | Sau khi hoàn thành |

## 8. Quy tắc nghiệp vụ và giới hạn phạm vi

1. **Xác thực:** `POST /orders` chỉ chấp nhận JWT hợp lệ. Đây là tiền điều kiện, không phải `include`: UC-09 chỉ chạy nếu phiên chưa xác thực, sau đó khách quay lại checkout.
2. **Giá và tồn kho:** Backend xác minh dữ liệu, tính lại giá và kiểm soát tồn kho trong transaction; client không quyết định tổng tiền cuối cùng.
3. **Trạng thái:** `PENDING → PAID` khi thanh toán thành công; nhánh lỗi `PENDING → PAYMENT_FAILED`. Các trạng thái pha chế (`PREPARING`, `READY`, `COMPLETED`) thuộc nghiệp vụ tiếp theo, không phải bước checkout.
4. **Idempotency:** Khóa thanh toán chỉ bảo đảm chống lặp cho cùng khóa và cùng đơn; không suy rộng thành chống tạo hai đơn nếu client gửi lại toàn bộ checkout với khóa mới.
5. **Phạm vi:** Chỉ VNPay Sandbox; không bật môi trường production/thu tiền thật (FR-19); không triển khai native app (FR-20) hay phân phối shipper (FR-21) trong nghiệp vụ này.
6. **Quan hệ UML đã chốt:** `include` cho UC-12 (kiểm tra đơn) và UC-13 (thanh toán là bước bắt buộc trong checkout), cùng UC-14 (xử lý idempotent bên trong thanh toán). UC-15, UC-16, UC-17 là `extend` theo điều kiện. UC-18 cũng `extend` UC-13 với điều kiện thanh toán đã được backend xác minh thành công. UC-09 là tiền điều kiện/luồng riêng, không include bắt buộc vì thành viên có thể đã đăng nhập. VNPay Sandbox tương tác với UC-13. Association actor–use-case được thể hiện bằng đường liền không hướng.

## 9. Sơ đồ Use-case chi tiết

Tệp **`docs/diagrams/BrewLite_DatVaThanhToan.puml`** là nguồn chỉnh sửa; **`docs/diagrams/BrewLite_DatVaThanhToan.svg`** là bản kết xuất. Các mã UC và quan hệ `include`/`extend` bám theo `docs/diagrams/use-case-overall.puml`.

*Hình 1.3 – Use-case diagram cho nghiệp vụ Đặt và thanh toán đơn hàng của BrewLite.*


## 10. Kết quả rà soát chéo

- **UC-09:** là tiền điều kiện của checkout; UC-11 chỉ được thực hiện bởi Member đã xác thực. Nếu chưa có JWT, khách hoàn tất đăng nhập rồi tiếp tục. Không dùng `include` vì đăng nhập không chạy mỗi lần checkout.
- **UC-18:** là phần mở rộng tùy điều kiện của UC-13, chỉ chạy khi backend xác minh giao dịch thành công; dùng `extend` thay cho `include`.
- **VNPay Sandbox:** hệ thống ngoài BrewLite; `PaymentsService` là adapter nội bộ. Merchant secret nằm phía backend trong cấu hình môi trường. Return URL không được dùng làm bằng chứng thanh toán; IPN phải xác minh chữ ký và dữ liệu giao dịch.
- **Thử lại thanh toán:** sau IPN thất bại đã xác minh, thử lại trên cùng đơn tạo Payment attempt và khóa mới; mất phản hồi của attempt hiện tại dùng lại khóa cũ. Đây là yêu cầu tài liệu, không phải xác nhận việc code đã triển khai.
- **Kiểm soát tồn kho:** SRS nêu Optimistic Locking; báo cáo hiện thực ghi nhận cập nhật tồn kho nguyên tử có điều kiện. Đặc tả nghiệp vụ giữ mục tiêu không oversell; kỹ thuật triển khai cần đối chiếu trong Task 2/3.
