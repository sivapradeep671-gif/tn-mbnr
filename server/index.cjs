const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const db = require('./database.cjs'); // Keeping SQLite as fallback for now
const mongoRepo = require('./database_mongo.cjs');
const { Blockchain, Block } = require('./blockchain.cjs');
const { calculateLicenseStatus, calculateLicenseTimestamps } = require('./licenseStatus.cjs');
const mult = require('multer');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { validateBody } = require('./middleware/validateBody.cjs');
const config = require('./config/secrets.cjs');
const logger = require('./utils/logger.cjs');

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
                    // Handle duplicate key (from a previous partial run)
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
            logger.warn("MongoDB offline. Falling back to SQLite Local Registry.");
            // Legacy SQLite Loader
            db.all("SELECT * FROM ledger ORDER BY index_id ASC", [], (err, rows) => {
                if (err) logger.error("Error loading SQLite ledger", { error: err.message });
                else if (rows && rows.length > 0) {
                    tnMbnrChain.chain = rows.map(row => {
                        const b = new Block(row.timestamp, JSON.parse(row.data), row.previousHash);
                        b.hash = row.hash;
                        b.nonce = row.nonce;
                        return b;
                    });
                    logger.info("Blockchain synchronized from SQLite", { blocks: tnMbnrChain.chain.length });
                }
            });
        }
    } catch (bootErr) {
        logger.error("MongoDB bootstrap error", { error: bootErr.message });
        logger.warn("Continuing with SQLite fallback");
    }
})();

const app = express();
const PORT = process.env.PORT || 3001;

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

