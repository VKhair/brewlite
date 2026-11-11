# TASK 1.3 – ĐẶC TẢ USE-CASE TRỌNG TÂM

## Đặt và thanh toán đơn hàng – Hệ thống BrewLite

**Tài liệu đối chiếu:** `srs.md` (quy ước FR-xx, AC-xx.y), `use-case-overall.puml` (quy ước UC-01 đến UC-25).  
**Sơ đồ chi tiết:** `BrewLite_DatVaThanhToan.puml`.

## 1. Thông tin tổng quan

| Thuộc tính | Nội dung |
| --- | --- |
| Tên nghiệp vụ trọng tâm | Đặt và thanh toán đơn hàng |
| Use-case chính trong sơ đồ tổng quát | **UC-11 – Tạo đơn hàng (Checkout)**; **UC-13 – Thực hiện thanh toán mô phỏng (Ví/Thẻ)** |
| Use-case liên quan | UC-06, UC-12, UC-14, UC-15, UC-16, UC-17, UC-18, UC-21; UC-09 cung cấp bước đăng nhập khi cần |
| Tác nhân chính | Khách hàng đã đăng nhập (Member Customer) |
| Tác nhân phụ | Cổng thanh toán mô phỏng (Mock Payment Gateway) |
| Mục tiêu | Tạo đơn có mã tra cứu và thanh toán không tiền mặt bằng ví điện tử hoặc thẻ mô phỏng, xác nhận trạng thái thanh toán |
| Trigger | Khách hàng chọn **Tiến hành thanh toán** từ giỏ hàng có sản phẩm |
| Phạm vi | BrewLite – phân hệ giỏ hàng, đặt đơn, thanh toán và xác nhận |
| Mức ưu tiên | Must-have |
| Yêu cầu chức năng trọng tâm | **FR-07, FR-08, FR-09, FR-10** |
| Yêu cầu liên quan | FR-04, FR-06, FR-11; FR-17 (Should-have), FR-18 (Could-have) |

