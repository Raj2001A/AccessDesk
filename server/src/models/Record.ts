import mongoose, { Document, Schema } from 'mongoose';
import { AccessLevel } from './User';

export interface IRecord {
  _id?: string;
  title: string;
  description: string;
  accessLevel: AccessLevel;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecordDocument extends Document, Omit<IRecord, '_id'> {}

const RecordSchema = new Schema<IRecordDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    accessLevel: { type: String, enum: Object.values(AccessLevel), required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const Record = mongoose.model<IRecordDocument>('Record', RecordSchema);
