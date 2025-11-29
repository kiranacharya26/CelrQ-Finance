import { useSession } from 'next-auth/react';
import { UserSession } from '@/types';

/**
 * Custom hook for authentication
 * Centralizes auth logic and provides typed session data
 */
export function useAuth() {
    const { data: session, status } = useSession();

    const isAuthenticated = !!session?.user?.email;
    const isLoading = status === 'loading';
    const userEmail = session?.user?.email || '';

    return {
        session: session as UserSession | null,
        isAuthenticated,
        isLoading,
        userEmail,
        user: session?.user,
    };
}
