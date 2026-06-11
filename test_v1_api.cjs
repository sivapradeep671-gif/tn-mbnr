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
        console.log("1. Testing Health...");
        const health = await request({ hostname: 'localhost', port: 3001, path: '/api/health', method: 'GET' });
        console.log(health.statusCode, health.body);

        console.log("\n2. Testing Registration...");
        const postData = JSON.stringify({
            trade_name: 'Test Business',
            legal_name: 'Test Business Pvt Ltd',
            business_category: 'Retail',
            latitude: 13.0,
            longitude: 80.0
        });
        const regOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/v1/license/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const regRes = await request(regOptions, postData);
        console.log(regRes.statusCode, regRes.body);
        const regJson = JSON.parse(regRes.body);

        const qrUuid = regJson.license?.qr_uuid || regJson.qr_uuid;
        if (!qrUuid) throw new Error("No QR UUID returned");

        console.log("\n3. Testing Verify...");
        const verRes = await request({ hostname: 'localhost', port: 3001, path: `/api/v1/license/verify/${qrUuid}?lat=13.0&lng=80.0`, method: 'GET' });
        console.log(verRes.statusCode, verRes.body);

        console.log("\n4. Testing Payment...");
        const payOptions = {
            hostname: 'localhost',
            port: 3001,
            path: `/api/v1/license/pay/${qrUuid}`,
            method: 'POST',
            headers: { 'Content-Length': 0 }
        };
        const payRes = await request(payOptions);
        console.log(payRes.statusCode, payRes.body);

        console.log("\n5. Testing Admin Logs...");
        const logsRes = await request({ hostname: 'localhost', port: 3001, path: `/api/v1/license/admin/logs`, method: 'GET' });
        console.log(logsRes.statusCode, logsRes.body.substring(0, 100) + '...');

    } catch (e) {
        console.error("Test Error:", e);
    }
})();
