# Kế hoạch nhóm và Product Backlog BrewLite

Kế hoạch này bám [Assignment 2](../assignment_2.md) và dùng hiện trạng mã nguồn làm mốc. Người phụ trách chịu trách nhiệm về PR mới và minh chứng của module. Bảng phân công không gán lại tác giả các commit hoặc xác nhận hồi tố việc nghiệm thu.

## Phân công theo module

| Thành viên | Module và phần code chịu trách nhiệm | Đóng góp Task 1–3 | Kiểm thử và bàn giao |
| --- | --- | --- | --- |
| Viết Khải | Nền tảng và vận hành. Health readiness trong NestJS, kiểm thử health, CI, Docker image và tự động hóa deploy. | Đặc tả yêu cầu vận hành FR-13, NFR-07/12. Vẽ deployment diagram và cập nhật ADR nền tảng. | Kiểm tra build sạch, health qua HTTPS, pipeline và cách rollback. Demo triển khai. Review phần thanh toán của Huy Phát. |
| Kim Khương | Tài khoản, phiên và tích hợp web. HTTP client dùng chung, đăng ký, đăng nhập, JWT, lưu phiên, điều hướng bảo vệ và mã E2E trình duyệt. | Điều phối rà soát stakeholder, SRS và tiêu chí chấp nhận. Cập nhật actor và nhánh xác thực của use case. | Kiểm thử đăng ký, đăng nhập, thiếu token và E2E menu đến xác nhận. Demo xác thực và minh chứng E2E. Review phần đơn hàng của Hải Yến. |
| Hải Yến | Giỏ, đơn hàng và vòng đời. Mã giỏ hàng, tạo đơn, snapshot, áp coupon và điểm vào đơn, quyền chủ đơn, hủy, lịch sử và chuyển trạng thái. | Phụ trách use case đặt và thanh toán, activity diagram và quy tắc trạng thái của miền đơn. | Kiểm thử tổng giỏ, thiếu tồn, hủy, truy cập đơn và chuyển trạng thái. Demo theo dõi đơn. Review API thực đơn, dữ liệu và kho của Quốc Huy. |
| Quốc Huy | Danh mục API và dữ liệu. API danh sách/chi tiết, Prisma, migration, seed, tồn và công thức nguyên liệu. Phụ trách dữ liệu và quy tắc xác thực coupon. | Đặc tả quy tắc món và kho. Chủ trì class diagram và đối chiếu ADR PostgreSQL với schema. | Kiểm thử API menu, migration/seed và tính đúng tồn kho. Demo danh mục từ PostgreSQL và hoàn tồn. Review phần nền tảng của Viết Khải. |
| Huy Phát | Menu web và thanh toán. Màn hình menu/chi tiết món, UI chọn topping, provider mock, tích hợp checkout và trang kết quả. | Xác định hành trình khách từ menu đến xác nhận, phụ trách use case tổng quát và sequence diagram thanh toán. | Kiểm thử trạng thái menu, giao dịch mock, retry và bảo toàn giỏ. Demo menu và thanh toán. Review phần tài khoản của Kim Khương. |

Mỗi người viết hoặc cập nhật yêu cầu của module, duyệt thiết kế trước khi làm code, gửi PR có bản triển khai và test, review module theo bảng, rồi tự trình bày kết quả trong Sprint Review. Người phụ trách chính chia việc ở các điểm giao nhau và cùng reviewer rà soát hợp đồng trước khi merge.

## Trình tự nghiệm thu Assignment 2

