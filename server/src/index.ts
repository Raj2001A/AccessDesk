import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

let isConnected = false;

const initDb = async () => {
  if (env.STORAGE === 'mongo' && !isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Initialize DB for serverless invocation
initDb().catch((err) => console.error('Database connection error:', err));

// When run standalone with node/tsx (not serverless)
if (process.env.VERCEL !== '1') {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

// Export default for Vercel Serverless Functions
export default app;
