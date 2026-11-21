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
