-- ============================================================
-- DDB Burger — SETUP COMPLETO v5
-- Ejecutar TODO esto en Supabase → SQL Editor → New query
-- ============================================================

-- BORRAR TODO
DROP TABLE IF EXISTS order_item_extras CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS promos CASCADE;
DROP TABLE IF EXISTS variant_ingredient_overrides CASCADE;
DROP TABLE IF EXISTS product_ingredients CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS fixed_costs CASCADE;
DROP TABLE IF EXISTS extras CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;

-- CREAR TABLAS
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, cost INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE extras (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE fixed_costs (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE product_variants (
  id TEXT PRIMARY KEY, product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE product_ingredients (
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (product_id, ingredient_id)
);
CREATE TABLE variant_ingredient_overrides (
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (variant_id, ingredient_id)
);
CREATE TABLE promos (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 2,
  promo_price INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE orders (
  id TEXT PRIMARY KEY, customer_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  product_name TEXT NOT NULL, variant_label TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1, unit_price INTEGER NOT NULL DEFAULT 0,
  original_unit_price INTEGER,
  promo_id TEXT REFERENCES promos(id) ON DELETE SET NULL,
  promo_name TEXT
);
CREATE TABLE order_item_extras (
  id TEXT PRIMARY KEY,
  order_item_id TEXT REFERENCES order_items(id) ON DELETE CASCADE,
  extra_id TEXT REFERENCES extras(id),
  extra_name TEXT NOT NULL, qty INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0
);

-- INDICES
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_extras_item ON order_item_extras(order_item_id);

-- RLS
ALTER TABLE ingredients                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_ingredient_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_extras            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON ingredients                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON extras                       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON fixed_costs                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON products                     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON product_variants             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON product_ingredients          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON variant_ingredient_overrides FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON promos                       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON orders                       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON order_items                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON order_item_extras            FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_read" ON orders            FOR SELECT TO anon USING (true);
CREATE POLICY "public_read" ON order_items       FOR SELECT TO anon USING (true);
CREATE POLICY "public_read" ON order_item_extras FOR SELECT TO anon USING (true);
CREATE POLICY "public_read" ON promos            FOR SELECT TO anon USING (true);
CREATE POLICY "public_update_status" ON orders   FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- DATOS INICIALES
INSERT INTO ingredients VALUES
  ('i1','Pan',450),('i2','Queso Cheddar',124),('i3','Carne 120gr',1000),
  ('i4','Salsa DDB',100),('i5','Sal',10),('i6','Pimienta',50),
  ('i7','Mantequilla',50),('i8','Lechuga',200),('i9','Cebolla Morada',100),
  ('i10','Tomate',100),('i11','Cebolla Carameliz.',300),
  ('i12','Champiñones',600),('i13','Bacon Chips',450);

INSERT INTO extras VALUES
  ('e1','Bacon Chips',990),('e2','Queso Cheddar',590),('e3','Pepinillos',490),
  ('e4','Salsa BBQ',690),('e5','Bebida Lata 350cc',1490),
  ('e6','Jugo Lata Jumex',1490),('e7','Not Burger',1490);

INSERT INTO fixed_costs VALUES
  ('fc1','Arriendo',200000),('fc2','Luz',15000),('fc3','Agua',5000),
  ('fc4','Gas',96000),('fc5','Mantención Equipos',20000),
  ('fc6','Patente',4583),('fc7','Contador/Auditor',20000);

INSERT INTO products VALUES
  ('p1','DDB Cheese Burger',true),('p2','DDB Notorious Big',true),
  ('p3','DDB Candy Bacon',true),('p4','DDB Cuarto de Libra',true),
  ('p5','DDB Clásica',true),('p6','DDB Galáctica',true),
  ('p7','DDB Homenaje del Mes',true);

INSERT INTO product_variants VALUES
  ('p1_simple','p1','Simple',4500),('p1_doble','p1','Doble',6500),('p1_triple','p1','Triple',9000),
  ('p2_simple','p2','Simple',5000),('p2_doble','p2','Doble',7000),('p2_triple','p2','Triple',9500),
  ('p3_simple','p3','Simple',6000),('p3_doble','p3','Doble',8000),('p3_triple','p3','Triple',10500),
  ('p4_simple','p4','Simple',4800),('p4_doble','p4','Doble',6800),('p4_triple','p4','Triple',9300),
  ('p5_simple','p5','Simple',5500),('p5_doble','p5','Doble',7500),('p5_triple','p5','Triple',10000),
  ('p6_simple','p6','Simple',6500),('p6_doble','p6','Doble',8500),('p6_triple','p6','Triple',11000),
  ('p7_doble','p7','Doble',10500);

INSERT INTO product_ingredients VALUES
  ('p1','i1',1),('p1','i2',1),('p1','i3',1),('p1','i4',1),('p1','i5',1),('p1','i6',1),('p1','i7',1),
  ('p2','i1',1),('p2','i2',1),('p2','i3',1),('p2','i4',1),('p2','i5',1),('p2','i6',1),('p2','i7',1),('p2','i8',1),('p2','i9',1),
  ('p3','i1',1),('p3','i2',1),('p3','i3',1),('p3','i4',1),('p3','i5',1),('p3','i6',1),('p3','i7',1),('p3','i11',1),('p3','i13',1),
  ('p4','i1',1),('p4','i2',1),('p4','i3',1),('p4','i4',1),('p4','i5',1),('p4','i6',1),('p4','i7',1),('p4','i9',1),
  ('p5','i1',1),('p5','i2',1),('p5','i3',1),('p5','i4',1),('p5','i5',1),('p5','i6',1),('p5','i7',1),('p5','i8',1),('p5','i9',1),('p5','i10',1),
  ('p6','i1',1),('p6','i2',1),('p6','i3',1),('p6','i4',1),('p6','i5',1),('p6','i6',1),('p6','i7',1),('p6','i11',1),('p6','i12',1),
  ('p7','i1',1),('p7','i2',2),('p7','i3',2),('p7','i4',1),('p7','i5',1),('p7','i6',1),('p7','i7',1);

INSERT INTO variant_ingredient_overrides VALUES
  ('p1_simple','i3',1),('p1_doble','i3',2),('p1_triple','i3',3),
  ('p2_simple','i3',1),('p2_doble','i3',2),('p2_triple','i3',3),
  ('p3_simple','i3',1),('p3_doble','i3',2),('p3_triple','i3',3),
  ('p4_simple','i3',1),('p4_doble','i3',2),('p4_triple','i3',3),
  ('p5_simple','i3',1),('p5_doble','i3',2),('p5_triple','i3',3),
  ('p6_simple','i3',1),('p6_doble','i3',2),('p6_triple','i3',3);
