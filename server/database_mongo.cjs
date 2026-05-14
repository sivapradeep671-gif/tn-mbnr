const connectDB = require('./mongodb.cjs');
const schemas = require('./mongodb_schema.cjs');

/**
 * TrustReg TN MongoDB Repository
 * Provides high-level business logic wrappers for the data layer.
 * Replaces the direct SQL execution pattern with an Object-Document Mapper (ODM).
 */
const repository = {
    // --- Business Logic ---
    getAllBusinesses: async () => {
        return await schemas.Business.find({}).lean();
    },

    getBusinessById: async (id) => {
        return await schemas.Business.findOne({ id }).lean();
    },

    createBusiness: async (data) => {
        const business = new schemas.Business(data);
        return await business.save();
    },

    updateBusiness: async (id, data) => {
        return await schemas.Business.findOneAndUpdate({ id }, data, { new: true });
    },

    // --- Blockchain Ledger ---
    getLedger: async () => {
        return await schemas.Ledger.find({}).sort({ index: 1 }).lean();
    },

    addBlockToLedger: async (block) => {
        // Auto-calculate index since Block objects don't carry one
        const count = await schemas.Ledger.countDocuments();
        const newBlock = new schemas.Ledger({
            index: block.index_id || block.index || count,
            timestamp: block.timestamp,
            data: block.data,
            previousHash: block.previousHash,
            hash: block.hash,
            nonce: block.nonce
        });
        return await newBlock.save();
    },

    // --- Citizens & Scans ---
    addScan: async (scanData) => {
        const scan = new schemas.Scan(scanData);
        return await scan.save();
    },

    addReport: async (reportData) => {
        const report = new schemas.Report(reportData);
        return await report.save();
    },

    getReports: async () => {
        return await schemas.Report.find({}).sort({ timestamp: -1 }).lean();
    }
};

module.exports = {
    connectDB,
    repository,
    models: schemas
};
