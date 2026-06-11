const { db } = require('../db/database.cjs');
const logger = require('../utils/logger.cjs');

/**
 * Deterministic State Evaluator
 * Recalculates and enforces state transitions based on server time ($T_current$).
 */
class LicenseService {
    
    /**
     * Helper to compute timestamps
     * @param {string} registrationTimestamp 
     * @returns {Object} Timestamps for the state machine
     */
    static calculateTimestamps(registrationTimestamp) {
        const regDate = new Date(registrationTimestamp);
        // Active: 30 minutes
        const validTill = new Date(regDate.getTime() + 30 * 60 * 1000);
        // Grace: +30 minutes
        const graceEnds = new Date(validTill.getTime() + 30 * 60 * 1000);
        // Payment: +1 month from grace end (or state change, simplified here)
        const payBy = new Date(graceEnds.getTime());
        payBy.setMonth(payBy.getMonth() + 1);

        return {
            license_valid_till: validTill.toISOString(),
            grace_ends_at: graceEnds.toISOString(),
            pay_by_date: payBy.toISOString()
        };
    }

    /**
     * Core Business Logic Engine (State Evaluator)
     * Dynamically determines the true state based on the current time.
     * Synchronously updates the database if a transition occurred.
     * @param {Object} license The database record
     * @returns {Object} The guaranteed true state of the license
     */
    static async evaluateDynamicState(license) {
        if (!license) return null;

        const now = new Date();
        const validTill = new Date(license.license_valid_till);
        const graceEnds = new Date(license.grace_ends_at);
        const payBy = new Date(license.pay_by_date);

        // If manually suspended or blocked, those take absolute precedence
        if (license.status === 'SUSPENDED' || license.status === 'BLOCKED') {
            return license;
        }

        let trueStatus = license.status;

        // If already expired, no upgrade possible
        if (trueStatus === 'EXPIRED') {
            return license;
        }

        // Determine time-based status
        let timeStatus;
        if (now > payBy) {
            timeStatus = 'EXPIRED';
        } else if (now > graceEnds) {
            timeStatus = 'PENDING_PAYMENT';
        } else if (now > validTill) {
            timeStatus = 'GRACE';
        } else {
            timeStatus = 'ACTIVE';
        }

        const severity = { 'ACTIVE': 0, 'GRACE': 1, 'PENDING_PAYMENT': 2, 'EXPIRED': 3 };
        
        // trueStatus is the worst of the current status or the time-based status.
        // This prevents time from "upgrading" a status that was manually downgraded.
        if (severity[timeStatus] > severity[trueStatus]) {
            trueStatus = timeStatus;
        }

        // Auto-update if drift detected
        if (trueStatus !== license.status) {
            logger.info(`State Drift Detected for ${license.qr_uuid}. Upgrading ${license.status} -> ${trueStatus}`);
            await db('licenses')
                .where({ id: license.id })
                .update({ status: trueStatus, updated_at: new Date().toISOString() });
            
            license.status = trueStatus;
        }

        return license;
    }
}

module.exports = LicenseService;
