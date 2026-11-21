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
