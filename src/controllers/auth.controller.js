import { validationResult } from 'express-validator';
import * as authService from '../services/auth.service.js';

export async function changePassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const { currentPassword, newPassword } = req.body;
    const ok = await authService.changePassword(req.userId, currentPassword, newPassword);
    if (!ok) {
      const err = new Error('Contraseña actual incorrecta');
      err.statusCode = 401;
      return next(err);
    }
    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Datos de login inválidos');
      err.statusCode = 400;
      err.errors = errors.array();
      return next(err);
    }
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    if (!result) {
      const err = new Error('Usuario o contraseña incorrectos');
      err.statusCode = 401;
      return next(err);
    }
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.userId);
    if (!user) {
      const err = new Error('Usuario no encontrado o inactivo');
      err.statusCode = 401;
      return next(err);
    }
    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}
