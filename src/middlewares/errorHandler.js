function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    console.error('[Error]', err);
  }

  const body = { ok: false, error: message };
  if (err.errors) body.errors = err.errors;
  if (isDev && err.stack) body.stack = err.stack;
  res.status(status).json(body);
}

export default errorHandler;
