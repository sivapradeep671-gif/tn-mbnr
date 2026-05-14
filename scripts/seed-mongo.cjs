/**
 * TN-MBNR MongoDB Pilot Seeder
 * Environment: Regional Admin Control Node
 */
const mongoose = require('mongoose');
const { Business, Ledger } = require('../server/mongodb_schema.cjs');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tn_mbnr';

const seedData = async () => {
    try {
        const safeUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
        console.log(`📡 Connecting to TN-MBNR MongoDB Cluster: ${safeUri}`);
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            retryWrites: true,
        });
        
        console.log('🧹 Clearing legacy node data...');
        await Business.deleteMany({});
        await Ledger.deleteMany({});

        console.log('🌱 Injecting verified Chennai pilot businesses...');
        const businesses = [
            {
                id: 'CHN-AN-001',
                legalName: 'Anna Nagar Grand Sweets Pvt Ltd',
                tradeName: 'Grand Sweets',
                type: 'PVT',
                category: 'Food & Beverage',
                address: '2nd Avenue, Anna Nagar, Chennai',
                contactNumber: '9123456780',
                email: 'contact@grandsweets.com',
                gstNumber: '33AAACG1234G1Z1',
                status: 'Verified',
                latitude: 13.0850,
                longitude: 80.2101,
                riskScore: 2,
                license_status: 'ACTIVE'
            },
            {
                id: 'CHN-TN-002',
                legalName: 'Saravana Stores Elite',
                tradeName: 'Saravana Stores',
                type: 'Sole Proprietorship',
                category: 'Retail',
                address: 'Usman Road, T.Nagar, Chennai',
                contactNumber: '9444123456',
                email: 'info@saravanastores.com',
                gstNumber: '33AAACS5678S1Z0',
                status: 'Verified',
                latitude: 13.0400,
                longitude: 80.2300,
                riskScore: 1,
                license_status: 'ACTIVE'
            }
        ];

        await Business.insertMany(businesses);
        console.log(`✅ Seeded ${businesses.length} high-integrity business records.`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Failure:', err);
        process.exit(1);
    }
};

seedData();
