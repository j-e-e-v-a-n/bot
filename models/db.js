// models/db.js
const { MongoClient } = require('mongodb');

// Replace with your MongoDB URI
const uri = 'mongodb+srv://user:ADhL0KH37CX52xV2@cluster0.cvupke0.mongodb.net'; // Change this to your MongoDB connection string
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('whatsappBot'); // Use your database name
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return db;
}

module.exports = { connectDB, getDB };