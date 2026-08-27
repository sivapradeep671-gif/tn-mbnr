const knex = require('knex');
const path = require('path');
const logger = require('../utils/logger.cjs');

const dbClient = process.env.DB_CLIENT || 'sqlite3';
const dbPath = process.env.DB_PATH || path.join(__dirname, '../tn_mbnr_production.db');

const knexConfig = dbClient === 'pg' ? {
    client: 'pg',
    connection: {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'tn_mbnr'
    },
    pool: { min: 2, max: 10 }
} : {
    client: 'sqlite3',
    connection: {
        filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
        afterCreate: (conn, cb) => {
            conn.run('PRAGMA foreign_keys = ON', cb);
        }
    }
};

const db = knex(knexConfig);

if (dbClient === 'pg') {
    logger.info("PostgreSQL High-Load Engine Initialized.");
} else {
    logger.info("PostgreSQL not detected. Falling back to SQLite Engine.");
}

const initializeDatabase = async () => {
    try {
        const hasMerchants = await db.schema.hasTable('merchants');
        if (!hasMerchants) {
            await db.schema.createTable('merchants', (table) => {
                table.string('id').primary(); // e.g., BIZ-123456
                table.string('tenant_id').notNullable().defaultTo('tn-chennai'); // SaaS tenant separation
                table.string('trade_name').notNullable();
                table.string('legal_name');
                table.string('gst_number');
                table.string('business_category');
                table.string('address_proof_url');
                table.float('latitude');
                table.float('longitude');
                table.timestamps(true, true);
            });
            logger.info("Table 'merchants' created.");
        }

        const hasLicenses = await db.schema.hasTable('licenses');
        if (!hasLicenses) {
            await db.schema.createTable('licenses', (table) => {
                table.string('id').primary(); // UUID
                table.string('merchant_id').notNullable().references('id').inTable('merchants').onDelete('CASCADE');
                table.string('qr_uuid').notNullable().unique(); // The unique token on the QR
                table.enum('status', ['ACTIVE', 'GRACE', 'PENDING_PAYMENT', 'EXPIRED', 'SUSPENDED', 'BLOCKED']).notNullable();
                table.string('registration_timestamp').notNullable();
                table.string('license_valid_till').notNullable();
                table.string('grace_ends_at').notNullable();
                table.string('pay_by_date').notNullable();
                table.timestamps(true, true);
            });
            logger.info("Table 'licenses' created.");
        }

        const hasLogs = await db.schema.hasTable('verification_logs');
        if (!hasLogs) {
            await db.schema.createTable('verification_logs', (table) => {
                table.string('id').primary();
                table.string('qr_uuid').notNullable();
                table.string('scanner_role').notNullable();
                table.float('scan_latitude');
                table.float('scan_longitude');
                table.boolean('is_counterfeit').defaultTo(false);
                table.string('verification_outcome').notNullable();
                table.string('timestamp').notNullable();
            });
            logger.info("Table 'verification_logs' created.");
        }

        const hasBusinesses = await db.schema.hasTable('businesses');
        if (!hasBusinesses) {
            await db.schema.createTable('businesses', (table) => {
                table.string('id').primary();
                table.string('tradeName').notNullable();
                table.string('legalName');
                table.string('type').defaultTo('Sole Proprietorship');
                table.string('category').defaultTo('General Trade');
                table.string('address');
                table.string('contactNumber');
                table.string('email');
                table.string('gstNumber');
                table.string('aadhaar_no');
                table.string('status').defaultTo('Pending');
                table.string('current_stage').defaultTo('SCRUTINY');
                table.string('registrationDate');
                table.integer('riskScore').defaultTo(0);
                table.float('latitude');
                table.float('longitude');
                table.string('license_valid_till');
                table.string('grace_ends_at');
                table.string('pay_by_date');
                table.boolean('payment_done').defaultTo(false);
                table.string('license_status').defaultTo('ACTIVE');
                table.string('property_tax_status').defaultTo('Paid');
                table.string('water_tax_status').defaultTo('Paid');
                table.string('professional_tax_status').defaultTo('Paid');
                table.string('sla_deadline_at');
                table.timestamps(true, true);
            });
            logger.info("Table 'businesses' created.");
        }

        const hasReports = await db.schema.hasTable('reports');
        if (!hasReports) {
            await db.schema.createTable('reports', (table) => {
                table.string('id').primary();
                table.string('business_name').notNullable();
                table.string('location');
                table.string('description');
                table.string('category');
                table.string('severity').defaultTo('Medium');
                table.string('image_path');
                table.string('status').defaultTo('Under Review');
                table.string('timestamp');
            });
            logger.info("Table 'reports' created.");
        }

        const hasScans = await db.schema.hasTable('scans');
        if (!hasScans) {
            await db.schema.createTable('scans', (table) => {
                table.increments('id').primary();
                table.string('business_id').notNullable();
                table.string('token');
                table.float('scan_lat');
                table.float('scan_lng');
                table.string('result').defaultTo('VALID');
                table.float('distance');
                table.string('scanned_at');
            });
            logger.info("Table 'scans' created.");
        }

        const hasLedger = await db.schema.hasTable('ledger');
        if (!hasLedger) {
            await db.schema.createTable('ledger', (table) => {
                table.integer('index').primary();
                table.string('timestamp').notNullable();
                table.text('data'); // Stored as JSON string
                table.string('previousHash');
                table.string('hash');
                table.integer('nonce').defaultTo(0);
            });
            logger.info("Table 'ledger' created.");
        }

        const hasApprovals = await db.schema.hasTable('approvals');
        if (!hasApprovals) {
            await db.schema.createTable('approvals', (table) => {
                table.string('id').primary();
                table.string('registry_id').notNullable();
                table.string('stage').notNullable();
                table.string('status').notNullable();
                table.string('acted_by_user_id');
                table.string('acted_by_role');
                table.string('acted_at');
                table.text('comments');
                table.string('order_ref_no');
                table.string('valid_from');
                table.string('valid_to');
                table.string('attachment_url');
            });
            logger.info("Table 'approvals' created.");
        }

        // Seed initial business and merchant records if SQLite businesses is empty
        const count = await db('businesses').count('* as count').first();
        if (!count || parseInt(count.count, 10) === 0) {
            const nowISO = new Date().toISOString();
            const validTill = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

            const sampleBusinesses = [
                {
                    id: 'BIZ-001',
                    tradeName: 'Anna Nagar Grand Mall',
                    legalName: 'AGM Enterprises Pvt Ltd',
                    type: 'Private Limited',
                    category: 'General Trade',
                    address: 'Anna Nagar, Chennai',
                    contactNumber: '9876543210',
                    email: 'contact@annagrand.com',
                    gstNumber: '33AAAAA0000A1Z5',
                    status: 'Verified',
                    current_stage: 'FINAL',
                    registrationDate: nowISO,
                    riskScore: 5,
                    latitude: 13.0850,
                    longitude: 80.2101,
                    license_valid_till: validTill,
                    license_status: 'ACTIVE',
                    property_tax_status: 'Paid',
                    water_tax_status: 'Paid',
                    professional_tax_status: 'Paid'
                },
                {
                    id: 'BIZ-002',
                    tradeName: 'Old Silk House',
                    legalName: 'Classic Weaves LLP',
                    type: 'Partnership',
                    category: 'Apparel',
                    address: 'T-Nagar, Chennai',
                    contactNumber: '9876543211',
                    email: 'info@oldsilk.com',
                    gstNumber: '33BBBBB1111B1Z2',
                    status: 'Verified',
                    current_stage: 'FINAL',
                    registrationDate: nowISO,
                    riskScore: 12,
                    latitude: 13.0400,
                    longitude: 80.2333,
                    license_valid_till: validTill,
                    license_status: 'ACTIVE',
                    property_tax_status: 'Paid',
                    water_tax_status: 'Paid',
                    professional_tax_status: 'Pending'
                },
                {
                    id: 'BIZ-003',
                    tradeName: 'Sunrise Cafe',
                    legalName: 'Naveen Foods',
                    type: 'Sole Proprietorship',
                    category: 'F&B',
                    address: 'Velachery, Chennai',
                    contactNumber: '9876543212',
                    email: 'support@sunrisecafe.com',
                    gstNumber: '33CCCCC2222C1Z9',
                    status: 'Pending',
                    current_stage: 'SCRUTINY',
                    registrationDate: nowISO,
                    riskScore: 25,
                    latitude: 12.9800,
                    longitude: 80.2200,
                    license_valid_till: validTill,
                    license_status: 'ACTIVE',
                    property_tax_status: 'Pending',
                    water_tax_status: 'Pending',
                    professional_tax_status: 'Pending'
                }
            ];

            await db('businesses').insert(sampleBusinesses);

            // Synchronize merchants table for v1 license queries
            for (const b of sampleBusinesses) {
                const hasM = await db('merchants').where({ id: b.id }).first();
                if (!hasM) {
                    await db('merchants').insert({
                        id: b.id,
                        tenant_id: 'tn-chennai',
                        trade_name: b.tradeName,
                        legal_name: b.legalName,
                        gst_number: b.gstNumber,
                        business_category: b.category,
                        latitude: b.latitude,
                        longitude: b.longitude,
                        created_at: nowISO,
                        updated_at: nowISO
                    });
                }
            }

            // Seed sample report
            await db('reports').insert({
                id: 'REP-001',
                business_name: 'Unregistered Stall',
                location: 'Near Anna Statue',
                description: 'Operating without valid TrustReg QR code',
                category: 'Unlicensed Activity',
                severity: 'High',
                status: 'Under Review',
                timestamp: nowISO
            });

            // Seed genesis block in ledger
            const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
            await db('ledger').insert({
                index: 0,
                timestamp: nowISO,
                data: JSON.stringify({ message: "Genesis Block established in TrustReg SQLite Engine" }),
                previousHash: "0",
                hash: genesisHash,
                nonce: 0
            });

            logger.info("SQLite production database initialized and seeded with default offline data.");
        }
    } catch (err) {
        logger.error("Failed to initialize production SQLite schema", { error: err.message });
    }
};

module.exports = { db, initializeDatabase };
