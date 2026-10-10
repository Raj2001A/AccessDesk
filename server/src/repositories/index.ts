import { env } from '../config/env';
import { UserRepository } from './UserRepository';
import { MongoUserRepository } from './MongoUserRepository';
import { FileUserRepository } from './FileUserRepository';
import { RecordRepository } from './RecordRepository';
import { MongoRecordRepository } from './MongoRecordRepository';
import { FileRecordRepository } from './FileRecordRepository';

export let userRepository: UserRepository;
export let recordRepository: RecordRepository;

if (env.STORAGE === 'mongo') {
  userRepository = new MongoUserRepository();
  recordRepository = new MongoRecordRepository();
} else {
  userRepository = new FileUserRepository();
  recordRepository = new FileRecordRepository();
}

export * from './UserRepository';
export * from './RecordRepository';
