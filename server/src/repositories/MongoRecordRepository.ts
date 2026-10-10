import { Record, IRecord } from '../models/Record';
import { AccessLevel, AccessLevelRank } from '../models/User';
import { RecordRepository, RecordQueryOptions, PaginatedRecords } from './RecordRepository';

export class MongoRecordRepository implements RecordRepository {
  async findPaginated(options: RecordQueryOptions): Promise<PaginatedRecords> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (options.maxAccessLevel) {
      const maxRank = AccessLevelRank[options.maxAccessLevel];
      const allowedLevels = Object.values(AccessLevel).filter(
        (lvl) => AccessLevelRank[lvl] <= maxRank
      );
      filter.accessLevel = { $in: allowedLevels };
    }

    if (options.search && options.search.trim()) {
      const escapedSearch = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escapedSearch, $options: 'i' };
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (options.sort) {
      const [field, dir] = options.sort.split(':');
      if (field) {
        sortObj = { [field]: dir === 'asc' ? 1 : -1 };
      }
    }

    const [records, total] = await Promise.all([
      Record.find(filter).sort(sortObj).skip(skip).limit(limit).lean<IRecord[]>().exec(),
      Record.countDocuments(filter).exec(),
    ]);

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(recordData: Omit<IRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<IRecord> {
    const created = await Record.create(recordData);
    return (created.toObject() as unknown) as IRecord;
  }

  async insertMany(records: Array<Omit<IRecord, '_id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    await Record.insertMany(records);
  }

  async deleteAll(): Promise<void> {
    await Record.deleteMany({}).exec();
  }
}
