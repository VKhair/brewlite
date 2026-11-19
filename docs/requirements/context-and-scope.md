# Bối cảnh và phạm vi BrewLite

BrewLite hỗ trợ đặt trước đồ uống, thanh toán không dùng tiền mặt và theo dõi tiến độ để nhận tại quầy. Web phục vụ hành trình khách hàng. NestJS cung cấp REST API và lưu dữ liệu nghiệp vụ trong PostgreSQL. Xem [kiến trúc tổng quan](../architecture/architecture.md).

Mục tiêu của MVP là giảm bước gọi món và trả tiền tại quầy. Khách có thể biết đơn đã thanh toán hay sẵn sàng nhận. Nhân viên có lịch sử trạng thái để xử lý và bàn giao đúng đơn. Đây là tạo phẩm Task 1.1 trong [Assignment 2](../../assignment_2.md).

## Người dùng và hệ thống liên quan

| Stakeholder | Mục tiêu và kỳ vọng | Cách hệ thống đáp ứng |
| --- | --- | --- |
| Khách hàng | Thấy rõ món, giá, trạng thái thanh toán và lúc có thể nhận. | Duyệt thực đơn, chỉnh giỏ, đăng nhập, đặt và thanh toán, xem chi tiết và lịch sử. |
| Nhân viên quầy | Nhận đúng đơn đã trả tiền, cập nhật tiến độ theo từng bước. | STAFF cập nhật trạng thái pha chế qua API. |
| Quản lý cửa hàng | Kiểm soát quyền, nguyên liệu và công thức. | ADMIN quản lý kho và cập nhật tiến độ qua API. |
| Giảng viên hoặc người nghiệm thu | Tái chạy được sản phẩm, đối chiếu yêu cầu với mã, test và bản demo. | Repository, bộ tài liệu truy vết, kết quả kiểm thử và URL triển khai là đầu vào nghiệm thu. |
| Nhóm phát triển và vận hành | Phát triển theo module, tái tạo dữ liệu, kiểm tra release và trạng thái hệ thống. | Có workspace, migration/seed, pipeline CI và health. Xem [kế hoạch nhóm](../backlog.md). |
| Đơn vị thanh toán | Nhận yêu cầu đúng số tiền và xử lý kết quả đúng một lần. | Mock chạy nội bộ. Với Sandbox, server ký URL, xác minh IPN và trả phản hồi theo giao thức. |

## Phạm vi trong MVP

- Next.js phục vụ thực đơn, trang chi tiết, giỏ, xác thực, checkout, lịch sử và trang kết quả. Hình thức nhận món là tại quầy.
- API tính giá theo danh mục, lưu snapshot dòng hàng, trừ tồn món và nguyên liệu theo công thức, lưu các lần thử thanh toán và lịch sử trạng thái.
- Chế độ mặc định mô phỏng ví điện tử và thẻ. Chế độ VNPay dùng Sandbox và cần callback truy cập được từ bên ngoài.
- Cập nhật pha chế thực hiện qua API. Web có manifest PWA và lưu giỏ cục bộ. Menu, xác thực, đặt đơn và thanh toán cần API hoạt động.
- Docker Compose định nghĩa môi trường local. Bản AWS Lightsail chạy Caddy, web, API và PostgreSQL trong một stack trên máy ảo. GitHub Actions chạy kiểm tra khi push hoặc mở pull request vào main. Xem [triển khai và vận hành](../deployment.md).

## Phạm vi mở rộng và ngoài phạm vi

- Mở rộng đã có ở API gồm coupon, điểm và kho nguyên liệu/công thức. Checkout web hiện chỉ gửi món, size, topping và số lượng. VNPay Sandbox là tích hợp mở rộng bên cạnh luồng mock bắt buộc của Assignment.
- MVP hiện không gồm giao hàng, thanh toán VNPay tiền thật, đặt hàng offline, giao diện quản trị hay tác vụ tự động đối soát VNPay.

## Giả định, ràng buộc và rủi ro

| Loại | Điều kiện | Cách kiểm tra hoặc xử lý |
| --- | --- | --- |
| Giả định | Nhận tại quầy, API và PostgreSQL khả dụng, người đặt có tài khoản. | Test luồng đăng nhập, từ chối khi thiếu JWT và đọc health trước demo. |
| Ràng buộc | Next.js mobile-first/PWA, NestJS, PostgreSQL và Docker. Đề bài yêu cầu luồng ví/thẻ mock. | Dùng mock trong E2E tái chạy được. Kiểm tra Sandbox riêng qua IPN và Return URL. |
| Rủi ro | Hai yêu cầu cùng giữ tồn hoặc một thanh toán được gửi lại. | Dùng transaction, kiểm tra số dư, idempotency và kiểm thử gửi lặp. |
| Rủi ro | VNPay không gửi IPN hợp lệ kịp thời. | Hiển thị trạng thái chờ, kiểm tra callback public và lưu bằng chứng giao dịch sau khi đã xác minh. |
| Rủi ro | Máy chấm không tái tạo được DB hoặc URL triển khai không hoạt động. | Chạy migration/seed trên DB trống và kiểm tra HTTPS/health trước bàn giao. |

Xem [SRS](srs.md), [use case đặt và thanh toán](BrewLite_DacTa_UseCase_DatVaThanhToan.md) và [hướng dẫn chạy](../deployment.md).
