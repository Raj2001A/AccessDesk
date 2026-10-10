import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/AuthService';
import { userRepository } from '../repositories';
import { Role, AccessLevel } from '../models/User';
import { AppError } from '../utils/AppError';

describe('AuthService', () => {
  const mockPassword = 'correctPassword123';
  let passwordHash: string;

  beforeEach(async () => {
    passwordHash = await bcrypt.hash(mockPassword, 10);
    vi.restoreAllMocks();
  });

  it('should throw generic 401 when user does not exist', async () => {
    vi.spyOn(userRepository, 'findByUserId').mockResolvedValue(null);

    await expect(
      AuthService.login('unknownUser', 'anyPassword', Role.GeneralUser)
    ).rejects.toThrowError(AppError);

    try {
      await AuthService.login('unknownUser', 'anyPassword', Role.GeneralUser);
    } catch (err: any) {
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid credentials');
    }
  });

  it('should throw generic 401 when password does not match', async () => {
    vi.spyOn(userRepository, 'findByUserId').mockResolvedValue({
      userId: 'testUser',
      name: 'Test User',
      passwordHash,
      role: Role.GeneralUser,
      accessLevel: AccessLevel.Internal,
      isActive: true,
    } as any);

    try {
      await AuthService.login('testUser', 'wrongPassword', Role.GeneralUser);
      expect.unreachable();
    } catch (err: any) {
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid credentials');
    }
  });

  it('should throw 403 when role mismatches AFTER password is confirmed', async () => {
    vi.spyOn(userRepository, 'findByUserId').mockResolvedValue({
      userId: 'testUser',
      name: 'Test User',
      passwordHash,
      role: Role.GeneralUser,
      accessLevel: AccessLevel.Internal,
      isActive: true,
    } as any);

    try {
      // User is GeneralUser, but claims to be Admin
      await AuthService.login('testUser', mockPassword, Role.Admin);
      expect.unreachable();
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain('Role mismatch');
    }
  });

  it('should return JWT token and sanitized user without passwordHash on valid login', async () => {
    vi.spyOn(userRepository, 'findByUserId').mockResolvedValue({
      userId: 'adminUser',
      name: 'Admin User',
      passwordHash,
      role: Role.Admin,
      accessLevel: AccessLevel.Restricted,
      isActive: true,
    } as any);

    const updateLoginSpy = vi
      .spyOn(userRepository, 'updateLastLogin')
      .mockResolvedValue(undefined);

    const result = await AuthService.login('adminUser', mockPassword, Role.Admin);

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.user).toBeDefined();
    expect(result.user.userId).toBe('adminUser');
    expect(result.user.role).toBe(Role.Admin);
    expect((result.user as any).passwordHash).toBeUndefined();
    expect(updateLoginSpy).toHaveBeenCalledTimes(1);
  });
});
