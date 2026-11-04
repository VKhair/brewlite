# 1. Bối cảnh, Stakeholder và Phạm vi hệ thống

## 1.1. Vấn đề nghiệp vụ BrewLite cần giải quyết

Trong môi trường quán cà phê hiện đại, khách hàng thường gặp phải tình trạng xếp hàng dài chờ đợi đặt món và thanh toán tiền mặt vào các giờ cao điểm. Việc xử lý thủ công gây nhầm lẫn đơn hàng, tăng thời gian phục vụ và giảm trải nghiệm người dùng.

BrewLite được thiết kế nhằm mang lại giải pháp đặt cà phê không dùng tiền mặt, giúp khách hàng chủ động chọn đồ uống, tùy chỉnh size/topping và thanh toán ngay trên thiết bị cá nhân.

## 1.2. Stakeholder chính và yêu cầu của từng bên

### 1.2.1. Khách hàng

* **Vai trò:** Khách hàng là người sử dụng dịch vụ của cửa hàng, trực tiếp đặt món và thanh toán hóa đơn.
* **Mục tiêu:** Xem được danh sách sản phẩm và thông tin sản phẩm, tùy chỉnh đồ uống theo sở thích, đặt hàng nhanh, thanh toán đa dạng và theo dõi trạng thái đơn hàng của mình.
* **Yêu cầu chức năng:**

  * Xem danh sách sản phẩm, giá bán và thông tin sản phẩm.
  * Xem chi tiết sản phẩm.
  * Lựa chọn các tùy chọn liên quan đến sản phẩm.
  * Thêm, sửa, xóa sản phẩm trong giỏ hàng.
  * Tự động tính tổng tiền sản phẩm.
  * Tạo đơn hàng sau khi xác nhận thông tin đặt hàng.
  * Lựa chọn phương thức thanh toán.
  * Xem trạng thái đơn hàng.
  * Nhận thông báo kết quả thanh toán thành công hoặc thất bại.
* **Yêu cầu phi chức năng:**

  * Giao diện dễ sử dụng, thân thiện cả trên máy tính và điện thoại.
  * Thời gian phản hồi hợp lý khi xem sản phẩm và đặt hàng.
  * Bảo mật thông tin cá nhân của khách hàng.
  * Hạn chế tạo đơn trùng lặp khi thao tác nhiều lần.
* **Mức độ ưu tiên:** Cao.

### 1.2.2. Nhân viên quầy

* **Vai trò:** Tiếp nhận, kiểm tra và xử lý đơn hàng của khách tại quầy.
* **Mục tiêu:** Theo dõi và cập nhật đơn hàng, xác nhận và cập nhật trạng thái đơn hàng, hạn chế nhầm lẫn giữa các đơn và phục vụ khách hàng nhanh chóng.
* **Yêu cầu chức năng:**

  * Đăng nhập vào hệ thống bằng tài khoản được cấp quyền.
  * Xem danh sách đơn hàng cần xử lý.
  * Xem thông tin chi tiết đơn hàng.
  * Cập nhật trạng thái đơn hàng theo quy trình.
  * Tra cứu đơn hàng qua mã đơn hàng.
  * Xác nhận đơn hàng đã hoàn thành hay chưa.
* **Yêu cầu phi chức năng:**

  * Cập nhật nhất quán thông tin đơn hàng.
  * Giao diện thao tác nhanh, phù hợp với môi trường làm việc tại quầy.
  * Nhân viên chỉ được truy cập các chức năng phù hợp với quyền hạn.
* **Mức độ ưu tiên:** Cao.

### 1.2.3. Quản lý cửa hàng

* **Vai trò:** Quản lý hoạt động kinh doanh, sản phẩm, nhân viên và theo dõi tình hình đơn hàng.
* **Mục tiêu:** Kiểm soát danh mục sản phẩm, theo dõi tình hình kinh doanh, quản lý nhân viên và theo dõi hiệu quả hoạt động của cửa hàng.
* **Yêu cầu chức năng:**

  * Đăng nhập bằng tài khoản có quyền quản trị.
  * Thêm, sửa, xóa hoặc ẩn thông tin sản phẩm.
  * Cập nhật giá bán và mô tả sản phẩm.
  * Xem danh sách và chi tiết đơn hàng.
  * Theo dõi trạng thái đơn hàng và thanh toán.
  * Tra cứu và thống kê doanh thu theo thời gian.
  * Quản lý và truy cập tài khoản của nhân viên.
