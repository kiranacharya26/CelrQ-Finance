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
    'swiggy': { name: 'Swiggy', color: '#FC8019', icon: 'Utensils', category: 'Restaurants & Dining' },
    'zomato': { name: 'Zomato', color: '#E23744', icon: 'Utensils', category: 'Restaurants & Dining' },
    'ubereats': { name: 'Uber Eats', color: '#06C167', icon: 'Utensils', category: 'Restaurants & Dining' },
    'dominos': { name: "Domino's", color: '#0B6CB7', icon: 'Pizza', category: 'Restaurants & Dining' }, // Pizza icon might not exist in Lucide, fallback to Utensils or Pizza if available. Lucide has Pizza.
    'mcdonalds': { name: "McDonald's", color: '#FFC72C', icon: 'Sandwich', category: 'Restaurants & Dining' },
    'kfc': { name: 'KFC', color: '#E4002B', icon: 'Drumstick', category: 'Restaurants & Dining' }, // Drumstick exists? Maybe just Utensils.
    'starbucks': { name: 'Starbucks', color: '#00704A', icon: 'Coffee', category: 'Restaurants & Dining' },
    'subway': { name: 'Subway', color: '#008C15', icon: 'Sandwich', category: 'Restaurants & Dining' },

    // Groceries & Quick Commerce
    'zepto': { name: 'Zepto', color: '#8B5CF6', icon: 'ShoppingCart', category: 'Groceries' },
    'blinkit': { name: 'Blinkit', color: '#FFD400', icon: 'Zap', category: 'Groceries' },
    'bigbasket': { name: 'BigBasket', color: '#84C225', icon: 'ShoppingBasket', category: 'Groceries' },
    'dunzo': { name: 'Dunzo', color: '#FF3366', icon: 'Package', category: 'Groceries' },
    'instamart': { name: 'Instamart', color: '#FC8019', icon: 'ShoppingCart', category: 'Groceries' },
    'jiomart': { name: 'JioMart', color: '#0066FF', icon: 'ShoppingCart', category: 'Groceries' },

    // E-commerce
    'amazon': { name: 'Amazon', color: '#FF9900', icon: 'Package', category: 'Online Shopping' },
    'flipkart': { name: 'Flipkart', color: '#2874F0', icon: 'ShoppingBag', category: 'Online Shopping' },
    'myntra': { name: 'Myntra', color: '#FF3F6C', icon: 'Shirt', category: 'Online Shopping' },
    'ajio': { name: 'AJIO', color: '#C8A876', icon: 'Shirt', category: 'Online Shopping' },
    'meesho': { name: 'Meesho', color: '#9F2089', icon: 'ShoppingBag', category: 'Online Shopping' },
    'nykaa': { name: 'Nykaa', color: '#FC2779', icon: 'Sparkles', category: 'Online Shopping' },
    'firstcry': { name: 'FirstCry', color: '#FFC629', icon: 'Baby', category: 'Online Shopping' },

    // Payment Apps
    'paytm': { name: 'Paytm', color: '#00BAF2', icon: 'Wallet', category: 'Other' },
    'phonepe': { name: 'PhonePe', color: '#5F259F', icon: 'Smartphone', category: 'Other' },
    'gpay': { name: 'Google Pay', color: '#4285F4', icon: 'Smartphone', category: 'Other' },
    'googlepay': { name: 'Google Pay', color: '#4285F4', icon: 'Smartphone', category: 'Other' },
    'cred': { name: 'CRED', color: '#0F0F0F', icon: 'CreditCard', category: 'Other' },
    'mobikwik': { name: 'MobiKwik', color: '#D91E36', icon: 'Wallet', category: 'Other' },

    // Transport
    'uber': { name: 'Uber', color: '#000000', icon: 'Car', category: 'Ride Services' },
    'ola': { name: 'Ola', color: '#00D77F', icon: 'Car', category: 'Ride Services' },
    'rapido': { name: 'Rapido', color: '#FFC629', icon: 'Bike', category: 'Ride Services' },
    'irctc': { name: 'IRCTC', color: '#F37021', icon: 'Train', category: 'Public Transport' },
    'makemytrip': { name: 'MakeMyTrip', color: '#E7352B', icon: 'Plane', category: 'Public Transport' },
    'goibibo': { name: 'Goibibo', color: '#FF6D38', icon: 'Plane', category: 'Public Transport' },

    // Streaming & Entertainment
    'netflix': { name: 'Netflix', color: '#E50914', icon: 'Clapperboard', category: 'Streaming Services' },
    'prime': { name: 'Prime Video', color: '#00A8E1', icon: 'Tv', category: 'Streaming Services' },
    'hotstar': { name: 'Disney+ Hotstar', color: '#0F1014', icon: 'Tv', category: 'Streaming Services' },
    'spotify': { name: 'Spotify', color: '#1DB954', icon: 'Music', category: 'Streaming Services' },
    'youtube': { name: 'YouTube Premium', color: '#FF0000', icon: 'Play', category: 'Streaming Services' },
    'apple': { name: 'Apple Music', color: '#FA243C', icon: 'Music', category: 'Streaming Services' },
    'bookmyshow': { name: 'BookMyShow', color: '#C4242B', icon: 'Ticket', category: 'Events & Recreation' },

    // Telecom
    'airtel': { name: 'Airtel', color: '#E60000', icon: 'Smartphone', category: 'Telecom' },
    'jio': { name: 'Jio', color: '#0066FF', icon: 'Smartphone', category: 'Telecom' },
    'vi': { name: 'Vi', color: '#E60000', icon: 'Smartphone', category: 'Telecom' },
    'vodafone': { name: 'Vodafone Idea', color: '#E60000', icon: 'Smartphone', category: 'Telecom' },
    'bsnl': { name: 'BSNL', color: '#0066CC', icon: 'Phone', category: 'Telecom' },

    // Health & Pharmacy
    'pharmeasy': { name: 'PharmEasy', color: '#10847E', icon: 'Pill', category: 'Healthcare' },
    '1mg': { name: '1mg', color: '#FF6F61', icon: 'Pill', category: 'Healthcare' },
    'apollo': { name: 'Apollo Pharmacy', color: '#00A3E0', icon: 'Stethoscope', category: 'Healthcare' },
    'netmeds': { name: 'Netmeds', color: '#1F8A70', icon: 'Pill', category: 'Healthcare' },
    'cult': { name: 'Cult.fit', color: '#FF3366', icon: 'Dumbbell', category: 'Healthcare' },

    // Utilities & Bills
    'bses': { name: 'BSES', color: '#0066CC', icon: 'Zap', category: 'Utilities' },
    'tatapower': { name: 'Tata Power', color: '#1B4F9B', icon: 'Zap', category: 'Utilities' },
    'adani': { name: 'Adani Gas', color: '#0066CC', icon: 'Flame', category: 'Utilities' },
};

