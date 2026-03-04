import express from 'express';
import { body } from 'express-validator';
import { productosController } from '../controllers/index.js';
import { auth, requireRole } from '../middlewares/index.js';

const router = express.Router();

router.use(auth);

router.get('/', productosController.listar);
router.get('/:id', productosController.obtenerPorId);

router.post(
  '/',
  requireRole('admin'),
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 120 }),
    body('descripcion').optional().trim().isLength({ max: 2000 }),
    body('precio_venta').isFloat({ min: 0 }).withMessage('Precio de venta inválido'),
    body('precio_costo').isFloat({ min: 0 }).withMessage('Precio de costo inválido'),
    body('stock').optional().isFloat({ min: 0 }).withMessage('Stock inválido'),
    body('unidad_medida').optional().isIn(['unidad', 'kg']),
  ],
  productosController.crear
);

router.put(
  '/:id',
  requireRole('admin'),
  [
    body('nombre').optional().trim().notEmpty().isLength({ max: 120 }),
    body('descripcion').optional().trim().isLength({ max: 2000 }),
    body('precio_venta').optional().isFloat({ min: 0 }),
    body('precio_costo').optional().isFloat({ min: 0 }),
    body('unidad_medida').optional().isIn(['unidad', 'kg']),
    body('activo').optional(),
  ],
  productosController.actualizar
);

router.delete('/:id', requireRole('admin'), productosController.eliminar);

export default router;
