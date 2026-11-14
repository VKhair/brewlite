"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { addCartItem } from "../../../lib/cart-store";

const API_URL = "/api";

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
  category: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  isAvailable: boolean;
  sizes: ProductSize[];
  toppings: Topping[];
};
export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products/${params.id}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Không tìm thấy sản phẩm.");
        }

        const data: Product = await response.json();

        setProduct(data);

        const defaultSize =
          data.sizes.find((size) => size.isDefault) ?? data.sizes[0];

        setSelectedSize(defaultSize?.id ?? "");
        setSelectedToppings([]);
        setQuantity(1);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin sản phẩm.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => controller.abort();
  }, [params.id]);

  const sizes = product?.sizes ?? [];
  const toppings = (product?.toppings ?? []).filter(
    (topping) => topping.isAvailable,
  );

  const selectedSizeData = sizes.find(
    (size) => size.id === selectedSize,
  );

  const sizePrice = selectedSizeData?.priceDelta ?? 0;

  const selectedToppingData = toppings.filter((topping) =>
    selectedToppings.includes(topping.id),
  );

  const toppingPrice = selectedToppingData.reduce(
    (total, topping) => total + topping.price,
    0,
  );

  const unitPrice = (product?.basePrice ?? 0) + sizePrice + toppingPrice;
  const totalPrice = unitPrice * quantity;

  function toggleTopping(id: string) {
    setSelectedToppings((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function addToCart() {
    if (!product || !selectedSizeData) return;

    const cartItem = {
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl || "",
      size: selectedSizeData.name,
      sizeId: selectedSizeData.id,
      toppings: selectedToppingData.map((topping) => topping.name),
      toppingIds: selectedToppingData.map((topping) => topping.id),
      quantity,
      unitPrice,
    };

    addCartItem(cartItem);

    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (loading) {
    return <main className="min-h-screen p-10 text-center">Đang tải sản phẩm...</main>;
  }

  if (error || !product) {
    return (
      <main className="min-h-screen p-10 text-center">
        <p>{error || "Không tìm thấy sản phẩm."}</p>
        <button onClick={() => router.push("/")}>
          Quay lại trang chủ
        </button>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#30251f]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#eee7df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            onClick={() => router.push("/")}
            className="text-xl font-black tracking-[0.18em] text-[#6f422d]"
          >
            BREWLITE
          </button>

          <button
            onClick={() => router.push("/cart")}
            className="rounded-full border border-[#e7ddd3] px-4 py-2 text-sm font-semibold transition hover:bg-[#f5eee7]"
          >
            Giỏ hàng
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7">
        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2 text-sm text-[#99877a]">
          <button onClick={() => router.push("/")} className="hover:text-[#8b5638]">
            Trang chủ
          </button>
          <span>/</span>
          <span>Menu</span>
          <span>/</span>
          <span className="font-semibold text-[#6f422d]">
            Chi tiết sản phẩm
          </span>
        </div>

        {/* Product content */}
        <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
    {/* Product image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-[#eee5dc]">
  <Image
    src={product.imageUrl}
    alt={product.name}
    fill
    sizes="(max-width: 1024px) 100vw, 50vw"
    className="object-cover"
  />
</div>
          {/* Product information */}
          <div className="flex flex-col">
            <p className="mb-3 text-xs font-bold tracking-[0.25em] text-[#a16c49]">
              {product.category}
            </p>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-4 text-2xl font-bold text-[#8b5638]">
              {product.basePrice.toLocaleString("vi-VN")}đ
            </p>

            <p className="mt-5 leading-7 text-[#796b61]">
              {product.description}
            </p>

            <div className="my-7 border-t border-[#e9dfd5]" />

            {/* Size */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Chọn kích cỡ</h2>
                <span className="text-sm text-[#99877a]">
                  Bắt buộc
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`rounded-xl border px-3 py-3 transition ${
                      selectedSize === size.name
                        ? "border-[#8b5638] bg-[#f4e9df] text-[#75462e]"
                        : "border-[#e7ddd3] bg-white hover:border-[#b58a6b]"
                    }`}
                  >
                    <span className="block font-bold">{size.id}</span>
                    <span className="mt-1 block text-xs">
                      {size.priceDelta === 0
                        ? "Mặc định"
                        : `+${size.priceDelta.toLocaleString("vi-VN")}đ`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div className="mt-7">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Topping thêm</h2>
                <span className="text-sm text-[#99877a]">
                  Không bắt buộc
                </span>
              </div>

              <div className="space-y-3">
                {toppings.map((topping) => {
                  const checked = selectedToppings.includes(topping.name);

                  return (
                    <label
                      key={topping.name}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border bg-white p-4 transition ${
                        checked
                          ? "border-[#8b5638] bg-[#fcf7f2]"
                          : "border-[#e7ddd3] hover:border-[#b58a6b]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTopping(topping.name)}
                          className="h-4 w-4 accent-[#8b5638]"
                        />
                        <span className="text-sm font-medium">
                          {topping.name}
                        </span>
                      </span>

                      <span className="text-sm font-semibold text-[#8b5638]">
                        +{topping.price.toLocaleString("vi-VN")}đ
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-7 flex items-center justify-between">
              <h2 className="font-bold">Số lượng</h2>

              <div className="flex items-center gap-5 rounded-full border border-[#e7ddd3] bg-white px-4 py-2">
                <button
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="text-xl font-semibold"
                  aria-label="Giảm số lượng"
                >
                  −
                </button>

                <span className="min-w-5 text-center font-bold">
                  {quantity}
                </span>

                <button
                  onClick={() => setQuantity((value) => value + 1)}
                  className="text-xl font-semibold"
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="mt-7 flex items-center justify-between rounded-2xl bg-[#f1e8df] p-5">
              <span className="font-semibold">Tổng cộng</span>
              <span className="text-xl font-bold text-[#8b5638]">
                {totalPrice.toLocaleString("vi-VN")}đ
              </span>
            </div>

            {/* Add to cart */}
            <button
              onClick={addToCart}
              className="mt-5 w-full rounded-full bg-[#75462e] px-6 py-4 font-bold text-white transition hover:bg-[#5e3825]"
            >
              {added ? "Đã thêm vào giỏ hàng ✓" : "Thêm vào giỏ hàng"}
            </button>

            {added && (
              <p className="mt-3 text-center text-sm font-medium text-green-700">
                Sản phẩm đã được lưu vào giỏ hàng.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
