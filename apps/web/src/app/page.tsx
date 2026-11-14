
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCart } from "../lib/cart-store";
import {
  clearSession,
  getSession,
  subscribeAuth,
  type AuthSession,
} from "../lib/auth";
type ProductSize = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
};

type Topping = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  category?: string;
  isAvailable: boolean;
  sizes?: ProductSize[];
  toppings?: Topping[];
};

type CartItem = {
  product: Product;
  size: ProductSize;
  toppings: Topping[];
  quantity: number;
};

const API_URL = "/api";

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ";
const getProductImage = (product: Product) => {
  const images: Record<string, string> = {
    "10000000-0000-4000-8000-000000000001": "/images/coffee-milk.jpg",
    "10000000-0000-4000-8000-000000000002": "/images/peach-tea.jpg",
    "10000000-0000-4000-8000-000000000003": "/images/matcha-freeze.jpg",
    "10000000-0000-4000-8000-000000000004": "/images/cacao-ice.jpg",
  };

  return images[product.id] || product.imageUrl;
};
export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthSession["user"] | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

useEffect(() => {
  const updateUser = () => {
    const session = getSession();
    setCurrentUser(session?.user ?? null);
  };

  updateUser();

  return subscribeAuth(updateUser);
}, []);

function handleAccountClick() {
  setShowAccountMenu((prev) => !prev);
}

