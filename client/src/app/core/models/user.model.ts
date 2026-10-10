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

export interface User {
  _id?: string;
  userId: string;
  name: string;
  role: Role;
  accessLevel: AccessLevel;
  isActive: boolean;
  lastLogin?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  userId: string;
  password: string;
  role: Role;
}
