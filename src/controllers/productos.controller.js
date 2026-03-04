import { validationResult } from 'express-validator';
import * as productosService from '../services/productos.service.js';

async function listar(req, res, next) {
  try {
    const data = await productosService.listar();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const err = new Error('ID inválido');
      err.statusCode = 400;
      return next(err);
    }
    const data = await productosService.obtenerPorId(id);
    if (!data) {
      const err = new Error('Producto no encontrado');
      err.statusCode = 404;
      return next(err);
    }
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
    const { nombre, descripcion, precio_venta, precio_costo, stock, unidad_medida } = req.body;
    const data = await productosService.crear({
      nombre,
      descripcion,
      precio_venta: Number(precio_venta),
      precio_costo: Number(precio_costo),
      stock: Number(stock) || 0,
      unidad_medida: unidad_medida || 'kg',
    });
    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const err = new Error('ID inválido');
      err.statusCode = 400;
      return next(err);
    }
    const { nombre, descripcion, precio_venta, precio_costo, unidad_medida, activo } = req.body;
    const payload = {};
    if (nombre !== undefined) payload.nombre = nombre;
    if (descripcion !== undefined) payload.descripcion = descripcion;
    if (precio_venta !== undefined) payload.precio_venta = Number(precio_venta);
    if (precio_costo !== undefined) payload.precio_costo = Number(precio_costo);
    if (unidad_medida !== undefined) payload.unidad_medida = unidad_medida;
    if (activo !== undefined) payload.activo = activo;
    const data = await productosService.actualizar(id, payload);
    if (!data) {
      const err = new Error('Producto no encontrado');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const err = new Error('ID inválido');
      err.statusCode = 400;
      return next(err);
    }
    const data = await productosService.eliminar(id);
    if (!data) {
      const err = new Error('Producto no encontrado');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

export default {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
