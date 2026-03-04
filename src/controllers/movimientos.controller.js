import { validationResult } from 'express-validator';
import * as movimientosService from '../services/movimientos.service.js';
import * as productosService from '../services/productos.service.js';

function getDefaultDates() {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10),
  };
}

async function estadisticas(req, res, next) {
  try {
    const { desde: qDesde, hasta: qHasta } = req.query;
    const defaultDates = getDefaultDates();
    const desde = qDesde && /^\d{4}-\d{2}-\d{2}$/.test(qDesde) ? qDesde : defaultDates.desde;
    const hasta = qHasta && /^\d{4}-\d{2}-\d{2}$/.test(qHasta) ? qHasta : defaultDates.hasta;
    if (desde > hasta) {
      const err = new Error('La fecha desde debe ser anterior a hasta');
      err.statusCode = 400;
      return next(err);
    }
    const data = await movimientosService.estadisticas(desde, hasta);
    res.json({ ok: true, data: { ...data, desde, hasta } });
  } catch (err) {
    next(err);
  }
}

async function listarPorProducto(req, res, next) {
  try {
    const productoId = parseInt(req.query.producto_id, 10);
    if (Number.isNaN(productoId)) {
      const err = new Error('producto_id inválido');
      err.statusCode = 400;
      return next(err);
    }
    const producto = await productosService.obtenerPorId(productoId);
    if (!producto) {
      const err = new Error('Producto no encontrado');
      err.statusCode = 404;
      return next(err);
    }
    const data = await movimientosService.listarPorProducto(productoId);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const productoId = parseInt(req.body.producto_id, 10);
    if (Number.isNaN(productoId)) {
      const err = new Error('producto_id inválido');
      err.statusCode = 400;
      return next(err);
    }
    const producto = await productosService.obtenerPorId(productoId);
    if (!producto) {
      const err = new Error('Producto no encontrado');
      err.statusCode = 404;
      return next(err);
    }
    const { tipo, cantidad, observacion } = req.body;
    const data = await movimientosService.crear(
      productoId,
      { tipo, cantidad: Number(cantidad), observacion },
      req.userId
    );
    if (!data) return next(new Error('Error al crear movimiento'));
    const productoActualizado = await productosService.obtenerPorId(productoId);
    res.status(201).json({ ok: true, data: { movimiento: data, producto: productoActualizado } });
  } catch (err) {
    next(err);
  }
}

export default {
  estadisticas,
  listarPorProducto,
  crear,
};
