import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { delayMiddleware } from '../middleware/delay';

describe('Delay Middleware', () => {
  it('should immediately call next() when ?delay is not provided', async () => {
    const req = { query: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    const start = Date.now();
    await delayMiddleware(req, res, next);
    const elapsed = Date.now() - start;

    expect(next).toHaveBeenCalledTimes(1);
    expect(elapsed).toBeLessThan(50);
  });

  it('should immediately call next() when ?delay is non-numeric or 0', async () => {
    const req = { query: { delay: '0' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    const start = Date.now();
    await delayMiddleware(req, res, next);
    const elapsed = Date.now() - start;

    expect(next).toHaveBeenCalledTimes(1);
    expect(elapsed).toBeLessThan(50);
  });

  it('should wait for the specified milliseconds when a positive delay is requested', async () => {
    const req = { query: { delay: '100' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    const start = Date.now();
    await delayMiddleware(req, res, next);
    const elapsed = Date.now() - start;

    expect(next).toHaveBeenCalledTimes(1);
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});
