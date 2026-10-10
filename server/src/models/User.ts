import mongoose, { Document, Schema } from 'mongoose';

export enum Role {
  GeneralUser = 'General User',
  Admin = 'Admin',
}

export enum AccessLevel {
  Public = 'Public',
  Internal = 'Internal',
  Confidential = 'Confidential',
  Restricted = 'Restricted',
}

export const AccessLevelRank: Record<AccessLevel, number> = {
  [AccessLevel.Public]: 1,
  [AccessLevel.Internal]: 2,
  [AccessLevel.Confidential]: 3,
  [AccessLevel.Restricted]: 4,
};

export interface IUser {
  _id?: string;
  userId: string;
  passwordHash: string;
  name: string;
  role: Role;
  accessLevel: AccessLevel;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends Document, Omit<IUser, '_id'> {}

const UserSchema = new Schema<IUserDocument>(
  {
    userId: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    accessLevel: { type: String, enum: Object.values(AccessLevel), required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
