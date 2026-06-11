const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'tn_mbnr_production.db');
const db = new sqlite3.Database(dbPath);

const exportData = () => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                m.id as merchant_id,
                m.trade_name,
                m.legal_name,
                m.business_category,
                l.status as license_status,
                l.qr_uuid,
                l.registration_timestamp,
                l.license_valid_till
            FROM merchants m
            LEFT JOIN licenses l ON m.id = l.merchant_id
        `, [], (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) {
                console.log("No data found in the database to export.");
                resolve();
                return;
            }

            // Get headers
            const headers = Object.keys(rows[0]).join(',');
            
            // Map rows
            const csvRows = rows.map(row => {
                return Object.values(row).map(value => {
                    if (value === null || value === undefined) return '';
                    // Escape quotes and wrap in quotes if there's a comma
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',');
            });

            const csvContent = [headers, ...csvRows].join('\n');
            const outputPath = path.join(__dirname, 'database_export.csv');
            
            fs.writeFileSync(outputPath, csvContent, 'utf8');
            console.log(`Data successfully exported to ${outputPath}`);
            resolve(outputPath);
        });
    });
};

exportData()
    .then(() => {
        db.close();
    })
    .catch(err => {
        console.error("Export failed:", err);
        db.close();
    });
