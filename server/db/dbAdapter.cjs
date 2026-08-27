const mongoose = require('mongoose');
const { db } = require('./database.cjs');
const mongoRepo = require('../database_mongo.cjs');
const { isConnected } = require('../mongodb.cjs');
const logger = require('../utils/logger.cjs');

const isMongoAvailable = () => {
    return isConnected();
};

const getDatabaseMode = () => {
    return isMongoAvailable() ? 'MongoDB (Primary)' : 'SQLite (Offline Resilient)';
};

const dbAdapter = {
    isMongoAvailable,
    getDatabaseMode,

    // --- Businesses ---
    getAllBusinesses: async () => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Business.find({}).lean();
            } catch (err) {
                logger.warn('MongoDB query failed, falling back to SQLite', { error: err.message });
            }
        }
        return await db('businesses').select('*');
    },

    getBusinessById: async (id) => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Business.findOne({ id }).lean();
            } catch (err) {
                logger.warn('MongoDB query failed, falling back to SQLite', { error: err.message });
            }
        }
        return await db('businesses').where({ id }).first();
    },

    findBusinessByPhone: async (phone) => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Business.findOne({ contactNumber: phone }).lean();
            } catch (err) {
                logger.warn('MongoDB query failed, falling back to SQLite', { error: err.message });
            }
        }
        return await db('businesses').where({ contactNumber: phone }).first();
    },

    findMatchingTradeName: async (tradeName) => {
        if (isMongoAvailable()) {
            try {
                const exact = await mongoRepo.models.Business.findOne({ tradeName, status: { $ne: 'Rejected' } }).lean();
                if (exact) return { exact };
                const regex = new RegExp(tradeName.substring(0, 3), 'i');
                const similar = await mongoRepo.models.Business.find({ tradeName: regex }).limit(5).lean();
                return { exact: null, similar };
            } catch (err) {
                logger.warn('MongoDB query failed, falling back to SQLite', { error: err.message });
            }
        }
        const exact = await db('businesses').where({ tradeName }).whereNot({ status: 'Rejected' }).first();
        if (exact) return { exact };
        const prefix = tradeName.substring(0, 3);
        const similar = await db('businesses').where('tradeName', 'like', `%${prefix}%`).limit(5);
        return { exact: null, similar };
    },

    createBusiness: async (data) => {
        if (isMongoAvailable()) {
            try {
                const newBiz = await mongoRepo.models.Business.create(data);
                return { id: data.id, mongo_id: newBiz._id };
            } catch (err) {
                logger.warn('MongoDB create failed, falling back to SQLite', { error: err.message });
            }
        }
        await db('businesses').insert(data);
        return { id: data.id, mongo_id: null };
    },

    updateBusinessStatus: async (id, status, currentStage) => {
        const updateData = { status };
        if (currentStage) updateData.current_stage = currentStage;

        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Business.findOneAndUpdate(
                    { id },
                    updateData,
                    { new: true }
                );
            } catch (err) {
                logger.warn('MongoDB update failed, falling back to SQLite', { error: err.message });
            }
        }
        await db('businesses').where({ id }).update(updateData);
        return await db('businesses').where({ id }).first();
    },

    // --- Reports ---
    getReports: async () => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Report.find({}).sort({ timestamp: -1 }).lean();
            } catch (err) {
                logger.warn('MongoDB reports fetch failed, falling back to SQLite', { error: err.message });
            }
        }
        return await db('reports').select('*').orderBy('timestamp', 'desc');
    },

    countReportsForBusiness: async (tradeName) => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Report.countDocuments({ business_name: tradeName });
            } catch (err) {
                logger.warn('MongoDB count reports failed, falling back to SQLite', { error: err.message });
            }
        }
        const res = await db('reports').where({ business_name: tradeName }).count('* as count').first();
        return res ? parseInt(res.count, 10) : 0;
    },

    createReport: async (data) => {
        const reportId = data.id || `REP-${Date.now()}`;
        const record = { ...data, id: reportId };

        if (isMongoAvailable()) {
            try {
                const report = await mongoRepo.models.Report.create(record);
                return { id: report._id, image_path: data.image_path };
            } catch (err) {
                logger.warn('MongoDB create report failed, falling back to SQLite', { error: err.message });
            }
        }
        await db('reports').insert(record);
        return { id: reportId, image_path: data.image_path };
    },

    // --- Ledger / Blockchain ---
    getLedger: async () => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Ledger.find({}).sort({ index: 1 }).lean();
            } catch (err) {
                logger.warn('MongoDB ledger fetch failed, falling back to SQLite', { error: err.message });
            }
        }
        const rows = await db('ledger').select('*').orderBy('index', 'asc');
        return rows.map(r => ({
            ...r,
            data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data
        }));
    },

    addBlockToLedger: async (block) => {
        if (isMongoAvailable()) {
            try {
                const count = await mongoRepo.models.Ledger.countDocuments();
                return await mongoRepo.models.Ledger.create({
                    index: block.index_id || block.index || count,
                    timestamp: block.timestamp,
                    data: block.data,
                    previousHash: block.previousHash,
                    hash: block.hash,
                    nonce: block.nonce
                });
            } catch (err) {
                logger.warn('MongoDB add block failed, falling back to SQLite', { error: err.message });
            }
        }
        const countRes = await db('ledger').count('* as count').first();
        const nextIndex = countRes ? parseInt(countRes.count, 10) : 0;
        await db('ledger').insert({
            index: block.index_id || block.index || nextIndex,
            timestamp: block.timestamp,
            data: typeof block.data === 'object' ? JSON.stringify(block.data) : block.data,
            previousHash: block.previousHash,
            hash: block.hash,
            nonce: block.nonce || 0
        });
    },

    // --- Scans ---
    addScan: async (scanData) => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Scan.create(scanData);
            } catch (err) {
                logger.warn('MongoDB add scan failed, falling back to SQLite', { error: err.message });
            }
        }
        return await db('scans').insert({
            business_id: scanData.business_id,
            token: scanData.token,
            scan_lat: scanData.scan_lat,
            scan_lng: scanData.scan_lng,
            result: scanData.result,
            distance: scanData.distance,
            scanned_at: new Date().toISOString()
        });
    },

    getScanStatsForBusiness: async (businessId) => {
        if (isMongoAvailable()) {
            try {
                const scanStatsAgg = await mongoRepo.models.Scan.aggregate([
                    { $match: { business_id: businessId } },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            failed: { $sum: { $cond: [{ $ne: ["$result", "VALID"] }, 1, 0] } }
                        }
                    }
                ]);
                return scanStatsAgg.length > 0 ? scanStatsAgg[0] : { total: 0, failed: 0 };
            } catch (err) {
                logger.warn('MongoDB scan stats failed, falling back to SQLite', { error: err.message });
            }
        }
        const totalRes = await db('scans').where({ business_id: businessId }).count('* as total').first();
        const failedRes = await db('scans').where({ business_id: businessId }).whereNot({ result: 'VALID' }).count('* as failed').first();
        return {
            total: totalRes ? parseInt(totalRes.total, 10) : 0,
            failed: failedRes ? parseInt(failedRes.failed, 10) : 0
        };
    },

    // --- Approvals ---
    getApprovalsForBusiness: async (registry_id) => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Approval.find({ registry_id }).sort({ acted_at: -1 }).lean();
            } catch (err) {
                logger.warn('MongoDB approvals fetch failed, falling back to SQLite', { error: err.message });
            }
        }
        return await db('approvals').where({ registry_id }).orderBy('acted_at', 'desc');
    },

    getPendingApprovals: async () => {
        if (isMongoAvailable()) {
            try {
                return await mongoRepo.models.Business.aggregate([
                    { $match: { status: { $nin: ['Verified', 'Rejected'] } } },
                    { $sort: { registrationDate: 1 } },
                    {
                        $lookup: {
                            from: "approvals",
                            localField: "id",
                            foreignField: "registry_id",
                            as: "approvals"
                        }
                    },
                    {
                        $addFields: {
                            latest_approval: { $arrayElemAt: [{ $slice: ["$approvals", -1] }, 0] }
                        }
                    },
                    {
                        $addFields: {
                            current_stage: "$latest_approval.stage",
                            last_status: "$latest_approval.status"
                        }
                    },
                    { $project: { approvals: 0, latest_approval: 0 } }
                ]);
            } catch (err) {
                logger.warn('MongoDB pending approvals failed, falling back to SQLite', { error: err.message });
            }
        }
        const pending = await db('businesses').whereNotIn('status', ['Verified', 'Rejected']).orderBy('registrationDate', 'asc');
        const results = [];
        for (const b of pending) {
            const lastApp = await db('approvals').where({ registry_id: b.id }).orderBy('acted_at', 'desc').first();
            results.push({
                ...b,
                current_stage: lastApp ? lastApp.stage : b.current_stage,
                last_status: lastApp ? lastApp.status : b.status
            });
        }
        return results;
    },

    createApprovalTransition: async (approvalData, bizStatus, nextStage, blockData) => {
        const approvalId = `APP-${Date.now()}`;
        const approvalRecord = {
            id: approvalId,
            registry_id: approvalData.registry_id,
            stage: approvalData.stage,
            status: approvalData.status,
            acted_by_user_id: approvalData.acted_by_user_id,
            acted_by_role: approvalData.acted_by_role,
            acted_at: new Date().toISOString(),
            comments: approvalData.comments,
            order_ref_no: approvalData.order_ref_no,
            valid_from: approvalData.valid_from,
            valid_to: approvalData.valid_to,
            attachment_url: approvalData.attachment_url
        };

        if (isMongoAvailable()) {
            const mongoose = require('mongoose');
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const app = await mongoRepo.models.Approval.create([approvalRecord], { session });
                await mongoRepo.models.Business.findOneAndUpdate(
                    { id: approvalData.registry_id },
                    { status: bizStatus, current_stage: nextStage },
                    { session }
                );
                const count = await mongoRepo.models.Ledger.countDocuments().session(session);
                await mongoRepo.models.Ledger.create([{
                    index: count,
                    timestamp: blockData.timestamp,
                    data: blockData.data,
                    previousHash: blockData.previousHash,
                    hash: blockData.hash,
                    nonce: blockData.nonce
                }], { session });
                await session.commitTransaction();
                return { approval_id: app[0]._id, business_status: bizStatus, next_stage: nextStage };
            } catch (err) {
                await session.abortTransaction();
                logger.warn('MongoDB transaction failed, falling back to SQLite', { error: err.message });
            } finally {
                session.endSession();
            }
        }

        // SQLite transaction fallback
        await db.transaction(async (trx) => {
            await trx('approvals').insert(approvalRecord);
            await trx('businesses').where({ id: approvalData.registry_id }).update({
                status: bizStatus,
                current_stage: nextStage
            });
            const countRes = await trx('ledger').count('* as count').first();
            const nextIndex = countRes ? parseInt(countRes.count, 10) : 0;
            await trx('ledger').insert({
                index: nextIndex,
                timestamp: blockData.timestamp,
                data: JSON.stringify(blockData.data),
                previousHash: blockData.previousHash,
                hash: blockData.hash,
                nonce: blockData.nonce || 0
            });
        });

        return { approval_id: approvalId, business_status: bizStatus, next_stage: nextStage };
    }
};

module.exports = dbAdapter;
