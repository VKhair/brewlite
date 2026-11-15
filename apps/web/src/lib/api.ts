export type Product = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  sizes?: Size[];
  toppings?: Topping[];
};
export type Size = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
};
export type Topping = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
};
const toppingImageNames: Record<string, string> = {
  "Matcha vuông": "matcha-vuong",
  "Ô long vuông": "o-long-vuong",
  "Quế hoa vuông": "que-hoa-vuong",
  "Bánh bò vuông": "banh-bo-vuong",
  "Trắng tròn": "trang-tron",
  "Trứng muối tròn": "trung-muoi-tron",
  "Bánh bò tròn": "banh-bo-tron",
  "Hoàng kim tròn": "hoang-kim-tron",
  "Khoai môn tròn": "khoai-mon-tron",
  "Khoai tím tròn": "khoai-tim-tron",
  "Khoai lang vàng tròn": "khoai-lang-vang-tron",
  "Matcha tròn": "matcha-tron",
};
export const toppingPhoto = (name: string) =>
  toppingImageNames[name]
    ? `/images/toppings/${toppingImageNames[name]}.png`
    : undefined;
export type CartItem = {
  key: string;
  productId: string;
  name: string;
  sizeId: string;
  sizeName: string;
  toppingIds: string[];
  toppingNames: string[];
  unitPrice: number;
  quantity: number;
  category: string;
  imageUrl?: string;
};
export type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};
export type Session = { access_token: string; user: User };
export type OrderItem = {
  productId: string;
  productName: string;
  sizeId: string;
  sizeName: string;
  toppings: { id: string; name: string; price: number }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};
export type Order = {
  orderId: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  history?: { toStatus: string; createdAt: string }[];
  payments?: {
    paymentId: string;
    status: string;
    amount: number;
    paymentMethod: string;
  }[];
};
export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
// Local product photos: keep old database records and existing carts compatible.
export const drinkPhoto = (
  name: string = "",
  category: string = "",
  imageUrl?: string,
) => {
  // Prefer the exact photo assigned by the API. Legacy seed records may be stale,
  // so map current menu product names explicitly before using older generic fallbacks.
  const currentMenuPhotos: Record<string, string> = {
    "Trà dâu tằm": "/images/menu-10/tra-dau-tam.webp",
    "Trà Atiso": "/images/menu-10/tra-atiso.webp",
    "Trà nhãn hạnh nhân": "/images/menu-10/tra-nhan-hanh-nhan.webp",
    "Trà vải hạnh nhân": "/images/menu-10/tra-vai-hanh-nhan.webp",
    "Trà lựu thạch dừa": "/images/menu-10/tra-luu-thach-dua.webp",
    "Trà lựu mãng cầu": "/images/menu-10/tra-luu-mang-cau.webp",
    "Trà sữa truyền thống": "/images/menu-10/tra-sua-truyen-thong.webp",
    "Trà sữa Thái xanh": "/images/menu-10/tra-sua-thai-xanh.webp",
    "Trà sữa Thái đỏ": "/images/menu-10/tra-sua-thai-do.webp",
    "Trà sữa kem phô mai mặn": "/images/menu-10/tra-sua-kem-pho-mai-man.webp",
  };
  if (currentMenuPhotos[name]) return currentMenuPhotos[name];
  if (
    imageUrl?.startsWith("/images/menu-10/") ||
    imageUrl?.startsWith("/images/menu-2026/")
  )
    return imageUrl;
  const text = `${name} ${category}`.toLocaleLowerCase("vi-VN");
  if (/matcha|freeze/.test(text)) return "/images/03-matcha-kem.png";
  if (/xoài|mango/.test(text)) return "/images/04-xoai-kem.png";
  if (/chanh|bạc hà|mojito|lime|mint/.test(text))
    return "/images/01-tra-chanh-bac-ha.png";
  if (/trà|đào|dâu|trái cây|fruit/.test(text))
    return "/images/02-tra-trai-cay-do.png";
  if (
    /cà phê|cappuccino|latte|espresso|americano|coffee|cacao|socola/.test(text)
  )
    return "/images/05-ca-phe-latte.png";
  return imageUrl && imageUrl !== "/images/drink.svg"
    ? imageUrl
    : "/images/05-ca-phe-latte.png";
};
export const emoji = (category: string, name = "") =>
  /matcha|freeze/i.test(name + category)
    ? "🍵"
    : /trà|tea/i.test(category + name)
      ? "🍑"
      : /cacao|socola/i.test(category + name)
        ? "🍫"
        : "☕";
export const statusName: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PAYMENT_FAILED: "Thanh toán lỗi",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`/api/backend${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Không thể kết nối máy chủ. Hãy kiểm tra backend đang chạy.",
      0,
    );
  }
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const first = json?.message;
    throw new ApiError(
      typeof first === "string"
        ? first
        : Array.isArray(first)
          ? first.join(", ")
          : "Có lỗi xảy ra, vui lòng thử lại.",
      response.status,
    );
  }
  return json as T;
}
