import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login } from '../controllers/AuthController';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
});

router.post('/login', loginLimiter, login);

export default router;
