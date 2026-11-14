# BrewLite – Deployment Diagram (Task 3.2)

**Nền tảng đã chọn:** AWS Lightsail<br>
**Trạng thái:** Deployment target; chưa có tài nguyên production/staging được tạo trong AWS.<br>
**Region:** Chưa chốt; tất cả Lightsail Container Services và managed PostgreSQL phải cùng Region.

## Sơ đồ triển khai mục tiêu

PlantUML source: [docs/diagrams/deployment-lightsail.puml](diagrams/deployment-lightsail.puml). The `.puml` file is the submission diagram; it shows the target topology and external payment/deployment flows.

## Ranh giới mạng và trách nhiệm

| Thành phần | Vị trí/đường truy cập | Quy tắc |
|---|---|---|
| Next.js Web | Lightsail Container Service, public HTTPS | Nhận trình duyệt/PWA; public endpoint phục vụ Web. |
| NestJS API | Lightsail Container Service, public HTTPS | Nhận API call từ Web và VNPay IPN. CORS chỉ cho phép Web origin đã cấu hình; bảo vệ route bằng JWT/validation; IPN phải xác minh chữ ký. Không công khai DB credentials. |
| PostgreSQL | Lightsail managed database, private mode | Cùng AWS account và Region; chỉ API cần kết nối. Không bật public mode. |
| VNPay Sandbox | Hệ thống ngoài AWS | API tạo payment URL; VNPay gửi IPN đến API. Return URL chỉ điều hướng trình duyệt, không tự xác nhận thanh toán. |
| GitHub Actions | GitHub-hosted CI/CD, chưa triển khai | Mục tiêu: build Web/API, gắn tag commit SHA, push tới image store của Lightsail, tạo deployment, chạy smoke test. Phương thức AWS identity/secret cần chốt ở Task 5. |

Lightsail Container Services chỉ có một container public endpoint cho mỗi service; mỗi endpoint được cấp HTTPS và service có private domain để giao tiếp với resource Lightsail cùng Region. Để API nhận được VNPay IPN và browser API calls, API service có public HTTPS endpoint; PostgreSQL vẫn giữ private mode. [AWS – container services](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-container-services.html) · [AWS – kết nối container với database](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-connecting-container-service-to-database.html) · [AWS – private/public database mode](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-configuring-database-public-mode.html)

## Image và triển khai

Lightsail Container Services có image store riêng cho từng service. Pipeline dự kiến build image Linux, gắn SHA, dùng AWS CLI `lightsail push-container-image` để đẩy image vào service tương ứng, sau đó tạo deployment mới. Đây là cách phù hợp với Lightsail; không mặc định dùng registry private bên ngoài. [AWS – push container images](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-pushing-container-images.html)

## Việc cần chốt trước Task 5

1. Chọn AWS Region, tên service, capacity, custom domain và certificate.
2. Chọn cách GitHub Actions xác thực với AWS/Lightsail và lưu secrets.
3. **Chọn cách chạy database migrations.** GitHub-hosted runner không nằm trong mạng private Lightsail DB. Không bật DB public để CI kết nối. Cần một migration runner/job chạy từ Lightsail hoặc phương án khác vẫn giữ DB private; bảo đảm chạy một lần trước smoke test.
4. Chốt rollback: deployment image trước đó và migration có tương thích ngược hay cần quy trình phục hồi riêng.

Sơ đồ này mô tả topology đích, không tuyên bố tài nguyên đã được provision. Hiện `docker-compose.yml`, Dockerfiles, ứng dụng Web/API và workflow CI/CD chưa được triển khai trong repo.
