import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/User';
import { AppError } from '../utils/AppError';

export const requireRole = (...allowedRoles: (Role | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Unauthorized: Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required: [${allowedRoles.join(
            ', '
          )}]`,
          403
        )
      );
      return;
    }

    next();
  };
};
