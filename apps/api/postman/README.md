# Hướng dẫn Kiểm thử Backend BrewLite bằng Postman

Để chạy luồng đặt món, thanh toán VNPay Sandbox và đo hiệu năng trên môi trường triển khai, xem [hướng dẫn kiểm thử server](server-testing.md).

Thư mục này chứa bộ **Postman Collection** và **Environment** chuẩn để kiểm thử toàn diện các API của Backend BrewLite (NestJS), bao gồm đầy đủ **10 Task trong Product Backlog** của đồ án Công nghệ Phần mềm.

---

## 📁 Các file trong thư mục

- `BrewLite_API.postman_collection.json`: File Collection chứa 25+ requests được nhóm thành 7 folder có sẵn Test Scripts và Pre-request Scripts tự động.
- `BrewLite_Local.postman_environment.json`: File Environment lưu các biến môi trường (`baseUrl`, `customerToken`, `baristaToken`, `adminToken`, `orderId`, `idempotencyKey`...).

---

## 🚀 Bước 1: Chuẩn bị Backend & CSDL

Trước khi bắt đầu kiểm thử, đảm bảo Backend và PostgreSQL đang chạy và đã nạp dữ liệu mẫu:

```bash
# 1. Khởi động CSDL (Docker)
docker compose up -d postgres

# 2. Đẩy schema và nạp dữ liệu mẫu (Sản phẩm, User Demo, Nguyên liệu, Coupons)
npm run prisma:push --workspace=backend
npm run prisma:seed --workspace=backend

# 3. Khởi động Backend (cổng 3001)
npm run dev:backend
```

Kiểm tra terminal backend báo: `Backend is running on http://localhost:3001`.

---

## 📥 Bước 2: Import vào Postman

1. Mở ứng dụng **Postman** (Desktop hoặc Web).
2. Bấm nút **Import** (nằm ở góc trên bên trái).
3. Kéo thả cả 2 file vào cửa sổ Import:
   - `BrewLite_API.postman_collection.json`
   - `BrewLite_Local.postman_environment.json`
4. Ở góc trên bên phải của Postman, mở menu môi trường (Environment dropdown) và chọn: **`BrewLite Local`**.

---

## 🧪 Bước 3: Thực hiện Kiểm thử

### Cách 1: Chạy tự động toàn bộ bằng Collection Runner (Khuyên dùng khi nghiệm thu)

1. Trên thanh sidebar bên trái, bấm vào menu **`...`** cạnh collection **`BrewLite Backend API - Test Collection`**.
2. Chọn **Run collection**.
3. Đảm bảo:
   - Environment đang chọn: **`BrewLite Local`**.
   - Tích chọn toàn bộ các request (theo thứ tự mặc định từ 01 đến 07).
   - Tích chọn tùy chọn *"Persist responses for a session"*.
4. Bấm **Run BrewLite Backend API...**.
5. Toàn bộ các bài test sẽ chạy tự động trong vài giây và trả về kết quả màu xanh (Passed 100%).

---

### Cách 2: Chạy kiểm thử tự động bằng Newman CLI từ Terminal

Nếu máy tính đã cài Node.js, bạn có thể chạy trực tiếp bộ test Postman qua lệnh terminal mà không cần mở Postman:

```bash
npx newman run backend/postman/BrewLite_API.postman_collection.json -e backend/postman/BrewLite_Local.postman_environment.json --reporters cli
```

---

### Cách 3: Chạy thủ công từng Request

Bạn có thể mở từng folder và bấm **Send** theo thứ tự luồng:

1. **Folder `01. Authentication`:**
   - Chạy `1.1 Đăng ký tài khoản Customer mới` $\rightarrow$ Tự sinh email ngẫu nhiên.
   - Chạy `1.2 Đăng nhập Customer` $\rightarrow$ Script tự động lưu `customerToken`.
   - Chạy `1.3 Đăng nhập Barista` $\rightarrow$ Tự động lưu `baristaToken`.
   - Chạy `1.4 Đăng nhập Admin` $\rightarrow$ Tự động lưu `adminToken`.
   - Chạy `1.5 Lấy thông tin tài khoản hiện tại` $\rightarrow$ Kiểm tra thông tin JWT.
   - Chạy `1.6 Đăng nhập sai mật khẩu` $\rightarrow$ Xác nhận trả về `401 Unauthorized`.

2. **Folder `02. Products & Menu`:**
   - Chạy `2.1 Lấy danh sách sản phẩm` $\rightarrow$ Xem danh sách menu cà phê.
   - Chạy `2.2 Lấy chi tiết sản phẩm ID 1` $\rightarrow$ Xem món Cà phê Sữa Đá.
   - Chạy `2.3 Lấy sản phẩm không tồn tại` $\rightarrow$ Xác nhận trả về `404 Not Found`.

