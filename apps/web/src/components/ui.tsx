"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api, Product, money, drinkPhoto } from "../lib/api";
import { useStore } from "../lib/store";
export function Header() {
  const { count, session, signout } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = [
    ["/", "Trang chủ"],
    ["/menu", "Thực đơn"],
    ["/orders", "Đơn hàng"],
  ];
  return (
    <>
      <div className="topbar">
        ☕ Cà phê ngon, ngày thêm vui · Đặt trước và nhận tại quầy
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo" onClick={() => setOpen(false)}>
            <span className="logo-mark">B</span>
            <span>
              Brew<span className="orange">Lite</span>
              <small>COFFEE & MORE</small>
            </span>
          </Link>
          <nav className={open ? "desktop-nav open" : "desktop-nav"}>
            {nav.map(([href, title]) => (
              <Link
                key={href}
                onClick={() => setOpen(false)}
                className={path === href ? "active" : ""}
                href={href}
              >
                {title}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/cart" className="cart-link" aria-label="Giỏ hàng">
              🛍️ <span className="cart-count">{count}</span>
            </Link>
            {session ? (
              <div className="account-nav">
                <Link href="/account" className="account-link">
                  👤{" "}
                  <span>{session.user.fullName.split(" ").slice(-1)[0]}</span>
                </Link>
                <button
                  onClick={() => {
                    signout();
                    router.push("/");
                  }}
                  className="logout-btn"
                  title="Đăng xuất"
                >
                  ↪
                </button>
              </div>
            ) : (
              <Link className="btn btn-small" href="/login">
                Đăng nhập
              </Link>
            )}
            <button
              className="menu-toggle"
              aria-label="Mở menu"
              onClick={() => setOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
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
export function ProductCard({ product, first }: { product: Product; first: boolean }) {
  const photo = drinkPhoto(product.name, product.category, product.imageUrl);
  return (
    <Link className="product-card" href={`/product/${product.id}`}>
      <div
        className={`drink-art art-${product.category.toLowerCase().replace(/[^a-z0-9]/g, "")}`}
      >
        <Image
          className="drink-photo"
          src={photo}
          alt={`Ảnh ${product.name}`}
          width={350}
          height={350}
          sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 280px"
          loading={first ? "eager" : "lazy"}
          fetchPriority={first ? "high" : undefined}
          unoptimized={!photo.startsWith("/images/")}
        />
        <span className="bubble b1" />
        <span className="bubble b2" />
        <span className="card-pill">{product.category}</span>
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p>{product.description || "Hương vị thơm ngon dành cho bạn."}</p>
        <div className="product-bottom">
          <strong>{money(product.basePrice)}</strong>
          <span className="round-plus">+</span>
        </div>
      </div>
    </Link>
  );
}
export function MenuProducts({ limit }: { limit?: number }) {
  const [products, setProducts] = useState<Product[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("Tất cả"),
    [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    api<Product[]>("/products")
      .then((v) => {
        if (alive) {
          setProducts(v);
          setError("");
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refresh]);
  const categories = ["Tất cả", ...new Set(products.map((p) => p.category))];
  const view = products
    .filter(
      (p) =>
        (filter === "Tất cả" || p.category === filter) &&
        `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, limit);
  return (
    <>
      <div className="menu-controls">
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={c === filter ? "category active" : "category"}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search-wrap">
          <span>⌕</span>
          <input
            aria-label="Tìm đồ uống"
            placeholder="Tìm món yêu thích..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4].map((x) => (
            <div key={x} className="skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <h3>Không tải được thực đơn</h3>
          <p>{error}</p>
          <button
            className="btn"
            onClick={() => {
              setLoading(true);
              setRefresh((x) => x + 1);
            }}
          >
            Thử lại
          </button>
        </div>
      ) : view.length ? (
        <div className="product-grid">
          {view.map((p, index) => (
            <ProductCard key={p.id} product={p} first={index === 0} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Không tìm thấy đồ uống</h3>
          <p>Hãy thử từ khóa hoặc danh mục khác nhé.</p>
        </div>
      )}
    </>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
export function Quantity({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="quantity">
      <button
        aria-label="Giảm số lượng"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        −
      </button>
      <b>{quantity}</b>
      <button
        aria-label="Tăng số lượng"
        disabled={quantity >= 99}
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
export function Status({ status }: { status: string }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {(
        {
          PAID: "✓ ",
          READY: "✓ ",
          COMPLETED: "✓ ",
          PAYMENT_FAILED: "! ",
          CANCELLED: "× ",
        } as Record<string, string>
      )[status] || "• "}
      {(
        {
          PENDING: "Chờ thanh toán",
          PAID: "Đã thanh toán",
          PREPARING: "Đang pha chế",
          READY: "Có thể nhận nước",
          COMPLETED: "Hoàn thành",
          PAYMENT_FAILED: "Thanh toán lỗi",
          CANCELLED: "Đã hủy",
        } as Record<string, string>
      )[status] || status}
    </span>
  );
}
