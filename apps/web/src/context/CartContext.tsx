'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId' | 'unitPrice' | 'lineTotal'>) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function generateCartItemId(
  productId: string,
  sizeId: string,
  toppings: { id: string }[]
): string {
  const sortedToppingIds = toppings.map((t) => t.id).sort().join('_');
  return `${productId}:${sizeId}:${sortedToppingIds}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('brewlite_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('brewlite_cart', JSON.stringify(items));
      } catch {
        // Ignore storage error
      }
    }
  }, [items, isMounted]);

  const addToCart = (newItem: Omit<CartItem, 'cartItemId' | 'unitPrice' | 'lineTotal'>) => {
    const unitPrice =
      newItem.basePrice +
      newItem.size.priceDelta +
      newItem.selectedToppings.reduce((sum, t) => sum + t.price, 0);

    const cartItemId = generateCartItemId(
      newItem.productId,
      newItem.size.id,
      newItem.selectedToppings
    );

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIndex > -1) {
        // Cùng sản phẩm, cùng size, cùng topping -> cộng dồn số lượng (AC-04.1)
        const updated = [...prev];
        const existing = updated[existingIndex];
        const nextQty = existing.quantity + newItem.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: nextQty,
          lineTotal: unitPrice * nextQty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          ...newItem,
          cartItemId,
          unitPrice,
          lineTotal: unitPrice * newItem.quantity,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              lineTotal: item.unitPrice * nextQty,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem('brewlite_cart');
    } catch {
      // Ignore
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
