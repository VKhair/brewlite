# BẢNG ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS - SOFTWARE REQUIREMENTS SPECIFICATION)

> **Dự án:** BrewLite - Nền tảng đặt đồ uống trực tuyến không dùng tiền mặt (Mobile-First / PWA)  
> **Học phần:** Đồ án Công nghệ Phần mềm (Assignment 2)  
> **Tác giả:** Nhóm phát triển BrewLite  
> **Phiên bản:** 1.0  
> **Ngày lập:** Tháng 11/2026  
> **Tài liệu tham chiếu:** [`docs/requirements/context-and-scope.md`](./context-and-scope.md)

---

## 1. Giới thiệu tổng quan

### 1.1. Mục đích tài liệu
Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS) này định nghĩa toàn bộ các yêu cầu chức năng (Functional Requirements - FR) và yêu cầu phi chức năng (Non-Functional Requirements - NFR) cho hệ thống **BrewLite**. 
Tài liệu đóng vai trò làm chuẩn cơ sở (baseline) để:
1. Nhóm phát triển (Frontend, Backend, Database) triển khai đúng nghiệp vụ và đúng kiến trúc.
2. Bộ phận QA/Test thiết kế các ca kiểm thử (Unit, Integration, E2E Test) và đối chiếu kết quả.
3. Giảng viên và bên nghiệm thu đánh giá mức độ hoàn thiện của sản phẩm phần mềm theo cam kết phạm vi.
4. Thiết lập quan hệ truy vết yêu cầu (Traceability) xuyên suốt qua các tạo phẩm thiết kế, mã nguồn và kiểm thử.

### 1.2. Quy ước mã định danh (Identification Conventions)
Để đảm bảo tính nhất quán và khả năng truy vết trong toàn bộ hệ thống tài liệu:
- `FR-xx`: Yêu cầu chức năng (Functional Requirement), trong đó `xx` là số thứ tự 2 chữ số (`FR-01`, `FR-02`,...).
- `NFR-xx`: Yêu cầu phi chức năng (Non-Functional Requirement), trong đó `xx` là số thứ tự 2 chữ số (`NFR-01`, `NFR-02`,...).
- `AC-xx.y`: Tiêu chí chấp nhận (Acceptance Criteria) thứ `y` của yêu cầu chức năng `FR-xx`.

### 1.3. Khung phân loại ưu tiên MoSCoW
Hệ thống yêu cầu được phân loại theo thang đo MoSCoW nhằm xác định rõ lộ trình phát triển qua 2 Sprint:
- **Must-have (M):** Các yêu cầu cốt lõi bắt buộc phải có để hệ thống hoạt động được trong phạm vi MVP (Minimum Viable Product). Nếu thiếu bất kỳ yêu cầu Must-have nào, hệ thống xem như chưa đạt điều kiện nghiệm thu.
- **Should-have (S):** Các yêu cầu quan trọng, gia tăng trải nghiệm người dùng và tính toàn vẹn hệ thống, được ưu tiên hoàn thiện trong Sprint 2 sau khi các chức năng Must-have đã chạy ổn định.
- **Could-have (C):** Các tính năng nâng cao, có giá trị gia tăng nhưng có thể hoãn lại nếu nguồn lực và thời gian có hạn.
- **Won't-have (W):** Các tính năng được xác định rõ ràng nằm ngoài phạm vi MVP của đồ án lần này (đã được thống nhất tại mục 1.4.3 tài liệu `context-and-scope.md`).

---

## 2. Bảng tổng hợp Yêu cầu Chức năng (Functional Requirements - FR) theo MoSCoW

| Mã Yêu Cầu | Tên Yêu Cầu Chức Năng | Nhóm Nghiệp Vụ Tối Thiểu | MoSCoW | Sprint Mục Tiêu | Thành Phần Triển Khai |
|---|---|---|---|---|---|
| **FR-01** | Hiển thị danh mục đồ uống (Menu Catalog) | Menu | **Must-have** | Sprint 1 | Backend (API) + Frontend (Web) |
| **FR-02** | Xem thông tin chi tiết đồ uống | Chi tiết sản phẩm | **Must-have** | Sprint 1 (API) / Sprint 2 (UI) | Backend (API) + Frontend (Web) |
| **FR-03** | Tùy biến món (Kích cỡ Size và Topping) | Chi tiết sản phẩm | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-04** | Quản lý giỏ hàng (Thêm, Sửa số lượng, Xóa món, Tính tổng tiền) | Giỏ hàng | **Must-have** | Sprint 2 | Frontend (Web) |
| **FR-05** | Đăng ký tài khoản người dùng | Xác thực | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-06** | Đăng nhập và Xác thực phiên (JWT) | Xác thực | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-07** | Tạo đơn hàng (Checkout) & Kiểm soát tồn kho đồng thời | Đặt đơn | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-08** | Xử lý thanh toán qua Cổng thanh toán mô phỏng (Mock Payment) | Thanh toán | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-09** | Xử lý giao dịch thanh toán thất bại và Bảo toàn giỏ hàng | Thanh toán | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-10** | Hiển thị xác nhận đơn hàng và mã tra cứu | Quản lý trạng thái đơn | **Must-have** | Sprint 2 | Frontend (Web) |
| **FR-11** | Xem danh sách lịch sử đơn hàng của người dùng | Lịch sử đơn | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-12** | Xem chi tiết trạng thái vòng đời đơn hàng đã đặt | Quản lý trạng thái đơn | **Must-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-13** | Kiểm tra sức khỏe hệ thống (Health Check API) | Khả năng triển khai | **Must-have** | Sprint 2 | Backend (API) + DevOps |
| **FR-14** | Tìm kiếm sản phẩm theo tên và Lọc theo danh mục | Menu | **Should-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-15** | Hủy đơn hàng ở trạng thái chờ thanh toán | Quản lý trạng thái đơn | **Should-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-16** | Lưu giỏ hàng tạm thời vào bộ nhớ cục bộ (Local Storage Persistence) | Giỏ hàng | **Should-have** | Sprint 2 | Frontend (Web) |
| **FR-17** | Áp dụng mã khuyến mãi giảm giá (Promotion Discount) | Đặt đơn & Thanh toán | **Should-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-18** | Tích lũy và sử dụng điểm thưởng thành viên (Loyalty Program) | Đặt đơn & Thanh toán | **Could-have** | Sprint 2 | Backend (API) + Frontend (Web) |
| **FR-19** | Thanh toán tiền thật qua cổng ngân hàng/VNPAY/MoMo | Thanh toán thực tế | **Won't-have** | Ngoài phạm vi | - |
| **FR-20** | Ứng dụng di động độc lập (Native iOS/Android App trên Store) | Nền tảng | **Won't-have** | Ngoài phạm vi | - |
| **FR-21** | Hệ thống định vị shipper và phân phối giao vận | Vận chuyển | **Won't-have** | Ngoài phạm vi | - |

