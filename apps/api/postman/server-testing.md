# Kiểm thử BrewLite trên server bằng Postman

Nhập các file sau vào Postman Desktop và chọn environment **BrewLite Server**. `baseUrl` mặc định trỏ tới API công khai qua HTTPS. `testProductId` là mã món Cà phê sữa trong dữ liệu mẫu.

- [BrewLite Server – Checkout](BrewLite.Server.Checkout.postman_collection.json)
- [BrewLite Server – Menu Performance](BrewLite.Server.Menu.Performance.postman_collection.json)
- [Environment BrewLite Server](BrewLite.Server.postman_environment.json)

## Kiểm tra chức năng

1. Chạy thư mục **Checkout** ở chế độ **Functional**, chọn 1 iteration, delay 1100 ms và bật dừng khi có lỗi. Chỉ chạy tối đa 5 lượt trên server công khai. Dừng cả đợt khi gặp HTTP 429, 5xx, hết hàng hoặc timeout sau một yêu cầu ghi.
2. Với tối đa 4 lượt đầu, đặt `checkoutMode=cancel`. Mỗi lượt tạo một tài khoản thử và một đơn, sau đó yêu cầu API hủy đơn và xác nhận `CANCELLED`.
3. Với lượt cuối, đặt `checkoutMode=vnpay`. Bật **Keep variable values** để chạy được bước xác nhận sau thanh toán. Lượt này kiểm tra thêm đăng nhập sai, tạo một đơn và gọi khởi tạo VNPay Sandbox đúng một lần.
4. Mở giá trị cục bộ `checkoutUrl` trong trình duyệt. Kiểm tra tên miền `sandbox.vnpayment.vn` và nhãn **Test** trước khi dùng thẻ mẫu. Nếu VNPay hiện điều khoản, người chạy kiểm thử đọc và xác nhận trước khi tiếp tục. [Dữ liệu thử chính thức của VNPay](https://sandbox.vnpayment.vn/apis/vnpay-demo/)
5. Sau khi hoàn tất giao dịch thử, chạy riêng request **10 Xác nhận IPN**. Cùng một đơn phải có trạng thái `PAID`, giao dịch VNPay tương ứng là `SUCCESS` và lịch sử có mốc `PAID`. Nếu vẫn `PENDING`, kiểm tra lại mỗi 10 giây trong tối đa 2 phút. Giữ mã đơn để đối soát nếu hết thời hạn chờ. Đơn có giao dịch VNPay đang chờ IPN chưa thể hủy qua API.

Giữ `customerPassword`, `customerToken` và `checkoutUrl` ở giá trị cục bộ. Xóa dữ liệu tạm trong environment sau khi xác nhận xong. Khi lưu kết quả, chỉ ghi mã đơn, trạng thái, thời gian và số đo.

## Đo hiệu năng

Chạy **BrewLite Server – Menu Performance → Run → Performance** trong Postman Desktop bằng **App**, với hai request đọc đã chọn. Dùng **Fixed** trong 1 phút với 1 VU trước, rồi 1 phút với 3 VU nếu lần đầu đạt nhịp gửi dự kiến. Script đợi 1.100 ms trước mỗi request của từng VU. Dừng nếu gặp HTTP 429, 5xx hoặc timeout. Giữ các lần chạy tuần tự. [Cấu hình Postman Performance](https://learning.postman.com/docs/tests-and-scripts/performance-testing/performance-test-configuration)

Có thể dùng Postman CLI cho cùng bộ request. Từ thư mục gốc repo, chạy lệnh dưới đây với `--peak-vu 1`, kiểm tra lần chạy, sau đó đổi thành `--peak-vu 3`.

```powershell
npm exec --yes --package=postman-cli@1.93.0 -- postman performance run apps/api/postman/BrewLite.Server.Menu.Performance.postman_collection.json -e apps/api/postman/BrewLite.Server.postman_environment.json --runner local --load-profile fixed --peak-vu 1 --duration 1 --output ndjson
```

Ghi số request, request/giây, độ trễ trung bình, p95, tỷ lệ lỗi runtime và tỷ lệ assertion thất bại theo từng endpoint. Tiêu chí của đợt đo này là `GET /products` có p95 dưới 500 ms ở cả hai mức tải. Đối với `POST /orders` và `POST /payments`, ghi thời gian từng mẫu và so với ngưỡng dưới 1.000 ms. Đo riêng thời gian chờ IPN sau khi hoàn tất giao dịch thử. [Đặc tả NFR-01 và NFR-02](../../../docs/requirements/srs.md)

[Kết quả đo và kiểm thử ngày 21/11/2026](server-test-report.md)
