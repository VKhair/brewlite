# BrewLite – Nền tảng đặt đồ uống trực tuyến không dùng tiền mặt

> **Đồ án:** Công nghệ Phần mềm (Software Engineering) – Assignment 2: Requirements to Deployment  
> **Slogan:** *"BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."*  
> **Ngăn xếp công nghệ bắt buộc:** **Next.js** (Web/PWA) · **NestJS** (API) · **PostgreSQL** (Database) · **Docker**

---

## 1. Giới thiệu tổng quan

BrewLite là ứng dụng thương mại điện tử phục vụ chuỗi đồ uống, được xây dựng theo kiến trúc **Monorepo** hiện đại, ưu tiên trải nghiệm thiết bị di động (**Mobile-First / PWA**). Hệ thống giải quyết bài toán ùn tắc tại quầy gọi món bằng giải pháp thanh toán điện tử (Ví điện tử / Thẻ), tích hợp quản lý giỏ hàng, xác thực bảo mật JWT, kiểm soát tồn kho đồng thời với ACID Transaction và Idempotency-Key chống trừ tiền lặp.

### Ngăn xếp công nghệ cốt lõi
- **Frontend (`apps/web`):** Next.js 16 (App Router), React 19, Tailwind CSS v4, tối ưu hóa PWA và thiết bị di động.
- **Backend (`apps/api`):** NestJS 12, TypeScript, kiến trúc phân lớp (Modular / Clean Architecture), RESTful API, Validation Pipes.
- **Cơ sở dữ liệu:** PostgreSQL (Production / Docker), PGlite (môi trường kiểm thử tích hợp in-memory siêu tốc).
- **DevOps & Vận hành:** Docker Compose (local), GitHub Actions (CI/CD Pipeline), AWS Lightsail (mục tiêu triển khai Production).

---

## 2. Cấu trúc thư mục Monorepo

```text
brewlite/
├── apps/
│   ├── web/                    # Ứng dụng Next.js Mobile-First / PWA
│   │   ├── src/app/            # App Router (menu, cart, checkout, orders, auth)
│   │   └── src/lib/            # Stores (cart, auth, orders) & tiện ích client
│   └── api/                    # Ứng dụng Backend NestJS
│       ├── src/                # Controllers, Services, DTOs, Auth, Orders, Payments
│       ├── db/                 # SQL Schema và dữ liệu khởi tạo (seed.sql)
│       └── test/               # Bộ kiểm thử Unit, Integration và E2E
├── docs/                       # Toàn bộ tài liệu kỹ thuật & tạo phẩm Task 1–5
│   ├── requirements/           # Task 1: Bối cảnh, SRS, đặc tả use-case checkout
│   ├── diagrams/               # Task 2: Use-case, Activity, Sequence, Class diagrams (.puml & .svg)
│   ├── architecture/           # Task 3: Mô tả kiến trúc C4, thư mục ADR (0001–0005)
│   ├── deployment.md           # Task 3.2: Sơ đồ triển khai AWS Lightsail & quy tắc mạng
│   ├── backlog.md              # Task 4.1: Product Backlog & phân công Sprint 1 & 2
│   └── traceability-matrix.md  # Ma trận truy vết Yêu cầu ↔ Sơ đồ ↔ Code ↔ Test
├── .github/
│   ├── workflows/ci.yml        # CI Pipeline (Install -> Lint -> Test -> Build)
│   ├── CONTRIBUTING.md         # Quy ước branch, commit và Definition of Done
│   └── pull_request_template.md# Mẫu Pull Request chuẩn
├── docker-compose.yml          # Container PostgreSQL phục vụ phát triển local
├── .env.example                # Cấu hình biến môi trường mẫu
└── package.json                # Quản lý workspaces monorepo và scripts điều phối
```

---

## 3. Hướng dẫn cài đặt và Khởi chạy cục bộ (Local Setup)

