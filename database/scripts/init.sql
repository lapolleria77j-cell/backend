CREATE DATABASE IF NOT EXISTS la_polleria_77
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE la_polleria_77;

DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(60) NOT NULL,
  nombre_completo VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'empleado') NOT NULL DEFAULT 'empleado',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_login DATETIME NULL DEFAULT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_username (username),
  KEY idx_usuarios_rol (rol),
  KEY idx_usuarios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS movimientos_stock;
DROP TABLE IF EXISTS productos;

CREATE TABLE productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT NULL DEFAULT NULL,
  precio_venta DECIMAL(10,2) NOT NULL,
  precio_costo DECIMAL(10,2) NOT NULL,
  stock DECIMAL(10,3) NOT NULL DEFAULT 0,
  unidad_medida ENUM('unidad', 'kg') NOT NULL DEFAULT 'kg',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_productos_activo (activo),
  KEY idx_productos_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimientos_stock (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
  cantidad DECIMAL(10,3) NOT NULL,
  cantidad_anterior DECIMAL(10,3) NOT NULL,
  cantidad_nueva DECIMAL(10,3) NOT NULL,
  observacion VARCHAR(255) NULL DEFAULT NULL,
  usuario_id INT UNSIGNED NULL DEFAULT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  anulado_en DATETIME NULL DEFAULT NULL,
  anulado_por INT UNSIGNED NULL DEFAULT NULL,
  motivo_anulacion VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_mov_producto (producto_id),
  KEY idx_mov_creado (creado_en),
  KEY idx_mov_anulado (anulado_en),
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_mov_anulado_por FOREIGN KEY (anulado_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Control de stock: sesiones abiertas/cerradas por la empleada (gastos primero por FK)
DROP TABLE IF EXISTS sesiones_control_stock_gastos;
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
  cantidad_inicial DECIMAL(10,3) NOT NULL DEFAULT 0,
  cantidad_agregada DECIMAL(10,3) NOT NULL DEFAULT 0,
  cantidad_final DECIMAL(10,3) NULL DEFAULT NULL,
  cantidad_vendida DECIMAL(10,3) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_sesion_producto (sesion_id, producto_id),
  KEY idx_detalle_producto (producto_id),
  CONSTRAINT fk_detalle_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones_control_stock (id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gastos registrados durante la sesión (empleado)
CREATE TABLE sesiones_control_stock_gastos (
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
