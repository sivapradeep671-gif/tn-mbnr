const axios = require('axios');
const { db } = require('./server/db/database.cjs');
const crypto = require('crypto');
const logger = require('./server/utils/logger.cjs');

// Quick utility to shift times in DB to test state machine
async function shiftTime(qr_uuid, shiftMinutes) {
    const license = await db('licenses').where({ qr_uuid }).first();
    const newReg = new Date(new Date(license.registration_timestamp).getTime() - shiftMinutes * 60000).toISOString();
    const newVal = new Date(new Date(license.license_valid_till).getTime() - shiftMinutes * 60000).toISOString();
    const newGrace = new Date(new Date(license.grace_ends_at).getTime() - shiftMinutes * 60000).toISOString();
    const newPay = new Date(new Date(license.pay_by_date).getTime() - shiftMinutes * 60000).toISOString();
    
    await db('licenses').where({ qr_uuid }).update({
        registration_timestamp: newReg,
        license_valid_till: newVal,
        grace_ends_at: newGrace,
        pay_by_date: newPay
    });
}

async function runTest() {
    console.log('--- STARTING V1 API TEST ---');
    
    // 1. Register a new business
    const res = await axios.post('http://localhost:3001/api/v1/license/register', {
        trade_name: 'Test Shop Pvt Ltd',
        business_category: 'Retail'
    });
    
    const qr_uuid = res.data.qr_uuid;
    console.log(`1. Registered Shop. QR UUID: ${qr_uuid}`);
    console.log(`   Initial Status: ${res.data.status}`);

    // 2. Scan immediately (Should be ACTIVE)
    const scan1 = await axios.get(`http://localhost:3001/api/v1/license/verify/${qr_uuid}`);
    console.log(`2. Immediate Scan: ${scan1.data.status} | Msg: ${scan1.data.message_en}`);

    // 3. Time travel: +35 mins (Should be GRACE)
    console.log('3. Simulating time travel (+35 mins)...');
    await shiftTime(qr_uuid, 35);
    const scan2 = await axios.get(`http://localhost:3001/api/v1/license/verify/${qr_uuid}`);
    console.log(`   Scan Result: ${scan2.data.status} | Msg: ${scan2.data.message_en}`);

    // 4. Time travel: +45 mins more (total 80 mins) (Should be PENDING_PAYMENT)
    console.log('4. Simulating time travel (+80 mins total)...');
    await shiftTime(qr_uuid, 45); // shift another 45
    const scan3 = await axios.get(`http://localhost:3001/api/v1/license/verify/${qr_uuid}`);
    console.log(`   Scan Result: ${scan3.data.status} | Msg: ${scan3.data.message_en}`);
    
    // 5. Time travel: +2 months (Should be EXPIRED)
    console.log('5. Simulating time travel (+2 months)...');
    await shiftTime(qr_uuid, 2 * 30 * 24 * 60); // roughly 60 days
    const scan4 = await axios.get(`http://localhost:3001/api/v1/license/verify/${qr_uuid}`);
    console.log(`   Scan Result: ${scan4.data.status} | Msg: ${scan4.data.message_en}`);

    // 6. Admin Override to BLOCKED
    console.log('6. Admin Override to BLOCKED...');
    const merchantId = scan4.data.merchant.id;
    const override = await axios.patch(`http://localhost:3001/api/v1/license/admin/license/${merchantId}`, { status: 'BLOCKED' });
    console.log(`   Override Result: ${override.data.new_status}`);
    const scan5 = await axios.get(`http://localhost:3001/api/v1/license/verify/${qr_uuid}`);
    console.log(`   Scan Result: ${scan5.data.status} | Msg: ${scan5.data.message_en}`);

    console.log('--- TEST COMPLETE ---');
    process.exit(0);
}

runTest().catch(e => {
    console.error('Test Failed:', e.response ? e.response.data : e.message);
    process.exit(1);
});
