BEGIN;
INSERT INTO products (id, name, description, base_price, image_url, category, is_available) VALUES
('10000000-0000-4000-8000-000000000001', 'Cà phê sữa', 'Cà phê phin cùng sữa đặc.', 29000, '/images/drink.svg', 'Cà phê', true),
('10000000-0000-4000-8000-000000000002', 'Trà đào', 'Trà thơm kết hợp đào.', 39000, '/images/drink.svg', 'Trà', true),
('10000000-0000-4000-8000-000000000003', 'Matcha Freeze', 'Matcha xay đá cùng sữa.', 49000, '/images/drink.svg', 'Freeze', true),
('10000000-0000-4000-8000-000000000004', 'Cacao đá', 'Cacao sữa đá.', 35000, '/images/drink.svg', 'Cacao', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_sizes (id, product_id, name, price_delta, is_default)
SELECT md5(p.id::text || v.name)::uuid, p.id, v.name, v.delta, v.name = 'M'
FROM products p CROSS JOIN (VALUES ('S', -5000), ('M', 0), ('L', 10000)) v(name, delta)
WHERE p.id IN ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002',
 '10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004')
ON CONFLICT DO NOTHING;

INSERT INTO toppings (id, name, price, is_available) VALUES
('20000000-0000-4000-8000-000000000001', 'Thạch cà phê', 5000, true),
('20000000-0000-4000-8000-000000000002', 'Đào miếng', 10000, true),
('20000000-0000-4000-8000-000000000003', 'Kem phô mai', 10000, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_toppings (product_id, topping_id) VALUES
('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002'),
('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003')
ON CONFLICT DO NOTHING;
COMMIT;
