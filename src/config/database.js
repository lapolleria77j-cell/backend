import mysql from 'mysql2/promise';

/**
 * Configuración de la base de datos.
 * En producción (Railway) usar DATABASE_URL.
 * En desarrollo usar variables sueltas (DB_HOST, DB_USER, etc.).
 */
function getDbConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      const database = url.pathname.replace(/^\//, '').replace(/\?.*$/, '');
      return {
        host: url.hostname,
        port: parseInt(url.port, 10) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: database || 'la_polleria_77',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        ssl: url.searchParams.get('ssl') === 'false' ? undefined : { rejectUnauthorized: false },
      };
    } catch (err) {
      console.error('[DB] Error al parsear DATABASE_URL:', err.message);
      throw err;
    }
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'la_polleria_77',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  };
}

const dbConfig = getDbConfig();

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function query(sql, params = []) {
  const p = await getPool();
  return p.execute(sql, params);
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

async function testConnection() {
  try {
    const p = await getPool();
    const [rows] = await p.execute('SELECT 1 AS ok');
    return rows && rows[0] && rows[0].ok === 1;
  } catch (err) {
    console.error('[DB] Error de conexión:', err.message);
    return false;
  }
}

export { getPool, query, closePool, testConnection, dbConfig };
