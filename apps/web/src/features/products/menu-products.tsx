"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "./product-card";
import { listProducts } from "./products.api";
import type { Product } from "./product.types";

export function MenuProducts({ limit }: { limit?: number }) {
  const [products, setProducts] = useState<Product[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("Tất cả"),
    [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    listProducts()
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
          {view.map((p) => (
            <ProductCard key={p.id} product={p} />
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
