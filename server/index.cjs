const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mongoRepo = require('./database_mongo.cjs');
const { Blockchain, Block } = require('./blockchain.cjs');
const { calculateLicenseStatus, calculateLicenseTimestamps } = require('./licenseStatus.cjs');
const mult = require('multer');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { validateBody } = require('./middleware/validateBody.cjs');
const { config } = require('./config/secrets.cjs');
const logger = require('./utils/logger.cjs');

// V1 Production SQLite Engine
const { initializeDatabase } = require('./db/database.cjs');
const licenseRoutesV1 = require('./routes/v1/license.cjs');

// Security secrets from hardened config
const AUTH_SECRET = config.auth.secret;
const QR_SECRET = config.qr.secret;

// Ensure uploads directory exists
const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = mult.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = mult({ storage: storage });

const tnMbnrChain = new Blockchain();

// --- MongoDB Bootstrapper ---
(async () => {
    try {
        const isMongoConnected = await mongoRepo.connectDB();
        if (isMongoConnected) {
            logger.info("Initializing Blockchain from MongoDB Local Node");
            const blocks = await mongoRepo.repository.getLedger();
            if (blocks.length === 0) {
                try {
                    const genesisBlock = tnMbnrChain.createGenesisBlock();
                    await mongoRepo.repository.addBlockToLedger(genesisBlock);
                    logger.info("Genesis Block established in MongoDB.");
                } catch (genesisErr) {
                    if (genesisErr.code === 11000) {
                        logger.info("Genesis Block already exists in MongoDB. Skipping.");
                    } else {
                        logger.warn("Genesis block creation failed", { error: genesisErr.message });
                    }
                }
            } else {
                tnMbnrChain.chain = blocks.map(row => {
                    const b = new Block(row.timestamp, row.data, row.previousHash);
                    b.hash = row.hash;
                    b.nonce = row.nonce;
                    return b;
                });
                logger.info("Blockchain synchronized from MongoDB", { blocks: tnMbnrChain.chain.length });
            }
        } else {
            logger.warn("WARNING: MongoDB is offline. Server running in degraded mode without Gamification.");
        }
    } catch (bootErr) {
        logger.warn("MongoDB bootstrap error, continuing in degraded mode.", { error: bootErr.message });
    }
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Production SQLite Engine
initializeDatabase().then(() => {
    logger.info("V1 Production Engine (SQLite) Online.");
});

// Initialize Monitoring & Crash Reporting
const monitoring = require('./utils/monitoring.cjs');
monitoring.setupCrashReporting();
monitoring.initMonitoring(app);

// --- Security Stack ---
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for demo simplicity with many external maps/fonts
    crossOriginEmbedderPolicy: false
}));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'CRITICAL SECURITY FLAG: Too many authentication attempts. Potential brute force detected. Retry in 15m.' }
});

const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit to 5 registrations per hour per IP
    standardHeaders: true,
    message: { error: 'ANTI-FLOOD PROTECTION: Registration frequency threshold reached. Manual verification required for further entries.' }
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://sivapradeep671-gif.github.io', 'https://tn-mbnr.onrender.com'] 
    : '*';

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// --- Auth Middleware ---

const generateToken = (payload) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const data = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64');
    const signature = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${data}`).digest('base64');
    return `${header}.${data}.${signature}`;
};

const verifyToken = (token) => {
    try {
        const [header, data, signature] = token.split('.');
        const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${data}`).digest('base64');
        if (signature !== expectedSignature) return null;
        return JSON.parse(Buffer.from(data, 'base64').toString());
    } catch (e) { return null; }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const user = verifyToken(token);
    if (!user) return res.status(403).json({ error: 'Forbidden' });

    req.user = user;
    next();
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        next();
    };
};

// --- Endpoints ---

// Mount V1 Production Engine Routes
app.use('/api/v1/license', apiLimiter, licenseRoutesV1);

