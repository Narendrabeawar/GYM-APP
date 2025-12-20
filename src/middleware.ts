import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // 1. If not logged in and trying to access protected routes
    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/gym') || pathname.startsWith('/branch') || pathname.startsWith('/reception') || pathname === '/change-password')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/signin'
        return NextResponse.redirect(redirectUrl)
    }

    // 2. If logged in but needs password change (limit to certain routes to avoid loop)
    if (user && user.user_metadata?.force_password_change && pathname !== '/change-password' && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/change-password', request.url))
    }

    // 3. Redirect authenticated users away from auth pages
    if (user && (pathname === '/signin' || pathname === '/signup')) {
        const role = user.user_metadata?.role
        if (user.user_metadata?.force_password_change) {
            return NextResponse.redirect(new URL('/change-password', request.url))
        }
        if (role === 'gym_admin') {
            return NextResponse.redirect(new URL('/gym/dashboard', request.url))
        }
        if (role === 'branch_admin') {
            return NextResponse.redirect(new URL('/branch/dashboard', request.url))
        }
        if (role === 'receptionist') {
            return NextResponse.redirect(new URL('/reception/dashboard', request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 4. Role-based unauthorized access prevention
    if (user) {
        const role = user.user_metadata?.role
        if (role === 'gym_admin' && (pathname.startsWith('/dashboard') || pathname.startsWith('/branch') || pathname.startsWith('/reception'))) {
            return NextResponse.redirect(new URL('/gym/dashboard', request.url))
        }
        // Branch admin can access both /branch and /reception routes
        if (role === 'branch_admin' && (pathname.startsWith('/dashboard') || pathname.startsWith('/gym'))) {
            return NextResponse.redirect(new URL('/branch/dashboard', request.url))
        }
        if (role === 'receptionist' && (pathname.startsWith('/dashboard') || pathname.startsWith('/gym') || pathname.startsWith('/branch'))) {
            return NextResponse.redirect(new URL('/reception/dashboard', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
