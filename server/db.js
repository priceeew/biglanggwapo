import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignored in non-supported environments
}

let cached = global._mongooseConn;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    // Already connecting, await the established connection
    await new Promise((resolve) => {
      const onConnected = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        mongoose.connection.off('connected', onConnected);
        mongoose.connection.off('error', onError);
      };
      mongoose.connection.once('connected', onConnected);
      mongoose.connection.once('error', onError);
    });
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });
    global._mongooseConn = conn;
    console.log('MongoDB Atlas connected successfully!');
    return conn;
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err.message);
    throw err;
  }
}
