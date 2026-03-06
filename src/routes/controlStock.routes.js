import express from 'express';
import { body } from 'express-validator';
import { controlStockController } from '../controllers/index.js';
import { auth, requireRole } from '../middlewares/index.js';

const router = express.Router();

router.use(auth);

router.get('/sesion-actual', controlStockController.getSesionActualmenteAbierta);
router.post('/sesiones', controlStockController.abrirSesion);

router.post(
  '/sesiones/:id/agregar',
  [
    body('producto_id').isInt({ min: 1 }).withMessage('producto_id inválido'),
    body('cantidad').isFloat({ min: 0.01 }).withMessage('cantidad debe ser mayor a 0'),
  ],
  controlStockController.agregar
);

router.post(
  '/sesiones/:id/cerrar',
  [
    body('items').isArray().withMessage('items debe ser un array'),
    body('items.*.producto_id').isInt({ min: 1 }).withMessage('producto_id inválido en item'),
    body('items.*.cantidad_final').isFloat({ min: 0 }).withMessage('cantidad_final debe ser >= 0'),
  ],
  controlStockController.cerrar
);

router.post(
  '/sesiones/:id/gastos',
  [
    body('importe').isFloat({ min: 0 }).withMessage('importe debe ser >= 0'),
    body('descripcion').optional().trim().isLength({ max: 255 }),
  ],
  controlStockController.agregarGasto
);

router.get('/sesiones', requireRole('admin'), controlStockController.listarSesiones);
router.get('/sesiones/:id', requireRole('admin'), controlStockController.obtenerSesion);
router.get('/sesiones/:id/movimientos', requireRole('admin'), controlStockController.getMovimientosSesion);
router.post(
  '/sesiones/:id/movimientos/:movId/anular',
  [body('motivo').optional().trim().isLength({ max: 255 })],
  requireRole('admin'),
  controlStockController.anularMovimiento
);
router.patch(
  '/sesiones/:id/movimientos/:movId',
  [body('cantidad').isFloat({ min: 0.01 }).withMessage('cantidad debe ser mayor a 0')],
  requireRole('admin'),
  controlStockController.editarMovimiento
);
router.get('/sesiones/:id/gastos', requireRole('admin'), controlStockController.getGastosSesion);

export default router;
