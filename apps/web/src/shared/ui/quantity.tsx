"use client";

export function Quantity({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="quantity">
      <button
        aria-label="Giảm số lượng"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        −
      </button>
      <b>{quantity}</b>
      <button
        aria-label="Tăng số lượng"
        disabled={quantity >= 99}
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
