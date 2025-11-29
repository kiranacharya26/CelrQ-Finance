const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env manually (same as check-db-dates)
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
    const { data, error } = await supabase.from('transactions').select('*').limit(100000);
    if (error) { console.error('Error:', error); return; }

    // Detect keys like in dashboard page
    const allKeys = new Set();
    data.slice(0, 50).forEach(t => Object.keys(t).forEach(k => allKeys.add(k)));
    const keys = Array.from(allKeys);
    const dateKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'));
    console.log('Detected dateKey:', dateKey);

    if (!dateKey) { console.log('No date key'); return; }

    const uniqueMonths = new Map();
    let parsed = 0, failed = 0;
    data.forEach(t => {
        const raw = t[dateKey];
        const date = new Date(raw);
        if (!isNaN(date.getTime())) {
            const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!uniqueMonths.has(monthStr)) uniqueMonths.set(monthStr, date);
            parsed++;
        } else {
            failed++;
        }
    });
    const months = Array.from(uniqueMonths.entries())
        .sort(([, a], [, b]) => a - b)
        .map(([m]) => m);

    console.log('Parsed', parsed, 'failed', failed);
    console.log('Months found:', months);
})();