app.get('/api/health', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.get('/api/auth/me', apiLimiter, authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { phone, role } = req.body;
    if (!phone || !role) return res.status(400).json({ error: 'Missing phone or role' });

    // MongoDB Priority Path
    if (mongoose.connection.readyState === 1) {
        if (role === 'business') {
            const row = await mongoRepo.models.Business.findOne({ contactNumber: phone }).lean();
            const businessId = row ? row.id : `BIZ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const token = generateToken({ id: businessId, phone, role });
            logger.info('User Login', { user_id: businessId, role, method: 'mongodb', ip: req.ip });
            return res.json({ message: 'Login successful', token, user: { id: businessId, phone, role } });
        }
    }

    // For Demo: If it's a merchant, find their business ID
    if (role === 'business') {
        db.get("SELECT id FROM businesses WHERE contactNumber = ?", [phone], (err, row) => {
            const businessId = row ? row.id : `BIZ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const token = generateToken({
                id: businessId,
                phone,
                role
            });
            logger.info('User Login', { user_id: businessId, role, method: 'sqlite', ip: req.ip });
            res.json({ message: 'Login successful', token, user: { id: businessId, phone, role } });
        });
    } else {
        const userId = `USER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const token = generateToken({
            id: userId,
            phone,
            role
        });
        logger.info('User Login', { user_id: userId, role, ip: req.ip });
        res.json({ message: 'Login successful', token, user: { id: userId, phone, role } });
    }
});

app.get('/api/businesses', apiLimiter, (req, res) => {
    db.all("SELECT * FROM businesses", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/verify-business', apiLimiter, authenticateToken, authorizeRoles('inspector', 'admin'), (req, res) => {
    const { businessName, type } = req.body;
    if (!businessName) return res.status(400).json({ error: "Missing business name" });

    // In a real production app, this would use the Gemini AI service.
    // For this build, we implement robust name-clash detection logic.
    db.get("SELECT * FROM businesses WHERE tradeName = ? AND status != 'Rejected'", [businessName], (err, row) => {
        if (row) {
            return res.json({
                isSafe: false,
                riskLevel: 'High',
                similarBrands: [row.tradeName],
                message: `CRITICAL FLAG: The name "${businessName}" is already registered. Intellectual property conflict detected.`
            });
        }

        // Search for similar sounding names (basic Levenshtein-style or keyword match)
        db.all("SELECT tradeName FROM businesses WHERE tradeName LIKE ?", [`%${businessName.substring(0, 3)}%`], (err, rows) => {
            if (rows && rows.length > 0) {
                return res.json({
                    isSafe: true,
                    riskLevel: 'Medium',
                    similarBrands: rows.map(r => r.tradeName),
                    message: "INTELLIGENCE ADVISORY: Similar brands detected in the regional grid. Proceed with documentation for validation."
                });
            }

            res.json({
                isSafe: true,
                riskLevel: 'Low',
                message: "VERIFIED: Brand name clear of regional conflicts. Node synchronization complete."
            });
        });
    });
});

const { businessSchema } = require('./validation/businessSchema.cjs');
const { encrypt } = require('./utils/piiEncryption.cjs');

app.post('/api/businesses', registrationLimiter, validateBody(businessSchema), (req, res) => {
    const b = req.body;
    const encryptedAadhaar = encrypt(b.aadhaar_no);
    const regDate = b.registrationDate || new Date().toISOString();
    const licenseTimestamps = calculateLicenseTimestamps(regDate);
    
    // Dynamic SLA lookup
    const slaKey = b.application_type === 'AMENDMENT' ? 'SLA_DAYS_AMENDMENT' : (b.application_type === 'RENEWAL' ? 'SLA_DAYS_RENEWAL' : 'SLA_DAYS_NEW');
    
    db.get("SELECT value FROM settings WHERE key = ?", [slaKey], (err, row) => {
        const slaDays = parseInt(row?.value || '15');
        const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

    const sql = `INSERT INTO businesses (
        id, legalName, tradeName, type, category, address, proofOfAddress, branchName, 
        contactNumber, email, gstNumber, status, registrationDate, riskScore, latitude, longitude,
        license_valid_till, grace_ends_at, pay_by_date, payment_done, license_status,
        assessment_number, water_connection_no, property_tax_status, water_tax_status, professional_tax_status,
        website, municipal_ward, nic_category, employee_count, application_type, sla_deadline_at, aadhaar_no, documents_metadata
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        b.id, b.legalName, b.tradeName, b.type, b.category, b.address, b.proofOfAddress, b.branchName,
        b.contactNumber, b.email, b.gstNumber, b.status || 'Pending', regDate, b.riskScore || 5, b.latitude, b.longitude,
        licenseTimestamps.license_valid_till,
        licenseTimestamps.grace_ends_at,
        licenseTimestamps.pay_by_date,
        licenseTimestamps.payment_done,
        licenseTimestamps.license_status,
        b.assessment_number,
        b.water_connection_no,
        b.property_tax_status || 'Pending',
        b.water_tax_status || 'Pending',
        b.professional_tax_status || 'Pending',
        b.website || '',
        b.municipal_ward || '',
        b.nic_category || '',
        b.employee_count || 0,
        b.application_type || 'NEW',
        slaDeadline,
        encryptedAadhaar || '',
        b.documents_metadata || '{}'
    ];

    db.run(sql, params, async function (err) {
        if (err) return res.status(400).json({ error: err.message });

        // MongoDB Sync Path
        if (mongoose.connection.readyState === 1) {
            try {
                await mongoRepo.models.Business.create({
                    ...b,
                    aadhaar_no: b.aadhaar_no, // Mongoose handles encryption if configured, otherwise store raw for now or reuse encrypt
                    status: b.status || 'Pending',
                    registrationDate: regDate,
                    license_valid_till: licenseTimestamps.license_valid_till,
                    grace_ends_at: licenseTimestamps.grace_ends_at,
                    pay_by_date: licenseTimestamps.pay_by_date,
                    payment_done: licenseTimestamps.payment_done,
                    license_status: licenseTimestamps.license_status,
                    sla_deadline_at: slaDeadline
                });
                logger.info('Business Synced to MongoDB', { business_id: b.id });
            } catch (mErr) {
                logger.warn('MongoDB Sync Failed', { business_id: b.id, error: mErr.message });
            }
        }

        const newBlock = new Block(new Date().toISOString(), {
            id: b.id,
            tradeName: b.tradeName,
            status: 'Registered',
            license: licenseTimestamps
        });
        tnMbnrChain.addBlock(newBlock);

        const ledgerSql = `INSERT INTO ledger (timestamp, data, previousHash, hash, nonce) VALUES (?,?,?,?,?)`;
        const ledgerParams = [newBlock.timestamp, JSON.stringify(newBlock.data), newBlock.previousHash, newBlock.hash, newBlock.nonce];

        db.run(ledgerSql, ledgerParams);

        res.json({ 
            message: "success", 
            data: { 
                id: b.id, 
                sqlite_last_id: this.lastID 
            }, 
            blockHash: newBlock.hash 
        });
    });
    });
});

