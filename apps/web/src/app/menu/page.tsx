import { MenuProducts } from "@/features/products/menu-products";
import { PageHeading } from "@/shared/ui/page-heading";
export default function Menu() {
  return (
    <div className="container inner-page">
      <PageHeading
        eyebrow="THỰC ĐƠN BREWLITE"
        title="Một menu, vô vàn cảm hứng"
        description="Hôm nay bạn muốn một ly cà phê đậm vị hay trà trái cây tươi mát?"
      />
      <MenuProducts />
    </div>
  );
}
