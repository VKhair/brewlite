import Link from "next/link";
import { MenuProducts } from "../components/ui";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-label">✦ MỖI NGÀY MỘT LY NGON</span>
            <h1>
              Một ly trà ngon.
              <br />
              <em>Ngàn điều thú vị.</em>
            </h1>
            <p>
              Thức uống yêu thích ngay trong tầm tay. Chọn món, đặt trước, thanh
              toán nhanh và nhận ngay tại quầy.
            </p>
            <div className="hero-buttons">
              <Link className="btn btn-white" href="/menu">
                Khám phá thực đơn <span>↗</span>
              </Link>
              <Link className="btn btn-outline-white" href="/orders">
                Xem đơn hàng
              </Link>
            </div>
            <div className="hero-trust">
              <span>✦ Vị ngon chuẩn gu</span>
              <span>⚡ Đặt hàng nhanh</span>
              <span>♡ Mỗi ngày tươi mới</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-circle circle-one" />
            <div className="hero-circle circle-two" />
            <div className="floating-note note-top">✦ Freshly brewed!</div>
            <img
              className="hero-drink-photo"
              src="/images/menu-10/tra-sua-thai-do.webp"
              alt=""
            />
            <div className="floating-note note-bottom">
              ☕ Good mood in a cup
            </div>
          </div>
        </div>
        <div className="hero-wave" />
      </section>
      <section className="features container">
        <div className="feature">
          <span className="feature-icon">☕</span>
          <div>
            <strong>Hương vị tuyển chọn</strong>
            <p>Thức uống thơm ngon, đậm đà</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">⚡</span>
          <div>
            <strong>Đặt trước siêu nhanh</strong>
            <p>Không cần xếp hàng chờ lâu</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">💳</span>
          <div>
            <strong>Thanh toán tiện lợi</strong>
            <p>Ví điện tử hoặc thẻ ngân hàng</p>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-title">
          <div>
            <span className="eyebrow">CHỌN LY BẠN THÍCH</span>
            <h2>
              Món ngon đang chờ bạn <span className="orange">✦</span>
            </h2>
            <p>
              Những thức uống nhỏ xinh, tiếp thêm năng lượng cho ngày của bạn.
            </p>
          </div>
          <Link href="/menu" className="text-link">
            Xem tất cả món →
          </Link>
        </div>
        <MenuProducts limit={4} />
      </section>
      <section className="container">
        <div className="banner">
          <div>
            <span className="eyebrow">BREWLITE EXPERIENCE</span>
            <h2>Đặt nước theo cách của bạn.</h2>
            <p>
              Chọn size, thêm topping, đặt hàng và theo dõi mọi bước — tất cả
              trên một màn hình.
            </p>
            <Link className="btn" href="/menu">
              Đặt món ngay ↗
            </Link>
          </div>
          <div className="banner-drinks" aria-hidden="true">
            <img src="/images/menu-10/tra-dau-tam.webp" alt="" />
            <img src="/images/menu-10/tra-luu-thach-dua.webp" alt="" />
          </div>
        </div>
      </section>
      <section className="section container how">
        <div className="section-title center">
          <div>
            <span className="eyebrow">RẤT ĐƠN GIẢN</span>
            <h2>3 bước để có ly ngon</h2>
          </div>
        </div>
        <div className="steps">
          <div>
            <span>01</span>
            <div className="step-icon">🔎</div>
            <h3>Chọn món yêu thích</h3>
            <p>Khám phá menu, chọn size và topping bạn muốn.</p>
          </div>
          <div>
            <span>02</span>
            <div className="step-icon">🛒</div>
            <h3>Đặt và thanh toán</h3>
            <p>Kiểm tra giỏ hàng, thanh toán không tiền mặt.</p>
          </div>
          <div>
            <span>03</span>
            <div className="step-icon">🥤</div>
            <h3>Đến quầy nhận nước</h3>
            <p>Theo dõi trạng thái và ghé quầy nhận món.</p>
          </div>
        </div>
      </section>
    </>
  );
}
