require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking for opportunities table...');
    const { data, error } = await supabase
        .from('opportunities')
        .select('id')
        .limit(1);

    if (error) {
        console.error('Error checking table:', error.message);
        if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
            console.log('Table "opportunities" does not exist.');
        }
    } else {
        console.log('Table "opportunities" exists.');
    }
}

checkTables();
