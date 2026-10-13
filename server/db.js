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
  if (cached && mongoose.connection.readyState === 1) {
    return cached;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  if (!cached) {
    cached = await mongoose.connect(uri);
    global._mongooseConn = cached;
    console.log('MongoDB Atlas connected successfully!');
  }

  return cached;
}
