import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/accessdesk'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  STORAGE: z.enum(['mongo', 'file']).default('mongo'),
  CORS_ORIGIN: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
