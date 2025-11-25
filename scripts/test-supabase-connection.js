const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    try {
        // Read .env.local
        const envPath = path.join(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('Error: .env.local file not found');
            process.exit(1);
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
                envVars[key] = value;
            }
        });

        const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
        const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

        if (!supabaseUrl || !supabaseKey) {
            console.error('Error: Missing Supabase credentials in .env.local');
            console.log('Found:', Object.keys(envVars));
            process.exit(1);
        }

        console.log('Connecting to Supabase at:', supabaseUrl);
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Try a simple request - auth.getSession is usually safe and doesn't require tables
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Connection failed with error:', error.message);
            process.exit(1);
        } else {
            console.log('Successfully connected to Supabase!');
            console.log('Session check result:', data ? 'OK' : 'No Session (Expected)');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

testConnection();