### 3.1. Yêu cầu môi trường
- **Node.js:** phiên bản `20.12+` hoặc `24.x` (khuyến nghị dùng `npm >= 10.0.0`).
- **Docker & Docker Compose:** để chạy container PostgreSQL.
- **Git:** phiên bản mới nhất.

### 3.2. Chạy nhanh toàn bộ hệ thống bằng Docker Compose

1. Tạo `.env` từ `.env.example` nếu chưa có. Nếu `.env` đã tồn tại, giữ các secret hiện tại và bổ sung các khóa cấu hình còn thiếu.
2. Từ thư mục repository, chạy:

   ```bash
   docker compose up --build
   ```

   Compose khởi động PostgreSQL, chạy schema/seed lặp an toàn trước API, sau đó khởi động web. Stack này dùng project name và cổng riêng để tránh thay đổi các container BrewLite khác đang chạy.

3. Mở các địa chỉ local mặc định:
   - Web: [http://localhost:3002](http://localhost:3002)
   - API health (kèm kiểm tra PostgreSQL): [http://localhost:3003/health](http://localhost:3003/health)
   - PostgreSQL: `localhost:5433`

Dừng stack bằng `docker compose down`. Dữ liệu PostgreSQL được giữ trong volume `brewlite-mvp_postgres_data`.

### 3.3. Chạy chế độ phát triển với hot reload

Giữ Compose chạy PostgreSQL, sau đó cài dependencies và khởi tạo dữ liệu:

```bash
npm ci
docker compose up -d postgres
npm run db:setup
```

Mở hai terminal tại thư mục repository:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Nếu đang chạy full stack bằng Compose, dừng hai service ứng dụng trước bằng `docker compose stop web api` để giải phóng cổng; PostgreSQL vẫn chạy. Web dùng proxy cùng origin tới API. Các cổng được cấu hình trong `.env` (`WEB_PORT`, `API_PORT`, `POSTGRES_PORT`). Lệnh `npm run user:staff -- email@example.com` nâng tài khoản đã đăng ký thành nhân viên để gọi API đổi trạng thái đơn.

Thanh toán mặc định dùng chế độ mô phỏng. Để chạy VNPay Sandbox bằng Docker Compose:

1. Đặt `PAYMENT_MODE=vnpay`, `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` trong `.env` local. Giữ khóa ký ở backend.
2. Dùng HTTPS tunnel trỏ đến API local cổng `3003`. Đặt `VNPAY_RETURN_URL=https://<tunnel>/payments/vnpay/return` và `VNPAY_FRONTEND_URL=http://localhost:3002` nếu dùng cổng mặc định.
3. Đăng ký `https://<tunnel>/payments/vnpay/ipn` với VNPay cho Terminal ID sandbox. Biến `VNPAY_IPN_URL` trong `.env` ghi lại địa chỉ đã đăng ký. Nếu tunnel đổi tên miền, cập nhật cả hai URL và đăng ký lại IPN.
4. Chạy `docker compose up -d --build`. Vào checkout để mở cổng sandbox và thử giao dịch thành công hoặc hủy. Return URL đưa trình duyệt về trang kết quả. Trạng thái đơn cập nhật khi API nhận IPN hợp lệ.

Hướng dẫn kỹ thuật và dữ liệu kiểm thử có trên [trang tài liệu VNPay Sandbox](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html).

---

## 4. Kiểm thử và Kiểm soát chất lượng (Quality Gates)

Toàn bộ quy trình kiểm thử và kiểm tra cú pháp được tự động hóa đồng bộ trên monorepo:

### 4.1. Kiểm tra cú pháp và định dạng (Linting)
Chạy kiểm tra cú pháp trên toàn bộ mã nguồn (Oxlint cho API và ESLint cho Web):
```bash
npm run lint
```
*Chạy riêng:* `npm run lint:api` hoặc `npm run lint:web`.

### 4.2. Kiểm thử tự động (Testing)
Sau khi build, seed PostgreSQL kiểm thử và cài Chromium theo [hướng dẫn Playwright](docs/deployment.md#kiểm-tra-và-tự-động-hóa), chạy unit API và E2E trình duyệt:
```bash
npm test
```
*Chạy riêng:* `npm run test:api` hoặc `npm run test:web`.

### 4.3. Kiểm thử tích hợp (Integration Tests)
Sau khi build API, đặt TEST_DATABASE_URL hoặc DATABASE_URL trỏ tới PostgreSQL kiểm thử rồi chạy:
```bash
npm run test:integration
```

### 4.4. Đóng gói sản phẩm (Production Build)
Biên dịch cả Backend NestJS và Frontend Next.js sẵn sàng cho môi trường triển khai:
```bash
npm run build
```
*Chạy riêng:* `npm run build:api` hoặc `npm run build:web`.

---

## 5. Triển khai (Deployment) và Kế hoạch Phục hồi (Rollback)

Theo thiết kế kiến trúc tại [`docs/deployment.md`](docs/deployment.md) và [`docs/architecture/adr/0005-aws-lightsail.md`](docs/architecture/adr/0005-aws-lightsail.md):

### 5.1. Môi trường production

Caddy trên Lightsail VM nhận HTTPS và chuyển tiếp đến web/API. PostgreSQL dùng volume và mạng nội bộ của Compose.

### 5.2. Kiểm tra và phát hành

PR vào main chạy hai check bắt buộc `Quality` và `Browser E2E`. Push lên main hoặc tag v* vượt qua hai check sẽ đóng gói web/API và đẩy image gắn commit SHA lên GHCR. Tag v* triển khai hai image lên Lightsail và kiểm tra readiness tại `/api/backend/health`. Xem [cấu hình môi trường production và vận hành release](docs/deployment.md#phát-hành-và-kiểm-tra-health).

### 5.3. Phục hồi

Trước khi phát hành, lưu bản sao overlay `/opt/brewlite/release.compose.yaml` của release ổn định, SHA cặp image API/web và điểm khôi phục PostgreSQL nếu có migration. Tag `v1.0.0` hoặc tag `v*` tương ứng trỏ tới commit cần phát hành.

Nếu cần quay lui và cặp image cũ tương thích với schema hiện tại, trên Lightsail VM chạy:

```bash
cd /opt/brewlite
cp /duong-dan/ban-sao/release.compose.yaml release.compose.yaml
docker compose -p brewlite-server -f compose.yaml -f release.compose.yaml pull api web
docker compose -p brewlite-server -f compose.yaml -f release.compose.yaml up -d --no-build --wait api web
curl --fail --silent --show-error https://brewlite.vkhair.dev/api/backend/health | jq -e '.status == "ok" and .database == "ok"'
```

Nếu schema đã thay đổi theo cách không tương thích, dùng phương án phục hồi PostgreSQL đã kiểm chứng cho migration đó trước khi khởi động cặp image cũ. [Chi tiết vận hành](docs/deployment.md#rollback)

---

## 6. Danh mục tài liệu kỹ thuật dự án

Toàn bộ tài liệu phân tích, thiết kế và truy vết được lưu trữ có kiểm soát phiên bản trong thư mục `docs/`:

| Giai đoạn / Task | Tài liệu chính | Mô tả nội dung |
|---|---|---|
| **Task 1: Yêu cầu** | [`docs/requirements/context-and-scope.md`](docs/requirements/context-and-scope.md) | Bối cảnh kinh doanh, 6 nhóm stakeholder, phạm vi in/out, giả định và ma trận rủi ro. |
| | [`docs/requirements/srs.md`](docs/requirements/srs.md) | Đặc tả 18 yêu cầu chức năng (FR), 12 phi chức năng (NFR), tiêu chí nghiệm thu (AC) và MoSCoW. |
| | [`docs/requirements/BrewLite_DacTa_UseCase_DatVaThanhToan.md`](docs/requirements/BrewLite_DacTa_UseCase_DatVaThanhToan.md) | Đặc tả use-case trọng tâm "Đặt và thanh toán đơn hàng" (Main, Alternative, Exception flows). |
| **Task 2: Mô hình** | [`docs/diagrams/use-case-overall.svg`](docs/diagrams/use-case-overall.svg) | Sơ đồ Use-case tổng quát toàn hệ thống (UC-01 đến UC-25). |
| | [`docs/diagrams/Activity_Dia.svg`](docs/diagrams/Activity_Dia.svg) | Sơ đồ hoạt động (Activity) với 4 swimlanes, xử lý hết hàng, chưa đăng nhập, thanh toán lỗi. |
| | [`docs/diagrams/sequence-checkout.svg`](docs/diagrams/sequence-checkout.svg) | Sơ đồ trình tự (Sequence) chi tiết: Customer $\rightarrow$ Web $\rightarrow$ API $\rightarrow$ DB $\rightarrow$ Mock Payment Service. |
| | [`docs/diagrams/ClassDiagram_BrewLite.svg`](docs/diagrams/ClassDiagram_BrewLite.svg) | Sơ đồ lớp miền nghiệp vụ (Class Diagram) đầy đủ 7 thực thể cốt lõi và 6 enums trạng thái. |
| **Task 3: Kiến trúc** | [`docs/architecture/architecture.md`](docs/architecture/architecture.md) | Mô tả kiến trúc C4 (Context, Container, Component), phân lớp NestJS và luồng xử lý thanh toán. |
| | [`docs/architecture/adr/`](docs/architecture/adr/) | 5 bản ghi quyết định kiến trúc: Monorepo, JWT, PostgreSQL/ORM, Payment Gateway, AWS Lightsail. |
| | [`docs/deployment.md`](docs/deployment.md) | Sơ đồ triển khai chi tiết trên AWS Lightsail, ranh giới mạng private/public và quản lý bí mật. |
| **Task 4: Sprint 1** | [`docs/backlog.md`](docs/backlog.md) | Phân rã công việc chi tiết theo Sprint 1 và Sprint 2 kèm Definition of Ready (DoR) và Done (DoD). |
| **Toàn chu kỳ** | [`docs/traceability-matrix.md`](docs/traceability-matrix.md) | Ma trận truy vết 2 chiều: FR/NFR $\longleftrightarrow$ Sơ đồ thiết kế $\longleftrightarrow$ Mã nguồn $\longleftrightarrow$ Ca kiểm thử. |

---

## 7. Quy ước đóng góp và Quy trình làm việc (Contribution & DoD)

- **Chiến lược phân nhánh (Branching Model):** Tuân thủ GitHub Flow. Nhánh `main` luôn ở trạng thái sẵn sàng triển khai. Mọi tính năng phát triển trên nhánh riêng theo quy ước `<type>/<issue>-<mô-tả-ngắn>` (ví dụ: `feat/menu-catalog`, `fix/cart-total`).
- **Quy ước Commit (Conventional Commits):** `<type>(<scope>): <mô tả>` (ví dụ: `feat(api): add GET /products endpoint`).
- **Definition of Done (DoD):**
  - Vượt qua 100% tiêu chí chấp nhận (AC) của yêu cầu nghiệp vụ.
  - Vượt qua kiểm tra tự động: `npm run lint`, `npm test`, `npm run build` không có lỗi.
  - Có ca kiểm thử bổ sung cho chức năng mới.
  - Không để lộ secret, API key hay thông tin bảo mật.
  - Được review và approve bởi ít nhất 1 thành viên trước khi merge vào `main`.
  - Cập nhật tài liệu kỹ thuật và dòng tương ứng trong [`docs/traceability-matrix.md`](docs/traceability-matrix.md).

*Chi tiết vui lòng xem tại [Hướng dẫn đóng góp (.github/CONTRIBUTING.md)](.github/CONTRIBUTING.md).*
