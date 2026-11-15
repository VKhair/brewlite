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

Thanh toán mặc định là mô phỏng; không cần VNPay key và không thu tiền thật. Có thể bật VNPay Sandbox bằng `PAYMENT_MODE=vnpay`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` và `VNPAY_RETURN_URL`. Địa chỉ IPN phải truy cập được từ VNPay; `localhost` chỉ phù hợp phát triển qua tunnel, không nhận callback từ Internet. Khi deploy, cấu hình URL public HTTPS cho cả return/IPN. Mã nguồn hiện hỗ trợ tạo URL ký HMAC-SHA512 và xác minh callback. Sau khi cập nhật `.env`, chạy lại `docker compose up -d --build` để bật lựa chọn VNPay trên web.

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
Chạy bộ kiểm thử Unit Test cho toàn bộ workspace:
```bash
npm test
```
*Chạy riêng:* `npm run test:api` hoặc `npm run test:web`.

### 4.3. Kiểm thử tích hợp (Integration Tests)
Chạy bộ kiểm thử tích hợp API với cơ sở dữ liệu in-memory PGlite:
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

### 5.1. Mô hình triển khai Production (AWS Lightsail)
- **Frontend Container Service:** Chạy Next.js Web App, mở cổng HTTPS công khai đón người dùng và hỗ trợ PWA.
- **Backend API Container Service:** Chạy NestJS API, mở HTTPS nhận API request từ Web và webhook thanh toán.
- **Managed PostgreSQL Database:** Vận hành ở chế độ **Private Mode**, chỉ cho phép kết nối nội bộ từ Backend API trong cùng AWS Region; tuyệt đối không mở cổng công khai ra Internet.

### 5.2. Pipeline Tự động hóa CI/CD
1. **Pull Request Quality Gate:** Mỗi PR vào nhánh `main` phải vượt qua pipeline GitHub Actions (`Install` $\rightarrow$ `Lint` $\rightarrow$ `Test` $\rightarrow$ `Build`).
2. **Đóng gói & Triển khai:** Khi tag phiên bản mới hoặc push vào `main`, pipeline đóng gói Docker Image gắn tag Git Commit SHA và triển khai lên AWS Lightsail.
3. **Kiểm tra sau triển khai (Smoke Test):** Gọi tự động endpoint `GET /health` để xác minh trạng thái sẵn sàng của dịch vụ và kết nối database.

### 5.3. Quy trình Rollback sự cố (< 5 phút)
Khi phát hiện lỗi nghiêm trọng sau khi triển khai phiên bản mới:
1. Truy cập AWS Lightsail Console hoặc dùng AWS CLI chuyển active deployment về bản snapshot/image tag SHA ổn định trước đó:
   ```bash
   aws lightsail create-container-service-deployment \
     --service-name brewlite-api \
     --containers file://deployments/rollback-containers.json \
     --public-endpoint file://deployments/rollback-endpoint.json
   ```
2. Thực hiện rollback database migration (nếu có thay đổi schema) về phiên bản tương thích.
3. Kiểm tra lại endpoint `GET /health` để đảm bảo hệ thống đã phục hồi trạng thái hoạt động bình thường trong thời gian dưới 5 phút theo chỉ tiêu **NFR-12**.

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
