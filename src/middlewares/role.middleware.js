export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const rol = req.user?.rol;
    if (!rol || !allowedRoles.includes(rol)) {
      const err = new Error('No tienes permiso para esta acción');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}
