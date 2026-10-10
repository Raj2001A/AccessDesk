import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import recordRoutes from './routes/recordRoutes';
import userRoutes from './routes/userRoutes';
import { authenticate } from './middleware/auth';
import { delayMiddleware } from './middleware/delay';
import { errorHandler } from './middleware/errorHandler';
import { getMe } from './controllers/UserController';

const app = express();

// Security headers and CORS
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);
app.use(express.json());

// Public Auth routes
app.use('/api/auth', authRoutes);

// Protected Data routes (with delayMiddleware enabled)
app.get('/api/me', delayMiddleware, authenticate, getMe);
app.use('/api/records', delayMiddleware, authenticate, recordRoutes);
app.use('/api/users', delayMiddleware, authenticate, userRoutes);

// Central error handler
app.use(errorHandler);

export default app;
