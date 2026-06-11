const http = require('http');

const request = (options, postData) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
};

(async () => {
    try {
        console.log("=== TN-MBNR Full End-to-End Lifecycle Test ===");

        // 1. Registration
        console.log("\n[1] Registering New Business...");
        const postData = JSON.stringify({
            trade_name: 'E2E Coffee Shop',
            legal_name: 'E2E Brews LLC',
            business_category: 'Food & Beverage',
            latitude: 13.0,
            longitude: 80.0
        });
        const regRes = await request({
            hostname: 'localhost', port: 3001, path: '/api/v1/license/register', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        }, postData);
        console.log(`Status: ${regRes.statusCode}`);
        const regJson = JSON.parse(regRes.body);
        const qrUuid = regJson.qr_uuid;
        const merchantId = regJson.merchant_id;
        console.log(`Success! Merchant ID: ${merchantId} | QR UUID: ${qrUuid}`);

        // 2. Admin Forcing State
        console.log("\n[2] Admin Forcing State to 'PENDING_PAYMENT'...");
        const adminPatch = JSON.stringify({ status: 'PENDING_PAYMENT' });
        const patchRes = await request({
            hostname: 'localhost', port: 3001, path: `/api/v1/license/admin/license/${merchantId}`, method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(adminPatch) }
        }, adminPatch);
        console.log(`Status: ${patchRes.statusCode} | Body: ${patchRes.body}`);

        // 3. Citizen Verification Scan
        console.log("\n[3] Citizen Verifying QR Code...");
        const scan1Res = await request({
            hostname: 'localhost', port: 3001, path: `/api/v1/license/verify/${qrUuid}?lat=13.0&lng=80.0`, method: 'GET',
            headers: { 'x-scanner-role': 'citizen' }
        });
        console.log(`Status: ${scan1Res.statusCode} | Body: ${scan1Res.body}`);

        // 4. Merchant Payment
        console.log("\n[4] Merchant Paying Dues via Dashboard...");
        const payRes = await request({
            hostname: 'localhost', port: 3001, path: `/api/v1/license/pay/${qrUuid}`, method: 'POST',
            headers: { 'Content-Length': 0 }
        });
        console.log(`Status: ${payRes.statusCode} | Body: ${payRes.body}`);

        // 5. Inspector Verification Scan
        console.log("\n[5] Inspector Verifying QR Code Post-Payment...");
        const scan2Res = await request({
            hostname: 'localhost', port: 3001, path: `/api/v1/license/verify/${qrUuid}?lat=13.01&lng=80.02`, method: 'GET',
            headers: { 'x-scanner-role': 'inspector' }
        });
        console.log(`Status: ${scan2Res.statusCode} | Body: ${scan2Res.body}`);

        // 6. Admin Logs Review
        console.log("\n[6] Admin Fetching Verification Logs...");
        const logsRes = await request({
            hostname: 'localhost', port: 3001, path: '/api/v1/license/admin/logs', method: 'GET'
        });
        console.log(`Status: ${logsRes.statusCode}`);
        const logs = JSON.parse(logsRes.body).logs.filter(l => l.qr_uuid === qrUuid);
        console.log(`Found ${logs.length} logs for this session:`);
        logs.forEach(l => {
            console.log(` - Role: ${l.scanner_role} | Outcome: ${l.verification_outcome} | GPS: ${l.scan_latitude}, ${l.scan_longitude}`);
        });

        console.log("\n=== E2E Test Completed Successfully ===");
    } catch (e) {
        console.error("Test Error:", e);
    }
})();
