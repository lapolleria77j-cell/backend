-- Ejecutar este script si ya tenés la base creada y solo querés agregar Control de stock.
-- Uso: mysql -u root -p la_polleria_77 < add_control_stock.sql

USE la_polleria_77;

DROP TABLE IF EXISTS sesiones_control_stock_detalle;
DROP TABLE IF EXISTS sesiones_control_stock;

CREATE TABLE sesiones_control_stock (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  abierto_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cerrado_en DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_sesiones_usuario (usuario_id),
  KEY idx_sesiones_cerrado (cerrado_en),
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sesiones_control_stock_detalle (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sesion_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_agregada DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_final DECIMAL(10,2) NULL DEFAULT NULL,
  cantidad_vendida DECIMAL(10,2) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_sesion_producto (sesion_id, producto_id),
  KEY idx_detalle_producto (producto_id),
  CONSTRAINT fk_detalle_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones_control_stock (id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