* **Yêu cầu phi chức năng:**

  * Dữ liệu doanh thu chính xác và có thể đối chiếu với giao dịch.
  * Các thao tác quản trị quan trọng cần được kiểm soát quyền truy cập.
  * Bảo đảm tính toàn vẹn dữ liệu khi nhiều người cùng sử dụng.
* **Mức độ ưu tiên:** Cao đối với quản lý sản phẩm, đơn hàng và doanh thu; trung bình đối với các báo cáo nâng cao.

### 1.2.4. Giảng viên/Khách hàng nghiệm thu

* **Vai trò:** Đánh giá mức độ đáp ứng yêu cầu của hệ thống, kiểm tra kết quả triển khai và xác nhận phạm vi chức năng của dự án.
* **Mục tiêu:** Đảm bảo sản phẩm được xây dựng đúng yêu cầu đã thống nhất, kiểm tra các luồng nghiệp vụ chính, đánh giá chất lượng mã nguồn, thiết kế và khả năng vận hành, xác nhận các chức năng được triển khai có thể kiểm thử và trình diễn.
* **Yêu cầu chức năng và nghiệm thu:**

  * Triển khai đầy đủ các chức năng nằm trong phạm vi dự án đã thống nhất.
  * Có thể trình diễn quy trình từ xem sản phẩm, thêm vào giỏ hàng đến tạo đơn hàng.
  * Có thể kiểm tra quy trình thanh toán thành công và thất bại.
  * Xử lý đúng các trường hợp dữ liệu đầu vào không hợp lệ.
  * Có tài liệu mô tả yêu cầu, thiết kế, hướng dẫn sử dụng và kết quả kiểm thử phù hợp với yêu cầu của khách hàng.
  * Các chức năng quan trọng phải trải qua kiểm thử và có kết quả đối chiếu.
* **Yêu cầu phi chức năng:**

  * Hệ thống hoạt động ổn định trong quá trình nghiệm thu.
  * Mã nguồn có cấu trúc rõ ràng, dễ đọc và dễ bảo trì.
  * Có thể truy xuất dữ liệu để đối chiếu kết quả kiểm thử.
  * Tài liệu hướng dẫn và chức năng triển khai phải nhất quán với nhau.
* **Mức độ ưu tiên:** Cao, vì đây là cơ sở đánh giá và nghiệm thu dự án.

### 1.2.5. Nhóm phát triển

* **Vai trò:** Phân tích, thiết kế, lập trình, kiểm thử, triển khai và bảo trì hệ thống.
* **Mục tiêu:** Xây dựng hệ thống đúng yêu cầu, đảm bảo các thành phần frontend, backend và cơ sở dữ liệu hoạt động thống nhất với nhau, dễ phát triển thêm các chức năng mới, phát hiện và xử lý lỗi trong quá trình triển khai.
* **Yêu cầu kỹ thuật:**

  * Hệ thống phải có kiến trúc rõ ràng, phân chia các thành phần theo nhiệm vụ được giao.
  * Backend cung cấp API để frontend truy xuất sản phẩm và thực hiện nghiệp vụ đơn hàng.
  * API tạo đơn hàng phải kiểm tra dữ liệu đầu vào và tính hợp lệ của sản phẩm.
  * Cơ sở dữ liệu phải lưu trữ đơn hàng, chi tiết đơn hàng và trạng thái thanh toán nhất quán.
  * Hệ thống xử lý lỗi từ API và cơ sở dữ liệu một cách phù hợp.
  * Chức năng thanh toán phải có cơ chế xác nhận kết quả giao dịch và cập nhật trạng thái đơn hàng.
  * Các chức năng quan trọng phải có kiểm thử phù hợp.
  * Hệ thống phải có tài liệu API và hướng dẫn cấu hình môi trường chạy.
