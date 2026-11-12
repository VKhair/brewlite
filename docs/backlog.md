# BrewLite Backlog

Backlog khởi tạo theo tài liệu phân công Task 1–5 do nhóm cung cấp. Trạng thái phản ánh những gì quan sát được trong repository tại lần cập nhật này; “Tài liệu đã có” không đồng nghĩa với việc task đã được review/merge hoặc nghiệm thu.

## Sprint 1 – Nền tảng, menu và CI

| ID | Công việc | Phụ trách | Trạng thái | Tiêu chí nghiệm thu / phụ thuộc |
|---|---|---|---|---|
| BL-4.1 | Repo, cấu trúc, hướng dẫn branch, PR template, `.env.example`, backlog và DoD | Viết Khải; Kim Khương hỗ trợ | Hoàn tất trong workspace | Có cấu trúc `apps/web`, `apps/api`, `docs`, `tests`; tài liệu làm việc, PR template, env mẫu, backlog và DoD được lưu trong repo. |
| BL-4.2 | Đưa tài liệu Task 1–3 vào `docs/` qua PR | Kim Khương; cả nhóm hỗ trợ | Tài liệu hiện diện; chưa xác minh PR/merge | Tài liệu yêu cầu, sơ đồ và kiến trúc được lưu trong `docs/`, review và merge qua PR. |
| BL-4.3a | API danh sách/chi tiết sản phẩm, schema và seed | Hải Yến, Quốc Huy | Chưa bắt đầu | `GET /products` và `GET /products/:id` trả dữ liệu từ schema đã tạo; seed sản phẩm mẫu có thể chạy lặp lại theo hướng dẫn. |
| BL-4.3b | Menu mobile-first với trạng thái loading, empty và error | Huy Phát | Chưa bắt đầu | Màn hình menu responsive; hiển thị đúng ba trạng thái và dữ liệu sản phẩm từ API. Phụ thuộc BL-4.3a hoặc API contract thống nhất. |
| BL-4.3c | Kiểm thử tối thiểu cho API và component | Quốc Huy; Hải Yến, Huy Phát hỗ trợ | Chưa bắt đầu | Có test cho endpoint sản phẩm và component menu; chạy thành công qua lệnh dự án. Phụ thuộc ứng dụng/API được scaffold. |
| BL-4.4a | CI: install → lint → test → build | Viết Khải | Chưa bắt đầu | GitHub Actions chạy đủ bốn bước trên PR; kết quả CI có thể kiểm tra trong GitHub. |
| BL-4.4b | Bảo vệ `main` và minh chứng PR pass/fail | Viết Khải; Quốc Huy hỗ trợ | Chưa xác minh | Branch protection yêu cầu CI pass; lưu liên kết/minh chứng một PR pass và một PR fail. Cần cấu hình repository GitHub. |

## Sprint 2 – Nghiệp vụ, kiểm thử và bàn giao

| ID | Công việc | Phụ trách | Trạng thái | Tiêu chí nghiệm thu / phụ thuộc |
|---|---|---|---|---|
| BL-5.1a | Auth, JWT, tạo đơn, thanh toán và trạng thái/lịch sử đơn | Hải Yến; Quốc Huy hỗ trợ migration | Chưa bắt đầu | API đáp ứng SRS và API contract; thanh toán dùng VNPay Sandbox theo quyết định kiến trúc hiện tại. Phụ thuộc schema/migration và hợp đồng API. |
| BL-5.1b | UI chi tiết sản phẩm, giỏ hàng, login, checkout, theo dõi/lịch sử đơn | Huy Phát; Hải Yến hỗ trợ API contract | Chưa bắt đầu | Các màn hình đáp ứng luồng SRS; FE/BE thống nhất API contract trước khi tích hợp. |
| BL-5.1c | Validate FE/BE và xử lý lỗi | Hải Yến (BE), Huy Phát (FE) | Chưa bắt đầu | Dữ liệu đầu vào được kiểm tra ở cả hai phía; lỗi API có phản hồi và giao diện phù hợp theo tiêu chí chấp nhận. |
| BL-5.2a | Unit/integration test nghiệp vụ; E2E menu → xác nhận đơn | Quốc Huy; Hải Yến, Huy Phát hỗ trợ | Chưa bắt đầu | Bộ test tương ứng chạy được; có integration test tạo đơn/thanh toán và E2E luồng đặt hàng. |
| BL-5.2b | `docker-compose.yml` và `GET /health` | Viết Khải; Hải Yến hỗ trợ | Chưa bắt đầu | `docker compose up` khởi chạy hệ thống local; health endpoint trả trạng thái API và kết nối DB theo SRS. |
| BL-5.3 | CD: build/tag SHA, push, deploy, migration, smoke test và rollback | Viết Khải; Hải Yến hỗ trợ | Chưa bắt đầu | Pipeline triển khai tới AWS Lightsail; migration chạy có kiểm soát; smoke test xác nhận deploy; có quy trình rollback theo NFR-12. |
| BL-5.4a | Production HTTPS, DB private và quản lý secret | Viết Khải | Chưa bắt đầu | URL production dùng HTTPS; DB không public; secrets không commit và được cấu hình an toàn trên nền tảng. |
| BL-5.4b | README, release notes, tag và deployment guide | Kim Khương; Viết Khải hỗ trợ | Chưa bắt đầu | Người ngoài nhóm có thể theo README để chạy/kiểm tra; release và deployment docs phản ánh đúng trạng thái đã triển khai. |
| BL-5.4c | Hoàn thiện traceability matrix và cột Test | Kim Khương; Quốc Huy hỗ trợ | Chưa bắt đầu | FR/NFR được nối tới sơ đồ, code/API và test thực có; loại bỏ các tham chiếu chưa tồn tại hoặc đánh dấu rõ là dự kiến. |
| BL-5.4d | Video demo, Sprint Review và Retrospective | Kim Khương; cả nhóm hỗ trợ | Chưa bắt đầu | Có video demo và ghi nhận review/retrospective của Sprint 2. |

## Definition of Done

Áp dụng DoD trong [CONTRIBUTING](../.github/CONTRIBUTING.md) và SRS: đáp ứng tiêu chí chấp nhận; lint, test, build đạt; có test phù hợp cho thay đổi code; không commit secret; PR được ít nhất một thành viên khác review/approve; cập nhật tài liệu và `docs/traceability-matrix.md` khi liên quan. Task có tiêu chí vận hành/deploy chỉ được đánh dấu hoàn tất khi có minh chứng tương ứng.

## Cập nhật backlog

Người phụ trách cập nhật trạng thái và liên kết PR/test/minh chứng khi có thay đổi. Không đánh dấu “Hoàn tất” chỉ vì tài liệu hoặc file đã được tạo; cần đáp ứng tiêu chí nghiệm thu và quy trình review của nhóm.
