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
