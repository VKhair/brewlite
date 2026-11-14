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