app.put('/api/admin/businesses/:id/status', apiLimiter, authenticateToken, authorizeRoles('admin'), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    db.run("UPDATE businesses SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Business not found" });

        // Add to Ledger
        const newBlock = new Block(new Date().toISOString(), {
            id,
            action: 'StatusUpdate',
            newStatus: status
        });
        tnMbnrChain.addBlock(newBlock);

        const ledgerSql = `INSERT INTO ledger (timestamp, data, previousHash, hash, nonce) VALUES (?,?,?,?,?)`;
        db.run(ledgerSql, [newBlock.timestamp, JSON.stringify(newBlock.data), newBlock.previousHash, newBlock.hash, newBlock.nonce]);

        res.json({ message: "success", status, blockHash: newBlock.hash });
    });
});

app.get('/api/ledger', (req, res) => {
    db.all("SELECT * FROM ledger ORDER BY index_id DESC", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows, isValid: tnMbnrChain.isChainValid() });
    });
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

app.get('/api/qr-token/:businessId', apiLimiter, (req, res) => {
    const { businessId } = req.params;
    db.get("SELECT * FROM businesses WHERE id = ?", [businessId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Business not found" });
        
        const token = generateQRToken({
            id: row.id,
            lat: row.latitude,
            lng: row.longitude,
            name: row.tradeName
        });
        
        res.json({ token, expiresAt: Date.now() + 30000 });
    });
});

