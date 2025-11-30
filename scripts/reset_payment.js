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

async function resetPayment() {
    console.log('Resetting payment status for soukir826@gmail.com...');

    const email = 'soukir826@gmail.com';

    // Delete all payment records for this email
    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('email', email);

    if (error) {
        console.error('❌ Failed to delete payment record:', error);
    } else {
        console.log('✅ Successfully deleted payment records.');
        console.log('You should now see the payment option again on the home page.');
    }
}

resetPayment();
