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
