import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIES, APP_PATHS } from '@/lib/constants';

// Whitelist of public API routes that don't need session verification
const PUBLIC_API_ROUTES = [
    '/api/chat',
    '/api/auth/register',
    '/api/feedback', // if public feedback is allowed
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── 1. Allow Public Assets & Whitelisted APIs ───────
    if (
        pathname.startsWith('/_next') || 
        pathname.startsWith('/images') || 
        pathname.startsWith('/favicon.ico') ||
        PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
    ) {
        return NextResponse.next();
    }

    // ── 2. Identify Protected Areas ──────────────────────
    const isDashboardPath = pathname.startsWith(APP_PATHS.DASHBOARD);
    const isStudentPath = pathname.startsWith(APP_PATHS.STUDENT_DASHBOARD);
    const isApiRequest = pathname.startsWith('/api');

    const session = request.cookies.get(COOKIES.SESSION)?.value;

    // ── 3. Session Validation Logic ──────────────────────
    let isValidSession = false;
    if (session) {
        const segments = session.split('.');
        // Basic JWT structure check (header.payload.signature)
        if (segments.length === 3 && session.length > 100) {
            isValidSession = true;
        }
    }

    // ── 4. Redirect/Block Unauthorized Requests ──────────
    if (!isValidSession) {
        if (isApiRequest) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        if (isStudentPath) {
            return NextResponse.redirect(new URL(APP_PATHS.STUDENT_LOGIN, request.url));
        }
        
        if (isDashboardPath) {
            return NextResponse.redirect(new URL(APP_PATHS.LOGIN, request.url));
        }
    }

    return NextResponse.next();
}

// Global matcher covering Dashboards and API routes
export const config = {
    matcher: [
        '/dashboard/:path*', 
        '/student-dashboard/:path*',
        '/api/:path*'
    ],
};
