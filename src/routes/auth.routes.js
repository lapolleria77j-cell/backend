import express from 'express';
import { body } from 'express-validator';
import { login, me } from '../controllers/auth.controller.js';
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

export default router;
