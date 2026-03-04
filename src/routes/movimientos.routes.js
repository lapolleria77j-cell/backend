import express from 'express';
import { body } from 'express-validator';
import { movimientosController } from '../controllers/index.js';
import { auth, requireRole } from '../middlewares/index.js';

const router = express.Router();

router.use(auth);

router.get('/estadisticas', movimientosController.estadisticas);
router.get('/', movimientosController.listarPorProducto);

router.post(
  '/',
  requireRole('admin'),
  [
    body('producto_id').isInt({ min: 1 }).withMessage('producto_id inválido'),
    body('tipo').isIn(['entrada', 'salida', 'ajuste']).withMessage('tipo inválido'),
    body('cantidad').isFloat({ min: 0 }).withMessage('cantidad inválida'),
    body('observacion').optional().trim().isLength({ max: 255 }),
  ],
  movimientosController.crear
);

export default router;
