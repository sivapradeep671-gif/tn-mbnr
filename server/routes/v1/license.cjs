const express = require('express');
const crypto = require('crypto');
const { db } = require('../../db/database.cjs');
const LicenseService = require('../../services/LicenseService.cjs');
const logger = require('../../utils/logger.cjs');

const router = express.Router();

// Mock Gemini AI integration hook
const verifyWithGemini = async (tradeName) => {
    // In production, this would call the actual Gemini API.
    // We simulate a basic blocklist for demonstration.
    const blockedNames = ['fraud', 'scam', 'counterfeit'];
    const lowerName = tradeName.toLowerCase();
    const isBlocked = blockedNames.some(b => lowerName.includes(b));
    
    if (isBlocked) {
        return { isSafe: false, reason: 'Flagged by Gemini: Intellectual Property or Policy Violation' };
    }
    return { isSafe: true, reason: 'Cleared by AI Verification' };
};

/**
 * POST /api/v1/license/register
 * Captures business data, sets up the QR token, evaluates timestamps, and records to DB.
 */
router.post('/register', async (req, res) => {
    const { trade_name, legal_name, gst_number, business_category, address_proof_url } = req.body;
    
    if (!trade_name) return res.status(400).json({ error: "Missing trade_name" });

    // Step 1: Gemini AI Hook
    const aiCheck = await verifyWithGemini(trade_name);
    
    // Step 2: Set Initial Status
    const initialStatus = aiCheck.isSafe ? 'ACTIVE' : 'SUSPENDED';

    const merchant_id = `BIZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const qr_uuid = crypto.randomUUID();
    const nowISO = new Date().toISOString();
    
    const timestamps = LicenseService.calculateTimestamps(nowISO);

    try {
        await db.transaction(async (trx) => {
            // Insert Merchant
            await trx('merchants').insert({
                id: merchant_id,
                trade_name,
                legal_name: legal_name || trade_name,
                gst_number: gst_number || null,
                business_category: business_category || 'General',
                address_proof_url: address_proof_url || null,
                created_at: nowISO,
                updated_at: nowISO
            });

            // Insert License
            await trx('licenses').insert({
                id: crypto.randomUUID(),
                merchant_id,
                qr_uuid,
                status: initialStatus,
                registration_timestamp: nowISO,
                license_valid_till: timestamps.license_valid_till,
                grace_ends_at: timestamps.grace_ends_at,
                pay_by_date: timestamps.pay_by_date,
                created_at: nowISO,
                updated_at: nowISO
            });
        });

        logger.info(`New merchant registered: ${merchant_id} | Initial Status: ${initialStatus}`);

        res.status(201).json({
            message: "Registration successful",
            merchant_id,
            qr_uuid,
            ai_verification: aiCheck,
            status: initialStatus,
            timestamps
        });
    } catch (err) {
        logger.error("Registration failed", { error: err.message });
        res.status(500).json({ error: "Database transaction failed" });
    }
});

/**
 * GET /api/v1/verify/:qr_uuid
 * Dynamic status lookup endpoint with zero client-side state dependency.
 */
router.get('/verify/:qr_uuid', async (req, res) => {
    const { qr_uuid } = req.params;
    const { lat, lng } = req.query;
    
    // Determine scanner role from standard auth or custom header
    const scannerRole = req.headers['x-scanner-role'] === 'inspector' ? 'inspector' : 'citizen';

    try {
        // Fetch raw license and joined merchant
        const licenseRecord = await db('licenses').where({ qr_uuid }).first();
        
        if (!licenseRecord) {
            // Log counterfeit scan
            await db('verification_logs').insert({
                id: crypto.randomUUID(),
                qr_uuid,
                scanner_role: scannerRole,
                scan_latitude: lat ? parseFloat(lat) : null,
                scan_longitude: lng ? parseFloat(lng) : null,
                is_counterfeit: true,
                verification_outcome: 'INVALID_UUID',
                timestamp: new Date().toISOString()
            });

            return res.status(404).json({
                status: "COUNTERFEIT",
                message_en: "This QR code does not match any valid municipal record.",
                message_ta: "இந்த QR குறியீடு எந்தவொரு செல்லுபடியான நகராட்சி பதிவுடனும் பொருந்தவில்லை."
            });
        }

        const merchant = await db('merchants').where({ id: licenseRecord.merchant_id }).first();

        // Pass through deterministic state machine
        const finalLicenseState = await LicenseService.evaluateDynamicState(licenseRecord);

        // Geolocation Check Logic (Stubbed for prototype)
        // In reality, compare lat/lng against merchant coordinates
        const isLocationMismatch = false; 

        let finalOutcome = finalLicenseState.status;
        let msgEn = "Business successfully verified.";
        let msgTa = "வணிகம் வெற்றிகரமாக சரிபார்க்கப்பட்டது.";

        if (finalOutcome === 'GRACE') {
            msgEn = "Warning: Business is currently in the 30-minute grace period.";
            msgTa = "எச்சரிக்கை: வணிகம் தற்போது 30 நிமிட சலுகை காலத்தில் உள்ளது.";
        } else if (finalOutcome === 'EXPIRED') {
            msgEn = "CRITICAL: This license has officially expired.";
            msgTa = "முக்கியமானது: இந்த உரிமம் அதிகாரப்பூர்வமாக காலாவதியாகிவிட்டது.";
        } else if (finalOutcome === 'SUSPENDED') {
            msgEn = "CRITICAL: Operations suspended by municipal authorities.";
            msgTa = "முக்கியமானது: நகராட்சி அதிகாரிகளால் செயல்பாடுகள் தற்காலிகமாக நிறுத்தப்பட்டுள்ளன.";
        } else if (finalOutcome === 'BLOCKED') {
            msgEn = "CRITICAL: Flagged for severe violations or fraud.";
            msgTa = "முக்கியமானது: கடுமையான மீறல்கள் அல்லது மோசடிக்காக கொடியிடப்பட்டுள்ளது.";
        }

        // Log successful (or at least valid-token) scan
        await db('verification_logs').insert({
            id: crypto.randomUUID(),
            qr_uuid,
            scanner_role: scannerRole,
            scan_latitude: lat ? parseFloat(lat) : null,
            scan_longitude: lng ? parseFloat(lng) : null,
            is_counterfeit: false,
            verification_outcome: finalOutcome,
            timestamp: new Date().toISOString()
        });

        return res.json({
            status: finalOutcome,
            message_en: msgEn,
            message_ta: msgTa,
            merchant: {
                id: merchant.id,
                trade_name: merchant.trade_name,
                business_category: merchant.business_category
            },
            timestamps: {
                registration: finalLicenseState.registration_timestamp,
                license_valid_till: finalLicenseState.license_valid_till,
                grace_ends_at: finalLicenseState.grace_ends_at
            }
        });
        
    } catch (err) {
        logger.error("Scan verification failed", { error: err.message, qr_uuid });
        res.status(500).json({ error: "Internal processing error during verification." });
    }
});

/**
 * PATCH /api/v1/admin/license/:id
 * Admin endpoint to override a state dynamically (without touching QR).
 */
router.patch('/admin/license/:id', async (req, res) => {
    const { id } = req.params; // merchant_id or license id
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'GRACE', 'PENDING_PAYMENT', 'EXPIRED', 'SUSPENDED', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status state" });
    }

    try {
        const updateCount = await db('licenses')
            .where({ merchant_id: id })
            .update({ status, updated_at: new Date().toISOString() });

        if (updateCount === 0) {
            return res.status(404).json({ error: "License not found for this merchant" });
        }

        logger.info(`Admin manual override: Merchant ${id} set to ${status}`);
        res.json({ message: "License state successfully overridden", new_status: status });

    } catch (err) {
        res.status(500).json({ error: "Failed to override license state" });
    }
});

/**
 * POST /api/v1/license/pay/:qr_uuid
 * Payment Gateway Simulation. Clears dues and resets state to ACTIVE.
 */
router.post('/pay/:qr_uuid', async (req, res) => {
    const { qr_uuid } = req.params;

    try {
        const license = await db('licenses').where({ qr_uuid }).first();
        if (!license) return res.status(404).json({ error: "License not found" });

        if (license.status === 'ACTIVE') {
            return res.status(400).json({ error: "No pending municipal dues for this license." });
        }

        // Simulate successful payment processing
        const nowISO = new Date().toISOString();
        const timestamps = LicenseService.calculateTimestamps(nowISO);

        await db('licenses')
            .where({ qr_uuid })
            .update({
                status: 'ACTIVE',
                registration_timestamp: nowISO,
                license_valid_till: timestamps.license_valid_till,
                grace_ends_at: timestamps.grace_ends_at,
                pay_by_date: timestamps.pay_by_date,
                updated_at: nowISO
            });

        logger.info(`Payment processed for ${qr_uuid}. State reset to ACTIVE.`);
        res.json({ message: "Payment successful. License is now ACTIVE.", new_status: "ACTIVE" });

    } catch (err) {
        logger.error("Payment failed", { error: err.message });
        res.status(500).json({ error: "Payment processing failed" });
    }
});

/**
 * GET /api/v1/license/admin/logs
 * Retrieves verification logs for the Inspector Dashboard.
 */
router.get('/admin/logs', async (req, res) => {
    try {
        const logs = await db('verification_logs')
            .orderBy('timestamp', 'desc')
            .limit(100);

        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

module.exports = router;
