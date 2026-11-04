## Chiến lược branch (GitHub Flow)
- `main`: luôn ổn định, chỉ nhận code qua Pull Request
- Nhánh làm việc tách từ main, đặt tên: `<loại>/<issue>-<mô-tả-ngắn>`
  Ví dụ: `feat/12-products-api`, `docs/05-srs`, `fix/20-cart-total`
- Merge bằng Squash and merge, xóa nhánh sau khi merge

## Quy ước commit (Conventional Commits)
<type>(<scope>): <mô tả>
type: feat | fix | docs | test | refactor | chore | ci
scope: web | api | db | docs | ci
Ví dụ: feat(api): add GET /products endpoint

## Quy trình Pull Request
1. Tạo nhánh từ main, commit nhỏ và rõ ràng
2. Mở PR, điền template, gắn issue
3. Cần ít nhất 1 approval và CI pass mới được merge
4. Thay đổi yêu cầu/sơ đồ/kiến trúc phải ghi rõ lý do trong PR

## Definition of Done
- Đáp ứng tiêu chí chấp nhận của issue/yêu cầu
- Lint, test và build pass
- Đã được review và merge qua PR
- Có test tương ứng (nếu là code)
- Tài liệu và traceability-matrix đã cập nhật
- Không lộ secret