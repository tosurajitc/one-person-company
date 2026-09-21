import { NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/platform',
  '/setup-wizard',
]

// Routes that require admin access
const ADMIN_ROUTES = [
  '/admin',
]

// Admin routes that are publicly accessible (no auth needed)
const ADMIN_PUBLIC_ROUTES = [
  '/admin/login',
]

// Public routes (no authentication required)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signout',
  '/contact',
  '/resources',
  '/pricing',
  '/about',
  '/admin/login',
  '/get_started',
]

// Routes that authenticated users shouldn't access (redirect to dashboard)
const AUTH_REDIRECT_ROUTES = [
  '/login',
]

// Paths that look like a founder site slug: one lowercase segment with no sub-path
// e.g. /sharma-digital  but NOT /dashboard or /admin/xyz or /platform/x
function isFounderSitePath(pathname) {
  return /^\/[a-z0-9][a-z0-9-]*$/.test(pathname)
}

function extractSubdomain(hostname) {
  if (!hostname) return null
  const hostWithoutPort = hostname.split(':')[0].toLowerCase()

  // Ignore localhost and raw IP addresses
  if (hostWithoutPort === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort)) {
    return null
  }

  // Check known platform domains
  const platformDomains = ['opcgenie.com', 'shuktoai.com', 'opcgenie.in']
  for (const domain of platformDomains) {
    if (hostWithoutPort.endsWith('.' + domain)) {
      const sub = hostWithoutPort.slice(0, -(domain.length + 1))
      if (sub && sub !== 'www' && sub !== 'admin' && sub !== 'api') {
        return sub
      }
    }
  }

  // Fallback for custom domains or multi-level domains (e.g. sub.customdomain.com)
  const parts = hostWithoutPort.split('.')
  if (parts.length >= 3) {
    const sub = parts[0]
    if (sub !== 'www' && sub !== 'admin' && sub !== 'api') {
      return sub
    }
  }

  return null
}

export function middleware(request) {
  const { pathname, hostname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Handle subdomain rewrites for founder sites:
  // e.g. priya.opcgenie.com/ or priya.opcgenie.com/web-design
  // Rewrites internally to /[username] or /[username]/[offer-slug]
  const subdomain = extractSubdomain(hostname)
  if (subdomain && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const url = request.nextUrl.clone()
    if (pathname === '/') {
      url.pathname = `/${subdomain}`
    } else {
      url.pathname = `/${subdomain}${pathname}`
    }
    return NextResponse.rewrite(url)
  }

  // Get user info from token
  let user = null
  let isAuthenticated = false
  
  if (token) {
    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000
      
      // Check if token is expired
      if (decoded.exp > currentTime) {
        user = decoded
        isAuthenticated = true
      }
      // Expired token: isAuthenticated stays false; route guards below will redirect to login
    } catch (error) {
      console.error('Token decode error:', error)
      // Invalid token — clear the cookie and redirect to login
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('token')
      return response
    }
  }

  // Helper functions
  const isProtectedRoute = () => PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAdminRoute = () => ADMIN_ROUTES.some(route => pathname.startsWith(route))
  const isPublicRoute = () => PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
  const isAuthRedirectRoute = () => AUTH_REDIRECT_ROUTES.some(route => pathname === route)
  const isAdmin = () => user && (user.role === 'admin' || user.role === 'super_admin')
  const isSuperAdmin = () => user && user.role === 'super_admin'

  // 1. Handle authentication redirects (logged-in users accessing login/signup)
  if (isAuthenticated && isAuthRedirectRoute()) {
    // If a redirect param is present, honour it (e.g. user navigated to
    // /login?redirect=/setup-wizard while already logged in)
    const redirectParam = request.nextUrl.searchParams.get('redirect') || request.nextUrl.searchParams.get('next')
    if (redirectParam && !redirectParam.startsWith('/admin')) {
      return NextResponse.redirect(new URL(redirectParam, request.url))
    }
    if (isAdmin()) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 2. Handle admin routes
  if (isAdminRoute()) {
    // Allow public admin routes (e.g. /admin/login) through without auth
    if (ADMIN_PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    if (!isAuthenticated) {
      // Redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    if (!isAdmin()) {
      // Regular user trying to access admin area
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Admin access granted, continue
    return NextResponse.next()
  }

  // 3. Handle protected routes (user dashboard, profile, etc.)
  if (isProtectedRoute()) {
    if (!isAuthenticated) {
      // Store the attempted URL for redirect after login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Authenticated user, continue
    return NextResponse.next()
  }

  // 4. Handle public routes
  if (isPublicRoute()) {
    return NextResponse.next()
  }

  // 5. Founder site pages — /[slug] with no sub-path (e.g. /sharma-digital)
  //    These are publicly accessible even without authentication.
  if (isFounderSitePath(pathname)) {
    return NextResponse.next()
  }

  // 6. Handle unknown routes
  // For any other route, check if user is authenticated
  if (!isAuthenticated) {
    // Unknown route, not authenticated - redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user accessing unknown route - allow it
  return NextResponse.next()
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (including images, svgs, icons, css)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$).*)',
  ],
}

// Helper function to check if request is from admin subdomain/path
function isAdminRequest(request) {
  const { hostname, pathname } = request.nextUrl
  
  // Check for admin subdomain
  if (hostname.startsWith('admin.')) {
    return true
  }
  
  // Check for admin path
  if (pathname.startsWith('/admin')) {
    return true
  }
  
  return false
}

// Helper function to get redirect URL after successful login
export function getPostLoginRedirect(user, requestedPath = null) {
  // If there's a requested path, use it (but ensure it's appropriate for user role)
  if (requestedPath) {
    // Admin trying to access user area - redirect to admin dashboard
    if ((user.role === 'admin' || user.role === 'super_admin') && 
        !requestedPath.startsWith('/admin')) {
      return '/admin'
    }
    
    // Regular user trying to access admin area - redirect to user dashboard
    if (user.role === 'user' && requestedPath.startsWith('/admin')) {
      return '/dashboard'
    }
    
    // Appropriate path for user role
    return requestedPath
  }
  
  // Default redirects based on role
  if (user.role === 'admin' || user.role === 'super_admin') {
    return '/admin'
  }
  
  return '/dashboard'
}