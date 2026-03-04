import 'dotenv/config';
import app from './app.js';
import config from './config/index.js';

const { port, db } = config;

async function start() {
  const dbOk = await db.testConnection();
  if (!dbOk) {
    console.error('No se pudo conectar a la base de datos. Revisa .env y que MySQL esté corriendo.');
    process.exit(1);
  }
  console.log('Base de datos conectada.');

  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  app.listen(port, host, () => {
    console.log(`Servidor escuchando en http://${host}:${port}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('Entorno: producción');
    }
  });
}

start().catch((err) => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});
