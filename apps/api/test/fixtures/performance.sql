-- Load only into a disposable test database after the normal demo seed.
BEGIN;
INSERT INTO products (id, name, base_price, image_url, category, is_available, stock)
SELECT md5('brewlite-perf-product-' || n)::uuid, 'Test drink ' || n,
       29000, '/images/drink.svg', 'Test', true, 100
FROM generate_series(1, 17) AS n
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_sizes (id, product_id, name, is_default)
SELECT md5('brewlite-perf-size-' || n)::uuid,
       md5('brewlite-perf-product-' || n)::uuid, 'M', true
FROM generate_series(1, 17) AS n
ON CONFLICT (id) DO NOTHING;
COMMIT;
