-- Ajusta precisión de cantidades a 3 decimales (kg con gramos).
-- Ejecutar si ya tenés la base creada:
-- mysql -u root -p la_polleria_77 < add_precision_cantidades_3_decimales.sql

USE la_polleria_77;

ALTER TABLE productos
  MODIFY COLUMN stock DECIMAL(10,3) NOT NULL DEFAULT 0;

ALTER TABLE movimientos_stock
  MODIFY COLUMN cantidad DECIMAL(10,3) NOT NULL,
  MODIFY COLUMN cantidad_anterior DECIMAL(10,3) NOT NULL,
  MODIFY COLUMN cantidad_nueva DECIMAL(10,3) NOT NULL;

ALTER TABLE sesiones_control_stock_detalle
  MODIFY COLUMN cantidad_inicial DECIMAL(10,3) NOT NULL DEFAULT 0,
  MODIFY COLUMN cantidad_agregada DECIMAL(10,3) NOT NULL DEFAULT 0,
  MODIFY COLUMN cantidad_final DECIMAL(10,3) NULL DEFAULT NULL,
  MODIFY COLUMN cantidad_vendida DECIMAL(10,3) NULL DEFAULT NULL;
