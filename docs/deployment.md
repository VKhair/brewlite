# Triển khai và vận hành BrewLite

## AWS Lightsail

BrewLite chạy trên một máy ảo Lightsail Ubuntu 24.04 LTS tại `ap-southeast-2` (Sydney). Docker Compose trên máy chủ dùng project `brewlite-server` với cấu hình tại `/opt/brewlite/compose.yaml` và `/opt/brewlite/Caddyfile`. Cấu hình runtime và secret nằm trong môi trường triển khai. Xem [sơ đồ triển khai](diagrams/deploymentDiagram.puml) và [ADR-0005](architecture/adr/0005-aws-lightsail.md).

| Dịch vụ | Image xác nhận ngày 19/11/2026 | Kết nối |
| --- | --- | --- |
| Caddy | `caddy:2-alpine` | Publish TCP `80` và `443`. Phục vụ HTTPS cho tên miền, chuyển HTTP sang HTTPS. |
| Web | `brewlite-web:33c72b5` | Caddy gọi `web:3000`. Next.js chuyển tiếp `/api/backend/*` đến `http://api:3001`. |
| API | `brewlite-api:33c72b5` | Nghe tại `api:3001` trong mạng Compose. Caddy chuyển trực tiếp `/payments/vnpay/return` và `/payments/vnpay/ipn` đến API. |
| PostgreSQL | `postgres:16-alpine` | API kết nối `postgres:5432` trong mạng Compose. Dữ liệu dùng volume `brewlite-server_postgres_data`. |

Web, API và PostgreSQL chỉ dùng cổng nội bộ trong stack này. API chạy `db:setup` trước khi khởi động. Compose dùng healthcheck để đợi PostgreSQL trước API, API trước web, và web trước Caddy. Cả bốn dịch vụ có restart policy `unless-stopped`. Caddy lưu trạng thái trong các volume `brewlite-server_caddy_data` và `brewlite-server_caddy_config`.

### Kiểm tra sau triển khai

Trên máy Lightsail, dùng file Compose của máy chủ để xem trạng thái và image:

~~~bash
sudo docker compose --project-directory /opt/brewlite -f /opt/brewlite/compose.yaml ps --all
sudo docker compose --project-directory /opt/brewlite -f /opt/brewlite/compose.yaml config --images
~~~

