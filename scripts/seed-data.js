require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    console.log('Seeding data...');

    // 1. Create Organizations
    const organizations = [
        { name: 'Acme Corp', background: 'Technology', insightly_id: 2001 },
        { name: 'Globex Inc', background: 'Manufacturing', insightly_id: 2002 },
        { name: 'Soylent Corp', background: 'Food & Beverage', insightly_id: 2003 },
        { name: 'Initech', background: 'Software', insightly_id: 2004 },
        { name: 'Umbrella Corp', background: 'Pharmaceuticals', insightly_id: 2005 }
    ];

    let organizationIds = [];

    for (const org of organizations) {
        // Check if organization exists
        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('name', org.name)
            .single();

        if (existing) {
            organizationIds.push(existing.id);
        } else {
            const { data, error } = await supabase
                .from('organizations')
                .insert(org)
                .select('id')
                .single();

            if (error) console.error('Error creating organization:', error);
            else organizationIds.push(data.id);
        }
    }

    console.log(`Created/Updated ${organizationIds.length} organizations.`);

    if (organizationIds.length === 0) return;

    // 2. Create Contacts
    const contacts = [
        { first_name: 'Alice', last_name: 'Johnson', email: 'alice@acme.com', role: 'CEO', account_id: organizationIds[0], insightly_id: 3001 },
        { first_name: 'Bob', last_name: 'Smith', email: 'bob@globex.com', role: 'CTO', account_id: organizationIds[1], insightly_id: 3002 },
        { first_name: 'Charlie', last_name: 'Brown', email: 'charlie@soylent.com', role: 'Manager', account_id: organizationIds[2], insightly_id: 3003 },
        { first_name: 'Peter', last_name: 'Gibbons', email: 'peter@initech.com', role: 'Developer', account_id: organizationIds[3], insightly_id: 3004 },
        { first_name: 'Jill', last_name: 'Valentine', email: 'jill@umbrella.com', role: 'Security', account_id: organizationIds[4], insightly_id: 3005 }
    ];

    for (const contact of contacts) {
        // Check if contact exists
        const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', contact.email)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('contacts')
                .insert(contact);

            if (error) console.error('Error creating contact:', error);
        }
    }

    console.log('Created/Updated contacts.');

    // 3. Create Opportunities
    const opportunities = [
        { opportunity_name: 'Acme Cloud Migration', opportunity_value: 50000, stage_id: 1, opportunity_state: 'OPEN', forecast_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), insightly_id: 1001 },
        { opportunity_name: 'Globex Machinery Upgrade', opportunity_value: 120000, stage_id: 2, opportunity_state: 'OPEN', forecast_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), insightly_id: 1002 },
        { opportunity_name: 'Soylent New Flavor Launch', opportunity_value: 15000, stage_id: 3, opportunity_state: 'WON', forecast_close_date: new Date(), insightly_id: 1003 },
        { opportunity_name: 'Initech TPS Report Automation', opportunity_value: 8000, stage_id: 1, opportunity_state: 'OPEN', forecast_close_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), insightly_id: 1004 },
        { opportunity_name: 'Umbrella Security Audit', opportunity_value: 250000, stage_id: 2, opportunity_state: 'OPEN', forecast_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), insightly_id: 1005 }
    ];

    for (const opp of opportunities) {
        // Check if opportunity exists
        const { data: existing } = await supabase
            .from('opportunities')
            .select('id')
            .eq('opportunity_name', opp.opportunity_name)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('opportunities')
                .insert(opp);

            if (error) console.error('Error creating opportunity:', error);
        }
    }

    console.log('Created/Updated opportunities.');

    // 4. Create Team Members
    const teamMembers = [
        { first_name: 'Michael', last_name: 'Scott', email: 'michael@dundermifflin.com', role: 'manager', insightly_user_id: 1 },
        { first_name: 'Jim', last_name: 'Halpert', email: 'jim@dundermifflin.com', role: 'member', insightly_user_id: 2 },
        { first_name: 'Dwight', last_name: 'Schrute', email: 'dwight@dundermifflin.com', role: 'admin', insightly_user_id: 3 },
        { first_name: 'Pam', last_name: 'Beesly', email: 'pam@dundermifflin.com', role: 'member', insightly_user_id: 4 }
    ];

    for (const member of teamMembers) {
        const { data: existing } = await supabase
            .from('team_members')
            .select('id')
            .eq('email', member.email)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('team_members')
                .insert(member);

            if (error) console.error('Error creating team member:', error);
        }
    }

    console.log('Created/Updated team members.');
    console.log('Seeding complete.');
}

seedData().catch(console.error);
