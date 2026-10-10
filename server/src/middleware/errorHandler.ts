import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.name || 'Error'}: ${err.message}`, err.stack ? `\n${err.stack}` : '');
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (err.message === 'Invalid credentials') {
    res.status(401).json({ message: 'Invalid credentials. Please verify your User ID and Password.' });
    return;
  }

  if (err.message && (err.message.includes('Role mismatch') || err.message.includes('Forbidden'))) {
    res.status(403).json({ message: err.message });
    return;
  }

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
};
