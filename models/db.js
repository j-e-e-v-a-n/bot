import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb+srv://user:ADhL0KH37CX52xV2@cluster0.cvupke0.mongodb.net');
let db = null;

export async function connectDB() {
  if (db) {
    console.log('⚠️ MongoDB already connected');
    return;
  }

  try {
    await client.connect();
    db = client.db('whatsappBot');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

export function isConnected() {
  return !!db;
}
