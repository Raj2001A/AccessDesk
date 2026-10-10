import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { Role, AccessLevel } from '../models/User';
import { userRepository, recordRepository } from '../repositories';

const seedDatabase = async () => {
  // Guard against running in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Error: Refusing to run seed script when NODE_ENV=production!');
    process.exit(1);
  }

  try {
    if (env.STORAGE === 'mongo') {
      await mongoose.connect(env.MONGODB_URI);
      console.log('Connected to MongoDB for seeding...');
    } else {
      console.log('Seeding local file storage at server/data/...');
    }

    // 1. Clear existing data
    await userRepository.deleteAll();
    await recordRepository.deleteAll();
    console.log('Cleared existing data.');

    // 2. Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
      { userId: 'admin1', name: 'Alice Admin', role: Role.Admin, accessLevel: AccessLevel.Restricted, isActive: true, passwordHash },
      { userId: 'admin2', name: 'Bob Admin', role: Role.Admin, accessLevel: AccessLevel.Restricted, isActive: true, passwordHash },
      { userId: 'user1', name: 'Charlie User', role: Role.GeneralUser, accessLevel: AccessLevel.Internal, isActive: true, passwordHash },
      { userId: 'user2', name: 'Dave User', role: Role.GeneralUser, accessLevel: AccessLevel.Internal, isActive: true, passwordHash },
      { userId: 'user3', name: 'Eve User', role: Role.GeneralUser, accessLevel: AccessLevel.Internal, isActive: true, passwordHash },
      { userId: 'user4', name: 'Frank User', role: Role.GeneralUser, accessLevel: AccessLevel.Internal, isActive: true, passwordHash },
    ];

    await userRepository.insertMany(users);
    console.log(`Seeded ${users.length} users successfully.`);

    // 3. Seed ~40 Records across access levels
    const accessLevels = Object.values(AccessLevel);
    const records = [];

    const topics = [
      { prefix: 'Security Audit', desc: 'Quarterly review of authentication and encryption standards.' },
      { prefix: 'Financial Report', desc: 'Summary of annual operating revenues, capital expenditures, and runway.' },
      { prefix: 'Team Roster', desc: 'Internal engineering team contact directory and on-call schedules.' },
      { prefix: 'Press Release', desc: 'Public marketing communication detailing upcoming platform release.' },
      { prefix: 'Infrastructure Plan', desc: 'Architectural blueprints for high availability multi-region deployment.' },
      { prefix: 'Employee Survey', desc: 'Aggregated internal feedback regarding workplace culture and tools.' },
      { prefix: 'API Specification', desc: 'OpenAPI documentation and client SDK integration guidelines.' },
      { prefix: 'Incident Post-Mortem', desc: 'Detailed forensic investigation of database downtime incident.' },
    ];

    for (let i = 1; i <= 40; i++) {
      const topic = topics[(i - 1) % topics.length];
      const level = accessLevels[(i - 1) % accessLevels.length];
      const creator = users[(i - 1) % users.length].userId;

      records.push({
        title: `${topic.prefix} #${i}`,
        description: `${topic.desc} Priority record index ${i} created for testing.`,
        accessLevel: level,
        createdBy: creator,
      });
    }

    await recordRepository.insertMany(records);
    console.log(`Seeded ${records.length} records successfully.`);

    console.log(`✅ Seeding complete using STORAGE=${env.STORAGE}!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    if (env.STORAGE === 'mongo') {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
};

seedDatabase();
