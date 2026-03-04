import { query } from '../config/database.js';
import * as authService from './auth.service.js';

const FIELDS = 'id, username, nombre_completo, rol, activo, ultimo_login, creado_en';

export async function listar() {
  const [rows] = await query(`SELECT ${FIELDS} FROM usuarios ORDER BY id`);
  return rows;
}

export async function obtenerPorId(id) {
  const [rows] = await query(`SELECT ${FIELDS} FROM usuarios WHERE id = ?`, [id]);
  return rows && rows[0] ? rows[0] : null;
}

export async function existeUsername(username, excludeId = null) {
  const u = (username || '').trim().toLowerCase();
  if (!u) return false;
  let sql = 'SELECT id FROM usuarios WHERE LOWER(username) = ?';
  const params = [u];
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  const [rows] = await query(sql, params);
  return rows && rows.length > 0;
}

export async function crear({ username, nombre_completo, password, rol = 'empleado' }) {
  const u = (username || '').trim().toLowerCase();
  const hash = await authService.hashPassword(password);
  await query(
    `INSERT INTO usuarios (username, nombre_completo, password_hash, rol) VALUES (?, ?, ?, ?)`,
    [u, (nombre_completo || '').trim(), hash, rol]
  );
  const [rows] = await query('SELECT LAST_INSERT_ID() AS id');
  const id = rows[0].id;
  return obtenerPorId(id);
}

export async function actualizar(id, { username, nombre_completo, rol, activo, password }) {
  const current = await obtenerPorId(id);
  if (!current) return null;
  const updates = [];
  const params = [];
  if (username !== undefined) {
    updates.push('username = ?');
    params.push((username || '').trim().toLowerCase());
  }
  if (nombre_completo !== undefined) {
    updates.push('nombre_completo = ?');
    params.push((nombre_completo || '').trim());
  }
  if (rol !== undefined) {
    updates.push('rol = ?');
    params.push(rol);
  }
  if (activo !== undefined) {
    updates.push('activo = ?');
    params.push(activo ? 1 : 0);
  }
  if (password !== undefined && password !== '') {
    updates.push('password_hash = ?');
    params.push(await authService.hashPassword(password));
  }
  if (params.length === 0) return current;
  params.push(id);
  await query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);
  return obtenerPorId(id);
}

export async function eliminar(id) {
  const current = await obtenerPorId(id);
  if (!current) return null;
  await query('UPDATE usuarios SET activo = 0 WHERE id = ?', [id]);
  return { ...current, activo: 0 };
}
