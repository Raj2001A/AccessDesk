import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { env } from '../config/env';
import { Role } from '../models/User';
import { AppError } from '../utils/AppError';

describe('authenticate Middleware', () => {
  it('should verify valid token and attach user to req', () => {
    const payload = { userId: 'admin1', role: Role.Admin, accessLevel: 'Restricted' };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('admin1');
    expect(req.user?.role).toBe(Role.Admin);
  });

  it('should reject requests without authorization header with 401', () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('Missing or malformed authorization header');
  });

  it('should reject invalid token signature with 401', () => {
    const token = jwt.sign({ userId: 'hacker' }, 'wrong_secret_key_12345678901234567890');
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('Invalid token');
  });

  it('should reject expired token with 401', () => {
    const token = jwt.sign({ userId: 'admin1' }, env.JWT_SECRET, { expiresIn: '-10s' });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('Token has expired');
  });
});
