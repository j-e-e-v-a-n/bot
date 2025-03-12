import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
let db = null;

export async function connectDB() {
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