| Task | Điều phối | Tạo phẩm và điều kiện để chuyển bước |
| --- | --- | --- |
| 1.1–1.3 | Kim Khương | [Bối cảnh và phạm vi](requirements/context-and-scope.md), [SRS](requirements/srs.md), [use case tổng quát](diagrams/use-case-overall.puml), [use case đặt và thanh toán](requirements/BrewLite_DacTa_UseCase_DatVaThanhToan.md) và [sơ đồ chi tiết](diagrams/BrewLite_DatVaThanhToan.puml). Cả nhóm duyệt phạm vi và tiêu chí chấp nhận. |
| 2.1–2.3 | Huy Phát | [Activity](diagrams/Activity_Dia.svg), [sequence](diagrams/sequence-checkout.svg) và [class diagram](diagrams/ClassDiagram_BrewLite.svg) bám Task 1. Kiểm tra cả nguồn và bản kết xuất. Hải Yến duyệt hành vi nghiệp vụ, Quốc Huy duyệt quan hệ và dữ liệu. |
| 3.1–3.2 | Quốc Huy | [Kiến trúc](architecture/architecture.md), [ADR](architecture/adr/README.md), [deployment diagram](diagrams/deploymentDiagram.svg). Viết Khải đối chiếu topology với Lightsail. Cả nhóm xác nhận ranh giới module và môi trường. |
| 4.1–4.4 | Viết Khải | Repository, backlog hai Sprint, thay đổi tài liệu qua PR, MVP menu và CI. Chốt demo menu có loading/empty/error, seed và test. Cần link PR cùng bằng chứng CI pass và CI bắt lỗi. |
| 5.1–5.4 | Hải Yến | MVP đầu cuối, unit/integration/E2E, Compose và health, CD và smoke, HTTPS production, release và bàn giao. Cần link pipeline/release, demo và Sprint Review/Retrospective. |

Đề bài nghiệm thu Task 1 → 2 → 3 → 4 → 5. Trước khi chốt task kế tiếp, gắn link tạo phẩm của task trước và PR/commit liên quan vào issue hoặc board. Với code đã có, dùng lịch sử thật và ghi riêng những minh chứng còn thiếu. Sửa SRS, sơ đồ hay ADR qua PR có lý do và cập nhật [ma trận truy vết](traceability-matrix.md) cùng thay đổi.

## Sprint 1 — MVP xem menu

**Mục tiêu Sprint:** Người dùng xem được danh sách và chi tiết món từ PostgreSQL trên web mobile-first. Nhóm có nền tảng repository, test và CI kiểm tra PR.

| Issue | Task | Chủ trì | Code và tiêu chí chấp nhận | Điểm |
| --- | --- | --- | --- | --- |
| S1-K01 | 4.1, 4.3, 4.4 | Viết Khải | Nối script workspace và cấu hình CI install → generate → lint → test → build. Chạy CI trên PR và thu bằng chứng một lần pass, một lần phát hiện lỗi. | 2 |
| S1-K02 | 4.3 | Viết Khải | Hoàn thiện readiness API và kiểm thử truy vấn DB đạt hoặc lỗi. Health phản ánh đúng DB dùng cho demo menu. | 2 |
| S1-M01 | 4.3 | Kim Khương | Phụ trách client REST và rewrite cùng origin cho web. Request danh sách/chi tiết tới được API và lỗi HTTP hiện đúng thông báo. | 2 |
| S1-M02 | 4.3 | Kim Khương | Viết test cho HTTP client và dữ liệu trả lỗi của menu. Test chạy được qua script web dùng trong CI. | 2 |
| S1-Y01 | 4.3 | Hải Yến | Viết phần tính giá lựa chọn món dùng chung cho chi tiết và giỏ. Kiểm thử giá gốc, chênh lệch size và topping. | 2 |
| S1-Y02 | 4.3 | Hải Yến | Viết hàm khóa cấu hình món và kiểm tra số lượng cho luồng chọn món. Kiểm thử cùng tùy chọn được gộp và tùy chọn khác tạo dòng riêng. | 2 |
| S1-Q01 | 4.3 | Quốc Huy | Phụ trách danh sách/chi tiết sản phẩm NestJS, schema và seed. Seed chạy lặp giữ dữ liệu cũ. | 3 |
| S1-Q02 | 4.3 | Quốc Huy | Bổ sung test API sản phẩm cho danh sách, chi tiết và 404, dùng dữ liệu seed cô lập. | 1 |
| S1-P01 | 4.3 | Huy Phát | Phụ trách UI menu/chi tiết mobile-first. Hiện loading, empty, lỗi và nút thử lại, cùng giá và ảnh từ API. | 3 |
| S1-P02 | 4.3 | Huy Phát | Viết kiểm thử component hoặc luồng menu cho một phản hồi thành công và lỗi/thử lại. | 1 |

