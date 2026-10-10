import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/requireRole';
import { Role } from '../models/User';
import { AppError } from '../utils/AppError';

describe('requireRole Middleware', () => {
  it('should call next() without error when user has the required role', () => {
    const middleware = requireRole(Role.Admin);
    const req = {
      user: { userId: 'admin1', role: Role.Admin, accessLevel: 'Restricted' },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with 403 AppError when user role does not match', () => {
    const middleware = requireRole(Role.Admin);
    const req = {
      user: { userId: 'user1', role: Role.GeneralUser, accessLevel: 'Internal' },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toContain('Forbidden');
  });

  it('should call next with 401 AppError when req.user is missing', () => {
    const middleware = requireRole(Role.Admin);
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('Unauthorized');
  });
});
