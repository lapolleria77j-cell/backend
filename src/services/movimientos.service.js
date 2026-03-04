import { query } from '../config/database.js';

export async function listarPorProducto(productoId) {
  const [rows] = await query(
    `SELECT m.id, m.producto_id, m.tipo, m.cantidad, m.cantidad_anterior, m.cantidad_nueva, m.observacion, m.usuario_id, m.creado_en,
            u.nombre_completo AS usuario_nombre
     FROM movimientos_stock m
     LEFT JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.producto_id = ?
     ORDER BY m.creado_en DESC`,
    [productoId]
  );
  return rows.map((r) => ({
    ...r,
    cantidad: Number(r.cantidad),
    cantidad_anterior: Number(r.cantidad_anterior),
    cantidad_nueva: Number(r.cantidad_nueva),
  }));
}

export async function crear(productoId, { tipo, cantidad, observacion }, usuarioId = null) {
  const [prodRows] = await query('SELECT id, stock FROM productos WHERE id = ?', [productoId]);
  if (!prodRows || prodRows.length === 0) return null;
  const stockActual = Number(prodRows[0].stock);
  let cantidadNueva;
  let cantidadDelta = Number(cantidad);
  if (tipo === 'entrada') {
    cantidadNueva = stockActual + cantidadDelta;
  } else if (tipo === 'salida') {
    cantidadNueva = stockActual - cantidadDelta;
  } else {
    cantidadNueva = cantidadDelta;
  }
  await query(
    'UPDATE productos SET stock = ? WHERE id = ?',
    [cantidadNueva, productoId]
  );
  await query(
    `INSERT INTO movimientos_stock (producto_id, tipo, cantidad, cantidad_anterior, cantidad_nueva, observacion, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      productoId,
      tipo,
      tipo === 'ajuste' ? cantidadNueva : Math.abs(cantidadDelta),
      stockActual,
      cantidadNueva,
      (observacion || '').trim() || null,
      usuarioId || null,
    ]
  );
  const [rows] = await query('SELECT LAST_INSERT_ID() AS id');
  const [mov] = await query(
    `SELECT id, producto_id, tipo, cantidad, cantidad_anterior, cantidad_nueva, observacion, usuario_id, creado_en FROM movimientos_stock WHERE id = ?`,
    [rows[0].id]
  );
  return mov && mov[0] ? { ...mov[0], cantidad_nueva: cantidadNueva } : null;
}

/**
 * Estadísticas de movimientos en un rango de fechas.
 * @param {string} desde - YYYY-MM-DD
 * @param {string} hasta - YYYY-MM-DD
 */
export async function estadisticas(desde, hasta) {
  const [resumenTipo] = await query(
    `SELECT tipo, COUNT(*) AS total
     FROM movimientos_stock
     WHERE DATE(creado_en) >= ? AND DATE(creado_en) <= ?
     GROUP BY tipo`,
    [desde, hasta]
  );

  const [porDia] = await query(
    `SELECT DATE(creado_en) AS fecha,
       SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) AS entrada,
       SUM(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END) AS salida,
       SUM(CASE WHEN tipo = 'ajuste' THEN 1 ELSE 0 END) AS ajuste
     FROM movimientos_stock
     WHERE DATE(creado_en) >= ? AND DATE(creado_en) <= ?
     GROUP BY DATE(creado_en)
     ORDER BY fecha`,
    [desde, hasta]
  );

  const [topProductos] = await query(
    `SELECT p.id AS producto_id, p.nombre,
       COUNT(m.id) AS total_movimientos,
       SUM(CASE WHEN m.tipo = 'entrada' THEN 1 ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.tipo = 'salida' THEN 1 ELSE 0 END) AS salidas,
       SUM(CASE WHEN m.tipo = 'ajuste' THEN 1 ELSE 0 END) AS ajustes
     FROM movimientos_stock m
     INNER JOIN productos p ON p.id = m.producto_id
     WHERE DATE(m.creado_en) >= ? AND DATE(m.creado_en) <= ?
     GROUP BY m.producto_id
     ORDER BY total_movimientos DESC
     LIMIT 20`,
    [desde, hasta]
  );

  const porTipo = {
    entrada: 0,
    salida: 0,
    ajuste: 0,
  };
  let totalMovimientos = 0;
  (resumenTipo || []).forEach((r) => {
    porTipo[r.tipo] = Number(r.total);
    totalMovimientos += Number(r.total);
  });

  return {
    resumen: {
      totalMovimientos,
      entrada: porTipo.entrada,
      salida: porTipo.salida,
      ajuste: porTipo.ajuste,
    },
    porDia: (porDia || []).map((r) => ({
      fecha: r.fecha,
      entrada: Number(r.entrada),
      salida: Number(r.salida),
      ajuste: Number(r.ajuste),
      total: Number(r.entrada) + Number(r.salida) + Number(r.ajuste),
    })),
    topProductos: (topProductos || []).map((r) => ({
      producto_id: r.producto_id,
      nombre: r.nombre,
      total_movimientos: Number(r.total_movimientos),
      entradas: Number(r.entradas),
      salidas: Number(r.salidas),
      ajustes: Number(r.ajustes),
    })),
  };
}
