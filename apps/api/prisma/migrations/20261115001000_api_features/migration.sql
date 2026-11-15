ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_used integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_discount integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
UPDATE orders SET subtotal_amount = total_amount WHERE subtotal_amount = 0 AND total_amount > 0;

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer,
  discount_amount integer,
  min_order_amount integer NOT NULL DEFAULT 0,
  max_discount integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((discount_percent IS NOT NULL) <> (discount_amount IS NOT NULL)),
  CHECK (discount_percent IS NULL OR discount_percent BETWEEN 1 AND 100),
  CHECK (discount_amount IS NULL OR discount_amount >= 0),
  CHECK (min_order_amount >= 0),
  CHECK (max_discount IS NULL OR max_discount >= 0)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  points integer NOT NULL CHECK (points <> 0),
  type text NOT NULL CHECK (type IN ('EARN', 'REDEEM', 'REFUND')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, type)
);
CREATE INDEX IF NOT EXISTS loyalty_transactions_user_created ON loyalty_transactions(user_id, created_at);

ALTER TABLE payments ALTER COLUMN mock_outcome DROP NOT NULL;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('EWALLET', 'CARD', 'VNPAY'));
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_mock_outcome_check;
ALTER TABLE payments ADD CONSTRAINT payments_mock_outcome_check CHECK (mock_outcome IS NULL OR mock_outcome IN ('SUCCESS', 'FAILURE'));
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_txn_ref text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_url text;
DROP INDEX IF EXISTS payments_provider_txn_ref;
CREATE UNIQUE INDEX payments_provider_txn_ref ON payments(provider_txn_ref);

CREATE TABLE IF NOT EXISTS ingredients (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  unit text NOT NULL,
  on_hand numeric(14,3) NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_recipes (
  id serial PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id integer NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  size text NOT NULL CHECK (size IN ('S', 'M', 'L')),
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (product_id, size, ingredient_id)
);
CREATE INDEX IF NOT EXISTS product_recipes_ingredient ON product_recipes(ingredient_id);
CREATE TABLE IF NOT EXISTS topping_recipes (
  id serial PRIMARY KEY,
  topping_id uuid NOT NULL REFERENCES toppings(id) ON DELETE CASCADE,
  ingredient_id integer NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  UNIQUE (topping_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS topping_recipes_ingredient ON topping_recipes(ingredient_id);
CREATE TABLE IF NOT EXISTS inventory_movements (
  id serial PRIMARY KEY,
  ingredient_id integer NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('OPENING', 'RECEIPT', 'ADJUSTMENT', 'CONSUMPTION', 'REVERSAL')),
  quantity numeric(14,3) NOT NULL CHECK (quantity <> 0),
  reason text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, ingredient_id, type)
);
CREATE INDEX IF NOT EXISTS inventory_movements_ingredient_created ON inventory_movements(ingredient_id, created_at);

INSERT INTO coupons (code, discount_percent, min_order_amount, max_discount)
VALUES ('BREWLITE10', 10, 30000, 30000)
ON CONFLICT (code) DO NOTHING;
INSERT INTO coupons (code, discount_amount, min_order_amount)
VALUES ('GIAM20K', 20000, 50000), ('WELCOME', 15000, 0)
ON CONFLICT (code) DO NOTHING;
