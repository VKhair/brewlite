# ADR-0002 — Xác thực API bằng JWT

**Quyết định ban đầu ngày 12/11/2026. Trạng thái hiện tại đã triển khai.**

API NestJS ký access token bằng HS256, với sub là UUID người dùng và issuer, audience, expiration được kiểm tra khi xác minh. JWT_SECRET cần tối thiểu 32 byte. Thời hạn mặc định là 1 ngày. Mật khẩu được băm bcrypt cost 12.

Web lưu phiên trong localStorage và gửi Authorization: Bearer khi gọi route được bảo vệ. JwtGuard tra người dùng và vai trò hiện tại trong DB. Đọc, hủy và thanh toán theo chủ đơn. STAFF hoặc ADMIN đổi tiến độ. Chỉ ADMIN truy cập API kho. Tạo đơn yêu cầu JWT của tài khoản đặt đơn.

Đăng xuất xóa phiên cục bộ. Token đã cấp vẫn có hiệu lực trong thời hạn và bị từ chối nếu tài khoản không còn tồn tại. Phiên bản hiện tại dùng một access token cho mỗi lần xác thực, chưa có refresh token.

Xem [dịch vụ xác thực](../../../apps/api/src/auth/auth.service.ts), [JwtGuard](../../../apps/api/src/auth/jwt.guard.ts), [AdminGuard](../../../apps/api/src/auth/admin.guard.ts) và [store web](../../../apps/web/src/app/app-providers.tsx).
