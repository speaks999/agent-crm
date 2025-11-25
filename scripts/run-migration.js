require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!dbUrl) {
        console.error('DATABASE_URL or POSTGRES_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const migrationPath = path.join(__dirname, '../supabase/migrations/20250123000000_insightly_integration.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