function handleLogout() {
  clearSession();
  setCurrentUser(null);
  setShowAccountMenu(false);
  setNotice("Đã đăng xuất thành công.");
}



  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notice, setNotice] = useState("");

  // Lấy danh sách sản phẩm từ Backend
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Không thể tải thực đơn (${response.status}).`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu sản phẩm từ máy chủ không hợp lệ.");
        }

        setProducts(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(
            err.message ||
              "Không thể kết nối máy chủ. Vui lòng thử lại.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category)
      .filter((value): value is string => Boolean(value));

    return ["Tất cả", ...Array.from(new Set(values))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchKeyword = product.name
        .toLowerCase()
        .includes(keyword.toLowerCase());

      const matchCategory =
        category === "Tất cả" || product.category === category;

      return matchKeyword && matchCategory;
    });
  }, [products, keyword, category]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce((sum, item) => {
    const toppingTotal = item.toppings.reduce(
      (total, topping) => total + topping.price,
      0,
    );

    return (
      sum +
      (item.product.basePrice +
        item.size.priceDelta +
        toppingTotal) *
        item.quantity
    );
  }, 0);

  // Mở chi tiết và lấy size/topping từ API
  async function openProduct(product: Product) {
    setSelectedProduct(product);
    setDetailLoading(true);
    setSelectedToppings([]);
    setQuantity(1);
    setSelectedSize("");

    try {
      const response = await fetch(`${API_URL}/products/${product.id}`);

      if (!response.ok) {
        throw new Error("Không thể tải chi tiết sản phẩm.");
      }

      const detail: Product = await response.json();

      setSelectedProduct(detail);

      const defaultSize =
        detail.sizes?.find((size) => size.isDefault) ??
        detail.sizes?.[0];

      if (defaultSize) setSelectedSize(defaultSize.id);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Có lỗi xảy ra.",
      );
      setSelectedProduct(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function toggleTopping(id: string) {
    setSelectedToppings((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function addToCart() {
    if (!selectedProduct) return;

    const size = selectedProduct.sizes?.find(
      (item) => item.id === selectedSize,
    );

    if (!size) {
      setNotice("Vui lòng chọn kích cỡ sản phẩm.");
      return;
    }

    const toppings =
      selectedProduct.toppings?.filter((item) =>
        selectedToppings.includes(item.id),
      ) ?? [];

    setCart((current) => [
      ...current,
      {
        product: selectedProduct,
        size,
        toppings,
        quantity,
      },
    ]);

    setSelectedProduct(null);
    setNotice("Đã thêm sản phẩm vào giỏ hàng.");
  }

  function changeCartQuantity(index: number, amount: number) {
    setCart((current) =>
      current
        .map((item, i) =>
          i === index
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeCartItem(index: number) {
    setCart((current) => current.filter((_, i) => i !== index));
  }
function handleCheckout() {
  if (cart.length === 0) {
    setNotice("Giỏ hàng đang trống.");
    return;
  }

  const checkoutItems = cart.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    imageUrl: getProductImage(item.product) || "",
    size: item.size.name,
    sizeId: item.size.id,
    toppings: item.toppings.map((topping) => topping.name),
    toppingIds: item.toppings.map((topping) => topping.id),
    quantity: item.quantity,
    unitPrice:
      item.product.basePrice +
      item.size.priceDelta +
      item.toppings.reduce((sum, topping) => sum + topping.price, 0),
  }));

  saveCart(checkoutItems);
  setShowCart(false);
  router.push("/checkout");
}
  const selectedProductPrice = selectedProduct
    ? selectedProduct.basePrice +
      (selectedProduct.sizes?.find(
        (item) => item.id === selectedSize,
      )?.priceDelta ?? 0) +
      (selectedProduct.toppings
        ?.filter((item) => selectedToppings.includes(item.id))
        .reduce((sum, item) => sum + item.price, 0) ?? 0)
    : 0;

  return (
    <main className="site">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#">
            <span className="brand-icon">☕</span>
            <span>Brew<span className="brand-light">Lite</span></span>
          </a>

          <nav className="nav">
            <a className="active" href="#">Thực đơn</a>
            <button onClick={() => setShowCart(true)}>
              Giỏ hàng của tôi
            </button>
            <a href="/orders">Đơn hàng của tôi</a>
            <a href="#footer">Ưu đãi & Voucher</a>
          </nav>

          <div className="header-actions">
            <button
              className="cart-button"
              onClick={() => setShowCart(true)}
              aria-label="Mở giỏ hàng"
            >
              🛒
              {cartCount > 0 && <span>{cartCount}</span>}
            </button>
            <div className="account-menu-wrapper">
  <button
    className="avatar"
    onClick={handleAccountClick}
    aria-label="Tài khoản"
    title="Tài khoản"
  >
    👤
  </button>

  {showAccountMenu && (
    <div className="account-dropdown">
      <div className="account-dropdown-title">
        {currentUser ? currentUser.fullName : "Tài khoản của tôi"}
      </div>

      {!currentUser ? (
        <>
          <button onClick={() => router.push("/login")}>
            Đăng nhập
          </button>
          <button onClick={() => router.push("/register")}>
            Đăng ký
          </button>
        </>
      ) : (
        <button onClick={handleLogout}>
          Đăng xuất
        </button>
      )}
    </div>
  )}
</div>          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="container">
        <div className="breadcrumb">Trang chủ　›　Thực đơn</div>

        <section className="menu-heading">
          <div>
            <p className="eyebrow">BREWLITE COFFEE & TEA</p>
            <h1>Thực đơn BrewLite</h1>
            <p className="subheading">
              Khám phá những thức uống thơm ngon, được pha chế từ
              những nguyên liệu chất lượng.
            </p>
          </div>

          <div className="search-box">
            <span>⌕</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm đồ uống yêu thích..."
            />
            {keyword && (
              <button onClick={() => setKeyword("")}>×</button>
            )}
          </div>
        </section>

        {/* CATEGORY */}
        <div className="category-list">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "category active" : "category"}
              onClick={() => setCategory(item)}
            >
              {item === "Tất cả" ? "☕ " : ""}
              {item}
            </button>
          ))}
        </div>

        {/* PROMOTION BANNER */}
        <section className="promo-banner">
          <div>
            <span className="promo-label">✦ ĐẶC QUYỀN BREWCLUB</span>
            <h2>Đặc quyền BrewClub: Mua 2 Tặng 1</h2>
            <p>
              Tích điểm mỗi ngày, nhận ưu đãi hấp dẫn dành riêng
              cho thành viên BrewLite.
            </p>
          </div>
          <button onClick={() => setNotice("Ưu đãi BrewClub sẽ được cập nhật sau.")}>
            Tìm hiểu ngay →
          </button>
        </section>

        {/* PRODUCT LIST */}
        <section className="product-section">
          <div className="section-heading">
            <div>
              <h2>Thức uống nổi bật</h2>
              <p>{filteredProducts.length} sản phẩm</p>
            </div>
            <span className="sort-label">Sắp xếp: Mặc định</span>
          </div>

          {loading && (
            <div className="state-box">
              <div className="spinner" />
              <p>Đang tải thực đơn...</p>
            </div>
          )}

          {!loading && error && (
            <div className="state-box error-state">
              <div className="state-icon">!</div>
              <h3>Không thể tải thực đơn</h3>
              <p>{error}</p>
              <button
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="state-box">
              <div className="state-icon">⌕</div>
              <h3>Không tìm thấy sản phẩm</h3>
              <p>Thử tìm kiếm với từ khóa hoặc danh mục khác.</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setKeyword("");
                  setCategory("Tất cả");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <button
                    className="product-image"
                    onClick={() => openProduct(product)}
                    aria-label={`Xem ${product.name}`}
                  >
                  {getProductImage(product) ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={getProductImage(product)} alt={product.name} />
) : (
                      <div className="no-image">☕</div>
                    )}
                    <span className="image-tag">BREWLITE</span>
                  </button>

                  <div className="product-info">
                    <span className="product-category">
                      {product.category || "Đồ uống"}
                    </span>
                    <h3>{product.name}</h3>
                    <p>
                      {product.description || "Thức uống thơm ngon từ BrewLite."}
                    </p>
                    <div className="product-bottom">
                      <strong>{money(product.basePrice)}</strong>
                      <button
                        className="add-button"
                        onClick={() => openProduct(product)}
                      >
                        + Thêm
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <footer className="footer" id="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <h3>☕ BrewLite</h3>
            <p>
              Trải nghiệm thức uống thủ công nguyên bản,
              kết hợp tinh hoa trà và cà phê cùng dịch vụ
              giao hàng tiện lợi mỗi ngày.
            </p>
            <strong>☎ 1900 8899</strong>
          </div>

          <div>
            <h4>Cửa hàng & Điểm đến</h4>
            <p>247 Cầu Giấy, Hà Nội</p>
            <p>12B Trần Hưng Đạo, Đà Nẵng</p>
            <p>86 Nguyễn Huệ, Quận 1, TP.HCM</p>
          </div>

          <div>
            <h4>Chính sách & Hỗ trợ</h4>
            <p>Chính sách giao hàng</p>
            <p>Quy định tích điểm BrewClub</p>
            <p>Điều khoản & Dịch vụ</p>
          </div>

          <div>
            <h4>Đối tác thanh toán</h4>
            <p>MoMo　ZaloPay　VNPay</p>
            <p>Visa / Mastercard</p>
          </div>
        </div>
        <div className="copyright">
          © 2025 BrewLite Specialty Coffee & Tea. Bảo lưu mọi quyền.
        </div>
      </footer>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProduct(null);
            }
          }}
        >
          <div className="detail-modal">
            <button
              className="close-button"
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>

            <div className="modal-product-heading">
              <div className="modal-product-image">
            {getProductImage(selectedProduct) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getProductImage(selectedProduct)}
                  alt={selectedProduct.name}
                />
              ) : (
                "☕"
              )}
              </div>
              <div>
                <span className="product-category">BREWLITE MENU</span>
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.description}</p>
              </div>
            </div>

            {detailLoading ? (
              <div className="modal-loading">
                <div className="spinner" />
                Đang tải tùy chọn...
              </div>
            ) : (
              <>
                <div className="option-group">
                  <div className="option-title">
                    <strong>1. Chọn kích cỡ</strong>
                    <span>Bắt buộc</span>
                  </div>
                  <div className="option-list">
                    {selectedProduct.sizes?.map((size) => (
                      <button
                        key={size.id}
                        className={
                          selectedSize === size.id
                            ? "option active"
                            : "option"
                        }
                        onClick={() => setSelectedSize(size.id)}
                      >
                        {size.name}
                        {size.priceDelta > 0 &&
                          ` (+${money(size.priceDelta)})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="option-group">
                  <div className="option-title">
                    <strong>2. Chọn topping</strong>
                    <span>Không bắt buộc</span>
                  </div>
                  <div className="topping-list">
                    {selectedProduct.toppings
                      ?.filter((item) => item.isAvailable)
                      .map((topping) => (
                        <label className="topping-item" key={topping.id}>
                          <input
                            type="checkbox"
                            checked={selectedToppings.includes(topping.id)}
                            onChange={() => toggleTopping(topping.id)}
                          />
                          <span>{topping.name}</span>
                          <strong>+{money(topping.price)}</strong>
                        </label>
                      ))}
                    {(!selectedProduct.toppings ||
                      selectedProduct.toppings.length === 0) && (
                      <p className="muted">Sản phẩm chưa có topping.</p>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <div className="quantity-control">
                    <button
                      onClick={() =>
                        setQuantity((value) => Math.max(1, value - 1))
                      }
                    >
                      −
                    </button>
                    <strong>{quantity}</strong>
                    <button
                      onClick={() =>
                        setQuantity((value) => Math.min(99, value + 1))
                      }
                    >
                      +
                    </button>
                  </div>

                  <strong className="modal-price">
                    {money(selectedProductPrice * quantity)}
                  </strong>

                  <button
                    className="primary-button"
                    onClick={addToCart}
                    disabled={detailLoading || !selectedSize}
                  >
                    Thêm vào giỏ →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div className="overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowCart(false);
        }}>
          <aside className="cart-drawer">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">BREWLITE</span>
                <h2>Giỏ hàng của tôi</h2>
              </div>
              <button
                className="close-button"
                onClick={() => setShowCart(false)}
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <div>🛒</div>
                <h3>Giỏ hàng đang trống</h3>
                <p>Hãy chọn thức uống yêu thích của bạn nhé.</p>
                <button
                  className="primary-button"
                  onClick={() => setShowCart(false)}
                >
                  Khám phá thực đơn
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div className="cart-item" key={`${item.product.id}-${index}`}>
                      <div className="cart-item-image">
                        {getProductImage(item.product) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getProductImage(item.product)}
                          alt={item.product.name}
                        />
                      ) : "☕"}
                      </div>
                      <div className="cart-item-content">
                        <strong>{item.product.name}</strong>
                        <small>{item.size.name}</small>
                        {item.toppings.map((topping) => (
                          <small key={topping.id}>{topping.name}</small>
                        ))}
                        <strong className="cart-item-price">
                          {money(
                            (item.product.basePrice +
                              item.size.priceDelta +
                              item.toppings.reduce(
                                (sum, topping) => sum + topping.price,
                                0,
                              )) *
                              item.quantity,
                          )}
                        </strong>
                        <div className="quantity-control small">
                          <button onClick={() => changeCartQuantity(index, -1)}>
                            −
                          </button>
                          <strong>{item.quantity}</strong>
                          <button onClick={() => changeCartQuantity(index, 1)}>
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        className="remove-button"
                        onClick={() => removeCartItem(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Tạm tính</span>
                    <strong>{money(cartTotal)}</strong>
                  </div>
                  <div className="cart-total">
                    <span>Tổng cộng</span>
                    <strong>{money(cartTotal)}</strong>
                  </div>
                  <p>
                    Giỏ hàng hiện được lưu trong phiên sử dụng trình duyệt.
                    Chưa gửi đơn hàng lên máy chủ.
                  </p>
                  <button
                    className="primary-button full-button"
                  onClick={handleCheckout}
                  >
                    Tiếp tục →
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {notice && (
        <div className="toast">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
    </main>
  );
}
