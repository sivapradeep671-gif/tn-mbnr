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
        console.log("=== Phase 4: Geofence & Communications Test ===");

        // 1. Register a test business at known coordinates (13.0, 80.0)
        console.log("\n[1] Registering target business at (13.0, 80.0)...");
        const postData = JSON.stringify({
            trade_name: 'Geofence Test Shop',
            legal_name: 'Geofence LLC',
            business_category: 'Retail',
            latitude: 13.0,
            longitude: 80.0
        });
        const regRes = await request({
            hostname: 'localhost', port: 3001, path: '/api/v1/license/register', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        }, postData);
        
        console.log(`Registration Response Status: ${regRes.statusCode}`);
        console.log(`Registration Response Body: ${regRes.body}`);
        
        const qrUuid = JSON.parse(regRes.body).qr_uuid;
        console.log(`Registered! QR UUID: ${qrUuid}`);

        // 2. Scan from exactly the same location
        console.log("\n[2] Scanning from matching coordinates (13.0, 80.0)...");
        const scan1Res = await request({
            hostname: 'localhost', port: 3001, path: `/api/v1/license/verify/${qrUuid}?lat=13.0&lng=80.0`, method: 'GET'
        });
        const scan1Body = JSON.parse(scan1Res.body);
        console.log(`Status Code: ${scan1Res.statusCode} | Status: ${scan1Body.status} | Msg: ${scan1Body.message_en}`);

        // 3. Scan from a location far away (e.g., 14.0, 81.0 -> >100km away)
        console.log("\n[3] Scanning from distant coordinates (14.0, 81.0)...");
        const scan2Res = await request({
            hostname: 'localhost', port: 3001, path: `/api/v1/license/verify/${qrUuid}?lat=14.0&lng=81.0`, method: 'GET'
        });
        const scan2Body = JSON.parse(scan2Res.body);
        console.log(`Status Code: ${scan2Res.statusCode} | Status: ${scan2Body.status} | Msg: ${scan2Body.message_en}`);

        // 4. Test Registry Fetch
        console.log("\n[4] Fetching SQLite Registry for Map Explorer...");
        const regFetchRes = await request({
            hostname: 'localhost', port: 3001, path: `/api/v1/license/registry`, method: 'GET'
        });
        const registry = JSON.parse(regFetchRes.body).data;
        console.log(`Registry fetched! Contains ${registry.length} nodes.`);
        console.log(`Sample node: ${registry[registry.length-1].tradeName} at [${registry[registry.length-1].latitude}, ${registry[registry.length-1].longitude}]`);

        // 5. Test Communication Hub
        console.log("\n[5] Dispatching Mock SMS via Communication Hub API...");
        const smsData = JSON.stringify({ to: '+919876543210', body: 'This is a test alert from TN-MBNR.' });
        const smsRes = await request({
            hostname: 'localhost', port: 3001, path: `/api/notify-sms`, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(smsData) }
        }, smsData);
        console.log(`SMS Dispatch Status Code: ${smsRes.statusCode}`);
        console.log(`SMS Dispatch Body: ${smsRes.body}`);

        console.log("\n=== Phase 4 Test Complete ===");
    } catch (e) {
        console.error("Test Error:", e);
    }
})();
