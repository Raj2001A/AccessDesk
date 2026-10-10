import { IUser } from '../models/User';

export interface UserRepository {
  findByUserId(userId: string): Promise<IUser | null>;
  findAll(): Promise<IUser[]>;
  create(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser>;
  update(
    userId: string,
    data: Partial<Pick<IUser, 'name' | 'role' | 'accessLevel' | 'isActive' | 'passwordHash'>>
  ): Promise<IUser | null>;
  updateLastLogin(userId: string, date: Date): Promise<void>;
  delete(userId: string): Promise<boolean>;
  insertMany(users: Array<Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  deleteAll(): Promise<void>;
}
