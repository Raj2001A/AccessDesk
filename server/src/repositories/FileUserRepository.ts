import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { IUser } from '../models/User';
import { UserRepository } from './UserRepository';

export class FileUserRepository implements UserRepository {
  private filePath: string;

  constructor() {
    const baseDir = existsSync(path.resolve(process.cwd(), 'server'))
      ? path.resolve(process.cwd(), 'server/data')
      : path.resolve(process.cwd(), 'data');
    this.filePath = path.join(baseDir, 'users.json');
  }

  private async ensureFile(): Promise<void> {
    const dir = path.dirname(this.filePath);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    if (!existsSync(this.filePath)) {
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private async readAll(): Promise<IUser[]> {
    await this.ensureFile();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      if (!data.trim()) return [];
      const parsed = JSON.parse(data);
      // Restore Date objects
      return parsed.map((u: IUser) => ({
        ...u,
        lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined,
        createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
      }));
    } catch {
      return [];
    }
  }

  private async writeAll(users: IUser[]): Promise<void> {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(users, null, 2), 'utf-8');
  }

  async findByUserId(userId: string): Promise<IUser | null> {
    const users = await this.readAll();
    const user = users.find((u) => u.userId === userId);
    return user || null;
  }

  async findAll(): Promise<IUser[]> {
    const users = await this.readAll();
    return [...users].reverse(); // latest first
  }

  async create(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const users = await this.readAll();
    const existing = users.find((u) => u.userId === userData.userId);
    if (existing) {
      throw new Error(`User ID ${userData.userId} already exists`);
    }

    const now = new Date();
    const newUser: IUser = {
      ...userData,
      _id: `file_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    await this.writeAll(users);
    return newUser;
  }

  async update(
    userId: string,
    data: Partial<Pick<IUser, 'name' | 'role' | 'accessLevel' | 'isActive' | 'passwordHash'>>
  ): Promise<IUser | null> {
    const users = await this.readAll();
    const index = users.findIndex((u) => u.userId === userId);
    if (index === -1) return null;

    const existing = users[index];
    if (!existing) return null;

    const updatedUser: IUser = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    users[index] = updatedUser;
    await this.writeAll(users);
    return updatedUser;
  }

  async updateLastLogin(userId: string, date: Date): Promise<void> {
    const users = await this.readAll();
    const user = users.find((u) => u.userId === userId);
    if (user) {
      user.lastLogin = date;
      user.updatedAt = new Date();
      await this.writeAll(users);
    }
  }

  async delete(userId: string): Promise<boolean> {
    const users = await this.readAll();
    const index = users.findIndex((u) => u.userId === userId);
    if (index === -1) return false;

    users.splice(index, 1);
    await this.writeAll(users);
    return true;
  }

  async insertMany(newUsers: Array<Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const users = await this.readAll();
    const now = new Date();
    for (const u of newUsers) {
      users.push({
        ...u,
        _id: `file_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      });
    }
    await this.writeAll(users);
  }

  async deleteAll(): Promise<void> {
    await this.writeAll([]);
  }
}
