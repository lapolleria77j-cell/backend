import express from 'express';
import { body } from 'express-validator';
import { usuariosController } from '../controllers/index.js';
import { auth, requireRole } from '../middlewares/index.js';

const router = express.Router();

router.use(auth);

router.get('/', usuariosController.listar);
router.get('/:id', usuariosController.obtenerPorId);

router.post(
  '/',
  requireRole('admin'),
  [
    body('username').trim().notEmpty().withMessage('Usuario requerido').isLength({ max: 60 }),
    body('nombre_completo').trim().notEmpty().withMessage('Nombre completo requerido').isLength({ max: 120 }),
    body('password').notEmpty().withMessage('Contraseña requerida').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    body('rol').optional().isIn(['admin', 'empleado']),
  ],
  usuariosController.crear
);

router.put(
  '/:id',
  requireRole('admin'),
  [
    body('username').optional().trim().notEmpty().isLength({ max: 60 }),
    body('nombre_completo').optional().trim().notEmpty().isLength({ max: 120 }),
    body('rol').optional().isIn(['admin', 'empleado']),
    body('activo').optional(),
    body('password').optional().isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  ],
  usuariosController.actualizar
);

router.delete('/:id', requireRole('admin'), usuariosController.eliminar);

export default router;
