import mongoose from 'mongoose';
import { env } from './env';

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false, // Prevents 10000ms buffering hang
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    const conn = await cachedPromise;
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    cachedPromise = null;
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