Ngày 19/11/2026, cả bốn container đều `Up`. Web, API và PostgreSQL báo `healthy`. Trang chủ qua HTTPS trả `200`. Health qua Caddy và Next.js trả `200` cùng `{"status":"ok","database":"ok"}`. Xem [BrewLite](https://brewlite.vkhair.dev/) và [health endpoint](https://brewlite.vkhair.dev/api/backend/health).

API chạy với `PAYMENT_MODE=vnpay`. Gọi Return URL khi thiếu tham số trả `302` về `/orders?payment=unverified`. IPN thiếu chữ ký trả HTTP `200` kèm `RspCode: "97"`. Hai phản hồi này xác nhận định tuyến và cách từ chối callback không hợp lệ. Việc đăng ký IPN ở phía VNPay và giao dịch Sandbox đầu cuối chưa được kiểm chứng trong lần kiểm tra này.

## Môi trường phát triển cục bộ

Repository định nghĩa ba dịch vụ trong [Docker Compose](../docker-compose.yml). Dockerfile và CI dùng Node.js 24.

| Dịch vụ | Cổng host mặc định | Kết nối nội bộ Compose |
| --- | --- | --- |
| Next.js web | 127.0.0.1:3002 | Web nghe cổng 3000 và rewrite request về http://api:3001. |
| NestJS API | 127.0.0.1:3003 | API nghe cổng 3001 và kết nối postgres:5432. |
| PostgreSQL 16 | 127.0.0.1:5433 | DB nghe cổng 5432 và dùng volume postgres_data. |

Compose chờ PostgreSQL healthy trước khi chạy API. Lệnh khởi động API áp migration và seed trước khi start. Web chờ GET /health từ API thành công.

## Chạy ứng dụng trực tiếp, dùng PostgreSQL trong Docker

Tạo `.env` gốc từ [`.env.example`](../.env.example) nếu chưa có. Cấu hình `DATABASE_URL` theo cổng và thông tin PostgreSQL đã chọn.

~~~bash
npm ci
docker compose up -d postgres
npm run build:api
npm run db:setup
~~~

Chờ PostgreSQL sẵn sàng trước khi chạy `db:setup`. Bước build tạo Prisma Client trong `dist` cho script seed. Chạy `npm run dev:api` và `npm run dev:web` ở hai terminal. Mở web ở `http://localhost:3002` và kiểm tra `GET http://localhost:3003/health`. Khi DB sẵn sàng, health trả `{ "status": "ok", "database": "ok" }`. Nếu truy vấn DB lỗi, API trả HTTP `503`.

`db:setup` gọi migration rồi seed. DB mới nhận baseline và migration tính năng. Script nhận diện một số schema UUID cũ để ghi nhận baseline trước khi deploy migration. Seed giữ lại giá trị đã có. Sau khi đăng ký tài khoản và build API, có thể cấp quyền bằng `npm run user:staff -- email@example.com` hoặc `npm run user:admin --workspace=api -- email@example.com`. Xem [script migration](../apps/api/scripts/migrate.cjs) và [script seed](../apps/api/scripts/seed.cjs).

Khi nâng cấp schema tồn theo nguyên liệu, dừng API phiên bản cũ, chạy migration rồi mới khởi động bản mới. Migration giữ nguyên lượng đã trừ cho các phiên VNPay đang chờ và hoàn lượng đã giữ của đơn chưa bắt đầu thanh toán. Trước khi mở bán, quản trị viên cần cấu hình công thức cho từng size và topping được bán rồi nhập tồn nguyên liệu. Seed ứng dụng tạo danh mục, 12 công thức theo size, 3 công thức topping và tồn dương dành cho demo trên DB mới. Seed giữ nguyên số dư hiện có và công thức đã cấu hình. Suite integration PostgreSQL dùng fixture riêng. Xem [migration tồn theo lần thanh toán](../apps/api/prisma/migrations/20261121000000_payment_ingredient_inventory/migration.sql).

## Build container và cấu hình thanh toán

- [Dockerfile API](../apps/api/Dockerfile) cấp DATABASE_URL mẫu trong bước generate/build. Khi container chạy, Compose cấp URL PostgreSQL của môi trường.
- [Dockerfile web](../apps/web/Dockerfile) tạo bản Next.js standalone. Compose chuyển PAYMENT_MODE vào build web qua NEXT_PUBLIC_PAYMENT_MODE. Khi chạy web trực tiếp với Sandbox, đặt NEXT_PUBLIC_PAYMENT_MODE=vnpay trước khi chạy hoặc build.
- API mặc định dùng PAYMENT_MODE=mock. JWT_SECRET cần ít nhất 32 byte, JWT_EXPIRES_IN mặc định là 1d. API ở NODE_ENV=production yêu cầu ALLOW_MOCK_PAYMENTS=true nếu dùng mock.
- Để dùng Sandbox, đặt PAYMENT_MODE=vnpay, VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_RETURN_URL và VNPAY_FRONTEND_URL. VNPAY_PAYMENT_URL phải là endpoint Sandbox. Giữ secret ở API. Return URL cần truy cập được từ trình duyệt. Đăng ký URL IPN truy cập được từ VNPay, trỏ đến /payments/vnpay/ipn. VNPAY_IPN_URL ghi địa chỉ đã đăng ký, việc đăng ký thực hiện bên ngoài ứng dụng.

## Kiểm tra và tự động hóa

- docker compose config --quiet kiểm tra cấu hình Compose.
- npm run test:integration cần build API và kết nối PostgreSQL qua TEST_DATABASE_URL hoặc DATABASE_URL. Suite tạo schema kiểm thử riêng rồi dọn sau khi chạy.
- [Smoke test](../apps/api/scripts/smoke-commerce.cjs) tạo tài khoản và đơn thật trong DB mà API đang dùng. Chạy với môi trường thử nghiệm, PAYMENT_MODE=mock và API_URL=http://localhost:3003 nếu dùng cổng host mặc định.
- [Quality và Browser E2E](../.github/workflows/ci.yml) là hai check cho PR vào main. Mỗi job dùng một PostgreSQL riêng. Browser E2E khởi động web và API thật ở chế độ mock, tạo tài khoản thử và kiểm tra mã đơn trên giao diện.
- Để chạy lại [test checkout](../apps/web/e2e/checkout.spec.ts) ở local, dùng DB dành cho test với DATABASE_URL và JWT_SECRET theo cấu hình local. Đặt PAYMENT_MODE và NEXT_PUBLIC_PAYMENT_MODE thành mock, API_INTERNAL_URL thành http://127.0.0.1:3003 trước khi build. Để trống cổng web/API cho Playwright khởi động hai dịch vụ.

~~~bash
npm ci
npx playwright install chromium
npm run build
npm run db:setup
npm run test:web
~~~

## Phát hành và kiểm tra health

Push lên main hoặc tag v* chạy hai check trước khi build và push hai image lên GHCR với tag là toàn bộ commit SHA. Chỉ tag v* kích hoạt deploy vào GitHub environment production. Web release dùng VNPay Sandbox tương ứng với cấu hình Lightsail.

Environment production cần ba GitHub Actions secrets: DEPLOY_TARGET (user@host), DEPLOY_SSH_KEY (private key của tài khoản triển khai) và DEPLOY_KNOWN_HOSTS (host key SSH đã xác minh). Tài khoản triển khai cần quyền chạy Docker Compose v2 có hỗ trợ --wait, ghi vào /opt/brewlite và pull hai image GHCR. Với package private, cấu hình quyền đọc registry trên máy chủ.

Job deploy dùng project brewlite-server, giữ cấu hình dịch vụ trong compose.yaml và ghi đè hai tên image theo SHA. Sau khi Compose sẵn sàng và ID image của cả hai container khớp, workflow lưu release.compose.yaml cạnh compose.yaml. Khi thao tác thủ công với release này, dùng cả hai file:

~~~bash
cd /opt/brewlite
docker compose -p brewlite-server -f compose.yaml -f release.compose.yaml ps
~~~

Cuối job, runner gọi endpoint HTTPS công khai qua web và yêu cầu cả status và database bằng ok. Lỗi SSH, pull, khởi động, kiểm tra image hoặc health làm job thất bại.

## Rollback

Khi chuẩn bị phát hành, lưu cặp image web/API đang chạy, cấu hình tương ứng và điểm khôi phục dữ liệu nếu thay đổi schema. Khi deploy thất bại, xác định migration đã chạy tới đâu và khả năng tương thích của image trước với schema hiện tại. Nếu tương thích, dùng lại cặp image và cấu hình đã lưu rồi kiểm tra container, HTTPS và health. Nếu không tương thích, dùng phương án phục hồi dữ liệu đã kiểm chứng cho migration đó. Lưu thời điểm, phiên bản, kết quả smoke và lỗi đã xử lý vào minh chứng release. Quy trình này cần được diễn tập trên môi trường kiểm thử trước khi ghi là đã xác minh.