**Ranh giới nghiệp vụ:** Checkout tạo đơn `PENDING`; thanh toán mô phỏng chuyển đơn sang `PAID` khi thành công hoặc `PAYMENT_FAILED` khi thất bại. Không thu tiền thật qua ngân hàng/ví thực tế (FR-19: Won't-have). Tác vụ pha chế, giao đồ uống và quản trị kho không thuộc luồng tương tác chính của use-case này.

## 2. Tác nhân, tiền điều kiện và hậu điều kiện

### 2.1. Tác nhân

- **Member Customer:** Xem giỏ, chọn phương thức, xác nhận thanh toán và xem kết quả.
- **Mock Payment Gateway:** Cung cấp kết quả thành công/thất bại cho giao dịch mô phỏng. Trong mã nguồn hiện thực, logic mô phỏng thuộc `PaymentsService` của NestJS.

### 2.2. Tiền điều kiện

1. Giỏ hàng có ít nhất một dòng sản phẩm, bao gồm số lượng, size/topping đã chọn.
2. Khách hàng đã đăng nhập và có JWT hợp lệ khi yêu cầu tạo đơn (`POST /orders`). Nếu chưa đăng nhập, hệ thống dẫn tới bước đăng nhập trước khi tiếp tục.
3. Backend, cơ sở dữ liệu và chức năng thanh toán mô phỏng sẵn sàng xử lý yêu cầu.
4. Sản phẩm, tùy chọn và tồn kho **sẽ được backend xác minh lại** khi tạo đơn; dữ liệu hiển thị ở client không được xem là kết quả xác minh cuối cùng.

### 2.3. Hậu điều kiện

**Thành công:** Đơn hàng được lưu với mã định danh/mã tra cứu duy nhất; trạng thái `PENDING → PAID`; giao dịch thanh toán được ghi nhận; giỏ hàng được xóa; màn hình xác nhận hiển thị mã đơn, tổng tiền, trạng thái và khách hàng có thể xem đơn trong lịch sử.

**Không thành công:** Nếu dữ liệu/tồn kho không hợp lệ, không tạo đơn dở dang và transaction tạo đơn được hoàn tác. Nếu thanh toán thất bại, đơn ở `PAYMENT_FAILED`, giỏ hàng được bảo toàn; tồn kho/điểm đã dùng được hoàn lại theo nghiệp vụ hiện thực.

## 3. Luồng chính (Main Success Scenario)

| Bước | Tác nhân | Hành động / Phản hồi |
| --- | --- | --- |
| 1 | Khách hàng | Mở giỏ hàng và xem món, size, topping, số lượng, tổng tiền. |
| 2 | Khách hàng | Chọn **Tiến hành thanh toán**. |
| 3 | Hệ thống | Kiểm tra phiên đăng nhập; yêu cầu JWT hợp lệ trước khi tạo đơn. |
| 4 | Hệ thống | Hiển thị thông tin cần thanh toán và hai lựa chọn **Ví điện tử** hoặc **Thẻ ngân hàng**. |
| 5 | Khách hàng | Chọn phương thức và xác nhận đặt, thanh toán đơn hàng. |
| 6 | Next.js → NestJS | Gửi `POST /orders` kèm JWT và thông tin giỏ hàng. |
| 7 | NestJS API | Kiểm tra JWT, kiểm tra sản phẩm/size/topping/số lượng, tính lại tổng tiền trên server và đối chiếu tồn kho. |
| 8 | NestJS → PostgreSQL | Thực hiện transaction, ghi nhận đơn hàng `PENDING`, cập nhật tồn kho hợp lệ; hoàn tác nếu có lỗi. |
| 9 | NestJS → Next.js | Trả thông tin đơn: `orderId`, `orderCode`, `totalAmount`, `status: PENDING`. |
| 10 | Next.js → NestJS | Gửi `POST /payments` với `orderId`, phương thức `EWALLET` hoặc `CARD` và `Idempotency-Key`. |
| 11 | NestJS / Mock Payment | Kiểm tra khóa chống lặp, mô phỏng xử lý và nhận kết quả **thành công**. |
| 12 | NestJS → PostgreSQL | Ghi nhận Payment, cập nhật đơn `PENDING → PAID` và ghi nhận quyền lợi liên quan nếu áp dụng. |
| 13 | Next.js | Xóa giỏ hàng khi nhận xác nhận thành công, hiển thị mã đơn, tổng thanh toán, `PAID` và thông điệp nhận nước tại quầy. |
| 14 | Khách hàng | Xem xác nhận đơn và có thể truy cập lịch sử đơn hàng. |

**Điểm kết thúc thành công:** Đơn `PAID`, đã ghi nhận Payment, có mã tra cứu và giỏ hàng được xóa.

## 4. Luồng thay thế (Alternative Flows)

| Mã | Tại bước | Điều kiện và xử lý | Điểm tiếp tục |
| --- | --- | --- | --- |
| AF-01 | 3 | Chưa đăng nhập: điều hướng tới đăng nhập (UC-09); sau đăng nhập hợp lệ, tiếp tục quy trình. | Bước 4 |
| AF-02 | 1–5 | Khách thay đổi món, size/topping hoặc số lượng; hệ thống cập nhật giỏ và tổng tiền tạm tính. | Bước 1 hoặc 4 |
| AF-03 | 4–5 | Khách chuyển giữa `EWALLET` và `CARD` trước khi xác nhận. | Bước 5 |
| AF-04 | 4–5 | Nếu áp dụng coupon (UC-15/FR-17), hệ thống xác minh mã và tính lại tiền; coupon không hợp lệ không được giảm giá. | Bước 5 |
| AF-05 | 4–5 | Nếu sử dụng điểm (UC-16/FR-18), hệ thống kiểm tra điểm hợp lệ và tính giảm trừ. | Bước 5 |
| AF-06 | 10–12 | Client gửi lại **cùng `Idempotency-Key` cho cùng `orderId`**: API trả lại kết quả giao dịch đã ghi nhận, không tạo giao dịch mới. | Bước 13 nếu kết quả thành công; nếu thất bại chuyển EF-05 |

## 5. Luồng ngoại lệ (Exception Flows)

| Mã | Tại bước | Tình huống | Kết quả và xử lý |
| --- | --- | --- | --- |
| EF-01 | 3, 6 | JWT hết hạn, thiếu hoặc sai | Từ chối tạo đơn (`401`), yêu cầu đăng nhập lại; không tạo đơn. |
| EF-02 | 1–2 | Giỏ hàng trống | Vô hiệu hóa nút checkout; hướng khách quay lại menu. |
| EF-03 | 7 | Dữ liệu sản phẩm, size, topping hoặc số lượng không hợp lệ | Backend báo lỗi validation; người dùng sửa giỏ; không tạo đơn. |
| EF-04 | 7–8 | Thiếu hàng/nguyên liệu hoặc xung đột cập nhật đồng thời | Transaction hoàn tác, không tạo đơn dở dang/không tiêu hao vượt tồn; báo khách sửa giỏ. |
| EF-05 | 11–12 | Ví/Thẻ mô phỏng trả thất bại | Lưu kết quả Payment, chuyển đơn `PAYMENT_FAILED`, giữ nguyên giỏ; hoàn tồn kho/điểm đã dùng theo logic hiện thực; hiển thị **Thử lại** và **Quay lại giỏ**. |
| EF-06 | 11 | `Idempotency-Key` đã gắn với **đơn khác** | API từ chối sử dụng lại khóa cho đơn khác, không xử lý thanh toán. |
| EF-07 | 8, 12 | Lỗi máy chủ/DB | Báo lỗi; transaction của thao tác bị lỗi được hoàn tác, không xác nhận thành công khi chưa có kết quả bền vững. |
| EF-08 | 10–13 | Mất phản hồi mạng, chưa rõ giao dịch thành công hay không | Không coi timeout là thất bại chắc chắn; cần kiểm tra kết quả đơn/giao dịch trước khi xác nhận. Mã nguồn hiện tại có khả năng tạo đơn và khóa mới nếu người dùng xác nhận lại, do đó **chống lặp chỉ được bảo đảm trong phạm vi cùng khóa/cùng đơn**. |

**Quy tắc thử lại cần thống nhất:** SRS (`AC-09.3`) mô tả thử lại thanh toán, còn báo cáo đối chiếu mã nguồn ghi nhận giao diện hiện tạo **đơn `PENDING` mới và khóa mới** khi người dùng xác nhận lại sau `PAYMENT_FAILED`. Tài liệu này mô tả hiện trạng tại EF-05/EF-08, không khẳng định hệ thống hiện đã thử lại trên cùng đơn. Nhóm cần chốt một quy tắc nhất quán trong SRS, sơ đồ trình tự và kiểm thử.

## 6. Tiêu chí chấp nhận để viết kiểm thử

Các tiêu chí dưới đây **truy vết về mã AC có sẵn trong SRS**, không tự đặt `AC-01` khác hệ thống mã hóa của SRS.

| Mã SRS | Điều kiện kiểm thử | Kết quả mong đợi |
| --- | --- | --- |
| AC-04.5, AC-04.6 | Giỏ có món / giỏ rỗng | Tổng tiền đúng; giỏ rỗng không cho checkout. |
| AC-07.1, AC-06.4 | JWT thiếu/sai/hết hạn | Không tạo đơn; yêu cầu xác thực lại. |
| AC-07.2 | Dữ liệu hoặc tồn kho không đáp ứng | API từ chối, không tạo đơn dở dang, tồn kho nhất quán. |
| AC-07.3, AC-07.4 | Tạo đơn thành công | Đơn `PENDING`, có `orderId`, `orderCode` và tổng tiền. |
| AC-08.1, AC-08.2 | Thanh toán mô phỏng thành công | Ghi Payment, đơn `PAID`, xóa giỏ và chuyển màn hình xác nhận. |
| AC-08.3 | Gửi cùng khóa cho cùng đơn hai lần | Chỉ ghi nhận/xử lý một giao dịch. |
| AC-09.1, AC-09.2, AC-09.3 | Thanh toán lỗi | Đơn `PAYMENT_FAILED`, giữ giỏ và có tùy chọn xử lý tiếp. |
| AC-10.1, AC-10.2 | Thanh toán thành công | Màn hình hiện mã đơn, `PAID`, thông tin món và điều hướng phù hợp. |
| AC-11.1, AC-11.2 | Xem lịch sử sau thanh toán | Khách xem được đơn thuộc tài khoản mình. |

## 7. Ma trận liên kết Use-case – yêu cầu – API

| Use-case theo sơ đồ tổng quát | Yêu cầu SRS | API / Thành phần | Vai trò trong Task 1.3 |
| --- | --- | --- | --- |
| UC-06 – Quản lý giỏ hàng | FR-04; FR-16 (Should) | Zustand/localStorage phía web | Chuẩn bị giỏ; giữ/xóa giỏ theo kết quả |
| UC-09 – Đăng nhập & JWT | FR-06 | `POST /auth/login`; JWT Guard | Tiền điều kiện / AF-01 |
| **UC-11 – Tạo đơn hàng** | **FR-07** | `POST /orders` | Luồng chính |
| UC-12 – Kiểm tra dữ liệu & tồn kho | FR-07; NFR-08 | OrdersService, transaction/InventoryService | `include` của UC-11 |
| **UC-13 – Thanh toán mô phỏng** | **FR-08** | `POST /payments` | Luồng chính |
| UC-14 – Xử lý thanh toán chống lặp | FR-08; NFR-08 | PaymentsService / `Idempotency-Key` | `include` của UC-13 |
| UC-15 – Khuyến mãi | FR-17 (Should) | Kiểm tra coupon phía backend | `extend` của UC-11 |
| UC-16 – Điểm thưởng | FR-18 (Could) | Loyalty phía backend | `extend` của UC-13 |
| UC-17 – Thanh toán thất bại | FR-09; NFR-09 | Payment + trạng thái đơn + client cart | `extend` của UC-13 khi thất bại |
| UC-18 – Xem xác nhận | FR-10 | Giao diện xác nhận đơn | `extend` của UC-13 khi thành công |
| UC-21 – Lịch sử đơn | FR-11 | `GET /orders/me` | Sau khi hoàn thành |

## 8. Quy tắc nghiệp vụ và giới hạn phạm vi

1. **Xác thực:** `POST /orders` chỉ chấp nhận người dùng có JWT hợp lệ. Đăng nhập là tiền điều kiện, không phải bước bắt buộc `include` cho mọi lần checkout.
2. **Giá và tồn kho:** Backend xác minh dữ liệu, tính lại giá và kiểm soát tồn kho trong transaction; client không quyết định tổng tiền cuối cùng.
3. **Trạng thái:** `PENDING → PAID` khi thanh toán thành công; nhánh lỗi `PENDING → PAYMENT_FAILED`. Các trạng thái pha chế (`PREPARING`, `READY`, `COMPLETED`) thuộc nghiệp vụ tiếp theo, không phải bước checkout.
4. **Idempotency:** Khóa thanh toán chỉ bảo đảm chống lặp cho cùng khóa và cùng đơn; không suy rộng thành chống tạo hai đơn nếu client gửi lại toàn bộ checkout với khóa mới.
5. **Phạm vi:** Chỉ mô phỏng ví/thẻ; không thu tiền thật (FR-19); không triển khai native app (FR-20) hay phân phối shipper (FR-21) trong phạm vi nghiệp vụ này.
6. **Quan hệ UML:** `include` cho xác minh đơn và xử lý giao dịch bắt buộc; `extend` cho khuyến mãi, điểm thưởng, thanh toán thất bại và hiển thị xác nhận theo điều kiện. Các UC khác như xem giỏ, lịch sử được nối trực tiếp với actor, không ép thành bước con bắt buộc.

## 9. Sơ đồ Use-case chi tiết

Tệp PlantUML **`BrewLite_DatVaThanhToan.puml`** mô tả phạm vi UC-11/UC-13 và các UC liên quan, sử dụng **đen trắng** phù hợp khi chèn báo cáo. Các số UC lấy nguyên từ sơ đồ tổng quát `use-case-overall.puml`.

*Hình 1.3 – Use-case diagram cho nghiệp vụ Đặt và thanh toán đơn hàng của BrewLite.*