// Category default icons
// Category default icons (Lucide icon names)
export const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
    'Groceries': { icon: 'ShoppingCart', color: '#10B981' }, // Emerald-500
    'Restaurants & Dining': { icon: 'Utensils', color: '#F97316' }, // Orange-500
    'Fuel': { icon: 'Fuel', color: '#EF4444' }, // Red-500
    'Ride Services': { icon: 'Car', color: '#3B82F6' }, // Blue-500
    'Public Transport': { icon: 'Bus', color: '#6366F1' }, // Indigo-500
    'Telecom': { icon: 'Smartphone', color: '#8B5CF6' }, // Violet-500
    'Online Shopping': { icon: 'ShoppingBag', color: '#EC4899' }, // Pink-500
    'Retail & Stores': { icon: 'Store', color: '#F59E0B' }, // Amber-500
    'Streaming Services': { icon: 'Tv', color: '#E11D48' }, // Rose-600
    'Events & Recreation': { icon: 'Ticket', color: '#9333EA' }, // Purple-600
    'Housing': { icon: 'Home', color: '#78716C' }, // Stone-500
    'Education': { icon: 'GraduationCap', color: '#2563EB' }, // Blue-600
    'Income': { icon: 'Wallet', color: '#16A34A' }, // Green-600
    'Insurance': { icon: 'Shield', color: '#475569' }, // Slate-600
    'Investments': { icon: 'TrendingUp', color: '#06B6D4' }, // Cyan-500
    'Personal Care': { icon: 'Sparkles', color: '#D946EF' }, // Fuchsia-500
    'Healthcare': { icon: 'Stethoscope', color: '#0EA5E9' }, // Sky-500
    'Utilities': { icon: 'Zap', color: '#EAB308' }, // Yellow-500
    'Credit Card Payments': { icon: 'CreditCard', color: '#64748B' }, // Slate-500
    'Automotive': { icon: 'Wrench', color: '#57534E' }, // Stone-600
    'Shopping': { icon: 'ShoppingBag', color: '#DB2777' }, // Pink-600
    'Other': { icon: 'CircleDashed', color: '#94A3B8' }, // Slate-400
};

/**
 * Get category icon and color
 */
export function getCategoryIcon(category: string): { icon: string; color: string } {
    return CATEGORY_ICONS[category] || { icon: 'Tag', color: '#9E9E9E' };
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
