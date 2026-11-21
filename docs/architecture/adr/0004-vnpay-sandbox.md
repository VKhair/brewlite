# ADR-0004 — Mock và VNPay Sandbox

**Quyết định tích hợp Sandbox ngày 12/11/2026. Cả hai chế độ hiện đã có trong mã.**

API chọn provider theo PAYMENT_MODE. Mặc định là mock cho EWALLET hoặc CARD. Mock bị chặn ở NODE_ENV=production trừ khi ALLOW_MOCK_PAYMENTS=true. VNPay chỉ dùng endpoint Sandbox. Web chọn cách hiển thị theo NEXT_PUBLIC_PAYMENT_MODE.

Provider VNPay ký URL từ số tiền trong đơn, mã lần thử và Return URL. Lần thử PENDING có link hiệu lực 15 phút. Return xác minh chữ ký và dữ liệu tham chiếu trước khi điều hướng. IPN xác minh chữ ký, terminal, tham chiếu, số tiền và trạng thái rồi chốt giao dịch trong transaction. Kết quả truy vấn sau redirect lấy từ API BrewLite.

Khóa idempotency theo người dùng áp dụng cho POST /payments. API dùng lại lần thử VNPay đang PENDING. Hết hạn URL không tự kết thúc lần thử. Nếu phát lại một yêu cầu mock đã bỏ trường mockOutcome, giá trị mặc định khi ghi và giá trị khi đối chiếu hiện khác nhau.

Xem [factory](../../../apps/api/src/payments/providers/payment-provider.factory.ts), [VNPay provider](../../../apps/api/src/payments/providers/vnpay.provider.ts), [dịch vụ thanh toán](../../../apps/api/src/payments/payments.service.ts), [dịch vụ callback](../../../apps/api/src/payments/vnpay-callback.service.ts) và [cấu hình](../../deployment.md).
