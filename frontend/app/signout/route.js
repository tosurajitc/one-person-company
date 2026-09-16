import { NextResponse } from 'next/server'

/**
 * GET /signout
 * Server-side sign-out handler.
 * Clears the token cookie via Set-Cookie header, then redirects to /login.
 * Because this runs on the server before any redirect is followed,
 * the middleware will see no cookie and will not redirect /login back to /dashboard.
 */
export async function GET(request) {
  // Also call the backend logout endpoint to invalidate server-side session if any
  try {
    const cookie = request.cookies.get('token')?.value
    if (cookie) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `token=${cookie}` },
      })
    }
  } catch (_) {
    // Non-fatal — proceed with client-side cookie clear regardless
  }

  const response = NextResponse.redirect(new URL('/login', request.url))

  // Clear the token cookie by setting it expired
  response.cookies.set('token', '', {
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    httpOnly: false,
  })
  // Also clear the HttpOnly variant the backend may have set
  response.cookies.set('token', '', {
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    httpOnly: true,
  })

  return response
}
