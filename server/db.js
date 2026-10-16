import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.VERCEL && !process.env.AWS_REGION) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {
    // Ignored in non-supported environments
  }
}

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  if (!cached.promise) {
    const opts = {
      autoIndex: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 15000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 30000
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('MongoDB Atlas connection established (pool: 10, idleTimeout: 15s)');
      return m;
    }).catch((err) => {
      cached.promise = null;
      cached.conn = null;
      console.error('MongoDB Atlas connection failed:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }

  return cached.conn;
}

// Cleanup connection references when connection is lost
mongoose.connection.on('disconnected', () => {
  if (cached) {
    cached.conn = null;
    cached.promise = null;
  }
});

// Close connections cleanly on termination to prevent Atlas connection exhaustion
const closeConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('MongoDB Atlas connection cleanly closed on process termination.');
    }
  } catch {}
};

process.once('SIGINT', closeConnection);
process.once('SIGTERM', closeConnection);

