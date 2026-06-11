const axios = require('axios');

async function testPhase6() {
    const API_URL = 'http://localhost:3001/api/v1/license';
    
    console.log("=== Running Phase 6 Multi-Tenant Tests ===");

    try {
        console.log("\n1. Registering Business in Madurai Tenant...");
        const regRes = await axios.post(`${API_URL}/register`, {
            trade_name: "Madurai Spice",
            tenant_id: "tn-madurai",
            latitude: 9.9252,
            longitude: 78.1198
        });
        
        const { qr_uuid } = regRes.data;
        console.log("Registration Successful! QR UUID:", qr_uuid);

        console.log("\n2. Scanning QR code as Madurai Tenant (Expected: Success)");
        const verifyMadurai = await axios.get(`${API_URL}/verify/${qr_uuid}?tenant_id=tn-madurai`);
        console.log("Result:", verifyMadurai.data.status);

        console.log("\n3. Scanning QR code as Chennai Tenant (Expected: COUNTERFEIT)");
        try {
            await axios.get(`${API_URL}/verify/${qr_uuid}?tenant_id=tn-chennai`);
        } catch (err) {
            console.log("Result:", err.response.data.status, "-", err.response.data.message_en);
        }

        console.log("\n4. Fetching Madurai Registry (Expected: Contains Madurai Spice)");
        const registryMadurai = await axios.get(`${API_URL}/registry?tenant_id=tn-madurai`);
        const foundInMadurai = registryMadurai.data.data.some(m => m.tradeName === "Madurai Spice");
        console.log("Found in Madurai Registry?", foundInMadurai);

        console.log("\n5. Fetching Chennai Registry (Expected: Does NOT contain Madurai Spice)");
        const registryChennai = await axios.get(`${API_URL}/registry?tenant_id=tn-chennai`);
        const foundInChennai = registryChennai.data.data.some(m => m.tradeName === "Madurai Spice");
        console.log("Found in Chennai Registry?", foundInChennai);

        if (foundInMadurai && !foundInChennai) {
            console.log("\n✅ ALL PHASE 6 TENANT ISOLATION TESTS PASSED!");
        } else {
            console.log("\n❌ TENANT ISOLATION FAILED!");
        }

    } catch (error) {
        console.error("Test failed to run:", error.response ? error.response.data : error.message);
    }
}

testPhase6();
