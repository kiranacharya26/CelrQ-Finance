// Merchant logo and branding information for popular Indian merchants

export interface MerchantInfo {
    name: string;
    color: string;
    icon: string;
    category?: string;
}

// Comprehensive merchant database with 50+ popular merchants
export const MERCHANT_LOGOS: Record<string, MerchantInfo> = {
    // Food Delivery & Restaurants
    'swiggy': { name: 'Swiggy', color: '#FC8019', icon: '🍔', category: 'Restaurants & Dining' },
    'zomato': { name: 'Zomato', color: '#E23744', icon: '🍕', category: 'Restaurants & Dining' },
    'ubereats': { name: 'Uber Eats', color: '#06C167', icon: '🍱', category: 'Restaurants & Dining' },
    'dominos': { name: "Domino's", color: '#0B6CB7', icon: '🍕', category: 'Restaurants & Dining' },
    'mcdonalds': { name: "McDonald's", color: '#FFC72C', icon: '🍔', category: 'Restaurants & Dining' },
    'kfc': { name: 'KFC', color: '#E4002B', icon: '🍗', category: 'Restaurants & Dining' },
    'starbucks': { name: 'Starbucks', color: '#00704A', icon: '☕', category: 'Restaurants & Dining' },
    'subway': { name: 'Subway', color: '#008C15', icon: '🥪', category: 'Restaurants & Dining' },

    // Groceries & Quick Commerce
    'zepto': { name: 'Zepto', color: '#8B5CF6', icon: '🛒', category: 'Groceries' },
    'blinkit': { name: 'Blinkit', color: '#FFD400', icon: '⚡', category: 'Groceries' },
    'bigbasket': { name: 'BigBasket', color: '#84C225', icon: '🛒', category: 'Groceries' },
    'dunzo': { name: 'Dunzo', color: '#FF3366', icon: '📦', category: 'Groceries' },
    'instamart': { name: 'Instamart', color: '#FC8019', icon: '🛒', category: 'Groceries' },
    'jiomart': { name: 'JioMart', color: '#0066FF', icon: '🛒', category: 'Groceries' },

    // E-commerce
    'amazon': { name: 'Amazon', color: '#FF9900', icon: '📦', category: 'Online Shopping' },
    'flipkart': { name: 'Flipkart', color: '#2874F0', icon: '🛍️', category: 'Online Shopping' },
    'myntra': { name: 'Myntra', color: '#FF3F6C', icon: '👗', category: 'Online Shopping' },
    'ajio': { name: 'AJIO', color: '#C8A876', icon: '👔', category: 'Online Shopping' },
    'meesho': { name: 'Meesho', color: '#9F2089', icon: '🛍️', category: 'Online Shopping' },
    'nykaa': { name: 'Nykaa', color: '#FC2779', icon: '💄', category: 'Online Shopping' },
    'firstcry': { name: 'FirstCry', color: '#FFC629', icon: '👶', category: 'Online Shopping' },

    // Payment Apps
    'paytm': { name: 'Paytm', color: '#00BAF2', icon: '💳', category: 'Other' },
    'phonepe': { name: 'PhonePe', color: '#5F259F', icon: '💰', category: 'Other' },
    'gpay': { name: 'Google Pay', color: '#4285F4', icon: '💸', category: 'Other' },
    'googlepay': { name: 'Google Pay', color: '#4285F4', icon: '💸', category: 'Other' },
    'cred': { name: 'CRED', color: '#0F0F0F', icon: '💳', category: 'Other' },
    'mobikwik': { name: 'MobiKwik', color: '#D91E36', icon: '💰', category: 'Other' },

    // Transport
    'uber': { name: 'Uber', color: '#000000', icon: '🚗', category: 'Ride Services' },
    'ola': { name: 'Ola', color: '#00D77F', icon: '🚕', category: 'Ride Services' },
    'rapido': { name: 'Rapido', color: '#FFC629', icon: '🛵', category: 'Ride Services' },
    'irctc': { name: 'IRCTC', color: '#F37021', icon: '🚂', category: 'Public Transport' },
    'makemytrip': { name: 'MakeMyTrip', color: '#E7352B', icon: '✈️', category: 'Public Transport' },
    'goibibo': { name: 'Goibibo', color: '#FF6D38', icon: '✈️', category: 'Public Transport' },

    // Streaming & Entertainment
    'netflix': { name: 'Netflix', color: '#E50914', icon: '🎬', category: 'Streaming Services' },
    'prime': { name: 'Prime Video', color: '#00A8E1', icon: '📺', category: 'Streaming Services' },
    'hotstar': { name: 'Disney+ Hotstar', color: '#0F1014', icon: '📺', category: 'Streaming Services' },
    'spotify': { name: 'Spotify', color: '#1DB954', icon: '🎵', category: 'Streaming Services' },
    'youtube': { name: 'YouTube Premium', color: '#FF0000', icon: '▶️', category: 'Streaming Services' },
    'apple': { name: 'Apple Music', color: '#FA243C', icon: '🎵', category: 'Streaming Services' },
    'bookmyshow': { name: 'BookMyShow', color: '#C4242B', icon: '🎭', category: 'Events & Recreation' },

    // Telecom
    'airtel': { name: 'Airtel', color: '#E60000', icon: '📱', category: 'Telecom' },
    'jio': { name: 'Jio', color: '#0066FF', icon: '📱', category: 'Telecom' },
    'vi': { name: 'Vi', color: '#E60000', icon: '📱', category: 'Telecom' },
    'vodafone': { name: 'Vodafone Idea', color: '#E60000', icon: '📱', category: 'Telecom' },
    'bsnl': { name: 'BSNL', color: '#0066CC', icon: '📱', category: 'Telecom' },

    // Health & Pharmacy
    'pharmeasy': { name: 'PharmEasy', color: '#10847E', icon: '💊', category: 'Healthcare' },
    '1mg': { name: '1mg', color: '#FF6F61', icon: '💊', category: 'Healthcare' },
    'apollo': { name: 'Apollo Pharmacy', color: '#00A3E0', icon: '⚕️', category: 'Healthcare' },
    'netmeds': { name: 'Netmeds', color: '#1F8A70', icon: '💊', category: 'Healthcare' },
    'cult': { name: 'Cult.fit', color: '#FF3366', icon: '💪', category: 'Healthcare' },

    // Utilities & Bills
    'bses': { name: 'BSES', color: '#0066CC', icon: '⚡', category: 'Utilities' },
    'tatapower': { name: 'Tata Power', color: '#1B4F9B', icon: '⚡', category: 'Utilities' },
    'adani': { name: 'Adani Gas', color: '#0066CC', icon: '🔥', category: 'Utilities' },
};

