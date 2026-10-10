import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

const startServer = async () => {
  if (env.STORAGE === 'mongo') {
    await connectDB();
  } else {
    console.log('Running with local file storage');
  }

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();
