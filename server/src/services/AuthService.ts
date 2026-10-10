import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories';
import { Role } from '../models/User';
import { AppError } from '../utils/AppError';

// Constant dummy hash (cost factor 10) to prevent timing-based user enumeration
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export class AuthService {
  static async login(userId: string, password: string, role: Role) {
    const user = await userRepository.findByUserId(userId);

    // Constant-time security measure: perform dummy hash check if user does not exist
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive. Please contact an administrator.', 403);
    }

    // Role check happens strictly AFTER password verification
    if (user.role !== role) {
      throw new AppError(
        `Role mismatch: Account is registered as "${user.role}", not "${role}".`,
        403
      );
    }

    const token = jwt.sign(
      { userId: user.userId, role: user.role, accessLevel: user.accessLevel },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const now = new Date();
    await userRepository.updateLastLogin(user.userId, now);

    return {
      token,
      user: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        accessLevel: user.accessLevel,
        isActive: user.isActive,
        lastLogin: now,
      },
    };
  }
}
