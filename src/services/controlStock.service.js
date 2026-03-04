import { query } from '../config/database.js';
import * as movimientosService from './movimientos.service.js';

/**
 * Obtiene la sesión actualmente abierta (solo puede haber una).
 */
export async function getSesionAbierta() {
  const [rows] = await query(
    `SELECT s.id, s.usuario_id, s.abierto_en, s.cerrado_en,
            u.nombre_completo AS usuario_nombre
     FROM sesiones_control_stock s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.cerrado_en IS NULL
     ORDER BY s.abierto_en DESC
     LIMIT 1`
  );
  if (!rows || rows.length === 0) return null;
  const sesion = rows[0];
  const [detalle] = await query(
    `SELECT d.id, d.producto_id, d.cantidad_inicial, d.cantidad_agregada, d.cantidad_final, d.cantidad_vendida,
            p.nombre AS producto_nombre, p.unidad_medida, p.precio_venta, p.precio_costo
     FROM sesiones_control_stock_detalle d
     INNER JOIN productos p ON p.id = d.producto_id
     WHERE d.sesion_id = ?
     ORDER BY p.nombre`,
    [sesion.id]
  );
  const [gastosRows] = await query(
    `SELECT g.id, g.importe, g.descripcion, g.creado_en, u.nombre_completo AS usuario_nombre
     FROM sesiones_control_stock_gastos g
     LEFT JOIN usuarios u ON u.id = g.usuario_id
     WHERE g.sesion_id = ?
     ORDER BY g.creado_en ASC`,
    [sesion.id]
  );
  const gastos = (gastosRows || []).map((r) => ({
    id: r.id,
    importe: Number(r.importe),
    descripcion: r.descripcion || '',
    creado_en: r.creado_en,
    usuario_nombre: r.usuario_nombre || null,
  }));
  const totalGastos = gastos.reduce((sum, g) => sum + g.importe, 0);

  return {
    ...sesion,
    detalle: (detalle || []).map((r) => ({
      id: r.id,
      producto_id: r.producto_id,
      producto_nombre: r.producto_nombre,
      unidad_medida: r.unidad_medida,
      precio_venta: Number(r.precio_venta),
      precio_costo: Number(r.precio_costo),
      cantidad_inicial: Number(r.cantidad_inicial),
      cantidad_agregada: Number(r.cantidad_agregada),
      cantidad_final: r.cantidad_final != null ? Number(r.cantidad_final) : null,
      cantidad_vendida: r.cantidad_vendida != null ? Number(r.cantidad_vendida) : null,
    })),
    gastos,
    total_gastos: totalGastos,
  };
}

/**
 * Obtiene el "final" del producto en la última sesión cerrada (para usar como "inicial" en la nueva).
 */
async function getInicialParaProducto(productoId) {
  const [rows] = await query(
    `SELECT d.cantidad_final
     FROM sesiones_control_stock_detalle d
     INNER JOIN sesiones_control_stock s ON s.id = d.sesion_id
     WHERE d.producto_id = ? AND s.cerrado_en IS NOT NULL
     ORDER BY s.cerrado_en DESC
     LIMIT 1`,
    [productoId]
  );
  if (!rows || rows.length === 0) return 0;
  return Number(rows[0].cantidad_final) || 0;
}

/**
 * Abre una nueva sesión. Falla si ya hay una abierta.
 */
export async function abrirSesion(usuarioId) {
  const abierta = await getSesionAbierta();
  if (abierta) {
    const err = new Error('Ya hay una sesión de control de stock abierta');
    err.statusCode = 409;
    throw err;
  }
  const [result] = await query(
    'INSERT INTO sesiones_control_stock (usuario_id) VALUES (?)',
    [usuarioId]
  );
  const id = result.insertId;

  // Pre-cargar detalle con TODOS los productos de la última sesión cerrada: inicial = final del día anterior
  // (5 kg, 0 kg, 0.9 kg, etc. — todo lo que quedó en el negocio aparece como inicial en la nueva sesión)
  const [prevSesiones] = await query(
    `SELECT id
     FROM sesiones_control_stock
     WHERE cerrado_en IS NOT NULL
     ORDER BY cerrado_en DESC
     LIMIT 1`
  );
  if (prevSesiones && prevSesiones.length > 0) {
    const prevId = prevSesiones[0].id;
    const [detallePrevio] = await query(
      `SELECT producto_id, cantidad_final
       FROM sesiones_control_stock_detalle
       WHERE sesion_id = ?`,
      [prevId]
    );
    if (detallePrevio && detallePrevio.length > 0) {
      const values = [];
      const params = [];
      for (const row of detallePrevio) {
        const inicial = row.cantidad_final != null ? Number(row.cantidad_final) : 0;
        values.push('(?, ?, ?, 0)');
        params.push(id, row.producto_id, inicial);
      }
      await query(
        `INSERT INTO sesiones_control_stock_detalle (sesion_id, producto_id, cantidad_inicial, cantidad_agregada)
         VALUES ${values.join(', ')}`,
        params
      );
    }
  }

  // Devolvemos la sesión completa con su detalle inicial
  return obtenerSesion(id);
}

