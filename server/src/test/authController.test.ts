import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { login } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { Role, AccessLevel } from '../models/User';
import { AppError } from '../utils/AppError';

describe('AuthController - login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should call next with AppError 400 when body fails Zod schema validation', async () => {
    const req = {
      body: {
        userId: '', // missing/empty
        password: '',
      },
    } as Request;

    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const calledError = (next as any).mock.calls[0][0];
    expect(calledError).toBeInstanceOf(AppError);
    expect(calledError.statusCode).toBe(400);
    expect(calledError.message).toContain('Validation error');
  });

  it('should call next with AppError 400 when role is invalid', async () => {
    const req = {
      body: {
        userId: 'admin1',
        password: 'password123',
        role: 'SuperUser', // not in Role enum
      },
    } as Request;

    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    await login(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const calledError = (next as any).mock.calls[0][0];
    expect(calledError).toBeInstanceOf(AppError);
    expect(calledError.statusCode).toBe(400);
    expect(calledError.message).toContain('Invalid role');
  });

  it('should return 200 with token and user profile on successful authentication', async () => {
    const mockAuthResult = {
      token: 'jwt_mock_token_abc',
      user: {
        userId: 'admin1',
        name: 'Alice Admin',
        role: Role.Admin,
        accessLevel: AccessLevel.Restricted,
        isActive: true as const,
        lastLogin: new Date(),
      },
    };

    vi.spyOn(AuthService, 'login').mockResolvedValue(mockAuthResult);

    const req = {
      body: {
        userId: 'admin1',
        password: 'password123',
        role: Role.Admin,
      },
    } as Request;

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock, json: jsonMock } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await login(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockAuthResult);
    expect(next).not.toHaveBeenCalled();
  });
});