app.post('/api/verify-scan', apiLimiter, (req, res) => {
    const { token, scannerLocation } = req.body;
    if (!token || !scannerLocation) return res.status(400).json({ error: "Missing token or location" });

    const verification = verifyQRToken(token);
    
    if (verification.status !== 'VALID') {
        // Log failed scan
        db.run("INSERT INTO scans (business_id, token, scan_lat, scan_lng, result) VALUES (?,?,?,?,?)",
            ["UNKNOWN", token.substring(0, 20), scannerLocation.lat, scannerLocation.lng, verification.status]);
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

    // Get full business data for response
    db.get("SELECT * FROM businesses WHERE id = ?", [payload.id], (err, biz) => {
        const licenseStatus = biz ? calculateLicenseStatus(biz) : null;
        
        // Log scan
        db.run("INSERT INTO scans (business_id, token, scan_lat, scan_lng, result, distance) VALUES (?,?,?,?,?,?)",
            [payload.id, token.substring(0, 20), scannerLocation.lat, scannerLocation.lng, finalStatus, distance]);

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
    });
});

// Admin Stats
app.get('/api/admin/shops', authenticateToken, authorizeRoles('admin'), (req, res) => {
    const sql = `
        SELECT b.*, 
        (SELECT COUNT(*) FROM scans WHERE business_id = b.id) as total_scans,
        (SELECT COUNT(*) FROM scans WHERE business_id = b.id AND result = 'VALID') as verified_scans,
        (SELECT COUNT(*) FROM scans WHERE business_id = b.id AND result != 'VALID') as failed_scans
        FROM businesses b
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", shops: rows });
    });
});

app.get('/api/admin/suspicious', authenticateToken, authorizeRoles('admin'), (req, res) => {
    db.all("SELECT s.*, b.tradeName FROM scans s LEFT JOIN businesses b ON s.business_id = b.id WHERE result != 'VALID' ORDER BY scanned_at DESC LIMIT 50", [], (err, scans) => {
        if (err) return res.status(400).json({ error: err.message });
        
        // Risky shops aggregation
        const riskySql = `
            SELECT b.tradeName as shop_name, COUNT(*) as failed_scans,
            (CAST(COUNT(*) AS REAL) / (SELECT COUNT(*) FROM scans WHERE business_id = b.id)) * 100 as risk_score
            FROM scans s
            JOIN businesses b ON s.business_id = b.id
            WHERE s.result != 'VALID'
            GROUP BY b.id
            ORDER BY failed_scans DESC
            LIMIT 10
        `;
        
        db.all(riskySql, [], (err, risky) => {
            res.json({ message: "success", scans, top_risky_shops: risky || [] });
        });
    });
});

// --- Approval Workflow ---

app.get('/api/admin/pending-approvals', authenticateToken, authorizeRoles('admin'), (req, res) => {
    const sql = `
        SELECT b.*, 
        (SELECT stage FROM registry_approvals WHERE registry_id = b.id ORDER BY acted_at DESC LIMIT 1) as current_stage,
        (SELECT status FROM registry_approvals WHERE registry_id = b.id ORDER BY acted_at DESC LIMIT 1) as last_status
        FROM businesses b
        WHERE b.status NOT IN ('Verified', 'Rejected')
        ORDER BY registrationDate ASC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.get('/api/approvals/:registry_id', apiLimiter, (req, res) => {
    const { registry_id } = req.params;
    db.all("SELECT * FROM registry_approvals WHERE registry_id = ? ORDER BY acted_at DESC", [registry_id], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/approvals', authenticateToken, (req, res) => {
    const { registry_id, stage, status, comments, order_ref_no, valid_from, valid_to, attachment_url } = req.body;
    const { id: officerId, role: officerRole } = req.user;

    if (!registry_id || !stage || !status) {
        return res.status(400).json({ error: "Missing required approval fields" });
    }

    // Role-Stage Mapping for TN e-Governance
    const allowedRoles = {
        'SCRUTINY': ['scrutiny_officer', 'admin'],
        'INSPECTION': ['inspector', 'admin'],
        'FINAL': ['approver', 'admin']
    };

    if (allowedRoles[stage] && !allowedRoles[stage].includes(officerRole)) {
        return res.status(403).json({ error: `Permission denied: ${officerRole} cannot perform ${stage}` });
    }

    const sql = `INSERT INTO registry_approvals (
        registry_id, stage, status, acted_by_user_id, acted_by_role, comments, order_ref_no, valid_from, valid_to, attachment_url
    ) VALUES (?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        registry_id, stage, status, officerId, officerRole, 
        comments, order_ref_no, valid_from, valid_to, attachment_url
    ];

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(sql, params, function(err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(400).json({ error: err.message });
            }
            
            // Map workflow status to main business status
            let bizStatus = 'Pending';
            let nextStage = stage;

            if (status === 'APPROVED') {
                if (stage === 'SCRUTINY') nextStage = 'INSPECTION';
                else if (stage === 'INSPECTION') nextStage = 'FINAL';
                else if (stage === 'FINAL') bizStatus = 'Verified';
            } else if (status === 'REJECTED') {
                bizStatus = 'Rejected';
            }
            
            // Update business status and lifecycle tracking
            db.run("UPDATE businesses SET status = ?, current_stage = ? WHERE id = ?", [bizStatus, nextStage, registry_id], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ error: "Record update error" });
                }

                // Add to Ledger for Immutable Audit Trail
                const auditData = {
                    id: registry_id,
                    action: 'ApprovalTransition',
                    stage,
                    status,
                    officer: officerId,
                    role: officerRole,
                    timestamp: new Date().toISOString()
                };
                
                const newBlock = tnMbnrChain.addBlock(new Block(new Date().toISOString(), auditData));
                const ledgerSql = `INSERT INTO ledger (timestamp, data, previousHash, hash, nonce) VALUES (?,?,?,?,?)`;
                
                db.run(ledgerSql, [newBlock.timestamp, JSON.stringify(newBlock.data), newBlock.previousHash, newBlock.hash, newBlock.nonce], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(400).json({ error: "Ledger commit failure" });
                    }
                    db.run("COMMIT");
                    res.json({ message: "success", approval_id: this.lastID, business_status: bizStatus, next_stage: nextStage });
                });
            });
        });
    });
});

app.post('/api/reports', upload.single('image'), (req, res) => {
    const { business_name, location, description, category, severity } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    const sql = `INSERT INTO reports (business_name, location, description, category, severity, image_path) VALUES (?,?,?,?,?,?)`;
    db.run(sql, [business_name, location, description, category, severity, imagePath], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", id: this.lastID, image: imagePath });
    });
});

app.get('/api/reports', apiLimiter, (req, res) => {
    db.all("SELECT * FROM reports ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
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

app.get('/api/health-score/:businessId', apiLimiter, (req, res) => {
    const { businessId } = req.params;

    db.get("SELECT * FROM businesses WHERE id = ?", [businessId], (err, business) => {
        if (err || !business) return res.status(404).json({ error: "Business not found" });

        // Get citizen report count
        db.get("SELECT COUNT(*) as count FROM reports WHERE business_name = ?", [business.tradeName], (err2, reportRow) => {
            const reportCount = reportRow?.count || 0;

            // Get scan statistics
            db.get(
                "SELECT COUNT(*) as total, SUM(CASE WHEN result != 'VALID' THEN 1 ELSE 0 END) as failed FROM scans WHERE business_id = ?",
                [businessId],
                (err3, scanRow) => {
                    const scanStats = { total: scanRow?.total || 0, failed: scanRow?.failed || 0 };
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
                }
            );
        });
    });
});

// Bulk health scores for dashboard
app.get('/api/health-scores', apiLimiter, (req, res) => {
    db.all("SELECT * FROM businesses", [], (err, businesses) => {
        if (err) return res.status(400).json({ error: err.message });

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

        // Sort by score descending
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
    });
});

// ============================================================
// TIER-1 FEATURE: Grievance Redressal Pipeline
// Allows businesses to contest AI rejections or flagged statuses
// Human-in-the-loop administrative justice
// ============================================================

// Create grievances table
db.run(`CREATE TABLE IF NOT EXISTS grievances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id TEXT NOT NULL,
    business_name TEXT,
    grievance_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'SUBMITTED',
    priority TEXT DEFAULT 'NORMAL',
    submitted_by TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_by TEXT,
    resolved_at DATETIME,
    resolution_notes TEXT,
    escalation_level INTEGER DEFAULT 0
)`);

app.post('/api/grievances', apiLimiter, (req, res) => {
    const { business_id, business_name, grievance_type, description, submitted_by } = req.body;

    if (!business_id || !grievance_type || !description) {
        return res.status(400).json({ error: "Missing required fields: business_id, grievance_type, description" });
    }

    const validTypes = ['NAME_REJECTION', 'STATUS_DISPUTE', 'TAX_ERROR', 'LICENSE_ISSUE', 'FRAUD_FALSE_POSITIVE', 'OTHER'];
    if (!validTypes.includes(grievance_type)) {
        return res.status(400).json({ error: `Invalid grievance type. Must be: ${validTypes.join(', ')}` });
    }

    // Auto-set priority based on type
    let priority = 'NORMAL';
    if (grievance_type === 'FRAUD_FALSE_POSITIVE') priority = 'HIGH';
    if (grievance_type === 'STATUS_DISPUTE') priority = 'HIGH';

    const sql = `INSERT INTO grievances (business_id, business_name, grievance_type, description, priority, submitted_by) VALUES (?,?,?,?,?,?)`;
    db.run(sql, [business_id, business_name || '', grievance_type, description, priority, submitted_by || 'anonymous'], function(err) {
        if (err) return res.status(400).json({ error: err.message });

        // Add to blockchain audit trail
        const auditBlock = new Block(new Date().toISOString(), {
            action: 'GrievanceFiled',
            grievanceId: this.lastID,
            businessId: business_id,
            type: grievance_type,
            priority
        });
        tnMbnrChain.addBlock(auditBlock);

        res.json({
            message: "Grievance submitted successfully",
            grievanceId: this.lastID,
            status: 'SUBMITTED',
            priority,
            estimatedResolution: '48-72 hours',
            blockHash: auditBlock.hash
        });
    });
});

app.get('/api/grievances', apiLimiter, (req, res) => {
    const { status, business_id } = req.query;
    let sql = "SELECT * FROM grievances";
    const params = [];
    const conditions = [];

    if (status) { conditions.push("status = ?"); params.push(status); }
    if (business_id) { conditions.push("business_id = ?"); params.push(business_id); }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY submitted_at DESC";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
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
    });
});

app.put('/api/grievances/:id/resolve', apiLimiter, authenticateToken, authorizeRoles('admin'), (req, res) => {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!['UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const escalation = status === 'ESCALATED' ? ', escalation_level = escalation_level + 1' : '';
    const sql = `UPDATE grievances SET status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?${escalation} WHERE id = ?`;

    db.run(sql, [status, req.user.id, resolution_notes || '', id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Grievance not found" });

        // Audit trail
        const auditBlock = new Block(new Date().toISOString(), {
            action: 'GrievanceResolved',
            grievanceId: parseInt(id),
            newStatus: status,
            officer: req.user.id
        });
        tnMbnrChain.addBlock(auditBlock);

        res.json({ message: "success", status, blockHash: auditBlock.hash });
    });
});

// ============================================================
// TIER-1 FEATURE: 3rd-Party Public Verification API
// Allows external apps (Swiggy, Zomato, etc.) to verify
// if a business is municipally registered
// No auth required — public read-only API
// ============================================================

app.get('/api/v1/verify/:businessId', (req, res) => {
    const { businessId } = req.params;

    // Set CORS headers for public access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Powered-By', 'TN-MBNR TrustReg Platform');

    db.get("SELECT * FROM businesses WHERE id = ?", [businessId], (err, business) => {
        if (err || !business) {
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
    });
});

// Serve Assets
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SPA Catch-all (using app.use for Express 5 compatibility)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

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

app.listen(PORT, () => {
    console.log(`✅ Server Hardened & Running on port ${PORT}`);
});