/**
 * Agrega producto y cantidad a la sesión. Crea o actualiza el detalle.
 * Descuenta esa cantidad del inventario (depósito) registrando una salida.
 * El stock del depósito se reduce; el "final" de la sesión queda en el negocio y no vuelve al inventario.
 * usuarioIdRegistra: quien está haciendo el movimiento (para "Registrado por" en movimientos).
 */
export async function agregar(sesionId, productoId, cantidad, usuarioIdRegistra) {
  const qty = Number(cantidad);
  if (qty <= 0) {
    const err = new Error('La cantidad debe ser mayor a 0');
    err.statusCode = 400;
    throw err;
  }
  const [sesiones] = await query(
    'SELECT id FROM sesiones_control_stock WHERE id = ? AND cerrado_en IS NULL',
    [sesionId]
  );
  if (!sesiones || sesiones.length === 0) {
    const err = new Error('Sesión no encontrada o ya está cerrada');
    err.statusCode = 404;
    throw err;
  }

  // Verificar que el producto exista en el depósito (inventario)
  const [prodRows] = await query('SELECT id, stock FROM productos WHERE id = ?', [productoId]);
  if (!prodRows || prodRows.length === 0) {
    const err = new Error('Producto no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const [existe] = await query(
    'SELECT id, cantidad_inicial, cantidad_agregada FROM sesiones_control_stock_detalle WHERE sesion_id = ? AND producto_id = ?',
    [sesionId, productoId]
  );
  if (existe && existe.length > 0) {
    const row = existe[0];
    const nuevaAgregada = Number(row.cantidad_agregada) + qty;
    await query(
      'UPDATE sesiones_control_stock_detalle SET cantidad_agregada = ? WHERE id = ?',
      [nuevaAgregada, row.id]
    );
  } else {
    const inicial = await getInicialParaProducto(productoId);
    await query(
      `INSERT INTO sesiones_control_stock_detalle (sesion_id, producto_id, cantidad_inicial, cantidad_agregada)
       VALUES (?, ?, ?, ?)`,
      [sesionId, productoId, inicial, qty]
    );
  }

  // Descontar del inventario (depósito): registrar salida para que productos.stock baje
  const observacion = `Control de stock - sesión ${sesionId}`;
  const mov = await movimientosService.crear(productoId, { tipo: 'salida', cantidad: qty, observacion }, usuarioIdRegistra);
  if (!mov) {
    const err = new Error('Error al descontar del inventario');
    err.statusCode = 500;
    throw err;
  }

  const sesion = await getSesionAbierta();
  return sesion && sesion.id === sesionId ? sesion : null;
}

/**
 * Cierra la sesión registrando cantidad_final por producto. Calcula cantidad_vendida = inicial + agregado - final.
 * El "final" queda en el negocio (no se devuelve al inventario/depósito).
 */
export async function cerrarSesion(sesionId, items) {
  const [sesiones] = await query('SELECT id FROM sesiones_control_stock WHERE id = ? AND cerrado_en IS NULL', [sesionId]);
  if (!sesiones || sesiones.length === 0) {
    const err = new Error('Sesión no encontrada o ya está cerrada');
    err.statusCode = 404;
    throw err;
  }
  const mapFinal = new Map((items || []).map((i) => [Number(i.producto_id), Number(i.cantidad_final)]));
  const [detalle] = await query(
    'SELECT id, producto_id, cantidad_inicial, cantidad_agregada FROM sesiones_control_stock_detalle WHERE sesion_id = ?',
    [sesionId]
  );
  for (const d of detalle || []) {
    const finalQty = mapFinal.get(d.producto_id);
    const inicial = Number(d.cantidad_inicial);
    const agregada = Number(d.cantidad_agregada);
    const finalVal = finalQty != null && !Number.isNaN(finalQty) ? finalQty : inicial + agregada;
    const vendida = Math.max(0, inicial + agregada - finalVal);
    await query(
      'UPDATE sesiones_control_stock_detalle SET cantidad_final = ?, cantidad_vendida = ? WHERE id = ?',
      [finalVal, vendida, d.id]
    );
  }
  await query('UPDATE sesiones_control_stock SET cerrado_en = NOW() WHERE id = ?', [sesionId]);
  return obtenerSesion(sesionId);
}

/**
 * Lista todas las sesiones (para admin).
 */
export async function listarSesiones() {
  const [rows] = await query(
    `SELECT s.id, s.usuario_id, s.abierto_en, s.cerrado_en,
            u.nombre_completo AS usuario_nombre
     FROM sesiones_control_stock s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     ORDER BY s.abierto_en DESC`
  );
  return (rows || []).map((r) => ({
    id: r.id,
    usuario_id: r.usuario_id,
    usuario_nombre: r.usuario_nombre,
    abierto_en: r.abierto_en,
    cerrado_en: r.cerrado_en,
    cerrada: r.cerrado_en != null,
  }));
}

/**
 * Obtiene una sesión por id con su detalle completo (para admin).
 */
export async function obtenerSesion(sesionId) {
  const [sesiones] = await query(
    `SELECT s.id, s.usuario_id, s.abierto_en, s.cerrado_en,
            u.nombre_completo AS usuario_nombre
     FROM sesiones_control_stock s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.id = ?`,
    [sesionId]
  );
  if (!sesiones || sesiones.length === 0) return null;
  const sesion = sesiones[0];
  const [detalle] = await query(
    `SELECT d.id, d.producto_id, d.cantidad_inicial, d.cantidad_agregada, d.cantidad_final, d.cantidad_vendida,
            p.nombre AS producto_nombre, p.unidad_medida, p.precio_venta, p.precio_costo
     FROM sesiones_control_stock_detalle d
     INNER JOIN productos p ON p.id = d.producto_id
     WHERE d.sesion_id = ?
     ORDER BY p.nombre`,
    [sesionId]
  );
  const [totalGastosRow] = await query(
    'SELECT COALESCE(SUM(importe), 0) AS total FROM sesiones_control_stock_gastos WHERE sesion_id = ?',
    [sesionId]
  );
  const total_gastos = totalGastosRow?.[0] ? Number(totalGastosRow[0].total) : 0;

  return {
    ...sesion,
    detalle: (detalle || []).map((r) => ({
      id: r.id,
      producto_id: r.producto_id,
      producto_nombre: r.producto_nombre,
      unidad_medida: r.unidad_medida,
      precio_venta: Number(r.precio_venta),
      precio_costo: Number(r.precio_costo),
      cantidad_inicial: Number(r.cantidad_inicial),
      cantidad_agregada: Number(r.cantidad_agregada),
      cantidad_final: r.cantidad_final != null ? Number(r.cantidad_final) : null,
      cantidad_vendida: r.cantidad_vendida != null ? Number(r.cantidad_vendida) : null,
    })),
    total_gastos,
  };
}

/**
 * Registra un gasto en una sesión abierta.
 */
export async function crearGasto(sesionId, { importe, descripcion }, usuarioId) {
  const num = Number(importe);
  if (Number.isNaN(num) || num < 0) {
    const err = new Error('El importe debe ser un número mayor o igual a 0');
    err.statusCode = 400;
    throw err;
  }
  const [sesiones] = await query(
    'SELECT id FROM sesiones_control_stock WHERE id = ? AND cerrado_en IS NULL',
    [sesionId]
  );
  if (!sesiones || sesiones.length === 0) {
    const err = new Error('Sesión no encontrada o ya está cerrada');
    err.statusCode = 404;
    throw err;
  }
  const desc = String(descripcion || '').trim().slice(0, 255);
  await query(
    'INSERT INTO sesiones_control_stock_gastos (sesion_id, importe, descripcion, usuario_id) VALUES (?, ?, ?, ?)',
    [sesionId, num, desc || '', usuarioId || null]
  );
  return getSesionAbierta();
}

/**
 * Lista los gastos de una sesión (para admin o empleado).
 */
export async function getGastosSesion(sesionId) {
  const [rows] = await query(
    `SELECT g.id, g.importe, g.descripcion, g.creado_en, u.nombre_completo AS usuario_nombre
     FROM sesiones_control_stock_gastos g
     LEFT JOIN usuarios u ON u.id = g.usuario_id
     WHERE g.sesion_id = ?
     ORDER BY g.creado_en ASC`,
    [sesionId]
  );
  return (rows || []).map((r) => ({
    id: r.id,
    importe: Number(r.importe),
    descripcion: r.descripcion || '',
    creado_en: r.creado_en,
    usuario_nombre: r.usuario_nombre || null,
  }));
}

/**
 * Lista los movimientos de salida (agregados) de una sesión de control de stock.
 * Son los registros en movimientos_stock con observación "Control de stock - sesión {id}".
 */
export async function getMovimientosSesion(sesionId) {
  const observacion = `Control de stock - sesión ${sesionId}`;
  const [rows] = await query(
    `SELECT m.id, m.producto_id, m.cantidad, m.creado_en,
            p.nombre AS producto_nombre, p.unidad_medida,
            u.nombre_completo AS usuario_nombre
     FROM movimientos_stock m
     INNER JOIN productos p ON p.id = m.producto_id
     LEFT JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.observacion = ? AND m.tipo = 'salida'
     ORDER BY m.creado_en ASC`,
    [observacion]
  );
  return (rows || []).map((r) => ({
    id: r.id,
    producto_id: r.producto_id,
    producto_nombre: r.producto_nombre,
    unidad_medida: r.unidad_medida,
    cantidad: Number(r.cantidad),
    creado_en: r.creado_en,
    usuario_nombre: r.usuario_nombre || null,
  }));
}
