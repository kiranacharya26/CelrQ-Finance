const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
    console.log('🔍 Checking Supabase database...\n');

    const { data, error } = await supabase
        .from('transactions')
        .select('date, description')
        .order('date', { ascending: true });

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log(`📊 Total transactions: ${data.length}\n`);

        if (data.length > 0) {
            const dates = data.map(r => r.date).filter(Boolean);
            console.log(`📅 Date Range:`);
            console.log(`   First: ${dates[0]}`);
            console.log(`   Last: ${dates[dates.length - 1]}\n`);

            console.log(`📅 First 10 transactions:`);
            data.slice(0, 10).forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.date} - ${t.description?.substring(0, 50)}`);
            });

            console.log(`\n📅 Last 10 transactions:`);
            data.slice(-10).forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.date} - ${t.description?.substring(0, 50)}`);
            });

            // Count by month
            const monthCounts = {};
            dates.forEach(d => {
                const month = d.substring(0, 7); // YYYY-MM
                monthCounts[month] = (monthCounts[month] || 0) + 1;
            });

            console.log(`\n📅 Transactions by Month:`);
            Object.keys(monthCounts).sort().forEach(month => {
                console.log(`   ${month}: ${monthCounts[month]} transactions`);
            });

            // Check if April-October 2024 exists
            const missingMonths = [];
            const expectedMonths = [
                '2024-04', '2024-05', '2024-06', '2024-07',
                '2024-08', '2024-09', '2024-10'
            ];

            expectedMonths.forEach(month => {
                if (!monthCounts[month]) {
                    missingMonths.push(month);
                }
            });

            if (missingMonths.length > 0) {
                console.log(`\n⚠️  Missing months: ${missingMonths.join(', ')}`);
            } else {
                console.log(`\n✅ All months from April 2024 to October 2024 are present!`);
            }
        }
    }
})();
