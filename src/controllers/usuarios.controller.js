import { validationResult } from 'express-validator';
import * as usuariosService from '../services/usuarios.service.js';

async function listar(req, res, next) {
  try {
    const data = await usuariosService.listar();
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
    const data = await usuariosService.obtenerPorId(id);
    if (!data) {
      const err = new Error('Usuario no encontrado');
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
    const { username, nombre_completo, password, rol } = req.body;
    const existe = await usuariosService.existeUsername(username);
    if (existe) {
      const err = new Error('El nombre de usuario ya está en uso');
      err.statusCode = 409;
      return next(err);
    }
    const data = await usuariosService.crear({
      username,
      nombre_completo,
      password,
      rol: rol || 'empleado',
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
    const { username, nombre_completo, rol, activo, password } = req.body;
    if (username !== undefined) {
      const existe = await usuariosService.existeUsername(username, id);
      if (existe) {
        const err = new Error('El nombre de usuario ya está en uso');
        err.statusCode = 409;
        return next(err);
      }
    }
    const payload = { nombre_completo, rol, activo, password };
    if (username !== undefined) payload.username = username;
    const data = await usuariosService.actualizar(id, payload);
    if (!data) {
      const err = new Error('Usuario no encontrado');
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
    const data = await usuariosService.eliminar(id);
    if (!data) {
      const err = new Error('Usuario no encontrado');
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
