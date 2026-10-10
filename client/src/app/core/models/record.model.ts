import { AccessLevel } from './user.model';

export interface RecordItem {
  _id: string;
  title: string;
  description: string;
  accessLevel: AccessLevel;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedRecordsResponse {
  success: boolean;
  records: RecordItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  userAccessLevel: AccessLevel;
}