* **Yêu cầu phi chức năng:**

  * Mã nguồn dễ bảo trì và mở rộng.
  * Các API có cấu trúc nhất quán.
  * Thông tin bí mật và thông tin xác thực không được lưu trực tiếp trong mã nguồn.
  * Hệ thống có khả năng xử lý lỗi và tránh ghi nhận sai trạng thái giao dịch.
  * Các thành viên có thể phối hợp phát triển bằng quy trình quản lý phiên bản.
* **Mức độ ưu tiên:** Cao.

### 1.2.6. Đơn vị thanh toán

* **Vai trò:** Cung cấp dịch vụ xử lý thanh toán điện tử, trả về kết quả giao dịch và hỗ trợ đối soát khi có phát sinh.
* **Mục tiêu:** Tiếp nhận yêu cầu thanh toán hợp lệ, xử lý giao dịch theo phương thức được hỗ trợ, trả về kết quả trạng thái giao dịch chính xác, hỗ trợ xác minh kết quả thanh toán và hạn chế giao dịch trùng lặp.
* **Yêu cầu chức năng:**

  * Hệ thống có thể tạo yêu cầu thanh toán cho một đơn hàng hợp lệ.
  * Truyền đúng mã đơn hàng và số tiền cần thanh toán.
  * Đơn vị thanh toán trả về kết quả giao dịch theo cơ chế tích hợp được hỗ trợ.
  * Có thể xác minh kết quả thanh toán trước khi xác nhận đơn hàng đã thanh toán.
  * Xử lý các trạng thái giao dịch như thành công, thất bại hoặc đang chờ xử lý nếu nhà cung cấp hỗ trợ.
  * Hạn chế việc xử lý cùng một thông báo thanh toán nhiều lần.
  * Có thể lưu mã giao dịch và thông tin cần thiết để đối chiếu.
* **Yêu cầu phi chức năng:**

  * Giao tiếp giữa hệ thống và đơn vị thanh toán phải được bảo vệ.
  * Thông tin xác thực API phải được lưu trữ an toàn.
  * Kết quả thanh toán phải được xác minh, không chỉ dựa vào thông tin do trình duyệt gửi lên.
  * Xử lý các lỗi kết nối hoặc các giao dịch đã hết hạn chờ.
  * Không được tự động đánh dấu thanh toán thành công.
* **Mức độ ưu tiên:** Cao đối với việc tạo giao dịch, xác minh kết quả và cập nhật trạng thái thanh toán.

## 1.3. Mục tiêu và kỳ vọng của từng Stakeholder

### 1.3.1. Khách hàng

**Mục tiêu:** Trải nghiệm đặt cà phê không dùng tiền mặt nhanh chóng, tiện lợi; chủ động chọn lựa đồ uống và theo dõi đơn hàng trực tiếp trên thiết bị cá nhân, giúp giảm thời gian xếp hàng chờ đợi tại quầy.

**Kỳ vọng đối với hệ thống:**

* **Trải nghiệm mượt mà:** Giao diện đẹp mắt, tối ưu trên điện thoại di động, thao tác xem menu, tùy chỉnh size/topping và thêm vào giỏ hàng dễ dàng.
* **Chính xác và minh bạch:** Giá bán, tổng tiền, phí tùy chọn và chi tiết đơn hàng được tự động tính toán chính xác.
* **Phản hồi tức thì:** Phản hồi trong thời gian ngắn, có xử lý trường hợp giao dịch đang chờ xác nhận và theo dõi được trạng thái đơn hàng theo thời gian thực.
* **An toàn và tin cậy:** Bảo mật thông tin cá nhân, không bị lặp đơn khi ấn nhầm nhiều lần.

### 1.3.2. Nhân viên quầy

**Mục tiêu:** Tiếp nhận và xử lý đơn hàng chính xác, rút ngắn thời gian pha chế và phục vụ khách hàng, hạn chế sai sót trong quá trình ghi nhận đơn thủ công.

**Kỳ vọng đối với hệ thống:**

