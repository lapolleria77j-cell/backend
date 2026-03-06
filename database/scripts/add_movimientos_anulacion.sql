-- Permite anular/corregir movimientos de control de stock (queda registrado en historial).
-- Ejecutar si ya tenés la base creada: mysql -u root -p la_polleria_77 < add_movimientos_anulacion.sql

USE la_polleria_77;

ALTER TABLE movimientos_stock
  ADD COLUMN anulado_en DATETIME NULL DEFAULT NULL AFTER creado_en,
  ADD COLUMN anulado_por INT UNSIGNED NULL DEFAULT NULL AFTER anulado_en,
  ADD COLUMN motivo_anulacion VARCHAR(255) NULL DEFAULT NULL AFTER anulado_por,
  ADD KEY idx_mov_anulado (anulado_en),
  ADD CONSTRAINT fk_mov_anulado_por FOREIGN KEY (anulado_por) REFERENCES usuarios (id) ON DELETE SET NULL;
