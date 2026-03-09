import { query } from '../config/database.js';

const FIELDS = 'id, nombre, descripcion, precio_venta, precio_costo, stock, unidad_medida, activo, creado_en, actualizado_en';

function mapRow(row) {
  if (!row) return null;
  return {
    ...row,
    precio_venta: Number(row.precio_venta),
    precio_costo: Number(row.precio_costo),
    stock: Number(row.stock),
  };
}

export async function listar() {
  const [rows] = await query(`SELECT ${FIELDS} FROM productos ORDER BY nombre`);

  // Stock en negocio: usamos la última sesión de control de stock cerrada.
  const [prevSesiones] = await query(
    `SELECT id
     FROM sesiones_control_stock
     WHERE cerrado_en IS NOT NULL
     ORDER BY cerrado_en DESC
     LIMIT 1`
  );

  let stockNegocioPorProducto = new Map();
  if (prevSesiones && prevSesiones.length > 0) {
    const prevId = prevSesiones[0].id;
    const [detallePrevio] = await query(
      `SELECT producto_id, cantidad_final
       FROM sesiones_control_stock_detalle
       WHERE sesion_id = ?`,
      [prevId]
    );
    stockNegocioPorProducto = new Map(
      (detallePrevio || []).map((row) => [
        Number(row.producto_id),
        row.cantidad_final != null ? Number(row.cantidad_final) : 0,
      ])
    );
  }

  return rows.map((r) => {
    const base = mapRow(r);
    const deposito = base.stock;
    const negocio = stockNegocioPorProducto.get(base.id) ?? 0;
    const total = deposito + negocio;
    return {
      ...base,
      stock_deposito: deposito,
      stock_negocio: negocio,
      stock_total: total,
    };
  });
}

export async function obtenerPorId(id) {
  const [rows] = await query(`SELECT ${FIELDS} FROM productos WHERE id = ?`, [id]);
  return mapRow(rows && rows[0] ? rows[0] : null);
}

export async function crear({ nombre, descripcion, precio_venta, precio_costo, stock = 0, unidad_medida = 'kg' }) {
  await query(
    `INSERT INTO productos (nombre, descripcion, precio_venta, precio_costo, stock, unidad_medida) VALUES (?, ?, ?, ?, ?, ?)`,
    [(nombre || '').trim(), (descripcion || '').trim() || null, precio_venta, precio_costo, stock ?? 0, unidad_medida]
  );
  const [rows] = await query('SELECT LAST_INSERT_ID() AS id');
  return obtenerPorId(rows[0].id);
}

export async function actualizar(id, { nombre, descripcion, precio_venta, precio_costo, unidad_medida, activo }) {
  const current = await obtenerPorId(id);
  if (!current) return null;
  const updates = [];
  const params = [];
  if (nombre !== undefined) {
    updates.push('nombre = ?');
    params.push((nombre || '').trim());
  }
  if (descripcion !== undefined) {
    updates.push('descripcion = ?');
    params.push((descripcion || '').trim() || null);
  }
  if (precio_venta !== undefined) {
    updates.push('precio_venta = ?');
    params.push(precio_venta);
  }
  if (precio_costo !== undefined) {
    updates.push('precio_costo = ?');
    params.push(precio_costo);
  }
  if (unidad_medida !== undefined) {
    updates.push('unidad_medida = ?');
    params.push(unidad_medida);
  }
  if (activo !== undefined) {
    updates.push('activo = ?');
    params.push(activo ? 1 : 0);
  }
  if (params.length === 0) return current;
  params.push(id);
  await query(`UPDATE productos SET ${updates.join(', ')} WHERE id = ?`, params);
  return obtenerPorId(id);
}

export async function eliminar(id) {
  const current = await obtenerPorId(id);
  if (!current) return null;
  await query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
  return obtenerPorId(id);
}