* **Đồng bộ dữ liệu:** Đơn đã được hệ thống ghi nhận phải xuất hiện trên danh sách xử lý trong thời gian quy định.
* **Thao tác đơn giản:** Giao diện hỗ trợ nhân viên cập nhật trạng thái đơn (đang pha chế, đã xong) một cách nhanh chóng.
* **Giảm thiểu nhầm lẫn:** Đơn hàng hiển thị đầy đủ ghi chú tùy chỉnh (size, topping) kèm mã đơn hàng để đối chiếu chính xác.

### 1.3.3. Quản lý cửa hàng

**Mục tiêu:** Kiểm soát hoạt động kinh doanh, quản lý danh mục sản phẩm và đánh giá hiệu quả vận hành của cửa hàng.

**Kỳ vọng đối với hệ thống:**

* **Quản lý linh hoạt:** Dễ dàng cập nhật giá, thêm/sửa/xóa hoặc ẩn bớt các sản phẩm tạm thời hết hàng.
* **Dữ liệu chính xác:** Báo cáo doanh thu và lịch sử đơn hàng chính xác, khớp đúng với giao dịch thanh toán thực tế/mô phỏng.
* **Toàn vẹn và phân quyền:** Đảm bảo dữ liệu không bị xung đột, xử lý cập nhật đồng thời, tránh ghi đè dữ liệu hoặc tạo trạng thái không nhất quán khi nhiều nhân viên/quản lý cùng truy cập; các thao tác nhạy cảm phải được phân quyền đúng chức năng.

### 1.3.4. Giảng viên/Khách hàng nghiệm thu

**Mục tiêu:** Kiểm tra, đánh giá mức độ hoàn thiện của dự án theo đúng quy trình công nghệ phần mềm từ khâu đặc tả yêu cầu đến triển khai sản phẩm thực tế trên Production.

**Kỳ vọng đối với hệ thống:**

* **Đáp ứng phạm vi:** Hệ thống phải triển khai đầy đủ các luồng nghiệp vụ cốt lõi đã cam kết trong MVP.
* **Chất lượng kỹ thuật:** Lint, test, build thành công; tuân thủ quy ước code, đúng kiến trúc, hệ thống hoạt động ổn định và có kiểm thử tự động.
* **Quy trình chuẩn hóa:** Có pipeline CI/CD tự động, tài liệu đặc tả nhất quán với mã nguồn và thể hiện quan hệ giữa yêu cầu, use case, sơ đồ, API/mã nguồn và kiểm thử.
* **Sẵn sàng vận hành:** Cung cấp URL Production truy cập được qua HTTPS kèm tính năng Health check.

### 1.3.5. Nhóm phát triển

**Mục tiêu:** Xây dựng một sản phẩm đúng yêu cầu, kiến trúc rõ ràng, dễ bảo trì, mở rộng và hoàn thành dự án đúng thời hạn Sprint.

**Kỳ vọng đối với hệ thống:**

* **Thống nhất kiến trúc:** API Backend (NestJS) và Frontend (Next.js) trao đổi dữ liệu rõ ràng qua chuẩn RESTful API có validate dữ liệu chặt chẽ.
* **Tự động hóa:** Giữ lại cho nhóm phát triển và nghiệm thu, đồng thời cụ thể hóa tiêu chí kiểm tra và triển khai tự động, giảm bớt thao tác thủ công.
* **Dễ bảo trì và mở rộng:** Đưa vào yêu cầu thiết kế kiến trúc hoặc ràng buộc kỹ thuật; mã nguồn được quản lý qua Git với chiến lược phân nhánh rõ ràng và bí mật không bị lộ.

### 1.3.6. Đơn vị thanh toán

**Mục tiêu:** Tiếp nhận yêu cầu thanh toán hợp lệ từ BrewLite và phản hồi kết quả giao dịch chính xác, an toàn.

**Kỳ vọng đối với hệ thống:**

