# ADR-0005: AWS Lightsail làm nền tảng triển khai

- **Trạng thái:** Accepted (nền tảng); Proposed (ánh xạ dịch vụ)
- **Ngày:** 2026-11-12

## Bối cảnh

Task 3 yêu cầu deployment diagram khớp nền tảng thực tế. Nhóm xác nhận AWS Lightsail. Stack gồm Next.js, NestJS, PostgreSQL và Docker. Repo chưa có Dockerfile hoặc cấu hình triển khai.

## Quyết định

Chọn AWS Lightsail làm nền tảng triển khai mục tiêu. Topology đề xuất gồm hai Lightsail Container Services (Web và API), mỗi service có public HTTPS endpoint; Lightsail managed PostgreSQL ở private mode cùng AWS Region. Web gọi API endpoint; API public nhận VNPay IPN; API kết nối DB qua mạng nội bộ. Xác nhận Region, capacity, DNS/TLS và pipeline ở Task 5 trước khi tạo tài nguyên.

## Phương án đã cân nhắc

- **Render/Railway/Fly.io:** được liệt kê trong kế hoạch ban đầu nhưng không còn là lựa chọn sau khi nhóm xác nhận AWS Lightsail.
- **AWS EC2/ECS đầy đủ:** cung cấp nhiều quyền kiểm soát hơn nhưng vận hành/phân cấu hình nhiều hơn mục tiêu MVP.
- **Lightsail:** được nhóm chọn; hỗ trợ container services và managed PostgreSQL, giúp giữ triển khai gọn cho dự án.

## Hệ quả và ràng buộc

- Container Service và managed database phải ở cùng Region để kết nối theo hướng dẫn AWS.
- Mỗi Container Service chỉ có một public endpoint container; endpoint dùng HTTPS. API cần public endpoint vì nhận browser API calls và VNPay IPN.
- Database giữ private mode; chỉ các resource Lightsail được phép kết nối. Không bật public mode lâu dài.
- Lightsail Container Services có image store theo service; CI có thể push bằng AWS CLI rồi tạo deployment. Migration runner chưa chốt; GitHub-hosted runner không nên truy cập DB private trực tiếp.
- Kiểm tra capacity, chi phí theo Region và yêu cầu của môi trường học trước khi tạo tài nguyên.

## Tài liệu tham khảo

- [Lightsail Container Services](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-container-services.html)
- [Kết nối Container Service với Lightsail database](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-connecting-container-service-to-database.html)
- [Private/public mode cho Lightsail database](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-configuring-database-public-mode.html)
- [Push container images vào Lightsail](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-pushing-container-images.html)
