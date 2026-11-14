# ADR-0002: JWT cho xác thực API

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-12

## Bối cảnh

SRS FR-06 yêu cầu đăng nhập và xác thực JWT. Tạo đơn cần JWT hợp lệ; API phải tự kiểm tra quyền sở hữu Order. Ứng dụng Web và API là hai container logic riêng.

## Quyết định

API NestJS phát hành và xác minh JWT cho các endpoint cần đăng nhập. Guard/API layer kiểm tra token và chuyển danh tính đã xác minh vào application layer; authorization theo user/order luôn thực hiện ở server. Mật khẩu được lưu dạng hash theo yêu cầu SRS, không lưu plaintext.

ADR này chốt cơ chế xác thực JWT ở mức kiến trúc; chưa chốt token transport/storage phía trình duyệt, refresh-token flow, key rotation hoặc role matrix. Các chi tiết đó phải được chốt trong API/auth design trước khi triển khai.

## Phương án đã cân nhắc

- **Session stateful:** dễ thu hồi phiên tập trung nhưng cần session store và chia sẻ trạng thái.
- **JWT:** phù hợp API stateless và đã được yêu cầu trong SRS; cần quản lý secret, hạn dùng và quyền truy cập cẩn thận.

## Hệ quả

- `JWT_SECRET` là secret runtime; `.env.example` chỉ chứa placeholder.
- Endpoint bảo vệ phải kiểm tra JWT, chủ sở hữu tài nguyên và quyền phù hợp.
- Không xem việc JWT hợp lệ là đủ để cho phép truy cập mọi Order.