* **Giao tiếp chuẩn xác:** Hệ thống BrewLite gửi đúng thông tin mã đơn hàng, số tiền và thông tin xác thực an toàn.
* **Xử lý bất đồng bộ và Idempotency:** Hệ thống xử lý đúng các trạng thái thanh toán (thành công, thất bại) và xác định rõ hành vi cần bảo đảm khi nhận cùng một yêu cầu nhiều lần.
* **Tính toàn vẹn dữ liệu:** Không tự động cập nhật đơn hàng thành công khi chưa nhận được xác minh chính xác từ cổng thanh toán.

## 1.4. Phạm vi hệ thống

### 1.4.1. Phạm vi trong MVP

MVP (Minimum Viable Product) là phiên bản sản phẩm tối thiểu có thể sử dụng được. Đối với dự án BrewLite, MVP tập trung xây dựng ứng dụng web đặt cà phê trực tuyến, cho phép khách hàng lựa chọn sản phẩm, đặt hàng và thanh toán không dùng tiền mặt thông qua cổng thanh toán mô phỏng.

Các chức năng nằm trong phạm vi MVP bao gồm:

1. **Hiển thị danh sách sản phẩm:** Hệ thống cho phép khách hàng xem danh sách đồ uống cùng với hình ảnh, tên sản phẩm và giá bán.
2. **Xem chi tiết sản phẩm:** Khách hàng có thể xem thông tin sản phẩm, lựa chọn kích cỡ (size), topping và số lượng đồ uống.
3. **Quản lý giỏ hàng:** Khách hàng có thể thêm sản phẩm vào giỏ hàng, điều chỉnh số lượng, xóa sản phẩm và xem tổng tiền.
4. **Tạo đơn hàng:** Hệ thống tiếp nhận thông tin giỏ hàng, kiểm tra dữ liệu và tạo đơn hàng cho khách hàng.
5. **Thanh toán mô phỏng:** Khách hàng có thể lựa chọn phương thức thanh toán bằng ví điện tử hoặc thẻ thông qua cổng thanh toán mô phỏng. Hệ thống xử lý kết quả thanh toán thành công hoặc thất bại. Nếu thanh toán thất bại, đơn hàng được ghi nhận trạng thái `PAYMENT_FAILED` và giỏ hàng được giữ lại để khách hàng có thể thực hiện thanh toán lại. Nếu thanh toán thành công, đơn hàng được cập nhật trạng thái `PAID` và hệ thống hiển thị thông tin xác nhận đơn hàng.
6. **Xác nhận đơn hàng:** Sau khi thanh toán thành công, hệ thống hiển thị thông tin đơn hàng, mã đơn hàng và trạng thái tương ứng để khách hàng theo dõi.
7. **Xem lịch sử đơn hàng:** Khách hàng đã đăng nhập có thể xem danh sách các đơn hàng của mình, bao gồm mã đơn hàng, thông tin đơn hàng và trạng thái tương ứng. Chức năng này giúp khách hàng thuận tiện trong việc tra cứu và theo dõi các đơn hàng đã đặt.

Các chức năng trên là phạm vi chính nhằm đáp ứng mục tiêu của BrewLite: giúp khách hàng đặt cà phê thuận tiện, giảm thời gian chờ và hỗ trợ thanh toán không dùng tiền mặt.

### 1.4.2. Phạm vi mở rộng

Trong các giai đoạn phát triển tiếp theo, BrewLite có thể được mở rộng để nâng cao khả năng quản lý và trải nghiệm sử dụng. Các chức năng dự kiến mở rộng bao gồm:

* **Giao diện dành cho nhân viên quầy:** Hỗ trợ nhân viên tiếp nhận đơn hàng, theo dõi đơn và cập nhật trạng thái xử lý đơn hàng.
* **Quản lý cửa hàng:** Phát triển giao diện quản lý cửa hàng, bao gồm quản lý sản phẩm, theo dõi tình trạng đơn hàng và các chức năng quản lý hoạt động kinh doanh khác.
* **Mở rộng nền tảng:** Phát triển ứng dụng trên thiết bị di động hoặc tối ưu thêm trải nghiệm sử dụng trên nhiều loại thiết bị.
* **Mở rộng hệ thống:** Xem xét khả năng hỗ trợ nhiều chi nhánh cửa hàng khi nhu cầu sử dụng tăng lên.

