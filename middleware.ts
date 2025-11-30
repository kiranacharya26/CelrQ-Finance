import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log('🔒 Middleware triggered for:', pathname);

    // Protected routes that require payment
    const protectedRoutes = ['/dashboard', '/transactions', '/insights', '/settings'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        console.log('🔒 Protected route detected:', pathname);

        // Check session via API instead of getToken (more reliable)
        try {
            const baseUrl = request.nextUrl.origin;
            const sessionUrl = new URL('/api/auth/session', baseUrl);

            // Forward cookies from the request
            const sessionResponse = await fetch(sessionUrl.toString(), {
                headers: {
                    cookie: request.headers.get('cookie') || '',
                },
            });

            if (!sessionResponse.ok) {
                console.log('❌ Session API returned error, redirecting to home');
                const url = request.nextUrl.clone();
                url.pathname = '/';
                return NextResponse.redirect(url);
            }

            const session = await sessionResponse.json();

            if (!session || !session.user) {
                console.log('❌ No session found, redirecting to home');
                const url = request.nextUrl.clone();
                url.pathname = '/';
                return NextResponse.redirect(url);
            }

            console.log('✅ Session found:', { email: session.user.email });

            // Check payment status
            const userId = (session.user as any).id || '';
            const email = session.user.email;

            try {
                // Call the payment status API
                const statusUrl = new URL('/api/payment/status', baseUrl);
                statusUrl.searchParams.set('userId', userId);
                statusUrl.searchParams.set('email', email || '');

                console.log('🔍 Checking payment status at:', statusUrl.toString());

                const response = await fetch(statusUrl.toString(), {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log('📡 Payment API response status:', response.status);

                // If API returns error, fail closed (block access) for security
                if (!response.ok) {
                    console.warn(`❌ Payment status check failed with status ${response.status}. Blocking access.`);
                    const url = request.nextUrl.clone();
                    url.pathname = '/';
                    url.searchParams.set('payment_required', 'true');
                    url.searchParams.set('error', 'verification_failed');
                    return NextResponse.redirect(url);
                }

                const data = await response.json();
                console.log('📦 Payment API data:', data);

                // If user hasn't paid, redirect to home page with payment prompt
                if (data.hasPaid === false) {
                    console.log('❌ User has not paid, redirecting to home');
                    const url = request.nextUrl.clone();
                    url.pathname = '/';
                    url.searchParams.set('payment_required', 'true');
                    return NextResponse.redirect(url);
                }

                // User has paid, allow access
                console.log('✅ User has paid, allowing access to:', pathname);
                return NextResponse.next();

            } catch (error) {
                console.error('❌ Error checking payment status in middleware:', error);
                // Fail closed - block access if payment check fails
                console.warn('❌ Payment verification failed. Blocking access for security.');
                const url = request.nextUrl.clone();
                url.pathname = '/';
                url.searchParams.set('payment_required', 'true');
                url.searchParams.set('error', 'verification_error');
                return NextResponse.redirect(url);
            }
        } catch (error) {
            console.error('❌ Error checking session:', error);
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    console.log('✅ Non-protected route, allowing access');
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/transactions/:path*'],
};
