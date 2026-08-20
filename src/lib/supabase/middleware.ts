import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

interface JwtPayload {
  sub?: string
  exp?: number
  user_metadata?: { role?: string; password_changed?: boolean }
  app_metadata?: { role?: string }
}

/**
 * Parse the Supabase session cookie locally (0ms, zero network calls).
 * 
 * Cookie format from @supabase/ssr:
 *   Cookie name: sb-<ref>-auth-token (may be chunked: .0, .1, .2 etc.)
 *   Cookie value: base64-<base64 encoded JSON>
 *   Decoded JSON: {"access_token":"<JWT>","refresh_token":"...","expires_at":...,...}
 *   
 * We extract the access_token JWT and parse its payload for sub + user_metadata.role.
 */
function parseSessionFromCookies(request: NextRequest): { userId: string; role: string; password_changed: boolean } | null {
  try {
    const allCookies = request.cookies.getAll()

    // Find auth token cookies (including chunked cookies like .0, .1)
    const authChunks = allCookies
      .filter((c) => {
        const name = c.name
        return (
          (name.startsWith('sb-') && (name.endsWith('-auth-token') || /-auth-token\.\d+$/.test(name))) ||
          name === 'sb-access-token'
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    if (authChunks.length === 0) return null

    // Join chunked cookie values
    let rawVal = authChunks.map((c) => c.value).join('')
    if (!rawVal) return null

    // Strip "base64-" prefix
    if (rawVal.startsWith('base64-')) {
      rawVal = rawVal.slice(7) // Remove "base64-"
    }

    // Decode the base64 to get the session JSON
    const sessionJson = Buffer.from(rawVal, 'base64').toString('utf8')
    const session = JSON.parse(sessionJson)

    // Extract the access_token JWT from the session
    const accessToken: string | undefined = session?.access_token
    if (!accessToken || !accessToken.includes('.')) return null

    // Parse the JWT payload (header.payload.signature)
    const jwtParts = accessToken.split('.')
    if (jwtParts.length < 2) return null

    const payloadJson = Buffer.from(jwtParts[1], 'base64url').toString('utf8')
    const payload: JwtPayload = JSON.parse(payloadJson)

    if (!payload?.sub) return null

    // Check expiration (with 30-second buffer)
    if (payload.exp && Date.now() / 1000 > payload.exp - 30) {
      return null
    }

    const role = payload.user_metadata?.role || payload.app_metadata?.role || 'candidate'
    const isManagement = ['admin', 'super_admin', 'hr_manager', 'supervisor', 'auditor'].includes(role)
    // Default to true for management so they don't get locked out, false for candidates
    const password_changed = payload.user_metadata?.password_changed ?? isManagement
    
    return { userId: payload.sub, role, password_changed }
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const session = parseSessionFromCookies(request)

  const requestHeaders = new Headers(request.headers)

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  if (host) {
    requestHeaders.set('x-tenant-host', host)
  }

  if (session) {
    requestHeaders.set('x-user-id', session.userId)
    requestHeaders.set('x-user-role', session.role)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 1. Protected routes — redirect unauthenticated users to login
  if (!session && (pathname.startsWith('/admin') || pathname.startsWith('/candidate') || pathname.startsWith('/force-change-password'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Authenticated user redirects & role-based access control
  if (session) {
    const { role, password_changed } = session
    const isManagement = ['admin', 'super_admin', 'hr_manager', 'supervisor', 'auditor'].includes(role)
    const isFullAdmin = role === 'admin' || role === 'super_admin'
    const isHR = isFullAdmin || role === 'hr_manager'
    
    // Check MFA status
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )
    
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const requiresMfa = mfaData?.nextLevel === 'aal2' && mfaData?.currentLevel === 'aal1'

    // Allow password reset page to handle its own MFA and password setting flow
    if (pathname.startsWith('/reset-password')) {
      return response
    }

    if (requiresMfa) {
      if (pathname !== '/login' && !pathname.startsWith('/actions') && !pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return response
    }
    
    // Block access if password needs to be changed
    if (!password_changed && !pathname.startsWith('/force-change-password') && !pathname.startsWith('/actions') && !pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/force-change-password'
      return NextResponse.redirect(url)
    }

    // Redirect away from force-change-password if already changed
    if (password_changed && pathname.startsWith('/force-change-password')) {
      const url = request.nextUrl.clone()
      url.pathname = isManagement ? '/admin' : '/candidate'
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from /login or /
    if (pathname === '/login' || pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = isManagement ? '/admin' : '/candidate'
      return NextResponse.redirect(url)
    }

    // Candidate trying to access admin portal
    if (pathname.startsWith('/admin') && !isManagement) {
      const url = request.nextUrl.clone()
      url.pathname = '/candidate'
      return NextResponse.redirect(url)
    }

    // Granular admin route protections:
    // A. SuperAdmin Console -> Super Admin strictly only
    if (
      (pathname.startsWith('/admin/superadmin') || pathname.startsWith('/admin/system')) &&
      role !== 'super_admin'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // B. Branding, Security, and Reset Requests -> Admin/Super Admin only
    if (
      (pathname.startsWith('/admin/settings/branding') ||
        pathname.startsWith('/admin/security') ||
        pathname.startsWith('/admin/reset-requests')) &&
      !isFullAdmin
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // C. Payroll -> Admin, Super Admin, HR Manager, and Auditor only (block supervisor)
    if (pathname.startsWith('/admin/payroll') && !isHR && role !== 'auditor') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Candidate-only portal redirect for pure admin roles (unless testing)
    if (pathname.startsWith('/candidate') && isFullAdmin) {
      // Allow admins to preview candidate pages if explicitly requested or redirect to /admin
      // Keeping redirect for consistency
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return response
}