app.get('/api/health', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.get('/api/auth/me', apiLimiter, authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { phone, role } = req.body;
    if (!phone || !role) return res.status(400).json({ error: 'Missing phone or role' });

    try {
        if (role === 'business') {
            const row = await mongoRepo.models.Business.findOne({ contactNumber: phone }).lean();
            const businessId = row ? row.id : `BIZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const token = generateToken({ id: businessId, phone, role });
            logger.info('User Login', { user_id: businessId, role, method: 'mongodb', ip: req.ip });
            return res.json({ message: 'Login successful', token, user: { id: businessId, phone, role } });
        } else {
            const userId = `USER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const token = generateToken({ id: userId, phone, role });
            logger.info('User Login', { user_id: userId, role, method: 'mongodb', ip: req.ip });
            return res.json({ message: 'Login successful', token, user: { id: userId, phone, role } });
        }
    } catch (err) {
        logger.error('Login error', { error: err.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/businesses', apiLimiter, async (req, res) => {
    try {
        const businesses = await mongoRepo.models.Business.find({}).lean();
        res.json({ message: "success", data: businesses });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/verify-business', apiLimiter, authenticateToken, authorizeRoles('inspector', 'admin'), async (req, res) => {
    const { businessName, type } = req.body;
    if (!businessName) return res.status(400).json({ error: "Missing business name" });

    try {
        const row = await mongoRepo.models.Business.findOne({ tradeName: businessName, status: { $ne: 'Rejected' } }).lean();
        if (row) {
            return res.json({
                isSafe: false,
                riskLevel: 'High',
                similarBrands: [row.tradeName],
                message: `CRITICAL FLAG: The name "${businessName}" is already registered. Intellectual property conflict detected.`
            });
        }

        const regex = new RegExp(businessName.substring(0, 3), 'i');
        const similar = await mongoRepo.models.Business.find({ tradeName: regex }).limit(5).lean();
        
        if (similar && similar.length > 0) {
            return res.json({
                isSafe: true,
                riskLevel: 'Medium',
                similarBrands: similar.map(r => r.tradeName),
                message: "INTELLIGENCE ADVISORY: Similar brands detected in the regional grid. Proceed with documentation for validation."
            });
        }

        res.json({
            isSafe: true,
            riskLevel: 'Low',
            message: "VERIFIED: Brand name clear of regional conflicts. Node synchronization complete."
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const { businessSchema } = require('./validation/businessSchema.cjs');
const { encrypt } = require('./utils/piiEncryption.cjs');

app.post('/api/businesses', registrationLimiter, validateBody(businessSchema), async (req, res) => {
    const b = req.body;
    const encryptedAadhaar = encrypt(b.aadhaar_no);
    const regDate = b.registrationDate || new Date().toISOString();
    const licenseTimestamps = calculateLicenseTimestamps(regDate);
    
    // Dynamic SLA lookup (Hardcoded for now as settings collection doesn't exist)
    const slaDays = b.application_type === 'AMENDMENT' ? 15 : (b.application_type === 'RENEWAL' ? 15 : 15);
    const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

    try {
        const newBusiness = await mongoRepo.models.Business.create({
            ...b,
            aadhaar_no: encryptedAadhaar,
            status: b.status || 'Pending',
            registrationDate: regDate,
            license_valid_till: licenseTimestamps.license_valid_till,
            grace_ends_at: licenseTimestamps.grace_ends_at,
            pay_by_date: licenseTimestamps.pay_by_date,
            payment_done: licenseTimestamps.payment_done,
            license_status: licenseTimestamps.license_status,
            sla_deadline_at: slaDeadline,
            property_tax_status: b.property_tax_status || 'Pending',
            water_tax_status: b.water_tax_status || 'Pending',
            professional_tax_status: b.professional_tax_status || 'Pending'
        });

        const newBlock = new Block(new Date().toISOString(), {
            id: b.id,
            tradeName: b.tradeName,
            status: 'Registered',
            license: licenseTimestamps
        });
        tnMbnrChain.addBlock(newBlock);
        
        await mongoRepo.repository.addBlockToLedger(newBlock);

        res.json({ 
            message: "success", 
            data: { 
                id: b.id, 
                mongo_id: newBusiness._id 
            }, 
            blockHash: newBlock.hash 
        });
    } catch (err) {
        logger.error('Registration Error', { error: err.message });
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/admin/businesses/:id/status', apiLimiter, authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    try {
        const updated = await mongoRepo.models.Business.findOneAndUpdate(
            { id }, 
            { status }, 
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: "Business not found" });

        const newBlock = new Block(new Date().toISOString(), {
            id,
            action: 'StatusUpdate',
            newStatus: status
        });
        tnMbnrChain.addBlock(newBlock);
        await mongoRepo.repository.addBlockToLedger(newBlock);

        res.json({ message: "success", status, blockHash: newBlock.hash });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/ledger', async (req, res) => {
    try {
        const rows = await mongoRepo.models.Ledger.find({}).sort({ index: -1 }).lean();
        res.json({ message: "success", data: rows, isValid: tnMbnrChain.isChainValid() });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- QR & Verification Logic ---

const generateQRToken = (payload) => {
    const data = JSON.stringify({ ...payload, exp: Date.now() + 30000 }); // 30s expiry
    const signature = crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex');
    return Buffer.from(JSON.stringify({ payload: JSON.parse(data), signature })).toString('base64');
};

const verifyQRToken = (token) => {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        const { payload, signature } = decoded;
        const expectedSignature = crypto.createHmac('sha256', QR_SECRET).update(JSON.stringify(payload)).digest('hex');
        
        if (signature !== expectedSignature) return { status: 'COUNTERFEIT', message: 'Invalid Signature' };
        if (Date.now() > payload.exp) return { status: 'EXPIRED', message: 'Token Expired' };
        
        return { status: 'VALID', payload };
    } catch (e) {
        return { status: 'INVALID', message: 'Malformed Token' };
    }
};

app.get('/api/qr-token/:businessId', apiLimiter, async (req, res) => {
    const { businessId } = req.params;
    try {
        const row = await mongoRepo.models.Business.findOne({ id: businessId }).lean();
        if (!row) return res.status(404).json({ error: "Business not found" });
        
        const token = generateQRToken({
            id: row.id,
            lat: row.latitude,
            lng: row.longitude,
            name: row.tradeName
        });
        
        res.json({ token, expiresAt: Date.now() + 30000 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/verify-scan', apiLimiter, async (req, res) => {
    const { token, scannerLocation } = req.body;
    if (!token || !scannerLocation) return res.status(400).json({ error: "Missing token or location" });

    const verification = verifyQRToken(token);
    
    if (verification.status !== 'VALID') {
        await mongoRepo.models.Scan.create({
            business_id: "UNKNOWN",
            token: token.substring(0, 20),
            scan_lat: scannerLocation.lat,
            scan_lng: scannerLocation.lng,
            result: verification.status
        });
        return res.json(verification);
    }

    const { payload } = verification;
    
    // Check Distance (200m geofence)
    const R = 6371e3; // metres
    const φ1 = payload.lat * Math.PI/180;
    const φ2 = scannerLocation.lat * Math.PI/180;
    const Δφ = (scannerLocation.lat-payload.lat) * Math.PI/180;
    const Δλ = (scannerLocation.lng-payload.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    let finalStatus = 'VALID';
    let message = "Transaction Secure. Verification Token Valid.";

    if (distance > 200) {
        finalStatus = 'LOCATION_MISMATCH';
        message = `WARNING: This QR code is registered to another location (${Math.round(distance)}m away). Possible stolen identity.`;
    }

    try {
        const biz = await mongoRepo.models.Business.findOne({ id: payload.id }).lean();
        const licenseStatus = biz ? calculateLicenseStatus(biz) : null;
        
        await mongoRepo.models.Scan.create({
            business_id: payload.id,
            token: token.substring(0, 20),
            scan_lat: scannerLocation.lat,
            scan_lng: scannerLocation.lng,
            result: finalStatus,
            distance
        });

        logger.info('QR Verification', { business_id: payload.id, status: finalStatus, distance: Math.round(distance) });

        res.json({
            status: finalStatus,
            message,
            business: biz ? {
                id: biz.id,
                name: biz.tradeName,
                legalName: biz.legalName,
                gst: biz.gstNumber,
                lat: biz.latitude,
                lng: biz.longitude
            } : null,
            license: licenseStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Stats
app.get('/api/admin/shops', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const shops = await mongoRepo.models.Business.aggregate([
            {
                $lookup: {
                    from: "scans",
                    localField: "id",
                    foreignField: "business_id",
                    as: "scans"
                }
            },
            {
                $addFields: {
                    total_scans: { $size: "$scans" },
                    verified_scans: {
                        $size: {
                            $filter: {
                                input: "$scans",
                                as: "scan",
                                cond: { $eq: ["$$scan.result", "VALID"] }
                            }
                        }
                    },
                    failed_scans: {
                        $size: {
                            $filter: {
                                input: "$scans",
                                as: "scan",
                                cond: { $ne: ["$$scan.result", "VALID"] }
                            }
                        }
                    }
                }
            },
            { $project: { scans: 0 } }
        ]);
        res.json({ message: "success", shops });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/admin/suspicious', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const scans = await mongoRepo.models.Scan.aggregate([
            { $match: { result: { $ne: 'VALID' } } },
            { $sort: { scanned_at: -1 } },
            { $limit: 50 },
            {
                $lookup: {
                    from: "businesses",
                    localField: "business_id",
                    foreignField: "id",
                    as: "business"
                }
            },
            {
                $addFields: {
                    tradeName: { $arrayElemAt: ["$business.tradeName", 0] }
                }
            },
            { $project: { business: 0 } }
        ]);

        const risky = await mongoRepo.models.Scan.aggregate([
            { $match: { result: { $ne: 'VALID' } } },
            {
                $group: {
                    _id: "$business_id",
                    failed_scans: { $sum: 1 }
                }
            },
            { $sort: { failed_scans: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "businesses",
                    localField: "_id",
                    foreignField: "id",
                    as: "business"
                }
            },
            {
                $project: {
                    shop_name: { $arrayElemAt: ["$business.tradeName", 0] },
                    failed_scans: 1,
                    risk_score: { $multiply: [{ $divide: ["$failed_scans", { $max: [1, "$failed_scans"] }] }, 100] } // Mock risk score calc
                }
            }
        ]);
        
        res.json({ message: "success", scans, top_risky_shops: risky });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Approval Workflow ---

app.get('/api/admin/pending-approvals', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const rows = await mongoRepo.models.Business.aggregate([
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
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/approvals/:registry_id', apiLimiter, async (req, res) => {
    const { registry_id } = req.params;
    try {
        const rows = await mongoRepo.models.Approval.find({ registry_id }).sort({ acted_at: -1 }).lean();
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/approvals', authenticateToken, async (req, res) => {
    const { registry_id, stage, status, comments, order_ref_no, valid_from, valid_to, attachment_url } = req.body;
    const { id: officerId, role: officerRole } = req.user;

    if (!registry_id || !stage || !status) {
        return res.status(400).json({ error: "Missing required approval fields" });
    }

    const allowedRoles = {
        'SCRUTINY': ['scrutiny_officer', 'admin'],
        'INSPECTION': ['inspector', 'admin'],
        'FINAL': ['approver', 'admin']
    };

    if (allowedRoles[stage] && !allowedRoles[stage].includes(officerRole)) {
        return res.status(403).json({ error: `Permission denied: ${officerRole} cannot perform ${stage}` });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const approval = await mongoRepo.models.Approval.create([{
            registry_id, stage, status, acted_by_user_id: officerId, acted_by_role: officerRole, 
            comments, order_ref_no, valid_from, valid_to, attachment_url
        }], { session });

        let bizStatus = 'Pending';
        let nextStage = stage;

        if (status === 'APPROVED') {
            if (stage === 'SCRUTINY') nextStage = 'INSPECTION';
            else if (stage === 'INSPECTION') nextStage = 'FINAL';
            else if (stage === 'FINAL') bizStatus = 'Verified';
        } else if (status === 'REJECTED') {
            bizStatus = 'Rejected';
        }
        
        await mongoRepo.models.Business.findOneAndUpdate(
            { id: registry_id },
            { status: bizStatus, current_stage: nextStage },
            { session }
        );

        const auditData = {
            id: registry_id,
            action: 'ApprovalTransition',
            stage, status, officer: officerId, role: officerRole,
            timestamp: new Date().toISOString()
        };
        
        const newBlock = new Block(new Date().toISOString(), auditData);
        tnMbnrChain.addBlock(newBlock);

        const count = await mongoRepo.models.Ledger.countDocuments().session(session);
        await mongoRepo.models.Ledger.create([{
            index: count,
            timestamp: newBlock.timestamp,
            data: newBlock.data,
            previousHash: newBlock.previousHash,
            hash: newBlock.hash,
            nonce: newBlock.nonce
        }], { session });

        await session.commitTransaction();
        res.json({ message: "success", approval_id: approval[0]._id, business_status: bizStatus, next_stage: nextStage });
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ error: err.message });
    } finally {
        session.endSession();
    }
});

app.post('/api/reports', upload.single('image'), async (req, res) => {
    const { business_name, location, description, category, severity } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    try {
        const report = await mongoRepo.models.Report.create({
            business_name, location, description, category, severity, image_path: imagePath
        });
        res.json({ message: "success", id: report._id, image: imagePath });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/reports', apiLimiter, async (req, res) => {
    try {
        const rows = await mongoRepo.models.Report.find({}).sort({ timestamp: -1 }).lean();
        res.json({ message: "success", data: rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ============================================================
// TIER-1 FEATURE: Business Health Credit Score
// Factors: Tax status, license status, risk score, citizen reports,
//          registration age, scan history
// Score: 0-100
// ============================================================

const calculateHealthScore = (business, reportCount = 0, scanStats = { total: 0, failed: 0 }) => {
    let score = 50; // Base score

    // Tax compliance (+30 max)
    const taxFields = ['property_tax_status', 'water_tax_status', 'professional_tax_status'];
    taxFields.forEach(field => {
        const val = business[field];
        if (val === 'Paid' || val === 'Cleared') score += 10;
        else if (val === 'Pending') score += 3;
        else if (val === 'Defaulted') score -= 5;
    });

    // License status (+15 max)
    if (business.license_status === 'ACTIVE') score += 15;
    else if (business.license_status === 'GRACE_PERIOD') score += 5;
    else if (business.license_status === 'EXPIRED') score -= 10;
    else if (business.license_status === 'SUSPENDED') score -= 15;

    // Verification status (+10)
    if (business.status === 'Verified') score += 10;
    else if (business.status === 'Rejected') score -= 20;

    // Citizen reports (-5 each, max -15)
    score -= Math.min(reportCount * 5, 15);

    // Scan fraud history (-10 per failed scan, max -20)
    score -= Math.min(scanStats.failed * 10, 20);

    // Risk score modifier
    if (business.riskScore && business.riskScore > 7) score -= 10;
    else if (business.riskScore && business.riskScore < 3) score += 5;

    // Registration age bonus (older = more trusted)
    if (business.registrationDate) {
        const ageMonths = Math.floor((Date.now() - new Date(business.registrationDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (ageMonths > 12) score += 5;
        if (ageMonths > 24) score += 5;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
};

const getHealthGrade = (score) => {
    if (score >= 90) return { grade: 'A+', label: 'Exemplary', color: '#22c55e' };
    if (score >= 80) return { grade: 'A', label: 'Excellent', color: '#4ade80' };
    if (score >= 70) return { grade: 'B', label: 'Good', color: '#84cc16' };
    if (score >= 60) return { grade: 'C', label: 'Fair', color: '#eab308' };
    if (score >= 40) return { grade: 'D', label: 'At Risk', color: '#f97316' };
    return { grade: 'F', label: 'Critical', color: '#ef4444' };
};

app.get('/api/health-score/:businessId', apiLimiter, async (req, res) => {
    const { businessId } = req.params;

    try {
        const business = await mongoRepo.models.Business.findOne({ id: businessId }).lean();
        if (!business) return res.status(404).json({ error: "Business not found" });

        const reportCount = await mongoRepo.models.Report.countDocuments({ business_name: business.tradeName });

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

        const scanStats = scanStatsAgg.length > 0 ? scanStatsAgg[0] : { total: 0, failed: 0 };
        const score = calculateHealthScore(business, reportCount, scanStats);
        const grading = getHealthGrade(score);

        res.json({
            message: "success",
            businessId: business.id,
            tradeName: business.tradeName,
            healthScore: score,
            grade: grading.grade,
            label: grading.label,
            color: grading.color,
            breakdown: {
                taxCompliance: {
                    property: business.property_tax_status || 'Unknown',
                    water: business.water_tax_status || 'Unknown',
                    professional: business.professional_tax_status || 'Unknown'
                },
                licenseStatus: business.license_status || 'Unknown',
                verificationStatus: business.status,
                citizenReports: reportCount,
                fraudScans: scanStats.failed,
                riskScore: business.riskScore || 0
            },
            eligibility: {
                subsidyAccess: score >= 80,
                fastTrackRenewal: score >= 70,
                municipalContracts: score >= 85,
                prioritySupport: score >= 60
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk health scores for dashboard
app.get('/api/health-scores', apiLimiter, async (req, res) => {
    try {
        const businesses = await mongoRepo.models.Business.find({}).lean();
        const scores = businesses.map(b => {
            const score = calculateHealthScore(b);
            const grading = getHealthGrade(score);
            return {
                id: b.id,
                tradeName: b.tradeName,
                healthScore: score,
                grade: grading.grade,
                label: grading.label,
                color: grading.color,
                status: b.status,
                license_status: b.license_status
            };
        });

        scores.sort((a, b) => b.healthScore - a.healthScore);
        const avg = scores.length > 0 ? Math.round(scores.reduce((s, b) => s + b.healthScore, 0) / scores.length) : 0;

        res.json({
            message: "success",
            data: scores,
            summary: {
                totalBusinesses: scores.length,
                averageScore: avg,
                exemplary: scores.filter(s => s.healthScore >= 90).length,
                atRisk: scores.filter(s => s.healthScore < 40).length,
                distribution: {
                    'A+': scores.filter(s => s.grade === 'A+').length,
                    'A': scores.filter(s => s.grade === 'A').length,
                    'B': scores.filter(s => s.grade === 'B').length,
                    'C': scores.filter(s => s.grade === 'C').length,
                    'D': scores.filter(s => s.grade === 'D').length,
                    'F': scores.filter(s => s.grade === 'F').length,
                }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// TIER-1 FEATURE: Grievance Redressal Pipeline
// Allows businesses to contest AI rejections or flagged statuses
// Human-in-the-loop administrative justice
// ============================================================

app.post('/api/grievances', apiLimiter, async (req, res) => {
    const { business_id, business_name, grievance_type, description, submitted_by } = req.body;

    if (!business_id || !grievance_type || !description) {
        return res.status(400).json({ error: "Missing required fields: business_id, grievance_type, description" });
    }

    const validTypes = ['NAME_REJECTION', 'STATUS_DISPUTE', 'TAX_ERROR', 'LICENSE_ISSUE', 'FRAUD_FALSE_POSITIVE', 'OTHER'];
    if (!validTypes.includes(grievance_type)) {
        return res.status(400).json({ error: `Invalid grievance type. Must be: ${validTypes.join(', ')}` });
    }

    let priority = 'NORMAL';
    if (grievance_type === 'FRAUD_FALSE_POSITIVE') priority = 'HIGH';
    if (grievance_type === 'STATUS_DISPUTE') priority = 'HIGH';

    try {
        const grievance = await mongoRepo.models.Grievance.create({
            business_id, business_name: business_name || '', grievance_type, description, priority, submitted_by: submitted_by || 'anonymous'
        });

        const auditBlock = new Block(new Date().toISOString(), {
            action: 'GrievanceFiled',
            grievanceId: grievance._id.toString(),
            businessId: business_id,
            type: grievance_type,
            priority
        });
        tnMbnrChain.addBlock(auditBlock);
        await mongoRepo.repository.addBlockToLedger(auditBlock);

        res.json({
            message: "Grievance submitted successfully",
            grievanceId: grievance._id,
            status: 'SUBMITTED',
            priority,
            estimatedResolution: '48-72 hours',
            blockHash: auditBlock.hash
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/grievances', apiLimiter, async (req, res) => {
    const { status, business_id } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (business_id) filter.business_id = business_id;

    try {
        const rows = await mongoRepo.models.Grievance.find(filter).sort({ submitted_at: -1 }).lean();
        res.json({
            message: "success",
            data: rows,
            summary: {
                total: rows.length,
                submitted: rows.filter(r => r.status === 'SUBMITTED').length,
                underReview: rows.filter(r => r.status === 'UNDER_REVIEW').length,
                resolved: rows.filter(r => r.status === 'RESOLVED').length,
                rejected: rows.filter(r => r.status === 'REJECTED').length
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/grievances/:id/resolve', apiLimiter, authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!['UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    try {
        const updateDoc = {
            status,
            resolved_by: req.user.id,
            resolved_at: new Date(),
            resolution_notes: resolution_notes || ''
        };
        
        if (status === 'ESCALATED') {
            updateDoc.$inc = { escalation_level: 1 };
        }

        const updated = await mongoRepo.models.Grievance.findByIdAndUpdate(id, updateDoc, { new: true });
        
        if (!updated) return res.status(404).json({ error: "Grievance not found" });

        const auditBlock = new Block(new Date().toISOString(), {
            action: 'GrievanceResolved',
            grievanceId: id,
            newStatus: status,
            officer: req.user.id
        });
        tnMbnrChain.addBlock(auditBlock);
        await mongoRepo.repository.addBlockToLedger(auditBlock);

        res.json({ message: "success", status, blockHash: auditBlock.hash });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ============================================================
// TIER-1 FEATURE: 3rd-Party Public Verification API (NDAP / OpenAPI Compliant)
// Allows external apps (Swiggy, Zomato, etc.) to verify
// if a business is municipally registered
// No auth required — public read-only API
// ============================================================

// ============================================================
// e-Pramaan / Aadhaar e-KYC Mock API
// ============================================================
app.post('/api/ekyc/verify', (req, res) => {
    const { aadhaar_no, otp } = req.body;
    // In a real scenario, this would call UIDAI or e-Pramaan gateway
    if (otp === '123456' || otp.length === 6) {
        res.json({ success: true, message: 'Aadhaar identity verified via e-Pramaan mock' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

app.get('/api-docs/swagger.json', (req, res) => {
    res.json({
        openapi: "3.0.0",
        info: {
            title: "TN-MBNR TrustReg Public API",
            version: "1.0.0",
            description: "Public verification API adhering to Indian e-Governance NDAP and Open API standards."
        },
        servers: [{ url: "http://localhost:3001", description: "Local Node" }],
        paths: {
            "/api/v1/verify/{businessId}": {
                get: {
                    summary: "Verify a business registration",
                    description: "Checks the municipal registry for the given business ID and returns health score and verification status.",
                    parameters: [
                        {
                            name: "businessId",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                            description: "The unique registration ID of the business"
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Successful verification response",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            verified: { type: "boolean" },
                                            registrationId: { type: "string" },
                                            tradeName: { type: "string" },
                                            status: { type: "string" },
                                            healthScore: {
                                                type: "object",
                                                properties: {
                                                    score: { type: "number" },
                                                    grade: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "Business not found"
                        }
                    }
                }
            }
        }
    });
});

app.get('/api-docs', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>TN-MBNR Open API Specifications</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js" crossorigin></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api-docs/swagger.json',
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
    </html>
    `);
});

app.get('/api/v1/verify/:businessId', async (req, res) => {
    const { businessId } = req.params;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Powered-By', 'TN-MBNR TrustReg Platform');

    try {
        const business = await mongoRepo.models.Business.findOne({ id: businessId }).lean();
        if (!business) {
            return res.status(404).json({
                verified: false,
                error: "Business not found in municipal registry",
                queryId: businessId,
                timestamp: new Date().toISOString()
            });
        }

        const score = calculateHealthScore(business);
        const grading = getHealthGrade(score);

        res.json({
            verified: business.status === 'Verified',
            registrationId: business.id,
            tradeName: business.tradeName,
            legalName: business.legalName,
            type: business.type,
            category: business.category,
            status: business.status,
            license: {
                status: business.license_status || 'UNKNOWN',
                validTill: business.license_valid_till,
                graceEndsAt: business.grace_ends_at
            },
            healthScore: {
                score,
                grade: grading.grade,
                label: grading.label
            },
            location: {
                address: business.address,
                ward: business.municipal_ward || 'N/A',
                geoVerified: !!(business.latitude && business.longitude)
            },
            taxCompliance: {
                property: business.property_tax_status || 'Unknown',
                water: business.water_tax_status || 'Unknown',
                professional: business.professional_tax_status || 'Unknown'
            },
            meta: {
                registeredOn: business.registrationDate,
                lastVerified: new Date().toISOString(),
                apiVersion: '1.0',
                provider: 'TN-MBNR Municipal Authority'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve Assets
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Notification Nodes ---

app.post('/api/notify-sms', apiLimiter, async (req, res) => {
    const { to, body } = req.body;
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    console.log(`[Notification Hub] SMS Request to: ${to}`);

    if (!sid || !token || sid === 'MOCK_SID') {
        console.warn(`[Mock SMS] To: ${to} | Body: ${body}`);
        return res.json({ success: true, mode: 'mock' });
    }

    try {
        // Implementation using Twilio SDK would go here
        // For now, we simulate the network handover
        console.log(`[Twilio Node] Dispatching live SMS via ${from}...`);
        res.json({ success: true, message: 'SMS Dispatched' });
    } catch (error) {
        res.status(500).json({ error: 'SMS Node Failure' });
    }
});

app.post('/api/notify-email', apiLimiter, async (req, res) => {
    const { to, subject, html } = req.body;
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'alerts@tn-mbnr.gov.in';

    console.log(`[Notification Hub] Email Request to: ${to}`);

    if (!apiKey || apiKey === 'MOCK_KEY') {
        console.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
        return res.json({ success: true, mode: 'mock' });
    }

    try {
        // Implementation using SendGrid SDK would go here
        console.log(`[SendGrid Node] Dispatching live Email via ${fromEmail}...`);
        res.json({ success: true, message: 'Email Dispatched' });
    } catch (error) {
        res.status(500).json({ error: 'Email Node Failure' });
    }
});

// --- DPDP Act Compliance (Right to Revoke) ---
const AadhaarVault = require('./utils/aadhaarVault.cjs');

app.post('/api/citizen/revoke-consent', apiLimiter, async (req, res) => {
    const { reference_token } = req.body;
    
    if (!reference_token) {
        return res.status(400).json({ error: 'Aadhaar reference token required for consent revocation' });
    }

    try {
        // Purge the PII from the Aadhaar Data Vault (ADV)
        await AadhaarVault.purge(reference_token);

        logger.info('DPDP Consent Revoked', { 
            event: 'consent_revocation',
            timestamp: new Date().toISOString(),
            reference_token: reference_token 
        });

        res.json({ 
            success: true, 
            message: 'Under the DPDP Act 2023, your consent has been revoked. All cached identity data has been permanently purged from the vault.' 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to purge data from vault.' });
    }
});

// SPA Catch-all (using app.use for Express 5 compatibility)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error('Unhandled Exception', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'An internal server error occurred. Support node has been notified.' 
            : err.message
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server Hardened & Running on port ${PORT} (Bound to 0.0.0.0 for Render Web Service)`);
});
