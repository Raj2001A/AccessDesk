import { Role, AccessLevel } from '../models/User';

export interface AuthUser {
  userId: string;
  role: Role;
  accessLevel: AccessLevel;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
