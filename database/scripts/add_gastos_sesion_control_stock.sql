-- Gastos por sesión de control de stock.
-- Ejecutar si ya tenés la base creada: mysql -u root -p la_polleria_77 < add_gastos_sesion_control_stock.sql

USE la_polleria_77;

CREATE TABLE IF NOT EXISTS sesiones_control_stock_gastos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sesion_id INT UNSIGNED NOT NULL,
  importe DECIMAL(10,2) NOT NULL,
  descripcion VARCHAR(255) NOT NULL DEFAULT '',
  usuario_id INT UNSIGNED NULL DEFAULT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_gastos_sesion (sesion_id),
  CONSTRAINT fk_gastos_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones_control_stock (id) ON DELETE CASCADE,
  CONSTRAINT fk_gastos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
