import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_CONNECTION_STRING || process.env.MONGODB_URI;

console.log('🔗 MONGO_CONNECTION_STRING:', process.env.MONGO_CONNECTION_STRING);
console.log('🔗 MONGODB_URI:', process.env.MONGODB_URI);
console.log('🔗 Using URI:', MONGODB_URI);
console.log('🔗 URI starts with mongodb+srv?', MONGODB_URI?.startsWith('mongodb+srv://'));
console.log('🔗 URI starts with mongodb?', MONGODB_URI?.startsWith('mongodb://'));

if (!MONGODB_URI) {
  throw new Error('Please define MONGO_CONNECTION_STRING or MONGODB_URI environment variable');
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
    console.log('🔌 Creating new MongoDB connection with URI:', MONGODB_URI);
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}