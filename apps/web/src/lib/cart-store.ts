
export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  size: string;
  sizeId: string;
  toppings: string[];
  toppingIds: string[];
  quantity: number;
  unitPrice: number;
}

const CART_KEY = "brewLiteCart";
const CART_EVENT = "brewLiteCartChanged";

export function getCartSnapshot(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(CART_KEY);
}

export function getServerCartSnapshot(): string | null {
  return null;
}

export function subscribeCart(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function parseCart(data: string | null): CartItem[] {
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(CART_KEY, JSON.stringify(items));

  window.dispatchEvent(new Event(CART_EVENT));
}

export function addCartItem(item: CartItem) {
  const currentCart = parseCart(getCartSnapshot());

  saveCart([...currentCart, item]);
}
