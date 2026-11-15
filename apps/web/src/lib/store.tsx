"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import type { CartItem, Session } from "./api";

type Store = {
  cart: CartItem[];
  session: Session | null;
  ready: boolean;
  count: number;
  total: number;
  add: (item: CartItem) => void;
  change: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  signin: (session: Session) => void;
  signout: () => void;
};

const Context = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Khôi phục giỏ hàng và phiên đăng nhập từ localStorage
  useEffect(() => {
    const restore = () => {
      try {
        const savedCart = localStorage.getItem("brewlite-cart");

        if (savedCart) {
          const parsed: unknown = JSON.parse(savedCart);

          if (Array.isArray(parsed)) {
            setCart(parsed as CartItem[]);
          }
        }

        const savedSession = localStorage.getItem("brewlite-session");

        if (savedSession) {
          setSession(JSON.parse(savedSession) as Session);
        }
      } catch (error) {
        console.error("Cannot restore BrewLite data:", error);
      } finally {
        setReady(true);
      }
    };

    const timeoutId = window.setTimeout(restore, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Tự động lưu giỏ hàng khi có thay đổi
  useEffect(() => {
    if (!ready) return;

    localStorage.setItem("brewlite-cart", JSON.stringify(cart));
  }, [cart, ready]);

  // Đăng nhập
  const signin = useCallback((next: Session) => {
    setSession(next);
    localStorage.setItem("brewlite-session", JSON.stringify(next));
  }, []);

  // Đăng xuất
  const signout = useCallback(() => {
    setSession(null);
    localStorage.removeItem("brewlite-session");
  }, []);

  // Thêm sản phẩm vào giỏ hàng
  const add = useCallback((item: CartItem) => {
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
    setCart((old) => old.filter((row) => row.key !== key));
  }, []);

  // Xóa toàn bộ giỏ hàng
  const clear = useCallback(() => {
    setCart([]);
  }, []);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return (
    <Context.Provider
      value={{
        cart,
        session,
        ready,
        count,
        total,
        add,
        change,
        remove,
        clear,
        signin,
        signout,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useStore() {
  const context = useContext(Context);

  if (!context) {
    throw new Error("StoreProvider missing");
  }

  return context;
}
