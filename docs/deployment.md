# Triển khai và phục hồi BrewLite trên AWS Lightsail

[Sơ đồ triển khai](diagrams/deploymentDiagram.svg) · [Nguồn PlantUML](diagrams/deploymentDiagram.puml)

Hai Lightsail Container Services phục vụ Next.js và NestJS qua HTTPS mặc định của Lightsail. Web chuyển tiếp `/api/backend/*` đến `http://<api-service>.service.local:3001`. PostgreSQL managed chỉ mở trong mạng private cùng region. API kết nối PostgreSQL bằng TLS xác minh hostname. VNPay Sandbox gọi IPN trực tiếp qua HTTPS.

## Thiết lập lần đầu

1. Trong cùng một region, tạo hai Lightsail Container Services và PostgreSQL managed. Đặt API scale 1, ghi lại tên tài nguyên và hai endpoint HTTPS mặc định. Giữ tùy chọn public của PostgreSQL ở trạng thái tắt.
2. Tạo IAM OIDC provider GitHub Actions và role triển khai. Giới hạn trust theo audience `sts.amazonaws.com` và subject `repo:VKhair/brewlite:environment:production`. Cấp quyền Lightsail để đọc service/deployment/database, đăng ký image, tạo deployment và tạo/đọc snapshot DB. Quyền cần dùng gồm `GetContainerServices`, `GetContainerServiceDeployments`, `GetContainerImages`, `CreateContainerServiceRegistryLogin`, `RegisterContainerImage`, `CreateContainerServiceDeployment`, `GetRelationalDatabase`, `CreateRelationalDatabaseSnapshot` và `GetRelationalDatabaseSnapshot` trong namespace `lightsail`. Thiết lập GitHub Environment `production` chỉ nhận tag `v*`. Chỉ cấp quyền đọc cấu hình deployment AWS cho người vận hành vì cấu hình chứa biến môi trường của API.
3. Thêm GitHub Environment variables `AWS_ROLE_ARN`, `AWS_REGION`, `LIGHTSAIL_API`, `LIGHTSAIL_WEB`, `LIGHTSAIL_DB`. Đặt `BREWLITE_BOOTSTRAP_CATALOG=true` để seed danh mục trong lần triển khai đầu trên DB mới. Tắt biến này sau khi seed thành công.
4. Thêm GitHub Environment secrets `DATABASE_URL`, `JWT_SECRET` (ít nhất 32 ký tự), `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`. Dùng định dạng `postgresql://USER:PASSWORD@DB_HOST:5432/DB_NAME?sslmode=verify-full&sslrootcert=/app/rds-ca.pem` và mã hóa ký tự đặc biệt trong thông tin đăng nhập. Image API chứa chứng chỉ CA của AWS.
5. Đăng ký `https://<api-host>/payments/vnpay/ipn` với terminal VNPay Sandbox. Workflow tự cấu hình Return URL `https://<api-host>/payments/vnpay/return` và URL điều hướng về Web. Đối chiếu HTTPS public endpoints với thông tin terminal trước khi demo.

## Phát hành

Sau khi PR đạt required checks `Quality` và `Browser E2E`, merge vào main. Tạo tag trên SHA đã merge và push **chỉ tag đó**. Tác vụ sau sẽ bắt đầu triển khai production khi environment đã được cấu hình.

```sh
git fetch origin main
git tag v1.0.0 origin/main
git push origin refs/tags/v1.0.0
```

Workflow [Release to Lightsail](../.github/workflows/release.yml) yêu cầu commit thuộc main và chạy lại hai job CI. Workflow khóa deploy đồng thời, build image Linux amd64 theo SHA và đẩy vào kho của từng service. Trước khi đổi phiên bản, workflow đợi snapshot DB sẵn sàng. API áp dụng migration trên kết nối private lúc khởi động. Chỉ thêm migration tương thích với phiên bản API trước đó để rollback image vẫn dùng được schema mới. Sau khi API active và health trả dữ liệu, workflow deploy Web rồi kiểm tra health DB, trang menu, danh mục qua proxy và chế độ private của DB.

Xem phiên bản, log container và health check trong Lightsail. Dùng trang Actions để đối chiếu SHA, phiên bản, snapshot và kết quả smoke. Với bản đầu tiên đã tạo API nhưng chưa seed, kiểm tra trạng thái migration và chạy seed một lần bằng cấu hình startup API với `BREWLITE_SEED_ON_START=true`, sau đó khôi phục cấu hình mặc định.

## Phục hồi

Khi bước deploy hoặc smoke lỗi, workflow dùng cấu hình active đã lưu trong bộ nhớ lúc bắt đầu để triển khai lại từng service đã bị tác động. Workflow chạy lại smoke và ghi thời gian phục hồi nếu có cả hai phiên bản trước. Lần phát hành đầu cần xử lý lỗi rồi chạy lại vì chưa có bản ổn định.

Nếu cần phục hồi thủ công, chọn deployment trước đó ở Lightsail, sao chép cấu hình với đúng image đã push và tạo deployment mới. Phục hồi API trước rồi đến Web. Xác minh `/health`, `/menu`, `/api/backend/products` và ghi thời gian từ lúc quyết định rollback đến khi cả hai service khỏe. Không đảo migration tự động. Khi cần phục hồi dữ liệu, tạo DB private mới từ snapshot, kiểm tra dữ liệu rồi cập nhật secret và cấu hình API.

## Minh chứng sau khi triển khai

Ghi URL HTTPS Web, URL API/health, region, tên tài nguyên, SHA, tag, link chạy CI/CD và trạng thái `publiclyAccessible=false` vào [hồ sơ bàn giao](acceptance.md). Xác nhận thanh toán bằng một giao dịch VNPay Sandbox thực tế, đối chiếu IPN, mã đơn PAID và lịch sử trên Web. Ghi kết quả rollback, demo, Sprint Review và Retrospective trước khi công bố GitHub Release.
