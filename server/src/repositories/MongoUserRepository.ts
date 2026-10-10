import { User, IUser } from '../models/User';
import { UserRepository } from './UserRepository';

export class MongoUserRepository implements UserRepository {
  async findByUserId(userId: string): Promise<IUser | null> {
    return User.findOne({ userId }).lean<IUser>().exec();
  }

  async findAll(): Promise<IUser[]> {
    return User.find().sort({ createdAt: -1 }).lean<IUser[]>().exec();
  }

  async create(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const created = await User.create(userData);
    return (created.toObject() as unknown) as IUser;
  }

  async update(
    userId: string,
    data: Partial<Pick<IUser, 'name' | 'role' | 'accessLevel' | 'isActive' | 'passwordHash'>>
  ): Promise<IUser | null> {
    const updated = await User.findOneAndUpdate({ userId }, { $set: data }, { new: true })
      .lean<IUser>()
      .exec();
    return updated;
  }

  async updateLastLogin(userId: string, date: Date): Promise<void> {
    await User.updateOne({ userId }, { $set: { lastLogin: date } }).exec();
  }

  async delete(userId: string): Promise<boolean> {
    const res = await User.deleteOne({ userId }).exec();
    return (res.deletedCount ?? 0) > 0;
  }

  async insertMany(users: Array<Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    await User.insertMany(users);
  }

  async deleteAll(): Promise<void> {
    await User.deleteMany({}).exec();
  }
}
