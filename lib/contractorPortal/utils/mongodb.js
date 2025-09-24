/// this file:
/// Establishes and manages MongoDB connections for the contractor portal application

///Contains a hardcoded MongoDB URI as a temporary workaround for Vercel environment variable issues
import mongoose from 'mongoose';

// Temporarily hardcoded to bypass Vercel environment variable issues
const HARDCODED_URI = "mongodb://renovationuser:6VnImqttgA23X4dQ@ac-84khuci-shard-00-00.uamrmwz.mongodb.net:27017,ac-84khuci-shard-00-01.uamrmwz.mongodb.net:27017,ac-84khuci-shard-00-02.uamrmwz.mongodb.net:27017/?ssl=true&replicaSet=atlas-h4sak6-shard-0&authSource=admin&retryWrites=true&w=majority&appName=renovation-bridge";

const ENV_URI = process.env.MONGO_CONNECTION_STRING || process.env.MONGODB_URI;

console.log('🔗 Environment URI:', ENV_URI);
console.log('🔗 Hardcoded URI:', HARDCODED_URI);
console.log('🔗 Environment starts with mongodb+srv?', ENV_URI?.startsWith('mongodb+srv://'));
console.log('🔗 Hardcoded starts with mongodb?', HARDCODED_URI?.startsWith('mongodb://'));

// Use hardcoded for now to test if environment variables are the issue
const MONGODB_URI = HARDCODED_URI;

console.log('🔗 Actually using:', MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error('No MongoDB connection string available');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔌 Creating new MongoDB connection with hardcoded URI');
    console.log('🔌 URI format:', MONGODB_URI.startsWith('mongodb+srv://') ? 'SRV' : 'STANDARD');
    
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('✅ MongoDB connected successfully with hardcoded URI');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error with hardcoded URI:', error);
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}