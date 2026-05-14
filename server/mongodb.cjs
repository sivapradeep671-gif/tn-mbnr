const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const config = require('./config/secrets.cjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tn_mbnr';

const connectDB = async () => {
    try {
        // Mask connection string for logging (hide password)
        const safeUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
        console.log(`📡 Attempting MongoDB connection: ${safeUri}`);

        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10s timeout for Atlas cold starts
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
        });

        console.log('✅ Connected to MongoDB Regional Node (TN-MBNR Cluster)');
        console.log(`   Database: ${mongoose.connection.db.databaseName}`);
        console.log(`   Host: ${mongoose.connection.host}`);
        return true;
    } catch (err) {
        console.warn('❌ MongoDB Cluster Unreachable. Using SQLite Fallback Node.');
        console.warn(`   Reason: ${err.message}`);
        return false;
    }
};

module.exports = connectDB;
