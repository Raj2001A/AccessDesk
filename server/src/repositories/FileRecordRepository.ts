import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { IRecord } from '../models/Record';
import { AccessLevelRank } from '../models/User';
import { RecordRepository, RecordQueryOptions, PaginatedRecords } from './RecordRepository';

export class FileRecordRepository implements RecordRepository {
  private filePath: string;

  constructor() {
    const baseDir = existsSync(path.resolve(process.cwd(), 'server'))
      ? path.resolve(process.cwd(), 'server/data')
      : path.resolve(process.cwd(), 'data');
    this.filePath = path.join(baseDir, 'records.json');
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

  private async readAll(): Promise<IRecord[]> {
    await this.ensureFile();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      if (!data.trim()) return [];
      const parsed = JSON.parse(data);
      return parsed.map((r: IRecord) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      }));
    } catch {
      return [];
    }
  }

  private async writeAll(records: IRecord[]): Promise<void> {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(records, null, 2), 'utf-8');
  }

  async findPaginated(options: RecordQueryOptions): Promise<PaginatedRecords> {
    let records = await this.readAll();

    // 1. Filter by access level
    if (options.maxAccessLevel) {
      const maxRank = AccessLevelRank[options.maxAccessLevel];
      records = records.filter(
        (rec) => AccessLevelRank[rec.accessLevel] <= maxRank
      );
    }

    // 2. Filter by search query
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      records = records.filter(
        (rec) =>
          rec.title.toLowerCase().includes(q) ||
          rec.description.toLowerCase().includes(q)
      );
    }

    // 3. Sort
    let sortField = 'createdAt';
    let sortAsc = false;
    if (options.sort) {
      const [field, dir] = options.sort.split(':');
      if (field) sortField = field;
      sortAsc = dir === 'asc';
    }

    records.sort((a, b) => {
      const recA = a as unknown as Record<string, unknown>;
      const recB = b as unknown as Record<string, unknown>;
      const valA = recA[sortField];
      const valB = recB[sortField];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (valA < (valB as unknown as string | number)) return sortAsc ? -1 : 1;
      return sortAsc ? 1 : -1;
    });

    const total = records.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const paginated = records.slice(skip, skip + limit);

    return {
      records: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(recordData: Omit<IRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<IRecord> {
    const records = await this.readAll();
    const now = new Date();
    const newRecord: IRecord = {
      ...recordData,
      _id: `file_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    records.push(newRecord);
    await this.writeAll(records);
    return newRecord;
  }

  async insertMany(newRecords: Array<Omit<IRecord, '_id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const records = await this.readAll();
    const now = new Date();
    for (const r of newRecords) {
      records.push({
        ...r,
        _id: `file_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      });
    }
    await this.writeAll(records);
  }

  async deleteAll(): Promise<void> {
    await this.writeAll([]);
  }
}
