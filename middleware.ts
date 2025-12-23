import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define Protected Routes
    const protectedRoutes = ['/dashboard', '/transactions', '/insights', '/settings'];
    const isAdminRoute = pathname.startsWith('/admin');
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || isAdminRoute;

    if (isProtectedRoute) {
        // 2. Get Session Token
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        // 3. Not Logged In -> Redirect to Home
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        // 4. Admin Route Protection
        if (isAdminRoute) {
            const adminEmails = (process.env.ADMIN_EMAILS || 'acharya.kiran26ka@gmail.com').split(',').map(e => e.trim().toLowerCase());
            const userEmail = token.email?.toLowerCase();

            if (!userEmail || !adminEmails.includes(userEmail)) {
                console.warn(`🚫 Unauthorized admin access attempt by: ${userEmail}`);
                const url = request.nextUrl.clone();
                url.pathname = '/dashboard'; // Send them to their own dashboard instead
                return NextResponse.redirect(url);
            }
            return NextResponse.next();
        }

        // 5. Payment Protection for Standard Protected Routes
        try {
            const baseUrl = request.nextUrl.origin;
            const statusUrl = new URL('/api/payment/status', baseUrl);
            statusUrl.searchParams.set('email', token.email || '');
            statusUrl.searchParams.set('userId', (token.sub || token.id) as string);

            const response = await fetch(statusUrl.toString(), {
                headers: {
                    cookie: request.headers.get('cookie') || '',
                },
            });

            if (!response.ok) {
                // Fail closed for security
                const url = request.nextUrl.clone();
                url.pathname = '/';
                url.searchParams.set('payment_required', 'true');
                return NextResponse.redirect(url);
            }

            const data = await response.json();

            if (!data.hasPaid) {
                const url = request.nextUrl.clone();
                url.pathname = '/';
                url.searchParams.set('payment_required', 'true');
                return NextResponse.redirect(url);
            }

            return NextResponse.next();
        } catch (error) {
            console.error('Middleware Payment Check Error:', error);
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/transactions/:path*',
        '/insights/:path*',
        '/settings/:path*',
        '/admin/:path*'
    ],
};
