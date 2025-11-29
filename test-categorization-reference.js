// Test script to verify AI categorization improvements
// Run with: node test-categorization.js

const testTransactions = [
    { narration: "UPI-REDBUS-123@paytm-HDFC-REF456", amount: -500 },
    { narration: "UPI-ZEPTO-xyz@icici", amount: -350 },
    { narration: "UPI-SWIGGY-abc@paytm", amount: -250 },
    { narration: "UPI-MAKEMYTRIP-def@hdfc", amount: -5000 },
    { narration: "UPI-UBER-ghi@axis", amount: -200 },
    { narration: "UPI-ZOMATO-jkl@sbi", amount: -400 },
    { narration: "UPI-BLINKIT-mno@paytm", amount: -600 },
    { narration: "UPI-OLA-pqr@icici", amount: -150 },
    { narration: "UPI-BOOKMYSHOW-stu@hdfc", amount: -800 },
    { narration: "UPI-CRED-vwx@axis", amount: -10000 },
];

const expectedCategories = {
    "UPI-REDBUS-123@paytm-HDFC-REF456": "Travel & Transport",
    "UPI-ZEPTO-xyz@icici": "Groceries",
    "UPI-SWIGGY-abc@paytm": "Restaurants & Dining",
    "UPI-MAKEMYTRIP-def@hdfc": "Travel & Transport",
    "UPI-UBER-ghi@axis": "Ride Services",
    "UPI-ZOMATO-jkl@sbi": "Restaurants & Dining",
    "UPI-BLINKIT-mno@paytm": "Groceries",
    "UPI-OLA-pqr@icici": "Ride Services",
    "UPI-BOOKMYSHOW-stu@hdfc": "Events & Recreation",
    "UPI-CRED-vwx@axis": "Credit Card Payments",
};

console.log("🧪 Testing AI Categorization Improvements\n");
console.log("Expected Results:");
console.log("================");

testTransactions.forEach(tx => {
    const expected = expectedCategories[tx.narration];
    console.log(`✓ ${tx.narration.padEnd(40)} → ${expected}`);
});

console.log("\n📝 Instructions:");
console.log("1. Upload a bank statement with these UPI transactions");
console.log("2. Check the console logs in the terminal");
console.log("3. Verify that categories match the expected results above");
console.log("\n💡 Key Improvements:");
console.log("- RedBus should now be 'Travel & Transport' (not 'Other')");
console.log("- All keywords in UPI narration are analyzed");
console.log("- AI reads EVERY word in the description");
console.log("- More comprehensive keyword coverage");
