import { useCallback, useEffect, useState } from "react";
import type { CartItem } from "./cart.types";

const checkoutOrderKey = "brewlite-cart-order";
const storageKey = "brewlite-cart";

export function useCartState(ready: boolean) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const restoreCart = useCallback(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) setCart(parsed as CartItem[]);
    }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, ready]);

  // Thêm sản phẩm vào giỏ hàng
  const add = useCallback((item: CartItem) => {
    localStorage.removeItem(checkoutOrderKey);
    setCart((old) => {
      const existing = old.find((row) => row.key === item.key);

      if (existing) {
        return old.map((row) =>
          row.key === item.key
            ? {
                ...row,
                quantity: Math.min(99, row.quantity + item.quantity),
              }
            : row,
        );
      }

      return [...old, item];
    });
  }, []);

  // Thay đổi số lượng
  const change = useCallback((key: string, quantity: number) => {
    localStorage.removeItem(checkoutOrderKey);
    setCart((old) =>
      old.map((row) =>
        row.key === key
          ? {
              ...row,
              quantity: Math.max(1, Math.min(99, quantity)),
            }
          : row,
      ),
    );
  }, []);

  // Xóa một sản phẩm
  const remove = useCallback((key: string) => {
    localStorage.removeItem(checkoutOrderKey);
    setCart((old) => old.filter((row) => row.key !== key));
  }, []);

  // Xóa toàn bộ giỏ hàng
  const markCheckout = useCallback((orderId: string) => {
    localStorage.setItem(checkoutOrderKey, orderId);
  }, []);
  const currentCheckout = useCallback(() => localStorage.getItem(checkoutOrderKey), []);
  const clearPaidCart = useCallback((orderId: string) => {
    if (localStorage.getItem(checkoutOrderKey) !== orderId) return;
    localStorage.removeItem(checkoutOrderKey);
    localStorage.removeItem(storageKey);
    setCart([]);
  }, []);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return { cart, count, total, add, change, remove, markCheckout, currentCheckout, clearPaidCart, restoreCart };
}