Task 4.2 thực hiện xuyên Sprint bằng PR tài liệu của từng module. Thứ tự tích hợp là schema/seed → API danh mục → client web → màn hình và test. Tính giá lựa chọn ở Sprint 1 làm nền cho luồng mua ở Sprint 2. MVP Sprint 1 nghiệm thu độc lập ở luồng đọc menu.

## Sprint 2 — Đặt, thanh toán, theo dõi và bàn giao

**Mục tiêu Sprint:** Checkout từ menu đến xác nhận chạy và có test đầu cuối. Bản phát hành triển khai được qua pipeline, có smoke test và đường lui khi lỗi.

| Issue | Task | Chủ trì | Code và tiêu chí chấp nhận | Điểm |
| --- | --- | --- | --- | --- |
| S2-K01 | 5.2–5.3 | Viết Khải | Kiểm tra build sạch Compose và viết workflow release có quality gate, image tag bất biến, migration an toàn, deploy và smoke. Push registry khi pipeline cần, hoặc ghi rõ cách chuyển image nếu dùng kho image cục bộ. | 5 |
| S2-K02 | 5.3–5.4 | Viết Khải | Viết kiểm tra health/smoke cho lần deploy và cơ chế dừng khi lỗi. Ghi cách phục hồi image trước, điều kiện tương thích migration và bằng chứng rollback trên môi trường kiểm thử. | 3 |
| S2-M01 | 5.1–5.2 | Kim Khương | Phụ trách form đăng ký/login, luồng JWT, phiên và điều hướng checkout sau login. Thêm test dữ liệu sai, token thiếu hoặc hết hạn. | 4 |
| S2-M02 | 5.2 | Kim Khương | Viết E2E trình duyệt dùng mock, từ menu → chọn món → giỏ → login → checkout → xác nhận. Dùng database thử nghiệm và lưu log chạy. Huy Phát và Hải Yến hỗ trợ tích hợp. | 4 |
| S2-Y01 | 5.1–5.2 | Hải Yến | Phụ trách giỏ, snapshot giá, tạo đơn, lưu lịch sử và các điểm giao dịch giữ tồn. Viết test giỏ và integration test tạo đơn/rollback. | 5 |
| S2-Y02 | 5.1–5.2 | Hải Yến | Phụ trách lịch sử và vòng đời đơn, phép chuyển cho STAFF/ADMIN và hủy của chủ đơn. Kiểm thử quyền, chuyển sai và hoàn khi hủy. | 3 |
| S2-Q01 | 5.1–5.2 | Quốc Huy | Phụ trách dữ liệu size/topping và đồng bộ schema, migration, seed. Chứng minh DB trống dựng lại được và catalog trả đúng lựa chọn. | 4 |
| S2-Q02 | 5.2 | Quốc Huy | Phụ trách tích hợp kho với đơn và thanh toán, test thiếu tồn, hoàn tồn và retry. Mở issue lỗi retry nguyên liệu kèm ca tái hiện và kết quả sửa nếu nằm trong phạm vi Sprint. | 4 |
| S2-P01 | 5.1–5.2 | Huy Phát | Phụ trách code thanh toán ví/thẻ mock và tích hợp UI checkout/kết quả. Kiểm thử thành công, thất bại, giỏ được giữ và retry. | 5 |
| S2-P02 | 5.2–5.4 | Huy Phát | Bổ sung test replay idempotency, gồm mockOutcome mặc định. Rà nhánh VNPay Sandbox đang có và chuẩn bị kịch bản demo. | 3 |

Thứ tự tích hợp là catalog và xác thực → tạo đơn và tồn → mock checkout và xác nhận → E2E → đóng gói và deploy. Thỏa thuận giữa module gồm API danh mục của Quốc Huy và Huy Phát, JWT của Kim Khương với Hải Yến, giao dịch giữ/hoàn tồn của Hải Yến và Quốc Huy, hợp đồng order/payment của Hải Yến và Huy Phát, và cấu hình callback giữa Huy Phát và Viết Khải.

