const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPayment() {
    console.log('Attempting to fix payment for soukir826@gmail.com...');

    const userId = '111144032102116643473';
    const email = 'soukir826@gmail.com';

    // 1. Check if table exists
    const { error: checkError } = await supabase.from('payments').select('id').limit(1);

    if (checkError) {
        if (checkError.code === 'PGRST205' || checkError.message.includes('does not exist')) {
            console.error('❌ CRITICAL: The "payments" table does not exist!');
            console.error('Please run the SQL migration provided in supabase/migrations/05_create_payments_table.sql');
            return;
        }
        console.error('Error checking table:', checkError);
    }

    // 2. Insert Payment Record
    const { data, error } = await supabase.from('payments').upsert({
        order_id: `manual_fix_${Date.now()}`,
        user_id: userId,
        email: email,
        amount: 499.00,
        currency: 'INR',
        status: 'PAID',
        payment_method: 'MANUAL_FIX',
        metadata: { note: 'Emergency fix via script' }
    }, { onConflict: 'order_id' }).select();

    if (error) {
        console.error('❌ Failed to insert payment record:', error);
    } else {
        console.log('✅ Successfully inserted PAID record for user.');
        console.log('Record:', data);
        console.log('You should now be able to access the dashboard.');
    }
}

fixPayment();
