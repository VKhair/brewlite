# Hồ sơ nghiệm thu và bàn giao BrewLite

## Kiểm tra trên môi trường test

- CI chạy lint, build, unit API, integration, hai ca Playwright và kiểm tra migration chạy lại vẫn giữ đơn đã thanh toán.
- VNPay integration dùng IPN mô phỏng với dữ liệu test. Giao dịch Sandbox qua endpoint HTTPS được ghi riêng ở lần nghiệm thu production.
- Ruleset [protectmain](https://github.com/VKhair/brewlite/rules/26506039) yêu cầu `Quality` và `Browser E2E`. [Lần CI thất bại trên PR #22](https://github.com/VKhair/brewlite/actions/runs/43838101409) phát hiện runner chưa có PostgreSQL cho integration và Prisma generate cần cấu hình tại bước build image. PR bị chặn. Job `Quality` nay khởi tạo PostgreSQL 16, còn build image chỉ dùng URL giả cho bước sinh Prisma Client.

## Kết quả đo local ngày 16/11/2026

Môi trường gồm Windows với Intel Core i5-13500H, API/Web chạy Docker Compose và PostgreSQL 16 trên cùng máy. API đã warm, catalog có 20 sản phẩm khả dụng, gồm 17 dòng giả lập dành cho phép đo. Chạy tuần tự 20 mẫu mỗi endpoint, bỏ vòng warm-up. Giao dịch ghi đặt từng món từ seed demo và trả kết quả mock.

| Chỉ tiêu | Ngưỡng SRS | Kết quả đo | Đánh giá |
|---|---|---|---|
| NFR-01 · GET /products | < 500 ms | p95 5,2 ms · max 8,3 ms | Đạt trong môi trường đo |
| NFR-02 · POST /orders | < 1000 ms | p95 16,6 ms · max 17,7 ms | Đạt trong môi trường đo |
| NFR-02 · POST /payments | < 1000 ms | p95 19,2 ms · max 21,9 ms | Đạt trong môi trường đo mock |
| NFR-03 · FCP | ≤ 1,8 s | 0,87 s | Đạt trong lần đo |
| NFR-03 · LCP | ≤ 2,5 s | 3,87 s | Chưa đạt |

Lighthouse 13.6.0 đo `/menu` sau khi chuyển ảnh menu sang Next Image. Lần đo dùng Edge headless, cấu hình mobile mặc định của Lighthouse và 4G mô phỏng với RTT 150 ms và throughput 1638,4 Kbps. Đo lại với cùng thiết lập sau khi deploy HTTPS.

Để lặp phép đo, dùng stack test riêng chạy mock ở cổng mặc định. Fixture bổ sung 17 món. Script tạo đơn và thanh toán mock trên DB test.

```sh
docker compose -p brewlite-e2e --env-file .env.example exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d brewlite < apps/api/test/fixtures/performance.sql
node scripts/measure-local.mjs
npx lighthouse@13.6.0 http://127.0.0.1:3002/menu --only-categories=performance --chrome-flags=--headless
```

## Biên bản production cần điền sau khi chạy

- Tag, SHA và link CI/CD.
- Các URL HTTPS Web, API, health và kết quả smoke, kèm minh chứng PostgreSQL private đã che thông tin kết nối.
- Mã đơn giao dịch Sandbox, thời điểm nhận IPN và trạng thái đã xác nhận trong lịch sử. Chỉ dùng ảnh hoặc video đã che thông tin cá nhân và bí mật.
- Phiên bản trước/sau rollback và thời gian đến khi smoke đạt. Ngưỡng SRS dưới 5 phút.
- Release notes và link video demo hoặc thời gian demo trực tiếp.

## Sprint Review và Retrospective

Ghi ngày, người tham dự, các tính năng đã trình diễn, kết quả so với mục tiêu Sprint và phản hồi của người nghiệm thu. Ghi lại điều đã làm tốt, vướng mắc và hành động cải tiến đã được nhóm thống nhất, kèm người phụ trách. Nhóm điền sau buổi làm việc thực tế.
