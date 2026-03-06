import { validationResult } from 'express-validator';
import * as controlStockService from '../services/controlStock.service.js';

async function getSesionActualmenteAbierta(req, res, next) {
  try {
    const sesion = await controlStockService.getSesionAbierta();
    if (!sesion) {
      return res.status(404).json({ ok: false, data: null, message: 'No hay sesión abierta' });
    }
    res.json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

async function abrirSesion(req, res, next) {
  try {
    const userId = req.userId;
    const sesion = await controlStockService.abrirSesion(userId);
    res.status(201).json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

async function agregar(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const sesionId = parseInt(req.params.id, 10);
    const productoId = parseInt(req.body.producto_id, 10);
    const cantidad = Number(req.body.cantidad);
    if (Number.isNaN(sesionId) || Number.isNaN(productoId)) {
      const err = new Error('ID de sesión o producto inválido');
      err.statusCode = 400;
      return next(err);
    }
    const sesion = await controlStockService.agregar(sesionId, productoId, cantidad, req.userId);
    res.json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

async function cerrar(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const sesionId = parseInt(req.params.id, 10);
    const items = req.body.items;
    if (Number.isNaN(sesionId)) {
      const err = new Error('ID de sesión inválido');
      err.statusCode = 400;
      return next(err);
    }
    const sesion = await controlStockService.cerrarSesion(sesionId, items);
    res.json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

async function listarSesiones(req, res, next) {
  try {
    const list = await controlStockService.listarSesiones();
    res.json({ ok: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function obtenerSesion(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const err = new Error('ID inválido');
      err.statusCode = 400;
      return next(err);
    }
    const sesion = await controlStockService.obtenerSesion(id);
    if (!sesion) {
      const err = new Error('Sesión no encontrada');
      err.statusCode = 404;
      return next(err);
    }
    res.json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

async function getMovimientosSesion(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const err = new Error('ID de sesión inválido');
      err.statusCode = 400;
      return next(err);
    }
    // Empleado solo puede ver movimientos de la sesión actual abierta
    if (req.user?.rol !== 'admin') {
      const sesionAbierta = await controlStockService.getSesionAbierta();
      if (!sesionAbierta || sesionAbierta.id !== id) {
        const err = new Error('Solo podés ver los movimientos de la sesión actual');
        err.statusCode = 403;
        return next(err);
      }
    }
    const list = await controlStockService.getMovimientosSesion(id);
    res.json({ ok: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function agregarGasto(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const sesionId = parseInt(req.params.id, 10);
    const importe = Number(req.body.importe);
    const descripcion = (req.body.descripcion || '').trim();
    if (Number.isNaN(sesionId)) {
      const err = new Error('ID de sesión inválido');
      err.statusCode = 400;
      return next(err);
    }
    const sesion = await controlStockService.crearGasto(sesionId, { importe, descripcion }, req.userId);
    res.status(201).json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

async function getGastosSesion(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const err = new Error('ID de sesión inválido');
      err.statusCode = 400;
      return next(err);
    }
    const list = await controlStockService.getGastosSesion(id);
    res.json({ ok: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function anularMovimiento(req, res, next) {
  try {
    const sesionId = parseInt(req.params.id, 10);
    const movimientoId = parseInt(req.params.movId, 10);
    const motivo = (req.body.motivo || '').trim();
    if (Number.isNaN(sesionId) || Number.isNaN(movimientoId)) {
      const err = new Error('ID de sesión o movimiento inválido');
      err.statusCode = 400;
      return next(err);
    }
    const esAdmin = req.user?.rol === 'admin';
    const sesion = await controlStockService.anularMovimiento(sesionId, movimientoId, motivo || null, req.userId, esAdmin);
    res.json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

async function editarMovimiento(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const sesionId = parseInt(req.params.id, 10);
    const movimientoId = parseInt(req.params.movId, 10);
    const cantidad = Number(req.body.cantidad);
    if (Number.isNaN(sesionId) || Number.isNaN(movimientoId)) {
      const err = new Error('ID de sesión o movimiento inválido');
      err.statusCode = 400;
      return next(err);
    }
    const esAdmin = req.user?.rol === 'admin';
    const sesion = await controlStockService.editarMovimiento(sesionId, movimientoId, cantidad, req.userId, esAdmin);
    res.json({ ok: true, data: sesion });
  } catch (err) {
    next(err);
  }
}

export default {
  getSesionActualmenteAbierta,
  abrirSesion,
  agregar,
  cerrar,
  listarSesiones,
  obtenerSesion,
  getMovimientosSesion,
  agregarGasto,
  getGastosSesion,
  anularMovimiento,
  editarMovimiento,
};
