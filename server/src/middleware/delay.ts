import { Request, Response, NextFunction } from 'express';

export const delayMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const delayQuery = req.query.delay;

  if (delayQuery !== undefined) {
    const parsed = parseInt(String(delayQuery), 10);
    if (!isNaN(parsed) && parsed > 0) {
      // Clamps to [0, 10000] ms
      const delayMs = Math.min(10000, Math.max(0, parsed));
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  next();
};
