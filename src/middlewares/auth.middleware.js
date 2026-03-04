import * as authService from '../services/auth.service.js';

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    const err = new Error('Token no proporcionado');
    err.statusCode = 401;
    return next(err);
  }
  const token = header.slice(7);
  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    req.userId = payload.sub;
    next();
  } catch (e) {
    const err = new Error('Token inválido o expirado');
    err.statusCode = 401;
    next(err);
  }
}
