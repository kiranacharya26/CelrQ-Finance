import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    console.warn('Missing OPENAI_API_KEY environment variable');
}

export const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function categorizeTransactions(rawInput: string | any[], learnedKeywords: Record<string, string[]> = {}) {
    // 1. Parse Input
    const rawArray: any[] = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;

    // 2. Define Local Keyword Logic (Expanded for India)
    const keywordMap: Record<string, string[]> = {
        Healthcare: ['medic', 'pharma', 'hospital', 'clinic', 'doctor', 'apollo', '1mg', 'practo', 'diagnostic', 'health', 'cure'],
        Groceries: ['grocery', 'supermarket', 'zepto', 'blinkit', 'bigbasket', 'dmart', 'reliance fresh', 'more', 'jiomart', 'dunzo', 'vegetable', 'fruits', 'veggie', 'hopcoms', 'instamart', 'swiggy instamart'],
        "Restaurants & Dining": ['restaurant', 'zomato', 'swiggy', 'cafe', 'domino', 'pizza', 'burger', 'kfc', 'mcdonald', 'starbucks', 'coffee', 'tea', 'bar', 'dining', 'dhaba', 'biryani', 'mess', 'canteen', 'tiffin', 'eatery', 'dine', 'food'],
        Fuel: ['fuel', 'petrol', 'diesel', 'hpcl', 'bpcl', 'ioc', 'shell', 'gas station', 'bharat petroleum', 'indian oil'],
        "Ride Services": ['uber', 'ola', 'rapido', 'auto', 'cab', 'taxi', 'namma yatri', 'rideshare'],
        "Travel & Transport": ['redbus', 'makemytrip', 'goibibo', 'yatra', 'cleartrip', 'ixigo', 'abhibus', 'bus ticket', 'flight', 'hotel booking', 'travel', 'booking', 'trip', 'holiday', 'vacation', 'airbnb', 'oyo', 'treebo'],
        "Public Transport": ['metro', 'bus', 'rail', 'irctc', 'train', 'fastag', 'toll', 'bmtc', 'ksrtc', 'railway', 'ticket'],
        "Utilities": ['electricity', 'water', 'gas cylinder', 'bescom', 'bwssb', 'electricity bill', 'water bill', 'lpg', 'indane', 'utility'],
        "Credit Card Payments": ['cred', 'credit card', 'cc payment', 'card payment', 'cheq'],
        // More specific telecom keywords - avoid generic 'phone'
        Telecom: [
            'mobile recharge', 'phone recharge', 'mobile bill', 'phone bill', 'telecom',
            'airtel', 'jio', 'vi', 'vodafone', 'bsnl', 'idea',
            'internet bill', 'broadband', 'wifi', 'fiber',
            'prepaid recharge', 'postpaid bill',
            'dth', 'tatasky', 'dish tv', 'sun direct', 'airtel digital',
            'act fibernet', 'hathway', 'tikona',
            'mobile data', 'data pack', 'talk time', 'validity'
        ],
        "Online Shopping": ['amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'amazon.in', 'shopping', 'ecommerce'],
        "Retail & Stores": ['mall', 'decathlon', 'ikea', 'croma', 'reliance', 'trends', 'zudio', 'h&m', 'zara', 'uniqlo', 'lifestyle', 'store', 'retail'],
        "Streaming Services": ['netflix', 'prime', 'hotstar', 'spotify', 'youtube premium', 'disney', 'subscription', 'streaming'],
        "Events & Recreation": ['movie', 'theatre', 'bookmyshow', 'pvr', 'inox', 'game', 'steam', 'playstation', 'concert', 'event', 'cinema', 'entertainment'],
        Housing: ['rent', 'rental', 'lease', 'landlord', 'tenant', 'maintenance', 'society', 'housing', 'apartment', 'flat', 'nobroker', 'nestaway', 'deposit', 'advance', 'radhakrishna k l', 'klradhakrishna'],
        Education: ['school', 'college', 'course', 'tuition', 'education', 'book', 'udemy', 'coursera', 'skillshare', 'learning', 'academy', 'study'],
        Income: ['salary', 'credit', 'refund', 'cashback', 'payment received', 'interest', 'dividend', 'reversal', 'income'],
        Insurance: ['insurance', 'policy', 'lic', 'acko', 'digit', 'star health', 'hdfc ergo', 'premium'],
        Investments: ['mutual fund', 'sip', 'stock', 'investment', 'zerodha', 'groww', 'upstox', 'coin', 'smallcase', 'equity', 'shares'],
        "Personal Care": ['salon', 'spa', 'gym', 'fitness', 'cult', 'urban company', 'hair', 'beauty', 'parlour', 'grooming']
    };

    // Merge learned keywords into the map
    Object.entries(learnedKeywords).forEach(([cat, keywords]) => {
        if (!keywordMap[cat]) {
            // If category doesn't exist in our map (e.g. custom category), add it
            keywordMap[cat] = [...keywords];
        } else {
            // Add unique keywords
            keywords.forEach(k => {
                if (!keywordMap[cat].includes(k.toLowerCase())) {
                    keywordMap[cat].push(k.toLowerCase());
                }
            });
        }
    });

    const mapCategory = (desc: string) => {
        const lower = (desc || '').toLowerCase();
        for (const [cat, keys] of Object.entries(keywordMap)) {
            // Use word boundary to avoid partial matches (e.g. "cure" in "secure")
            // Escape special regex characters in keywords just in case
            if (keys.some(k => {
                const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                return regex.test(lower);
            })) {
                return cat;
            }
        }
        return 'Other';
    };

    // Helper to find the best description field
    const findDescription = (obj: any): string => {
        const keys = Object.keys(obj);
        const descKey = keys.find(k => /description|narration|particulars|details|memo/i.test(k));
        if (descKey) {
            let desc = obj[descKey];

            // For UPI transactions, we want to preserve the FULL string for keyword matching
            // but also try to extract and highlight the merchant name
            if (typeof desc === 'string' && (desc.toLowerCase().includes('upi-') || desc.toLowerCase().includes('upi/'))) {
                // Keep the full description for keyword matching
                // The keyword map will now match against the entire UPI string
                // Example: "UPI-REDBUS-123@paytm-HDFC-REF123" will match "redbus" keyword

                // Try to extract merchant for better AI analysis (but keep full string too)
                const parts = desc.split(/[-/]/);
                if (parts.length >= 2) {
                    // Look for merchant name in parts
                    let merchantCandidate = '';

                    // Try parts 1, 2, 3 to find the best merchant name
                    for (let i = 1; i < Math.min(parts.length, 4); i++) {
                        const part = parts[i].trim();

                        // Skip if it's just numbers, UPI IDs (@), or very short
                        if (/^[\d@]+$/.test(part) || part.includes('@') || part.length < 3) {
                            continue;
                        }

                        // Skip common bank names and UPI keywords
                        const skipWords = ['upi', 'hdfc', 'icici', 'axis', 'sbi', 'paytm', 'phonepe', 'gpay', 'googlepay', 'bhim'];
                        if (skipWords.some(w => part.toLowerCase().includes(w))) {
                            continue;
                        }

                        merchantCandidate = part;
                        break;
                    }

                    // Clean up merchant name
                    if (merchantCandidate) {
                        let merchant = merchantCandidate
                            .replace(/CO$/i, '') // WAKEFITCO → WAKEFIT
                            .replace(/PVT$/i, '')
                            .replace(/LTD$/i, '')
                            .replace(/INC$/i, '')
                            .replace(/LLP$/i, '')
                            .replace(/\d+$/i, '') // Remove trailing numbers
                            .trim();

                        // Return the full description with merchant highlighted
                        // This way keyword matching works on full string, but AI sees merchant too
                        if (merchant.length > 2) {
                            return `${desc} [Merchant: ${merchant}]`;
                        }
                    }
                }

                // Return full UPI string even if we couldn't extract merchant
                // This ensures ALL keywords are checked
                return desc;
            }

            return desc;
        }

        let bestVal = '';
        for (const val of Object.values(obj)) {
            if (typeof val === 'string' && val.length > bestVal.length && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                bestVal = val;
            }
        }
        return bestVal;
    };

    // 3. Apply Local Categorization First
    const results = rawArray.map(t => {
        const desc = findDescription(t);
        return {
            ...t,
            _description: desc,
            category: mapCategory(desc)
        };
    });

    // 4. Identify "Other" transactions
    const uncategorizedIndices = results
        .map((t, i) => (t.category === 'Other' ? i : -1))
        .filter(i => i !== -1);

    const categorizedCount = results.length - uncategorizedIndices.length;
    if (categorizedCount > 0) {
        console.log(`✅ Locally categorized ${categorizedCount}/${results.length} transactions using learned rules.`);
    }

    if (uncategorizedIndices.length === 0 || !openai) {
        console.log("🎉 All transactions categorized locally! Zero AI cost.");
        return { results, newlyLearnedKeywords: {} };
    }

    // 5. Deduplicate Descriptions for OpenAI
    const uniqueDescriptions = new Set<string>();
    const descriptionToIndices: Record<string, number[]> = {};

    uncategorizedIndices.forEach(index => {
        const desc = results[index]._description || 'Unknown';
        if (!uniqueDescriptions.has(desc)) {
            uniqueDescriptions.add(desc);
        }
        if (!descriptionToIndices[desc]) {
            descriptionToIndices[desc] = [];
        }
        descriptionToIndices[desc].push(index);
    });

    const uniqueDescArray = Array.from(uniqueDescriptions);
    console.log(`🤖 Sending ${uniqueDescArray.length} unique transactions to AI (${uncategorizedIndices.length} total uncategorized, ${results.filter(r => r.category !== 'Other').length} categorized locally)`);

    // Prepare payload (list of descriptions only)
    const payloadObj = uniqueDescArray.map((desc, i) => ({ id: i, description: desc }));
    const rawDataString = JSON.stringify(payloadObj);

    // Limit payload size
    const payload = rawDataString.substring(0, 15000);

    const prompt = `You are a financial categorization expert with deep knowledge of thousands of global and Indian businesses, brands, and services.

Your task: Categorize each transaction by carefully analyzing EVERY WORD in the description/narration.

CATEGORIES:
- Healthcare, Groceries, Restaurants & Dining, Fuel, Ride Services, Travel & Transport, Public Transport
- Utilities, Credit Card Payments, Telecom, Online Shopping, Retail & Stores
- Streaming Services, Events & Recreation, Housing, Education, Income
- Insurance, Investments, Personal Care, Other

CRITICAL INSTRUCTIONS:

1. **READ EVERY SINGLE WORD** - Scan the ENTIRE description string. Don't skip any part.
   - For UPI transactions like "UPI-REDBUS-123@paytm-HDFC-REF456", read ALL parts: UPI, REDBUS, 123, paytm, HDFC, REF456
   - The merchant name can appear ANYWHERE in the string (beginning, middle, or end)

2. **Recognize Indian brands and services**:
   - RedBus, MakeMyTrip, Goibibo = Travel & Transport (bus/flight booking)
   - Zepto, Blinkit, BigBasket = Groceries
   - Zomato, Swiggy = Restaurants & Dining (unless it says "Instamart" then it's Groceries)
   - Uber, Ola, Rapido = Ride Services
   - BookMyShow = Events & Recreation
   - And hundreds more...

3. **Use your knowledge** - You have extensive knowledge of what companies do:
   - Wakefit = furniture/mattresses → Retail & Stores
   - Bombae = men's grooming → Personal Care
   - Cred, Cheq = credit card payments
   - 1mg, Practo, Apollo = Healthcare
   - Cult.fit = gym/fitness → Personal Care

4. **Be CONTEXT-AWARE and SPECIFIC**:
   - "PAYMENT FROM PHONE" is NOT Telecom - it's just a payment method (use "Other" unless you can identify the actual merchant)
   - "PHONE RECHARGE" or "MOBILE RECHARGE" IS Telecom
   - "PHONE BILL" or "MOBILE BILL" IS Telecom
   - "AIRTEL", "JIO", "VI", "VODAFONE" = Telecom
   - "PAYMENT VIA APP" is NOT a category - look for the actual merchant/purpose
   - Don't categorize based on payment method - categorize based on what was purchased

5. **Telecom-specific rules**:
   - Only categorize as Telecom if it explicitly mentions:
     * Mobile/phone RECHARGE, BILL, or DATA
     * Telecom provider names (Airtel, Jio, Vi, BSNL, etc.)
     * Internet/broadband service providers
     * DTH services (Tatasky, Dish TV, etc.)
   - Generic words like "phone", "mobile", "payment" alone are NOT enough for Telecom

6. **Extract keywords** - Identify the main merchant/brand name (lowercase, no spaces)

7. **Only use "Other"** if you genuinely cannot identify the merchant after reading the entire description

EXAMPLES:
- "UPI-REDBUS-abc@paytm-HDFC-123" → Category: "Travel & Transport", Keyword: "redbus"
- "UPI-ZEPTO-xyz@icici" → Category: "Groceries", Keyword: "zepto"
- "SWIGGY INSTAMART" → Category: "Groceries", Keyword: "instamart"
- "SWIGGY ORDER" → Category: "Restaurants & Dining", Keyword: "swiggy"
- "UPI-WAKEFIT-123" → Category: "Retail & Stores", Keyword: "wakefit"
- "AIRTEL MOBILE RECHARGE" → Category: "Telecom", Keyword: "airtel"
- "JIO PREPAID RECHARGE" → Category: "Telecom", Keyword: "jio"
- "PAYMENT FROM PHONE" → Category: "Other", Keyword: "payment" (NOT Telecom - no recharge/bill mentioned)
- "PAYMENT VIA PHONEPE TO MERCHANT" → Look for merchant name, not "Telecom"

OUTPUT FORMAT (JSON only):
{"categories": [{"id": 0, "category": "Travel & Transport", "keyword": "redbus"}, {"id": 1, "category": "Groceries", "keyword": "zepto"}, ...]}

TRANSACTIONS TO ANALYZE:
${payload}

Remember: Read EVERY word in each description. The merchant name is hiding somewhere in there!`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("Empty response");

        const parsed = JSON.parse(content);
        const aiResults = parsed.categories || [];
        const newlyLearnedKeywords: Record<string, string[]> = {};

        // 6. Map AI results back to ALL matching transactions
        aiResults.forEach((item: any) => {
            const originalDesc = uniqueDescArray[item.id];
            const category = item.category;
            const keyword = item.keyword ? item.keyword.toLowerCase().trim() : null;

            if (originalDesc && category && category !== 'Other') {
                const indicesToUpdate = descriptionToIndices[originalDesc];
                indicesToUpdate.forEach(idx => {
                    results[idx].category = category;
                });

                // Track learned keyword if it's new
                if (keyword && keyword.length > 2) { // Ignore very short keywords
                    // Check if we already know this keyword
                    const knownKeywords = keywordMap[category] || [];
                    if (!knownKeywords.includes(keyword)) {
                        if (!newlyLearnedKeywords[category]) {
                            newlyLearnedKeywords[category] = [];
                        }
                        // Avoid duplicates in the new batch
                        if (!newlyLearnedKeywords[category].includes(keyword)) {
                            newlyLearnedKeywords[category].push(keyword);
                        }
                    }
                }
            }
        });

        return { results, newlyLearnedKeywords };

    } catch (e) {
        console.error("OpenAI error", e);
        return { results, newlyLearnedKeywords: {} };
    }
}
