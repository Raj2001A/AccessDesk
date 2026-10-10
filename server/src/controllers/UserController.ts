import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { userRepository } from '../repositories';
import { Role, AccessLevel, IUser } from '../models/User';
import { AppError } from '../utils/AppError';

// Helper to strip sensitive fields
export const sanitizeUser = (user: IUser) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

// GET /api/me - Retrieve currently authenticated user profile
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await userRepository.findByUserId(currentUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users - List all users (Admin only)
export const getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userRepository.findAll();
    res.status(200).json({
      success: true,
      users: users.map(sanitizeUser),
      total: users.length,
    });
  } catch (error) {
    next(error);
  }
};

// Validation schemas
const createUserSchema = z.object({
  userId: z
    .string()
    .min(3, 'User ID must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'User ID can only contain letters, numbers, hyphens, and underscores'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role),
  accessLevel: z.nativeEnum(AccessLevel),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
  accessLevel: z.nativeEnum(AccessLevel).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// POST /api/users - Create user (Admin only)
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new AppError(`Validation failed: ${messages}`, 400);
    }

    const { userId, name, password, role, accessLevel, isActive } = parseResult.data;

    const existing = await userRepository.findByUserId(userId);
    if (existing) {
      throw new AppError(`User with ID '${userId}' already exists`, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await userRepository.create({
      userId,
      name,
      role,
      accessLevel,
      isActive,
      passwordHash,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - Update user (Admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!id) {
      throw new AppError('User ID parameter is required', 400);
    }

    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new AppError(`Validation failed: ${messages}`, 400);
    }

    const existing = await userRepository.findByUserId(id);
    if (!existing) {
      throw new AppError(`User '${id}' not found`, 404);
    }

    // Safety check: Admin cannot demote themselves or deactivate themselves
    if (req.user?.userId === id) {
      if (parseResult.data.role !== undefined && parseResult.data.role !== Role.Admin) {
        throw new AppError('Forbidden: Administrators cannot demote their own account', 403);
      }
      if (parseResult.data.isActive === false) {
        throw new AppError('Forbidden: Administrators cannot deactivate their own account', 403);
      }
    }

    const updated = await userRepository.update(id, parseResult.data);
    if (!updated) {
      throw new AppError(`User '${id}' could not be updated`, 500);
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: sanitizeUser(updated),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id - Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!id) {
      throw new AppError('User ID parameter is required', 400);
    }

    // Safety check: Admin cannot delete themselves
    if (req.user?.userId === id) {
      throw new AppError('Forbidden: Administrators cannot delete their own account', 403);
    }

    const existing = await userRepository.findByUserId(id);
    if (!existing) {
      throw new AppError(`User '${id}' not found`, 404);
    }

    const deleted = await userRepository.delete(id);
    if (!deleted) {
      throw new AppError(`User '${id}' could not be deleted`, 500);
    }

    res.status(200).json({
      success: true,
      message: `User '${id}' has been deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/reset-password - Reset password (Admin only)
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!id) {
      throw new AppError('User ID parameter is required', 400);
    }

    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new AppError(`Validation failed: ${messages}`, 400);
    }

    const existing = await userRepository.findByUserId(id);
    if (!existing) {
      throw new AppError(`User '${id}' not found`, 404);
    }

    const passwordHash = await bcrypt.hash(parseResult.data.newPassword, 10);
    await userRepository.update(id, { passwordHash });

    res.status(200).json({
      success: true,
      message: `Password for user '${id}' has been reset successfully`,
    });
  } catch (error) {
    next(error);
  }
};
