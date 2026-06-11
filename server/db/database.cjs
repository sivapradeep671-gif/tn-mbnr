const knex = require('knex');
const path = require('path');
const logger = require('../utils/logger.cjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../tn_mbnr_production.db');

const db = knex({
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
});

const initializeDatabase = async () => {
    try {
        const hasMerchants = await db.schema.hasTable('merchants');
        if (!hasMerchants) {
            await db.schema.createTable('merchants', (table) => {
                table.string('id').primary(); // e.g., BIZ-123456
                table.string('trade_name').notNullable();
                table.string('legal_name');
                table.string('gst_number');
                table.string('business_category');
                table.string('address_proof_url');
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
                table.string('id').primary(); // UUID
                table.string('qr_uuid').notNullable();
                table.string('scanner_role').notNullable(); // 'citizen', 'inspector'
                table.float('scan_latitude');
                table.float('scan_longitude');
                table.boolean('is_counterfeit').defaultTo(false);
                table.string('verification_outcome').notNullable();
                table.string('timestamp').notNullable();
            });
            logger.info("Table 'verification_logs' created.");
        }
    } catch (err) {
        logger.error("Failed to initialize production SQLite schema", { error: err.message });
    }
};

module.exports = { db, initializeDatabase };
