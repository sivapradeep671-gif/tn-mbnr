const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const config = require('./config/secrets.cjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sivapradeep671_db_user:Zoe435@cluster0.ymxtv3a.mongodb.net/tn_mbnr?retryWrites=true&w=majority&appName=Cluster0';

let isMongoOnline = false;

mongoose.connection.on('connected', () => { isMongoOnline = true; });
mongoose.connection.on('error', () => { isMongoOnline = false; });
mongoose.connection.on('disconnected', () => { isMongoOnline = false; });

const connectDB = async () => {
    try {
        // Disable buffering globally so queries fail fast instead of hanging when offline
        mongoose.set('bufferCommands', false);

        // Mask connection string for logging (hide password)
        const safeUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
        console.log(`📡 Attempting MongoDB connection: ${safeUri}`);

        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 2000, // 2s timeout for fast offline detection
            socketTimeoutMS: 5000,
            maxPoolSize: 10,
            retryWrites: true,
        });

        isMongoOnline = true;
        console.log('✅ Connected to MongoDB Regional Node (TN-MBNR Cluster)');
        console.log(`   Database: ${mongoose.connection.db.databaseName}`);
        console.log(`   Host: ${mongoose.connection.host}`);
        return true;
    } catch (err) {
        isMongoOnline = false;
        console.warn('❌ MongoDB Cluster Unreachable. Using SQLite Fallback Node.');
        console.warn(`   Reason: ${err.message}`);
        return false;
    }
};

const isConnected = () => {
    return isMongoOnline && mongoose.connection.readyState === 1;
};

module.exports = {
    connectDB,
    isConnected
};
