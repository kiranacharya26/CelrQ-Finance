import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUploadsSchema() {
    console.log('🔍 Checking uploads table schema...');

    // We can't easily query information_schema via the client SDK if RLS is on or permissions are restricted,
    // but we can try a simple select to see what columns come back or fail.
    const { data, error } = await supabase.from('uploads').select('*').limit(1);

    if (error) {
        console.error('Error fetching from uploads:', error);
    } else {
        console.log('Columns found in uploads:', data.length > 0 ? Object.keys(data[0]) : 'No data to check columns');
    }

    // Try to get column info via RPC or direct query if possible
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'uploads' });
    if (colError) {
        // If RPC doesn't exist, try a raw query if we have permissions (usually not via client)
        console.log('RPC get_table_columns failed, likely doesn\'t exist.');
    } else {
        console.log('Columns (via RPC):', cols);
    }
}

checkUploadsSchema();
