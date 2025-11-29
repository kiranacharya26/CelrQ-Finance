// Quick test to verify date parsing
const testDates = [
    '2024-04-01',
    '2024-05-15',
    '2024-10-31',
    '2024-11-01',
    '2025-03-31'
];

console.log('Testing date parsing and month extraction:\n');

testDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    console.log(`${dateStr} → ${monthStr}`);
});

console.log('\n✅ All dates should parse correctly to their month names');
console.log('If the dashboard still doesn\'t show all months, the issue is in the React component rendering');
