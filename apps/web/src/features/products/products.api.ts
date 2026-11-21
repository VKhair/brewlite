import { api } from "@/shared/api/http-client";
import type { Product } from "./product.types";

export function listProducts() {
  return api<Product[]>("/products");
}

export function getProduct(id: string) {
  return api<Product>(`/products/${id}`);
}
