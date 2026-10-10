import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Unauthorized: Missing or malformed authorization header', 401));
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    next(new AppError('Unauthorized: Missing token', 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new AppError('Unauthorized: Token has expired', 401));
      return;
    }
    next(new AppError('Unauthorized: Invalid token', 401));
  }
};
