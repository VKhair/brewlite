# Kết quả kiểm thử BrewLite bằng Postman

Ngày 21/11/2026, múi giờ Việt Nam (UTC+7). Đích đo là API BrewLite công khai qua HTTPS tại `brewlite.vkhair.dev/api/backend`. Các số độ trễ được đo từ máy chạy Postman, qua đường truyền và proxy của môi trường triển khai.

## Kiểm tra chức năng

Newman 6.2.3 chạy collection Postman tuần tự trong khoảng 09:41–09:42, với 1.100 ms giữa hai request. Đợt chạy tạo đúng 5 tài khoản thử, 5 đơn và 1 giao dịch VNPay Sandbox.

- **Đăng ký và đăng nhập.** Cả 5 lượt trả HTTP `201` khi đăng ký và `200` khi đăng nhập, cùng JWT của đúng tài khoản. Ca sai mật khẩu trả `401 INVALID_CREDENTIALS` trong 640 ms.
- **Xem và chọn món.** Menu và chi tiết đều trả `200` ở cả 5 lượt. Món Cà phê sữa đang bán, kích cỡ mặc định M. Mỗi đơn có đúng 1 món, tổng cộng 29.000 ₫.
- **Đặt và hủy đơn.** Cả 5 lượt tạo đơn trả `201 PENDING`. Bốn đơn thử đầu trả `200 CANCELLED` khi hủy. Mã đơn lần lượt là `BL-D7177F7D5FB7406D87480BD2120C3980`, `BL-E7A46A17F312421591EC5E5CAD5D6EFD`, `BL-6F4586A513084D8D916BBB5699A646AC` và `BL-8512569563114BE6BC493DB6F08E1BE3`.
- **Thanh toán Sandbox và IPN.** Đơn `BL-25A080BBE0C342B5B979B4C12AC49E57` khởi tạo VNPay lúc 09:42:51 với HTTP `200`, liên kết Sandbox hợp lệ và trạng thái `PENDING`. Trình duyệt quay về trang đơn và báo phiên đang mở hết hạn hoặc không hợp lệ. Request Postman dùng JWT của tài khoản thử trả `200` lúc 09:48:58 và xác nhận đơn `PAID`, giao dịch `VNPAY` tương ứng `SUCCESS`. Lịch sử đơn ghi mốc `PAID` lúc 09:46:11.687, khoảng 3 phút 20 giây sau khi nhận liên kết. Khoảng này gồm thao tác trên trình duyệt. Thời điểm xác nhận cuối bên VNPay chưa được ghi trực tiếp, nên chưa có số đo riêng cho độ trễ IPN kể từ lúc xác nhận giao dịch.

## Đo hiệu năng đọc menu

Chạy **Postman CLI 1.93.0** trên máy cục bộ bằng collection chỉ đọc, thay cho giao diện Desktop. Cấu hình **Fixed** trong 1 phút cho mỗi mức tải, chờ 1.100 ms trước mỗi request của mỗi VU. Lượt 1 VU ban đầu (09:46:12–09:47:13) gửi 41 request, trung bình 278 ms, p95 gộp 280 ms, 0,67 request/giây và 0% lỗi. Sau lượt 3 VU, chạy lại 1 VU đúng một lần để lấy số liệu theo endpoint vì kho dữ liệu cục bộ của CLI chỉ còn mẫu chi tiết của lần chạy mới nhất.

- **1 VU (09:50:49–09:51:50)**. Tổng 41 request, 0,67 request/giây. Khoảng nghỉ gửi nhỏ nhất ghi nhận 1.141 ms.
  - `GET /products` — 21 request, 0,34 request/giây, trung bình 287,24 ms, p95 **281 ms**, cao nhất 806 ms. 0% lỗi runtime và 0% assertion thất bại.
  - `GET /products/:id` — 20 request, 0,33 request/giây, trung bình 265,75 ms, p95 **277 ms**, cao nhất 283 ms. 0% lỗi runtime và 0% assertion thất bại.
- **3 VU (09:48:16–09:49:18)**. Tổng 125 request, 2,05 request/giây. Khoảng nghỉ gửi nhỏ nhất ghi nhận 1.125 ms.
  - `GET /products` — 63 request, 1,03 request/giây, trung bình 294,21 ms, p95 **309 ms**, cao nhất 933 ms. 0% lỗi runtime và 0% assertion thất bại.
  - `GET /products/:id` — 62 request, 1,02 request/giây, trung bình 266,73 ms, p95 **296 ms**, cao nhất 329 ms. 0% lỗi runtime và 0% assertion thất bại.

**NFR-01 đạt theo tiêu chí p95** ở cả hai mức tải. Một số phản hồi menu riêng lẻ vượt 500 ms, với giá trị cao nhất 806 ms ở 1 VU và 933 ms ở 3 VU.

P95 theo endpoint là phân vị rời rạc từ từng mẫu thời gian phản hồi do Postman ghi. Request/giây theo endpoint bằng số mẫu chia cho 61 giây thực tế của mỗi lượt. Lỗi runtime và assertion thất bại đều là 0% ở hai mức tải. Ngưỡng NFR-01 của đợt đo là **p95 dưới 500 ms** cho `GET /products`. [Đặc tả BrewLite](../../../docs/requirements/srs.md) · [Chỉ số Postman Performance](https://learning.postman.com/docs/tests-and-scripts/performance-testing/performance-test-metrics/)

## Đo hiệu năng đăng nhập và checkout

Số đo theo thứ tự 5 lượt, đơn vị ms.

- **Đăng ký** — 780, 641, 636, 639, 704.
- **Đăng nhập** — 1.604, 638, 641, 756, 631.
- **Tạo đơn** — 360, 294, 295, 536, 291. Cả 5 mẫu dưới 1.000 ms.
- **Khởi tạo VNPay** — 363. Mẫu duy nhất dưới 1.000 ms. Đây là thời gian API trả liên kết, trước khi nhập dữ liệu ở VNPay.

Kết quả NFR-02 đạt trên 5 mẫu tạo đơn và 1 mẫu khởi tạo thanh toán đã đo. Các thao tác ghi chạy tuần tự trên server công khai. [Đặc tả BrewLite](../../../docs/requirements/srs.md)

## Đối soát và tái hiện

Bốn đơn hủy và một đơn đã thanh toán vẫn có mã để đối soát trên server. Hai collection và environment được kiểm tra lại trên máy cục bộ bằng các phản hồi mô phỏng cho nhánh hủy, nhánh VNPay và IPN, cùng luồng đọc menu. Xem [hướng dẫn chạy lại](server-testing.md).
