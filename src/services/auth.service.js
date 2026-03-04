import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import config from '../config/index.js';

const BCRYPT_ROUNDS = 12;

export async function findByUsername(username) {
  const [rows] = await query(
    'SELECT id, username, nombre_completo, password_hash, rol, activo, ultimo_login, creado_en FROM usuarios WHERE username = ? AND activo = 1',
    [username.trim().toLowerCase()]
  );
  return rows && rows[0] ? rows[0] : null;
}

export async function login(username, password) {
  const user = await findByUsername(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  await query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
  const { password_hash, ...safe } = user;
  const token = jwt.sign(
    { sub: user.id, username: user.username, rol: user.rol },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return { user: safe, token };
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

export async function getUserById(id) {
  const [rows] = await query(
    'SELECT id, username, nombre_completo, rol, activo, ultimo_login, creado_en FROM usuarios WHERE id = ? AND activo = 1',
    [id]
  );
  return rows && rows[0] ? rows[0] : null;
}

/**
 * Cambia la contraseña del usuario. Requiere la contraseña actual correcta.
 * @returns {Promise<boolean>} true si se cambió correctamente
 */
export async function changePassword(userId, currentPassword, newPassword) {
  const [rows] = await query(
    'SELECT id, password_hash FROM usuarios WHERE id = ? AND activo = 1',
    [userId]
  );
  const user = rows && rows[0] ? rows[0] : null;
  if (!user) return false;
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return false;
  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, userId]);
  return true;
}