Các chức năng dành cho nhân viên quầy và quản lý cửa hàng được ghi nhận từ nhu cầu của các bên liên quan nhưng chưa thuộc phạm vi MVP ban đầu. Những chức năng này sẽ được xem xét triển khai trong các giai đoạn tiếp theo tùy theo mức độ ưu tiên, nguồn lực và kế hoạch phát triển của nhóm.

### 1.4.3. Các nội dung không thực hiện

Trong phạm vi MVP hiện tại, nhóm xác định một số giới hạn nhằm tập trung nguồn lực vào các chức năng cốt lõi của hệ thống:

* **Thanh toán tiền thật:** Không tích hợp giao dịch tài chính thực tế với ngân hàng hoặc ví điện tử. Hệ thống chỉ sử dụng cổng thanh toán mô phỏng theo yêu cầu của đề bài.
* **Ứng dụng di động độc lập:** Không xây dựng ứng dụng Android hoặc iOS riêng trong phạm vi MVP; dự án tập trung vào ứng dụng web được thiết kế theo hướng tương thích với thiết bị di động.
* **Hệ thống giao hàng:** Không triển khai hệ thống quản lý tài xế, phân công giao hàng hoặc theo dõi lộ trình giao hàng.
* **Giao diện quản lý vận hành dành cho nhân viên:** Không triển khai giao diện riêng dành cho nhân viên quầy để tiếp nhận đơn hàng và cập nhật trạng thái pha chế trong MVP ban đầu. Tuy nhiên, hệ thống vẫn hỗ trợ khách hàng xem thông tin và trạng thái đơn hàng của mình.

Các nội dung trên là những giới hạn phạm vi do nhóm đề xuất nhằm tập trung vào các chức năng cốt lõi của MVP. Phạm vi cuối cùng cần được thống nhất giữa các thành viên và bảo đảm không mâu thuẫn với những yêu cầu bắt buộc trong đề bài của giảng viên.

## 1.5. Giả định, ràng buộc và các rủi ro ban đầu

### 1.5.1. Các giả định

Trong quá trình phân tích, thiết kế và phát triển hệ thống BrewLite, nhóm đưa ra một số giả định ban đầu nhằm xác định cơ sở triển khai dự án, thống nhất phạm vi thực hiện và hạn chế những yếu tố có thể ảnh hưởng đến tiến độ phát triển hệ thống.

* **Giả định về người sử dụng:** Khách hàng có thiết bị kết nối Internet và sử dụng trình duyệt web để truy cập hệ thống BrewLite. Người dùng có khả năng thực hiện các thao tác cơ bản như xem sản phẩm, lựa chọn đồ uống, quản lý giỏ hàng và đặt hàng trực tuyến.
* **Giả định về dữ liệu sản phẩm:** Danh sách đồ uống, hình ảnh, tên sản phẩm, giá bán, kích cỡ (size) và các tùy chọn topping được cung cấp hoặc thiết lập trước bởi nhóm phát triển. Dữ liệu sản phẩm được sử dụng trong quá trình xây dựng và kiểm thử hệ thống phải bảo đảm tính nhất quán.
* **Giả định về quy trình đặt hàng:** Quy trình nghiệp vụ chính bao gồm xem danh sách sản phẩm, xem chi tiết sản phẩm, lựa chọn tùy chỉnh đồ uống, thêm sản phẩm vào giỏ hàng, xác nhận thông tin và tạo đơn hàng. Hệ thống phải kiểm tra dữ liệu đầu vào và tính toán tổng tiền trước khi ghi nhận đơn hàng.
* **Giả định về thanh toán:** Trong phạm vi sản phẩm khả dụng tối thiểu (MVP), BrewLite sử dụng cổng thanh toán mô phỏng để kiểm tra các trường hợp giao dịch thành công và thất bại. Hệ thống không thực hiện giao dịch tài chính thực tế với ngân hàng hoặc ví điện tử.
* **Giả định về môi trường phát triển:** Các thành viên trong nhóm có môi trường lập trình phù hợp, được cung cấp đầy đủ tài liệu và có khả năng phối hợp trong quá trình phân tích yêu cầu, thiết kế, lập trình, kiểm thử và hoàn thiện sản phẩm.
* **Giả định về tiêu chí nghiệm thu:** Các chức năng cốt lõi và kết quả cần đạt được sẽ được thống nhất trong nhóm và đối chiếu với yêu cầu của giảng viên. Sản phẩm phải có khả năng trình diễn các luồng nghiệp vụ chính và cung cấp kết quả kiểm thử tương ứng.