---

## 3. Đặc tả chi tiết Yêu cầu Chức năng và Tiêu chí Chấp nhận (Acceptance Criteria)

### FR-01: Hiển thị danh mục đồ uống (Menu Catalog)
- **Tác nhân:** Khách hàng (Guest, Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 1
- **Mô tả:** Hệ thống cung cấp danh sách toàn bộ các sản phẩm đồ uống đang kinh doanh tại quán, hiển thị rõ ràng hình ảnh minh họa, tên đồ uống, giá niêm yết cơ sở (Base Price) và danh mục (Cà phê, Trà, Freeze,...).
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-01.1 (Dữ liệu trả về từ API):** Khi gọi `GET /products`, hệ thống trả về HTTP 200 OK kèm danh sách JSON các sản phẩm có trạng thái `isAvailable: true`, mỗi sản phẩm gồm: `id`, `name`, `description`, `basePrice`, `imageUrl`, `category`.
  - **AC-01.2 (Hiển thị giao diện Mobile-first):** Danh sách sản phẩm hiển thị dạng lưới/danh sách chuẩn di động (tối ưu responsive), có hình ảnh sắc nét, tên sản phẩm không bị tràn chữ, giá hiển thị định dạng VND rõ ràng (ví dụ: `45.000 đ`).
  - **AC-01.3 (Trạng thái Loading):** Trong khi đang chờ dữ liệu từ API, giao diện hiển thị hiệu ứng khung xương (Skeleton loader) hoặc vòng xoay tải trang, không gây vỡ giao diện.
  - **AC-01.4 (Trạng thái Rỗng / Empty State):** Nếu quán chưa có sản phẩm nào hoặc không có sản phẩm khả dụng, giao diện hiển thị thông báo thân thiện: "Hiện chưa có sản phẩm nào, vui lòng quay lại sau".
  - **AC-01.5 (Trạng thái Lỗi / Error State):** Nếu mất kết nối máy chủ hoặc API lỗi (500/503), màn hình hiển thị thông báo lỗi rõ ràng kèm nút "Thử lại" (Retry button) để tải lại dữ liệu.

---

### FR-02: Xem thông tin chi tiết đồ uống
- **Tác nhân:** Khách hàng (Guest, Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 1 (API) / Sprint 2 (UI)
- **Mô tả:** Khi khách hàng bấm vào một sản phẩm trên menu, hệ thống hiển thị trang/hộp thoại chi tiết sản phẩm, gồm mô tả chi tiết, hình ảnh phóng to, giá gốc và các danh mục tùy chọn có sẵn.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-02.1 (API chi tiết sản phẩm):** Khi gọi `GET /products/:id`, nếu `id` hợp lệ, API trả về HTTP 200 OK với đầy đủ thông tin chi tiết và danh sách cấu hình Size, Topping hợp lệ; nếu `id` không tồn tại, trả về HTTP 404 Not Found kèm thông báo `Product not found`.
  - **AC-02.2 (Trình bày chi tiết):** Giao diện hiển thị đầy đủ: tên đồ uống, mô tả nguyên liệu, hình ảnh chất lượng cao và giá khởi điểm.
  - **AC-02.3 (Điều hướng):** Người dùng có thể dễ dàng quay lại danh mục sản phẩm bằng nút Back mà không mất trạng thái duyệt web trước đó.

---

### FR-03: Tùy biến món (Kích cỡ Size và Topping)
- **Tác nhân:** Khách hàng (Guest, Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Khách hàng có thể lựa chọn kích cỡ (Size S, M, L) và chọn thêm một hoặc nhiều loại Topping (Trân châu trắng, Thạch cà phê, Kem phô mai macchiato, Đào miếng...). Giá của món sẽ được tự động cộng dồn theo thời gian thực (Realtime price calculation) theo công thức:  
  $$\text{Đơn giá} = \text{Giá cơ sở (Base Price)} + \Delta\text{Giá Size} + \sum \Delta\text{Giá Topping}$$
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-03.1 (Lựa chọn kích cỡ duy nhất):** Khách hàng chỉ được chọn duy nhất 1 kích cỡ cho mỗi món (Radio buttons). Mặc định hệ thống chọn sẵn Size tiêu chuẩn (Size M). Giá hiển thị trên nút thêm vào giỏ lập tức cập nhật tương ứng khi đổi Size.
  - **AC-03.2 (Lựa chọn nhiều topping):** Khách hàng có thể chọn 0, 1 hoặc nhiều loại topping (Checkboxes). Mỗi topping hiển thị rõ tên và giá cộng thêm (ví dụ: `+ 10.000 đ`).
  - **AC-03.3 (Điều chỉnh số lượng):** Cho phép tăng/giảm số lượng món muốn đặt (tối thiểu là 1, tối đa là 99 cho mỗi dòng sản phẩm). Tổng tiền tạm tính = $\text{Đơn giá} \times \text{Số lượng}$.
  - **AC-03.4 (Topping hết hàng):** Nếu một loại topping được đánh dấu là hết hàng (`isAvailable: false`), lựa chọn đó bị vô hiệu hóa (disabled) trên giao diện và kèm nhãn "Hết hàng".

---

### FR-04: Quản lý giỏ hàng (Cart Management)
- **Tác nhân:** Khách hàng (Guest, Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Giỏ hàng là nơi lưu giữ các món đồ uống khách hàng đã chọn kèm theo tùy biến chi tiết. Khách hàng có thể kiểm tra danh sách món, điều chỉnh số lượng, xóa từng món, xóa toàn bộ giỏ và xem tổng tiền cần thanh toán.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-04.1 (Thêm vào giỏ):** Khi bấm "Thêm vào giỏ", sản phẩm kèm đúng các tùy chọn (Size, Topping, Ghi chú) được đưa vào giỏ. Nếu thêm cùng một sản phẩm có **chính xác cùng cấu hình Size và Topping**, hệ thống tự động cộng dồn số lượng thay vì tạo dòng mới. Nếu khác Size hoặc khác Topping, tách thành 2 dòng riêng biệt.
  - **AC-04.2 (Phản hồi thị giác tức thì):** Khi thêm món thành công, biểu tượng giỏ hàng trên thanh điều hướng cập nhật số lượng (badge count) kèm thông báo toast ngắn (ví dụ: "Đã thêm vào giỏ hàng").
  - **AC-04.3 (Cập nhật số lượng tại giỏ):** Trong màn hình giỏ hàng, người dùng có thể bấm nút `+` hoặc `-` để tăng giảm số lượng. Khi giảm từ 1 xuống 0, hệ thống hỏi xác nhận xóa món khỏi giỏ hàng.
  - **AC-04.4 (Xóa món):** Cung cấp nút xóa từng món. Có nút "Xóa tất cả" để làm trống giỏ hàng kèm hộp thoại xác nhận.
  - **AC-04.5 (Tính tổng tiền chính xác tuyệt đối):** Tổng tiền giỏ hàng phải bằng tổng thành tiền của từng món con. Không được có lỗi làm tròn số thập phân. Hiển thị rõ tổng số lượng ly và tổng số tiền thanh toán (VND).
  - **AC-04.6 (Giỏ hàng rỗng):** Nếu giỏ hàng không có sản phẩm, hiển thị màn hình Empty Cart kèm thông điệp "Giỏ hàng của bạn đang trống" và nút bấm "Khám phá menu ngay" dẫn về trang chủ. Nút "Tiến hành đặt hàng" bị vô hiệu hóa khi giỏ hàng rỗng.

---

### FR-05: Đăng ký tài khoản người dùng
- **Tác nhân:** Khách vãng lai (Guest Customer)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Cho phép người dùng mới tạo tài khoản trên hệ thống bằng Email làm định danh tài khoản duy nhất, cùng với Họ tên và Mật khẩu bảo mật. Khách hàng có thể cung cấp thêm số điện thoại liên hệ nhận đồ uống (tùy chọn).
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-05.1 (Validate dữ liệu đầu vào phía Client & Server):**
    - Email: Bắt buộc, đúng định dạng chuẩn RFC 5322 (ví dụ: `user@example.com`).
    - Mật khẩu: Bắt buộc, độ dài tối thiểu 6 ký tự, yêu cầu có cả chữ và số để đảm bảo an toàn.
    - Họ tên: Bắt buộc, độ dài từ 2 đến 50 ký tự.
    - Số điện thoại: Tùy chọn, nếu có cung cấp thì phải đúng định dạng số điện thoại Việt Nam (10 chữ số, bắt đầu bằng `03, 05, 07, 08, 09`).
  - **AC-05.2 (Kiểm tra trùng lặp email duy nhất):** Khi gọi `POST /auth/register` với payload `{ email, password, fullName, phone? }`, nếu email đã tồn tại trong hệ thống, máy chủ trả về HTTP 409 Conflict với thông báo: `Email đã được đăng ký`.
  - **AC-05.3 (Mã hóa mật khẩu):** Mật khẩu người dùng bắt buộc phải được băm bằng thuật toán `bcrypt` (với `salt rounds >= 10`) trước khi ghi vào cơ sở dữ liệu. Tuyệt đối không lưu plaintext.
  - **AC-05.4 (Đăng ký thành công):** Hệ thống trả về HTTP 201 Created, tự động đăng nhập hoặc chuyển hướng người dùng đến màn hình Đăng nhập kèm thông báo thành công.

---

### FR-06: Đăng nhập và Xác thực phiên (JWT Authentication)
- **Tác nhân:** Khách hàng (Guest, Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Người dùng đăng nhập vào hệ thống bằng Email và Mật khẩu đã đăng ký để nhận mã thông báo xác thực JSON Web Token (JWT), duy trì phiên làm việc cho các thao tác đặt hàng và tra cứu lịch sử.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-06.1 (Xác thực thông tin đăng nhập):** Gọi `POST /auth/login` với `{ email, password }`. Nếu thông tin chính xác, server trả về HTTP 200 OK kèm mã `access_token` (JWT) và thông tin cơ bản của người dùng (`id`, `fullName`, `email`, `role`).
  - **AC-06.2 (Xử lý sai thông tin đăng nhập):** Nếu sai email hoặc mật khẩu, server trả về HTTP 401 Unauthorized kèm thông báo chung `Thông tin đăng nhập không chính xác` (không phân biệt rõ sai email hay sai password để chống dò quét tài khoản).
  - **AC-06.3 (Lưu trữ phiên an toàn):** Client lưu trữ JWT an toàn, tự động đính kèm `Authorization: Bearer <token>` vào tiêu đề của tất cả các yêu cầu gọi API yêu cầu bảo mật.
  - **AC-06.4 (Xử lý hết hạn phiên):** Token có thời hạn sống xác định (ví dụ: 1 ngày theo cấu hình `.env`). Khi token hết hạn hoặc không hợp lệ, hệ thống tự động xóa token ở client, hiển thị thông báo phiên làm việc đã hết hạn và điều hướng người dùng về trang Đăng nhập.
  - **AC-06.5 (Đăng xuất):** Người dùng bấm "Đăng xuất" sẽ xóa bỏ token khỏi máy khách, đưa hệ thống về trạng thái Khách vãng lai.

---

### FR-07: Tạo đơn hàng (Checkout) & Kiểm soát tồn kho đồng thời
- **Tác nhân:** Khách hàng đã đăng nhập (Member Customer)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Khách hàng gửi thông tin giỏ hàng để khởi tạo đơn hàng. Máy chủ thực hiện kiểm tra dữ liệu, tính toán lại tổng tiền từ DB và kiểm soát số lượng tồn kho (`stock`) bằng cơ chế Transaction kết hợp Optimistic Locking để chống bán vượt số lượng (overselling) khi nhiều khách đặt đồng thời.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-07.1 (Bắt buộc xác thực):** Người dùng phải đăng nhập trước khi tạo đơn hàng (được bảo vệ bởi JWT Guard).
  - **AC-07.2 (Kiểm tra dữ liệu & Kiểm soát tồn kho):** Khi client gửi `POST /orders`, server kiểm tra:
    - Sản phẩm, Size, Topping hợp lệ và đang khả dụng (`isAvailable: true`).
    - Số lượng đặt không vượt quá số lượng tồn kho còn lại (`stock`).
    - Sử dụng Database Transaction + Optimistic Locking để đảm bảo tính nhất quán dữ liệu khi nhiều người dùng đặt mua cùng một sản phẩm tại cùng một thời điểm.
  - **AC-07.3 (Khởi tạo trạng thái đơn hàng):** Đơn hàng được tạo với trạng thái ban đầu là `PENDING`. Mã đơn hàng được sinh duy nhất (ví dụ: `#BL-1042`).
  - **AC-07.4 (Kết quả trả về):** Máy chủ trả về HTTP 201 Created kèm thông tin đơn hàng vừa tạo (`orderId`, `orderCode`, `totalAmount`, `status: PENDING`, `createdAt`).

---

### FR-08: Xử lý thanh toán qua Cổng thanh toán mô phỏng (Mock Payment)
- **Tác nhân:** Khách hàng (Member), Cổng thanh toán mô phỏng (Mock Payment Gateway)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Khách hàng thanh toán không dùng tiền mặt (chọn Ví điện tử hoặc Thẻ ngân hàng) qua cổng mô phỏng. Khi thanh toán thành công, đơn chuyển trạng thái sang `PAID`.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-08.1 (Gửi yêu cầu thanh toán idempotent):** Client gọi API `POST /payments` với payload gồm `orderId`, `paymentMethod` (EWALLET / CARD), và tiêu đề/payload kèm `Idempotency-Key` (UUID v4).
  - **AC-08.2 (Thanh toán thành công - Happy Path):**
    - Cổng thanh toán mô phỏng xử lý thành công, hệ thống chuyển trạng thái đơn hàng từ `PENDING` sang `PAID`.
    - Giỏ hàng của người dùng được dọn sạch.
    - Chuyển hướng sang màn hình xác nhận đơn hàng thành công.
  - **AC-08.3 (Chống lặp thanh toán - Idempotent):** Gửi 2 lần cùng một `Idempotency-Key` chỉ tạo/xử lý 1 giao dịch duy nhất, không bị trừ tiền hoặc lặp đơn 2 lần.

---

### FR-09: Xử lý giao dịch thanh toán thất bại và Bảo toàn giỏ hàng
- **Tác nhân:** Khách hàng (Member), Cổng thanh toán mô phỏng
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Khi thanh toán lỗi (thẻ hết hạn, không đủ số dư, timeout), hệ thống chuyển đơn sang trạng thái `PAYMENT_FAILED` và **giữ nguyên giỏ hàng** để khách hàng có thể chọn thanh toán lại ngay.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-09.1 (Ghi nhận trạng thái lỗi):** Khi cổng thanh toán trả về lỗi, hệ thống cập nhật trạng thái đơn thành `PAYMENT_FAILED`.
  - **AC-09.2 (Bảo toàn giỏ hàng):** Giỏ hàng phía Client **không bị xóa**, toàn bộ danh sách món và tùy chọn được giữ nguyên.
  - **AC-09.3 (Tùy chọn xử lý):** Hiển thị màn hình thông báo lỗi kèm 2 lựa chọn: "Thử lại thanh toán" (chuyển lại `PENDING` $\rightarrow$ `PAID`) hoặc "Quay lại giỏ hàng".

---

### FR-10: Hiển thị xác nhận đơn hàng và mã tra cứu
- **Tác nhân:** Khách hàng (Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Sau khi thanh toán thành công, hiển thị màn hình xác nhận đơn với đầy đủ mã đơn, trạng thái `PAID` và thông điệp nhận đồ uống tại quầy.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-10.1 (Nội dung hiển thị chuẩn Wireframe):**
    - Biểu tượng thành công.
    - Thông tin: "Đặt hàng thành công. Mã đơn: #1042. Trạng thái: PAID. Mời tới quầy lấy nước."
    - Bảng chi tiết món: Tên, size, topping, số lượng, thành tiền và tổng thanh toán.
  - **AC-10.2 (Điều hướng):** Cung cấp nút "Về trang chủ" và nút "Theo dõi tiến trình đơn hàng".

---

### FR-11: Xem danh sách lịch sử đơn hàng của người dùng
- **Tác nhân:** Khách hàng đã đăng nhập (Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Khách hàng có thể truy cập trang lịch sử đơn hàng để xem toàn bộ các đơn hàng đã đặt của tài khoản mình.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-11.1 (API lịch sử đơn hàng):** Gọi `GET /orders/me` kèm JWT token, API trả về danh sách các đơn hàng của chính tài khoản đăng nhập (sắp xếp mới nhất lên đầu).
  - **AC-11.2 (Thông tin thẻ đơn hàng):** Hiển thị mã đơn, ngày giờ tạo, tóm tắt đồ uống, tổng tiền và nhãn trạng thái trực quan.
  - **AC-11.3 (Trạng thái rỗng):** Nếu chưa có đơn hàng, hiển thị Empty state kèm nút "Khám phá menu ngay".

---

### FR-12: Xem chi tiết trạng thái vòng đời đơn hàng (Order State Machine)
- **Tác nhân:** Khách hàng đã đăng nhập (Member)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2
- **Mô tả:** Xem tiến trình xử lý đơn hàng tuân theo Sơ đồ Máy trạng thái (Order State Machine) chuẩn: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED` (và các nhánh ngoại lệ `PAYMENT_FAILED` có thể thử lại, `CANCELLED` hủy đơn).
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-12.1 (API chi tiết đơn):** Khi gọi `GET /orders/:id`, hệ thống trả về thông tin chi tiết và trạng thái hiện tại của đơn hàng.
  - **AC-12.2 (Ràng buộc chuyển trạng thái hợp lệ):** Hệ thống thực thi hàm kiểm soát chuyển trạng thái (`assertTransition`); mọi hành vi chuyển trạng thái trái phép (ví dụ từ `PENDING` nhảy thẳng lên `COMPLETED`) đều bị chặn và trả về lỗi nghiệp vụ.
  - **AC-12.3 (Thanh trạng thái trực quan):** Giao diện hiển thị thanh tiến trình trực quan theo các nấc: Đã đặt (`PENDING`) $\rightarrow$ Đã thanh toán (`PAID`) $\rightarrow$ Đang pha chế (`PREPARING`) $\rightarrow$ Sẵn sàng lấy nước (`READY`) $\rightarrow$ Hoàn tất (`COMPLETED`).

---

### FR-13: Kiểm tra sức khỏe hệ thống (Health Check API)
- **Tác nhân:** Hệ thống giám sát, CI/CD Pipeline, Quản trị hệ thống (DevOps)
- **Mức độ ưu tiên:** Must-have | **Sprint:** 2 (Task 5.2)
- **Mô tả:** Cung cấp endpoint độc lập để kiểm tra tính sẵn sàng hoạt động của ứng dụng backend và khả năng kết nối cơ sở dữ liệu PostgreSQL. Phục vụ cho Smoke test sau triển khai và giám sát uptime.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-13.1 (Phản hồi khi hệ thống bình thường):** Khi gửi yêu cầu `GET /health` (không cần token xác thực), nếu máy chủ API chạy bình thường và kết nối Database thành công, trả về HTTP 200 OK với body JSON chuẩn:
    ```json
    {
      "status": "ok",
      "timestamp": "2026-11-07T10:00:00.000Z",
      "database": "connected",
      "uptime": 12450.5
    }
    ```
  - **AC-13.2 (Phản hồi khi mất kết nối Database):** Nếu cơ sở dữ liệu PostgreSQL bị ngắt kết nối hoặc lỗi truy vấn, endpoint trả về HTTP 503 Service Unavailable kèm chi tiết:
    ```json
    {
      "status": "error",
      "database": "disconnected",
      "message": "Database connection pool exhausted or unreachable"
    }
    ```
  - **AC-13.3 (Tốc độ phản hồi):** Endpoint `GET /health` phản hồi nhanh trong thời gian dưới 200ms trong điều kiện kết nối mạng nội bộ ổn định.

---

### FR-14: Tìm kiếm sản phẩm theo tên và Lọc theo danh mục
- **Tác nhân:** Khách hàng (Guest, Member)
- **Mức độ ưu tiên:** Should-have | **Sprint:** 2
- **Mô tả:** Giúp khách hàng nhanh chóng tìm thấy đồ uống yêu thích thông qua thanh tìm kiếm theo từ khóa hoặc các nút lọc theo danh mục đồ uống.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-14.1 (Lọc danh mục):** Khi nhấn vào các tab danh mục ("Tất cả", "Cà phê", "Trà trái cây", "Đá xay Freeze"), danh sách lập tức lọc chỉ hiển thị các sản phẩm thuộc danh mục được chọn.
  - **AC-14.2 (Tìm kiếm theo từ khóa):** Cho phép nhập từ khóa tên món (hỗ trợ tiếng Việt không dấu và có dấu, ví dụ gõ "bac xiu" vẫn tìm ra "Bạc sỉu"). Phản hồi kết quả sau debounce 300ms.
  - **AC-14.3 (Không tìm thấy kết quả):** Hiển thị thông báo "Không tìm thấy đồ uống phù hợp với từ khóa '{keyword}'" nếu không có kết quả.

---

### FR-15: Hủy đơn hàng ở trạng thái chờ thanh toán
- **Tác nhân:** Khách hàng đã đăng nhập (Member)
- **Mức độ ưu tiên:** Should-have | **Sprint:** 2
- **Mô tả:** Khách hàng có thể chủ động hủy đơn hàng đã tạo nếu đơn hàng đó vẫn đang ở trạng thái `PENDING` (chưa thanh toán) và khách hàng không còn nhu cầu tiếp tục đơn hàng.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-15.1 (Ràng buộc trạng thái cho phép hủy):** Khách hàng chỉ được phép hủy trên giao diện khi trạng thái đơn là `PENDING`. Nếu đơn đã chuyển sang `PAID`, `PREPARING`, `READY` hoặc `COMPLETED`, nút "Hủy đơn" phía khách hàng bị ẩn hoặc vô hiệu hóa.
  - **AC-15.2 (Xác nhận hủy):** Hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn hủy đơn hàng này?".
  - **AC-15.3 (Cập nhật trạng thái):** Sau khi xác nhận, gọi `PATCH /orders/:id/cancel`. Server kiểm tra và cập nhật trạng thái đơn thành `CANCELLED`. Trả về HTTP 200 OK.

---

### FR-16: Lưu giỏ hàng tạm thời vào bộ nhớ cục bộ (Local Storage Persistence)
- **Tác nhân:** Khách hàng (Guest, Member)
- **Mức độ ưu tiên:** Should-have | **Sprint:** 2
- **Mô tả:** Giỏ hàng của khách hàng được đồng bộ tự động vào `localStorage` của trình duyệt để tránh mất mát dữ liệu khi tải lại trang (F5) hoặc vô tình đóng trình duyệt.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-16.1 (Tự động lưu):** Bất kỳ thao tác thêm, sửa số lượng, đổi topping, xóa món nào cũng tự động ghi nhận vào `localStorage` với khóa `brewlite_cart`.
  - **AC-16.2 (Tự động khôi phục):** Khi mở lại trang web, giỏ hàng tự động khôi phục chính xác các món đã chọn trước đó.
  - **AC-16.3 (Đồng bộ sau checkout):** Khi thanh toán thành công, `localStorage` được xóa sạch để tránh hiển thị lại giỏ cũ.

---

### FR-17: Áp dụng mã khuyến mãi giảm giá (Promotion Discount)
- **Tác nhân:** Khách hàng đã đăng nhập (Member)
- **Mức độ ưu tiên:** Should-have | **Sprint:** 2
- **Mô tả:** Khách hàng có thể nhập mã voucher khuyến mãi (Promotion Code) tại bước Checkout để được giảm giá đơn hàng theo tỷ lệ phần trăm hoặc số tiền cố định. Liên kết trực tiếp với lớp domain `Promotion` trong Class diagram.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-17.1 (Kiểm tra mã hợp lệ):** Khi gọi `POST /promotions/validate`, hệ thống kiểm tra mã có tồn tại, còn hạn sử dụng, đạt giá trị đơn hàng tối thiểu và chưa hết lượt dùng.
  - **AC-17.2 (Tính toán tiền giảm):** Nếu hợp lệ, hệ thống tính số tiền được giảm và trừ trực tiếp vào tổng tiền thanh toán của đơn hàng.
  - **AC-17.3 (Mã không hợp lệ):** Nếu mã hết hạn hoặc sai, hiển thị thông báo lỗi rõ ràng và giữ nguyên giá trị đơn hàng gốc.

---

### FR-18: Tích lũy và sử dụng điểm thưởng thành viên (Loyalty Program)
- **Tác nhân:** Khách hàng đã đăng nhập (Member)
- **Mức độ ưu tiên:** Could-have | **Sprint:** 2
- **Mô tả:** Hệ thống hỗ trợ cơ chế tích lũy điểm thưởng khi đơn hàng thanh toán thành công và cho phép khách hàng sử dụng điểm tích lũy để giảm trừ thanh toán cho các đơn hàng tiếp theo.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - **AC-18.1 (Tích điểm tự động):** Mỗi đơn hàng hoàn tất (`PAID`) được cộng điểm tích lũy theo tỷ lệ 1% giá trị đơn hàng vào trường `User.loyaltyPoints`.
  - **AC-18.2 (Lưu vết giao dịch điểm):** Mọi biến động cộng hoặc trừ điểm đều được lưu trong bảng `LoyaltyTransaction` liên kết với `User` và `Order` để phục vụ đối soát.
  - **AC-18.3 (Sử dụng điểm giảm trừ thanh toán):** Khách hàng có thể lựa chọn dùng số điểm thưởng hiện có để giảm trừ vào tổng tiền thanh toán của đơn hàng (với tỷ lệ quy đổi quy định, ví dụ 100 điểm = 1.000 đ); số điểm sử dụng được trừ khỏi `loyaltyPoints` và ghi nhận giao dịch giảm điểm.

---

## 4. Đặc tả Yêu cầu Phi Chức Năng (Non-Functional Requirements - NFR)

Hệ thống yêu cầu phi chức năng xác lập các tiêu chuẩn kỹ thuật nghiêm ngặt về hiệu năng vận hành, độ an toàn bảo mật, tính toàn vẹn dữ liệu, trải nghiệm người dùng trên thiết bị di động và khả năng đóng gói triển khai tự động của nền tảng BrewLite.

| Mã Yêu Cầu | Nhóm Phân Loại | Yêu Cầu Kỹ Thuật Cụ Thể | Tiêu Chuẩn & Chỉ Số Đo Lường | Điều Kiện Đo Lường & Tiêu Chí Nghiệm Thu |
|---|---|---|---|---|
| **NFR-01** | Hiệu năng (Performance) | Thời gian phản hồi API đọc danh mục đồ uống | Thời gian phản hồi $< 500\text{ ms}$ (chuẩn Assignment 1) | Đo trong môi trường kiểm thử với tập dữ liệu mẫu (tối thiểu 20 sản phẩm), kết nối mạng ổn định và máy chủ ở trạng thái sẵn sàng (warm state); không tính thời gian khởi động lạnh (cold start) trên dịch vụ đám mây miễn phí. |
| **NFR-02** | Hiệu năng (Performance) | Thời gian xử lý API nghiệp vụ tạo đơn & thanh toán | Thời gian phản hồi $< 1000\text{ ms}$ | Đo trên môi trường kiểm thử với các yêu cầu giao dịch đơn lẻ thông thường, kết nối cơ sở dữ liệu hoạt động ổn định. |
| **NFR-03** | Hiệu năng (Performance) | Tốc độ tải trang di động & tối ưu tài nguyên | First Contentful Paint (FCP) $\le 1.8\text{ s}$<br>Largest Contentful Paint (LCP) $\le 2.5\text{ s}$ | Đo bằng công cụ Google Lighthouse (giả lập thiết bị di động tầm trung trên mạng 4G tiêu chuẩn); gói mã nguồn ban đầu được chia nhỏ (code splitting) qua Next.js. |
| **NFR-04** | Bảo mật (Security) | Xác thực người dùng bằng JSON Web Token (JWT) | Chuẩn RFC 7519, thuật toán `HS256`, thời hạn `JWT_EXPIRES_IN=1d` | Mọi API yêu cầu quyền hạn (Tạo đơn, Lịch sử, Thanh toán) bắt buộc có Bearer Token hợp lệ. Token giả mạo hoặc hết hạn phải bị từ chối với mã HTTP 401 Unauthorized. |
| **NFR-05** | Bảo mật (Security) | Băm mật khẩu người dùng một chiều an toàn | Thuật toán `bcrypt` với Salt rounds $\ge 10$ | Không bao giờ lưu mật khẩu dạng văn bản thô (plaintext) trong database. Ngay cả quản trị viên trực tiếp xem bảng cơ sở dữ liệu cũng không thể dịch ngược được mật khẩu. |
| **NFR-06** | Bảo mật (Security) | Phòng chống lỗ hổng Injection và XSS | Parameterized Queries qua ORM, NestJS `ValidationPipe` whitelist | 100% dữ liệu gửi lên API đều được kiểm tra bằng `class-validator` với `{ whitelist: true, forbidNonWhitelisted: true }`. Đầu vào chứa mã SQL Injection hoặc HTML/script độc hại bị chặn ngay lập tức. |
| **NFR-07** | Bảo mật (Security) | Mã hóa đường truyền HTTPS & Quản lý an toàn bí mật | HTTPS / TLS, Database không public cổng 5432, Secrets qua biến môi trường | Đường truyền Production chạy qua HTTPS có chứng chỉ SSL hợp lệ do nền tảng triển khai cấp phát; cơ sở dữ liệu PostgreSQL chỉ nhận kết nối nội bộ trong mạng Private; secret không commit vào Git. |
| **NFR-08** | Độ tin cậy (Reliability) | Transaction ACID, Optimistic Locking & Idempotent Payment | DB Transaction `Read Committed`, Optimistic Locking (`stock`), Idempotency-Key (UUID v4), FSM assertTransition | (1) Đặt hàng đồng thời không vượt tồn kho nhờ Transaction + Optimistic Locking.<br>(2) Gửi trùng `Idempotency-Key` chỉ trừ tiền và ghi nhận đơn 1 lần duy nhất.<br>(3) Hàm `assertTransition` chặn đứng mọi hành vi nhảy cóc trạng thái đơn hàng. |
| **NFR-09** | Độ tin cậy (Reliability) | Khả năng phục hồi giỏ hàng khi sự cố giao dịch | Bảo toàn giỏ hàng cục bộ khi thanh toán lỗi | Khi cổng thanh toán mô phỏng phản hồi thất bại (`PAYMENT_FAILED`), giỏ hàng phía Client được giữ nguyên 100% để khách hàng có thể chọn thanh toán lại ngay. |
| **NFR-10** | Tính khả dụng (Usability) | Thiết kế ưu tiên di động (Mobile-First) và hỗ trợ PWA | Responsive $360\text{ px} - 1920\text{ px}$, nút $\ge 44\text{ px} \times 44\text{ px}$, Web App Manifest | Giao diện tối ưu trải nghiệm chạm trên điện thoại di động; hỗ trợ cài đặt lên màn hình chính (Add to Home Screen) dạng PWA kèm biểu tượng và màn hình chờ đồng bộ. |
| **NFR-11** | Tính khả dụng (Usability) | Đầy đủ 3 trạng thái giao diện chuẩn mực (UI States) | 100% màn hình có dữ liệu: Loading State, Empty State, Error State | Không để màn hình trắng (blank screen) trong bất kỳ trường hợp nào. Có thông báo lỗi bằng tiếng Việt kèm nút bấm thử lại (Retry) tiện lợi. |
| **NFR-12** | Khả năng triển khai & Vận hành (Deployability & DevOps) | Phân bổ rõ ràng theo Task 4 (Sprint 1) và Task 5 (Sprint 2) | **Sprint 1 (Task 4.4):** CI Gate tự động (Install $\rightarrow$ Lint $\rightarrow$ Test $\rightarrow$ Build)<br>**Sprint 2 (Task 5.2):** `docker-compose.yml` local & Health Check (`GET /health`)<br>**Sprint 2 (Task 5.3):** CD Pipeline tự động & Rollback $< 5\text{ phút}$ | (1) Sprint 1: Mọi PR vào `main` bắt buộc pass CI mới được merge.<br>(2) Sprint 2: Chạy toàn bộ hệ thống local bằng 1 lệnh `docker compose up`; `GET /health` phản hồi trạng thái kết nối DB.<br>(3) Sprint 2: Image gắn tag Git Commit SHA; cho phép rollback về phiên bản ổn định trước đó trong $< 5\text{ phút}$ nếu phát hiện lỗi sau deploy. |

---

## 5. Ma trận phân bổ Yêu cầu theo Sprint (Sprint Planning Alignment)

```
+----------------------------------------------------------------------------------------------------+
|                                    LỘ TRÌNH TRIỂN KHAI THEO SPRINT                                  |
+----------------------------------------------------------------------------------------------------+
| [Sprint 1: Nền Tảng Kỹ Thuật, Menu & MVP Đọc (Task 4)]                                             |
|  - FR-01: Hiển thị danh mục đồ uống (Menu Catalog)                                                 |
|  - FR-02: Xem thông tin chi tiết đồ uống (Tầng API Backend)                                        |
|  - NFR-01: Thời gian phản hồi API đọc menu < 500ms                                                 |
|  - NFR-11: Trạng thái Loading, Empty, Error trên giao diện menu Next.js                             |
|  - Task 4.1: Thiết lập Repository, cấu trúc apps/web, apps/api, branch strategy, README, .env       |
|  - Task 4.3: Seed dữ liệu sản phẩm mẫu, Unit/Component test tối thiểu                              |
|  - Task 4.4: Pipeline CI tự động (Install -> Lint -> Test -> Build) và Branch Protection           |
+----------------------------------------------------------------------------------------------------+
                                                   |
                                                   v
+----------------------------------------------------------------------------------------------------+
| [Sprint 2: Toàn Bộ Nghiệp Vụ Core, Thanh Toán, CI/CD & Production Delivery (Task 5)]               |
|  - FR-02: Giao diện chi tiết sản phẩm (UI Frontend)                                                |
|  - FR-03: Tùy biến món (Kích cỡ Size & Topping)                                                    |
|  - FR-04: Quản lý giỏ hàng & tính tiền realtime                                                    |
|  - FR-05, FR-06: Đăng ký, Đăng nhập và Xác thực phiên (JWT)                                        |
|  - FR-07: Tạo đơn hàng (Checkout) & Kiểm soát tồn kho đồng thời (Optimistic Locking)               |
|  - FR-08, FR-09: Thanh toán mô phỏng (Thành công / Thất bại) & Bảo toàn giỏ hàng                   |
|  - FR-10: Hiển thị xác nhận đơn hàng (Mã đơn, PAID, Mời lấy nước tại quầy)                         |
|  - FR-11, FR-12: Xem lịch sử (GET /orders/me) và Vòng đời đơn hàng FSM 5 bước                      |
|  - FR-13: Endpoint kiểm tra sức khỏe hệ thống (GET /health)                                        |
|  - FR-14: Tìm kiếm sản phẩm theo tên và Lọc danh mục nâng cao                                      |
|  - FR-15: Hủy đơn hàng ở trạng thái PENDING                                                        |
|  - FR-16: Lưu giỏ hàng tạm thời vào Local Storage                                                  |
|  - FR-17, FR-18: Áp dụng mã khuyến mãi (Promotion) & Quản lý điểm thưởng (Loyalty)                 |
|  - NFR-02, NFR-03: Hiệu năng ghi < 1000ms, Core Web Vitals trải nghiệm di động                     |
|  - NFR-04, NFR-05, NFR-06, NFR-07: Bảo mật JWT, bcrypt, HTTPS, bảo vệ biến môi trường              |
|  - NFR-08, NFR-09: ACID Transaction, Idempotency-Key chống trừ tiền lặp, bảo toàn giỏ hàng         |
|  - NFR-10: Hoàn thiện trải nghiệm Mobile-First & cấu hình PWA manifest                             |
|  - Task 5.2: Kiểm thử (Unit, Integration, E2E), docker-compose.yml local, GET /health              |
|  - Task 5.3: Pipeline CD tự động (Tag Commit SHA -> Deploy Production) & Rollback < 5 phút         |
|  - Task 5.4: Production URL qua HTTPS, Database Private, Release notes & Sprint Retrospective       |
+----------------------------------------------------------------------------------------------------+
```

---

## 6. Tiêu chuẩn Sẵn sàng (DoR) và Tiêu chuẩn Hoàn thành (DoD) cho Yêu cầu

### 6.1. Definition of Ready (DoR) - Tiêu chuẩn sẵn sàng để đưa vào phát triển
Một yêu cầu chức năng (FR) được xem là sẵn sàng để lập trình viên bắt tay vào phát triển khi:
1. Đã có mã định danh `FR-xx` rõ ràng trong tài liệu SRS này.
2. Mô tả nghiệp vụ không còn mập mờ, có đầy đủ các trường hợp ngoại lệ.
3. Tiêu chí chấp nhận (Acceptance Criteria) được định nghĩa rõ ràng, có thể đo lường và kiểm thử được.
4. Đã thống nhất cấu trúc dữ liệu đầu vào (Request body) và đầu ra (Response) giữa Frontend và Backend.
5. Đã xác định rõ các ràng buộc về mặt phi chức năng (Bảo mật, Hiệu năng) liên quan.

### 6.2. Definition of Done (DoD) - Tiêu chuẩn hoàn thành để nghiệm thu
Một yêu cầu được xem là hoàn thành (Done) và được phép merge vào nhánh chính `main` khi:
1. **Đáp ứng đầy đủ Tiêu chí chấp nhận:** Vượt qua toàn bộ các tiêu chí `AC-xx.y` đã đề ra.
2. **Kiểm tra tự động vượt qua (Automated Checks Pass):** Lệnh kiểm tra cú pháp `npm run lint`, kiểm thử tự động `npm run test` và đóng gói `npm run build` chạy thành công không có lỗi.
3. **Có kiểm thử kèm theo:** Các chức năng mới hoặc sửa đổi đều có Unit Test hoặc Integration Test tương ứng được bổ sung và kiểm chứng thành công.
4. **Không để lộ thông tin bí mật:** Đảm bảo không có bất kỳ API key, secret, mật khẩu hoặc chuỗi nhạy cảm nào bị đưa vào mã nguồn hoặc commit log.
5. **Được Review và Phê duyệt:** Pull Request nhận được ít nhất 1 sự đồng thuận (Approval) từ thành viên khác trong nhóm.
6. **Cập nhật tài liệu và Truy vết:** Đã cập nhật dòng tương ứng của yêu cầu trong bảng `docs/traceability-matrix.md`.
