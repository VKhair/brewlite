BEGIN;

ALTER TABLE inventory_movements
  ADD COLUMN payment_id uuid REFERENCES payments(id) ON DELETE RESTRICT;

-- Active VNPay attempts already reserved ingredients under the old order-level ledger.
WITH pending_payments AS (
  SELECT DISTINCT ON (p.order_id) p.order_id, p.id
  FROM payments p
  JOIN orders o ON o.id = p.order_id
  WHERE p.payment_method = 'VNPAY' AND p.status = 'PENDING' AND o.status = 'PENDING'
  ORDER BY p.order_id, p.created_at DESC, p.id DESC
)
UPDATE inventory_movements AS consumption
SET payment_id = pending.id
FROM pending_payments pending
WHERE consumption.order_id = pending.order_id
  AND consumption.type = 'CONSUMPTION'
  AND NOT EXISTS (
    SELECT 1 FROM inventory_movements reversal
    WHERE reversal.order_id = consumption.order_id
      AND reversal.ingredient_id = consumption.ingredient_id
      AND reversal.type = 'REVERSAL'
  );

-- Unpaid orders now reserve only when payment starts. Release their old debits.
WITH released AS (
  INSERT INTO inventory_movements (ingredient_id, order_id, type, quantity, reason)
  SELECT consumption.ingredient_id, consumption.order_id, 'REVERSAL',
         -consumption.quantity, 'Release unpaid order reservation during payment inventory migration'
  FROM inventory_movements consumption
  JOIN orders o ON o.id = consumption.order_id
  WHERE o.status = 'PENDING' AND consumption.type = 'CONSUMPTION'
    AND consumption.payment_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.order_id = o.id AND p.payment_method = 'VNPAY' AND p.status = 'PENDING'
    )
  ON CONFLICT (order_id, ingredient_id, type) DO NOTHING
  RETURNING ingredient_id, quantity
), totals AS (
  SELECT ingredient_id, sum(quantity) AS quantity
  FROM released
  GROUP BY ingredient_id
)
UPDATE ingredients
SET on_hand = ingredients.on_hand + totals.quantity, updated_at = now()
FROM totals
WHERE ingredients.id = totals.ingredient_id;

ALTER TABLE inventory_movements
  DROP CONSTRAINT inventory_movements_order_id_ingredient_id_type_key;

CREATE UNIQUE INDEX inventory_movements_payment_ingredient_type_key
  ON inventory_movements(payment_id, ingredient_id, type);

ALTER TABLE products DROP COLUMN stock;

COMMIT;
