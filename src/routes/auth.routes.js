import express from 'express';
import { body } from 'express-validator';
import { login, me, changePassword } from '../controllers/auth.controller.js';
import { auth } from '../middlewares/index.js';

const router = express.Router();

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Usuario requerido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  login
);

router.get('/me', auth, me);

router.patch(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  ],
  changePassword
);

export default router;