// Category default icons
export const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
    'Groceries': { icon: '🛒', color: '#84C225' },
    'Restaurants & Dining': { icon: '🍔', color: '#FC8019' },
    'Fuel': { icon: '⛽', color: '#FF6B6B' },
    'Ride Services': { icon: '🚗', color: '#000000' },
    'Public Transport': { icon: '🚌', color: '#4A90E2' },
    'Telecom': { icon: '📱', color: '#E60000' },
    'Online Shopping': { icon: '🛍️', color: '#2874F0' },
    'Retail & Stores': { icon: '🏪', color: '#FF9800' },
    'Streaming Services': { icon: '📺', color: '#E50914' },
    'Events & Recreation': { icon: '🎭', color: '#9C27B0' },
    'Housing': { icon: '🏠', color: '#795548' },
    'Education': { icon: '🎓', color: '#3F51B5' },
    'Income': { icon: '💰', color: '#4CAF50' },
    'Insurance': { icon: '🛡️', color: '#607D8B' },
    'Investments': { icon: '📈', color: '#00BCD4' },
    'Personal Care': { icon: '💅', color: '#E91E63' },
    'Healthcare': { icon: '⚕️', color: '#00A3E0' },
    'Utilities': { icon: '⚡', color: '#FFC107' },
    'Credit Card Payments': { icon: '💳', color: '#9E9E9E' },
    'Automotive': { icon: '🚗', color: '#546E7A' },
    'Shopping': { icon: '🛍️', color: '#EC407A' },
    'Other': { icon: '�', color: '#9E9E9E' },
};

/**
 * Get category icon and color
 */
export function getCategoryIcon(category: string): { icon: string; color: string } {
    return CATEGORY_ICONS[category] || { icon: '📌', color: '#9E9E9E' };
}

/**
 * Get display info for a transaction (merchant or category fallback)
 * This is used for UI display only.
 */
export function getTransactionDisplayInfo(
    narration: string,
    category: string
): { name: string; icon: string; color: string; subtitle: string } {
    const lower = (narration || '').toLowerCase();

    // Simple lookup in MERCHANT_LOGOS
    let foundInfo: MerchantInfo | null = null;
    for (const [key, info] of Object.entries(MERCHANT_LOGOS)) {
        if (lower.includes(key)) {
            foundInfo = info;
            break;
        }
    }

    if (foundInfo) {
        return {
            name: foundInfo.name,
            icon: foundInfo.icon,
            color: foundInfo.color,
            subtitle: category || foundInfo.category || 'Other',
        };
    }

    // Fallback to category
    const categoryInfo = getCategoryIcon(category);
    return {
        name: narration || category || 'Transaction',
        icon: categoryInfo.icon,
        color: categoryInfo.color,
        subtitle: category || 'Other',
    };
}
