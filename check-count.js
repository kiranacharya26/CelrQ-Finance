const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
    console.log("Checking total count...");

    // Try to get count first
    const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error getting count:", countError);
    } else {
        console.log("Total rows in DB (exact count):", count);
    }

    // Try fetching page 2 (rows 1000-2000)
    const { data: page2, error: page2Error } = await supabase
        .from('transactions')
        .select('*')
        .range(1000, 1999);

    if (page2Error) {
        console.error("Error fetching page 2:", page2Error);
    } else {
        console.log("Rows in page 2 (1000-1999):", page2.length);
        if (page2.length > 0) {
            console.log("Sample date from page 2:", page2[0].date);
        }
    }
})();
