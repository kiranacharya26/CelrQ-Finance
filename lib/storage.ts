export const UserStorage = {
    /**
     * Get data from local storage scoped to the user
     */
    getData: <T>(userEmail: string, key: string, defaultValue: T): T => {
        if (!userEmail) return defaultValue;
        if (typeof window === 'undefined') return defaultValue;

        const storageKey = `${userEmail}:${key}`;
        try {
            const item = localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${storageKey} from localStorage`, error);
            return defaultValue;
        }
    },

    /**
     * Save data to local storage scoped to the user
     */
    saveData: (userEmail: string, key: string, value: any): void => {
        if (!userEmail) return;
        if (typeof window === 'undefined') return;

        const storageKey = `${userEmail}:${key}`;
        try {
            localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving ${storageKey} to localStorage`, error);
        }
    },

    /**
     * Remove data from local storage scoped to the user
     */
    removeData: (userEmail: string, key: string): void => {
        if (!userEmail) return;
        if (typeof window === 'undefined') return;

        const storageKey = `${userEmail}:${key}`;
        localStorage.removeItem(storageKey);
    },

    /**
     * Migrate legacy data to user-scoped storage
     */
    migrateLegacyData: (userEmail: string, keys: string[]): void => {
        if (!userEmail || typeof window === 'undefined') return;

        keys.forEach(key => {
            const userKey = `${userEmail}:${key}`;
            // Only migrate if user data doesn't exist and legacy data does
            if (!localStorage.getItem(userKey)) {
                const legacyData = localStorage.getItem(key);
                if (legacyData) {
                    try {
                        // Validate JSON before migrating
                        JSON.parse(legacyData);
                        localStorage.setItem(userKey, legacyData);
                        console.log(`Migrated legacy data for ${key} to ${userKey}`);
                    } catch (e) {
                        console.error(`Failed to migrate legacy data for ${key}`, e);
                    }
                }
            }
        });
    }
};