3. **Folder `03. Coupons & Promotions`:**
   - Chạy `3.1 Lấy danh sách coupon kích hoạt` $\rightarrow$ Xem mã `BREWLITE10`, `GIAM20K`, `WELCOME`.
   - Chạy `3.2 Kiểm tra mã hợp lệ` $\rightarrow$ Xem giảm 10% cho đơn 50k.
   - Chạy `3.3 Kiểm tra mã chưa đủ đơn tối thiểu` $\rightarrow$ Xác nhận trả về `400 Bad Request`.

4. **Folder `04. Orders`:**
   - Chạy `4.1 Tạo đơn hàng hợp lệ` $\rightarrow$ Đơn tạo thành công trạng thái `PENDING`, tự động lưu `orderId` và `orderCode`.
   - Chạy `4.2 Tạo đơn thiếu Authorization` $\rightarrow$ Chặn `401 Unauthorized`.
   - Chạy `4.3 Tạo đơn với Admin Token` $\rightarrow$ Chặn `403 Forbidden` (do `CustomerGuard` bảo vệ quyền lợi khách).
   - Chạy `4.4 Lấy chi tiết đơn theo orderCode` $\rightarrow$ Xem đơn hàng vừa tạo.
   - Chạy `4.5 Lấy lịch sử đơn của tôi` $\rightarrow$ Xem danh sách đơn của Customer.
   - Chạy `4.6 Lấy toàn bộ đơn hàng` $\rightarrow$ Dành cho Barista kiểm tra hàng đợi.

5. **Folder `05. Cashless Payments & Idempotency`:**
   - Chạy `5.1 Thanh toán giả lập thành công (Lần 1)` $\rightarrow$ Sinh `Idempotency-Key` ngẫu nhiên, đơn chuyển thành `PAID`, cộng điểm tích lũy.
   - Chạy `5.2 Thanh toán Idempotent (Replay cùng Key)` $\rightarrow$ Trả về kết quả cũ, `idempotent: true`, không trừ tiền hay cộng điểm 2 lần.
   - Chạy `5.3 Tạo đơn hàng phụ` $\rightarrow$ Tạo thêm 1 đơn để test lỗi.
   - Chạy `5.4 Thanh toán giả lập thất bại` $\rightarrow$ Đơn chuyển `PAYMENT_FAILED`, hoàn trả tồn kho nguyên liệu.
   - Chạy `5.5 Thanh toán thiếu Idempotency-Key` $\rightarrow$ Chặn `400 Bad Request`.

6. **Folder `06. State Machine Validation`:**
   - Chạy `6.1 Barista nhận pha chế` $\rightarrow$ Chuyển `PAID → PREPARING`.
   - Chạy `6.2 Barista pha chế xong` $\rightarrow$ Chuyển `PREPARING → READY`.
   - Chạy `6.3 Đã giao khách hàng` $\rightarrow$ Chuyển `READY → COMPLETED` (hoàn tất vòng đời).
   - Chạy `6.4 Chặn quay lui State Machine` $\rightarrow$ Thử chuyển `COMPLETED → PENDING` $\rightarrow$ Bị chặn `400 Bad Request`.
   - Chạy `6.5 Chặn nhảy cóc State Machine` $\rightarrow$ Thử chuyển từ `PAYMENT_FAILED → COMPLETED` $\rightarrow$ Bị chặn `400 Bad Request`.

7. **Folder `07. Inventory Management`:**
   - Chạy `7.1 Lấy danh sách nguyên liệu` $\rightarrow$ Xem tồn kho Admin.
   - Chạy `7.2 Customer cố tình truy cập kho` $\rightarrow$ Chặn `403 Forbidden`.
   - Chạy `7.3 Nhập kho nguyên liệu Cà phê` $\rightarrow$ Tăng tồn kho thêm 500g.

---

## 📌 Các lưu ý quan trọng

1. **Cơ chế Phân quyền (RBAC):**
   - Tài khoản `demo@brewlite.com` có role `ADMIN` $\rightarrow$ Dùng cho quản trị kho và recipe.
   - Tài khoản `barista@brewlite.com` có role `BARISTA` $\rightarrow$ Dùng cho nhận đơn và chuyển trạng thái pha chế.
   - Tài khoản đăng ký mới có role `CUSTOMER` $\rightarrow$ Dùng cho đặt đơn và thanh toán.
2. **Cơ chế Idempotency:**
   - Postman Collection đã được lập trình sẵn script sinh UUID ngẫu nhiên cho mỗi lần gửi thanh toán mới, đảm bảo test đúng chuẩn RFC / REST API.
