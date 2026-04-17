const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const MAX_RETRIES = 5;
    let retries = 0;

    console.log('--- Database Migration Started ---');
    
    while (retries < MAX_RETRIES) {
        try {
            let connection;
            const config = process.env.MYSQL_URL 
                ? process.env.MYSQL_URL + (process.env.MYSQL_URL.includes('?') ? '&' : '?') + 'multipleStatements=true'
                : {
                    host: process.env.DB_HOST || 'localhost',
                    port: process.env.DB_PORT || 3307,
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASS || '',
                    database: process.env.DB_NAME || 'student_portal',
                    multipleStatements: true
                };

            console.log('--- Database Connection Info ---');
            if (process.env.MYSQL_URL) {
                console.log('Using MYSQL_URL:', process.env.MYSQL_URL);
            } else {
                console.log('Using DB_HOST:', config.host);
                console.log('Using DB_PORT:', config.port);
                console.log('Using DB_USER:', config.user);
                console.log('Using DB_NAME:', config.database);
            }
            
            connection = await mysql.createConnection(config);
            
            console.log("✅ Connection established. Running migration...");
            const sql = fs.readFileSync('database.sql', 'utf8');
            await connection.query(sql);
            console.log("✅ Database updated successfully");
            await connection.end();
            process.exit(0);
        } catch (err) {
            retries++;
            console.error(`⚠️ Migration Attempt ${retries} failed:`, err.message);
            if (retries >= MAX_RETRIES) {
                console.error("❌ Max retries reached. Migration failed permanently.");
                process.exit(1);
            }
            console.log(`Waiting 5 seconds before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

migrate();
