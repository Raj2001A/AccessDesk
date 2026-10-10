import { AccessLevel } from '../models/User';
import { IRecord } from '../models/Record';

export interface RecordQueryOptions {
  maxAccessLevel?: AccessLevel;
  page?: number;
  limit?: number;
  sort?: string; // e.g. "createdAt:desc" or "title:asc"
  search?: string;
}

export interface PaginatedRecords {
  records: IRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecordRepository {
  findPaginated(options: RecordQueryOptions): Promise<PaginatedRecords>;
  create(record: Omit<IRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<IRecord>;
  insertMany(records: Array<Omit<IRecord, '_id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  deleteAll(): Promise<void>;
}