### 1.5.2. Các ràng buộc của dự án

* **Ràng buộc về phạm vi chức năng:** Phiên bản MVP tập trung vào các chức năng cốt lõi gồm hiển thị danh sách sản phẩm, xem chi tiết sản phẩm, quản lý giỏ hàng, tạo đơn hàng, thanh toán mô phỏng, xác nhận đơn hàng và xem lịch sử đơn hàng. Các chức năng mở rộng phải được xem xét riêng để tránh làm ảnh hưởng đến mục tiêu chính của dự án.
* **Ràng buộc về thanh toán:** Hệ thống chỉ mô phỏng quy trình thanh toán, không tích hợp giao dịch tiền thật với ngân hàng hoặc ví điện tử. Kết quả thanh toán phải được xử lý nhất quán với trạng thái đơn hàng. Trường hợp thanh toán thất bại, đơn hàng được ghi nhận trạng thái lỗi thanh toán và giỏ hàng được giữ lại để khách hàng có thể thanh toán lại; trường hợp thanh toán thành công, đơn hàng được cập nhật trạng thái đã thanh toán.
* **Ràng buộc về nền tảng:** Sản phẩm được phát triển dưới dạng ứng dụng web, hướng đến khả năng sử dụng trên máy tính và thiết bị di động thông qua trình duyệt. Trong phạm vi MVP, nhóm không xây dựng ứng dụng Android hoặc iOS độc lập.
* **Ràng buộc về chức năng quản lý:** Giao diện quản lý dành riêng cho nhân viên quầy và các chức năng quản lý cửa hàng chưa thuộc phạm vi MVP ban đầu. Nhóm cần ưu tiên nguồn lực cho các chức năng trực tiếp phục vụ quy trình đặt hàng của khách hàng.
* **Ràng buộc về thời gian và nguồn lực:** Tiến độ thực hiện phụ thuộc vào thời hạn nộp bài, số lượng thành viên, khả năng chuyên môn và mức độ phối hợp giữa các thành viên. Nhóm cần phân công nhiệm vụ rõ ràng và ưu tiên các chức năng có mức độ quan trọng cao.
* **Ràng buộc về chất lượng và kiểm thử:** Các chức năng chính phải được kiểm thử trước khi nghiệm thu, đặc biệt là việc tính tổng tiền, kiểm tra dữ liệu đầu vào, tạo đơn hàng và xử lý kết quả thanh toán. Kết quả thực tế cần được đối chiếu với kết quả mong đợi để phát hiện và khắc phục lỗi.
* **Ràng buộc về bảo mật và tính toàn vẹn dữ liệu:** Hệ thống cần hạn chế truy cập trái phép, bảo vệ thông tin người dùng và bảo đảm dữ liệu đơn hàng, chi tiết đơn hàng cùng trạng thái thanh toán được lưu trữ nhất quán. Các thông tin xác thực và dữ liệu bí mật không được lưu trực tiếp trong mã nguồn.

### 1.5.3. Các rủi ro ban đầu

