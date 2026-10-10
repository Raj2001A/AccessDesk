import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { recordRepository } from '../repositories';
import { Role } from '../models/User';

const recordQuerySchema = z.object({
  page: z.preprocess((val) => {
    if (val === undefined) return 1;
    const num = parseInt(String(val), 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }, z.number().int().min(1)).default(1),
  limit: z.preprocess((val) => {
    if (val === undefined) return 10;
    const num = parseInt(String(val), 10);
    if (isNaN(num) || num < 1) return 10;
    if (num > 100) return 100;
    return num;
  }, z.number().int().min(1).max(100)).default(10),
  sort: z.preprocess((val) => (val ? String(val) : 'createdAt:desc'), z.string()).default('createdAt:desc'),
  search: z.preprocess((val) => (typeof val === 'string' && val.trim() ? val.trim() : undefined), z.string().optional()),
  delay: z.preprocess((val) => (val !== undefined ? parseInt(String(val), 10) : undefined), z.number().optional()),
});

export const getRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    
    // Server-side access level filtering:
    // Admin receives all records regardless of level.
    // Non-admins only receive records up to their own accessLevel.
    const maxAccessLevel = user.role === Role.Admin ? undefined : user.accessLevel;

    const query = recordQuerySchema.parse(req.query);

    const result = await recordRepository.findPaginated({
      maxAccessLevel,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      search: query.search,
    });

    res.status(200).json({
      success: true,
      ...result,
      userAccessLevel: user.accessLevel,
    });
  } catch (error) {
    next(error);
  }
};
