# ADR-0004: Tích hợp VNPay Sandbox

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-12

## Bối cảnh

Yêu cầu checkout đã được chốt dùng VNPay Sandbox, khách chọn VNPay rồi chọn nguồn tiền trên VNPay. Thanh toán production và thu tiền thật nằm ngoài phạm vi MVP. API cần xác minh IPN; Return URL chỉ phục vụ điều hướng.

## Quyết định

Tích hợp VNPay qua adapter/provider module bên trong NestJS API. API tạo payment URL từ Order và số tiền server-side, ký request bằng secret chỉ có ở backend, nhận IPN, xác minh chữ ký/mã tham chiếu/số tiền/trạng thái rồi cập nhật Payment và Order idempotently. Web không gọi VNPay bằng merchant secret và không tự đánh dấu Order `PAID` từ query trên Return URL.

Chỉ dùng endpoint/merchant credentials Sandbox. Production provider configuration bị loại khỏi phạm vi của ADR/MVP.

## Phương án đã cân nhắc

- **Mock Payment nội bộ:** đơn giản để demo nhưng không đáp ứng quyết định mới nhất của nhóm về VNPay Sandbox.
- **Tích hợp nhiều cổng ngay từ đầu:** tăng độ phức tạp mà không có yêu cầu MVP; adapter chỉ để cô lập provider và giữ đường mở rộng.

## Hệ quả

- Cần merchant sandbox credentials và IPN/Return URL truy cập được trước khi tích hợp/ nghiệm thu.
- Payment attempt, Idempotency-Key, gateway reference và IPN outcome cần được lưu/đối soát.
- Timeout không đồng nghĩa thất bại; retry cho cùng attempt dùng lại key. Attempt mới chỉ được tạo sau thất bại đã xác nhận, trên cùng Order với key mới và sau khi giữ tồn kho lại.
- Secret, IPN validation errors và giao dịch cần log an toàn, không ghi secret hoặc dữ liệu nhạy cảm thô.
