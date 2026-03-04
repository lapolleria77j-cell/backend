import 'dotenv/config';
import bcrypt from 'bcrypt';
import { query } from '../../src/config/database.js';

const BCRYPT_ROUNDS = 12;

async function seed() {
  const hash = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
  await query(
    `INSERT INTO usuarios (username, nombre_completo, password_hash, rol) 
     VALUES (?, ?, ?, 'admin') 
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['admin', 'Administrador', hash]
  );
  console.log('Usuario admin creado. Usuario: admin, Contraseña: Admin123!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
