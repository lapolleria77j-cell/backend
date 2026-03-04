import express from 'express';
import authRoutes from './auth.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import productosRoutes from './productos.routes.js';
import movimientosRoutes from './movimientos.routes.js';
import controlStockRoutes from './controlStock.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/productos', productosRoutes);
router.use('/movimientos', movimientosRoutes);
router.use('/control-stock', controlStockRoutes);

export default router;