| STT | Rủi ro                                                                                                                                                                                 | Biện pháp phòng ngừa và xử lý                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Thay đổi hoặc chưa thống nhất yêu cầu: Các thành viên có cách hiểu khác nhau về chức năng, phạm vi hoặc quy trình nghiệp vụ của hệ thống.                                              | Thống nhất yêu cầu trước khi triển khai; lập tài liệu đặc tả yêu cầu; xác định rõ phạm vi MVP và ghi nhận các thay đổi để đánh giá ảnh hưởng trước khi thực hiện.                             |
| 2   | Chậm tiến độ phát triển: Một số chức năng mất nhiều thời gian hơn dự kiến hoặc thành viên không hoàn thành nhiệm vụ đúng thời hạn.                                                     | Lập kế hoạch theo từng giai đoạn; phân công nhiệm vụ cụ thể; theo dõi tiến độ thường xuyên và ưu tiên hoàn thiện các chức năng cốt lõi trước.                                                 |
| 3   | Lỗi trong quy trình đặt hàng: Hệ thống có thể tính sai tổng tiền, ghi nhận thông tin sản phẩm không chính xác hoặc tạo đơn hàng không hợp lệ.                                          | Kiểm tra dữ liệu đầu vào ở phía máy chủ; xây dựng các trường hợp kiểm thử cho giỏ hàng, số lượng, giá sản phẩm và quy trình tạo đơn hàng.                                                     |
| 4   | Sai lệch trạng thái thanh toán: Kết quả thanh toán mô phỏng không được cập nhật chính xác vào đơn hàng hoặc xử lý không đúng khi thanh toán thất bại.                                  | Xây dựng quy tắc chuyển trạng thái rõ ràng; kiểm thử các trường hợp thành công, thất bại và thanh toán lại; bảo đảm trạng thái thanh toán và trạng thái đơn hàng được cập nhật nhất quán.     |
| 5   | Lỗi tích hợp giữa các thành phần: Giao diện người dùng, API phía máy chủ và cơ sở dữ liệu có thể không trao đổi dữ liệu đúng định dạng hoặc phát sinh lỗi khi kết nối.                 | Thống nhất cấu trúc dữ liệu và giao diện API; kiểm thử từng thành phần trước khi tích hợp; kiểm tra các trường hợp lỗi và ghi nhận thông báo phù hợp.                                         |
| 6   | Mất mát hoặc sai lệch dữ liệu: Thông tin sản phẩm, giỏ hàng, đơn hàng hoặc lịch sử giao dịch có thể không được lưu trữ hoặc truy xuất chính xác.                                       | Thiết kế cơ sở dữ liệu hợp lý; kiểm tra tính hợp lệ của dữ liệu; sử dụng các cơ chế bảo đảm tính toàn vẹn và giao dịch phù hợp; kiểm thử việc lưu, cập nhật và truy xuất dữ liệu.             |
| 7   | Rủi ro bảo mật: Người dùng có thể truy cập dữ liệu không thuộc quyền hạn hoặc thông tin nhạy cảm có thể bị xử lý không an toàn.                                                        | Kiểm tra quyền truy cập tại phía máy chủ; xác thực dữ liệu đầu vào; bảo vệ thông tin xác thực; không lưu thông tin bí mật trực tiếp trong mã nguồn và hạn chế trả về dữ liệu không cần thiết. |
| 8   | Thiếu sót trong kiểm thử: Một số trường hợp ngoại lệ chưa được kiểm tra, dẫn đến lỗi xuất hiện khi trình diễn hoặc nghiệm thu.                                                         | Xây dựng danh sách kiểm thử dựa trên yêu cầu; kiểm thử các luồng nghiệp vụ chính và các trường hợp lỗi; ghi nhận kết quả, sửa lỗi và kiểm thử lại trước khi bàn giao.                         |
| 9   | Phát sinh yêu cầu ngoài phạm vi: Nhóm bổ sung chức năng mở rộng khi các chức năng cốt lõi chưa hoàn thiện, làm tăng khối lượng công việc.                                              | Kiểm soát phạm vi MVP; phân biệt yêu cầu bắt buộc với yêu cầu mở rộng; chỉ bổ sung chức năng mới sau khi đánh giá tác động đến thời gian và nguồn lực.                                        |
| 10  | Phối hợp nhóm chưa hiệu quả: Việc phân chia công việc, tích hợp mã nguồn hoặc trao đổi thông tin giữa các thành viên không thống nhất có thể gây trùng lặp công việc và phát sinh lỗi. | Quy định rõ trách nhiệm từng thành viên; thống nhất quy trình quản lý phiên bản; thường xuyên cập nhật tiến độ và rà soát mã nguồn trước khi tích hợp.                                        |
