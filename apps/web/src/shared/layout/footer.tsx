import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="logo footer-logo">
            <span className="logo-mark">B</span>
            <span>
              Brew<span className="orange">Lite</span>
            </span>
          </div>
          <p>
            Chạm để đặt, ghé quầy để thưởng thức.
            <br />
            Mỗi ly nước là một chút niềm vui.
          </p>
        </div>
        <div>
          <strong>Khám phá</strong>
          <Link href="/menu">Thực đơn</Link>
          <Link href="/cart">Giỏ hàng</Link>
          <Link href="/orders">Đơn hàng của tôi</Link>
        </div>
        <div>
          <strong>Thông tin</strong>
          <p>
            Đặt đồ uống trực tuyến, thanh toán giả lập qua Ví điện tử hoặc Thẻ.
          </p>
          <p>Demo dự án Công nghệ phần mềm</p>
        </div>
      </div>
      <div className="container footer-bottom">
        © 2026 BrewLite · Được xây dựng với ☕ và sự tận tâm.
      </div>
    </footer>
  );
}
