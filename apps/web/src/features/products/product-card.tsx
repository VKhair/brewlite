import Link from "next/link";
import { money } from "@/shared/format";
import { drinkPhoto } from "./product-photos";
import type { Product } from "./product.types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="product-card" href={`/product/${product.id}`}>
      <div
        className={`drink-art art-${product.category.toLowerCase().replace(/[^a-z0-9]/g, "")}`}
      >
        <img
          className="drink-photo"
          src={drinkPhoto(product.name, product.category, product.imageUrl)}
          alt={`Ảnh ${product.name}`}
          loading="lazy"
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
