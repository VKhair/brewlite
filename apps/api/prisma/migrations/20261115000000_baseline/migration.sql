BEGIN;
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  description text NOT NULL DEFAULT '',
  base_price integer NOT NULL CHECK (base_price >= 0),
  image_url text NOT NULL,
  category text NOT NULL CHECK (length(trim(category)) > 0),
  is_available boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS product_sizes (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name IN ('S', 'M', 'L')),
  price_delta integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  UNIQUE (product_id, name)
);
CREATE UNIQUE INDEX IF NOT EXISTS product_sizes_one_default
  ON product_sizes(product_id) WHERE is_default;
CREATE TABLE IF NOT EXISTS toppings (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  price integer NOT NULL CHECK (price >= 0),
  is_available boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS product_toppings (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  topping_id uuid NOT NULL REFERENCES toppings(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, topping_id)
);
CREATE INDEX IF NOT EXISTS products_available_name ON products(name, id) WHERE is_available;
COMMIT;
BEGIN;
-- Initial demo inventory for the existing Sprint 1 catalog; reruns never reset it.
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 100 CHECK (stock >= 0);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  full_name text NOT NULL CHECK (length(full_name) BETWEEN 2 AND 50),
  phone text,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'STAFF')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  order_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN
    ('PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'PAYMENT_FAILED', 'CANCELLED')),
  total_amount integer NOT NULL CHECK (total_amount >= 0),
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_created ON orders(user_id, created_at DESC, id DESC);
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY,
  sequence bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  order_id uuid NOT NULL REFERENCES orders(id),
  from_status text,
  to_status text NOT NULL,
  actor_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_history_order ON order_status_history(order_id, created_at);
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  idempotency_key uuid NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('EWALLET', 'CARD')),
  mock_outcome text NOT NULL CHECK (mock_outcome IN ('SUCCESS', 'FAILURE')),
  amount integer NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_success ON payments(order_id) WHERE status = 'SUCCESS';
COMMIT;
