import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';
import { Role } from '../models/User';
import { AppError } from '../utils/AppError';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.nativeEnum(Role, { message: 'Invalid role. Must be either "General User" or "Admin"' }),
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.issues.map((issue) => issue.message).join(', ');
      throw new AppError(`Validation error: ${messages}`, 400);
    }

    const { userId, password, role } = parseResult.data;
    const result = await AuthService.login(userId, password, role);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