Mỗi người nhận **4 điểm việc trong Sprint 1 và 8 điểm trong Sprint 2**. Đây là ước lượng dùng khi lập kế hoạch. Sprint Planning hiệu chỉnh theo rủi ro, phụ thuộc và tải review, đồng thời giữ phần code và test cho từng thành viên.

## Quy trình làm việc và Definition of Done

1. **Sprint Planning.** Chọn issue từ backlog, xác định mục tiêu và người review. Issue sẵn sàng khi có mã Task/FR/NFR, phạm vi code, tiêu chí kiểm tra, phụ thuộc và cách tái hiện hoặc dữ liệu test.
2. **Thực hiện.** Tạo branch từ main theo [quy ước nhóm](../.github/CONTRIBUTING.md). PR gắn issue, nêu thay đổi yêu cầu hoặc thiết kế nếu có, ghi cách chạy và kết quả test. Khi bị chặn bởi module khác, cập nhật issue và chốt hợp đồng với người phụ trách trước khi tích hợp.
3. **Review và tích hợp.** Reviewer chạy hoặc xem kết quả ca chấp nhận. PR cần ít nhất một approval và lint/test/build đạt. Không merge khi CI lỗi. Bổ sung test phù hợp với thay đổi và cập nhật mã FR/NFR hoặc sơ đồ trong cùng PR.
4. **Sprint Review.** Mỗi người demo module của mình. Ghi PR đã merge, tính năng đã demo, kết quả test, phản hồi và việc chuyển sang Sprint sau.
5. **Retrospective.** Sau review, mỗi người nêu một việc hiệu quả hoặc một vướng mắc. Nhóm chọn hành động cải tiến, giao người thực hiện và gắn mốc kiểm tra vào Sprint kế tiếp hoặc đợt bàn giao.
6. **Đóng issue.** Issue hoàn tất khi có code hoặc tạo phẩm đạt tiêu chí, test tái chạy được, PR được duyệt và merge, tài liệu/truy vết cập nhật, không lộ secret và có bằng chứng triển khai nếu hạng mục thuộc vận hành.

## Minh chứng và checklist bàn giao

- [ ] **Task 1–3 — Kim Khương, Huy Phát, Quốc Huy:** đính kèm PR hoặc commit có SRS, use case, activity/sequence/class, kiến trúc/ADR, deployment và truy vết. Các file hiện có trong repository, cần gắn minh chứng review theo thứ tự.
- [ ] **Task 4 — Viết Khải:** đính kèm board hai Sprint và link PR có CI. Lưu một run pass, một run bắt lỗi và bằng chứng cấu hình chặn merge. Repository có workflow CI, cần đối chiếu các minh chứng trên GitHub.
- [ ] **Task 5.1–5.2 — Hải Yến, Quốc Huy, Kim Khương, Huy Phát:** đính kèm log unit/integration, kiểm thử dựng DB và E2E trình duyệt. Hiện có test API và integration PostgreSQL. E2E route gốc bằng Supertest chưa bao phủ hành trình trình duyệt.
- [ ] **Task 5.3 — Viết Khải:** đính kèm run từ push/tag đến deploy, image tag, smoke và bằng chứng xử lý thất bại. [Lightsail đã được kiểm tra](deployment.md#aws-lightsail), còn workflow CD và diễn tập rollback cần minh chứng riêng.
- [ ] **Task 5.4 — Cả nhóm:** Huy Phát chuẩn bị kịch bản/video demo, Viết Khải xác nhận URL HTTPS và health, Quốc Huy kiểm tra hướng dẫn migration/rollback, Hải Yến tổng hợp release notes, Kim Khương đối chiếu quyền truy cập repository và biên bản Review/Retrospective. Kiểm tra README để người ngoài nhóm chạy local, test, build, deploy và rollback theo các tài liệu liên kết.

Mỗi biên bản Sprint lưu mục tiêu, ngày, người tham dự, liên kết PR/CI, kết quả demo và tiêu chí đạt/chưa đạt. Biên bản Retrospective ghi hành động cải tiến, người phụ trách và thời điểm kiểm tra. Chốt release bằng Git tag và release notes có URL, tính năng, thay đổi DB, hướng dẫn xác minh và rollback. Image tag hiện có là bằng chứng phiên bản đang dùng trên máy chủ.
