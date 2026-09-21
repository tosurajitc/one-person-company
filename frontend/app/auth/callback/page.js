'use client'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const params = useSearchParams()
  const didRun = useRef(false)

  useEffect(() => {
    // Strict-mode mounts twice in dev — the ref ensures we only run once
    if (didRun.current) return
    didRun.current = true

    const code        = params.get('code')
    const state       = params.get('state')
    const oauthError  = params.get('error')          // Google sends this on denial/mismatch
    const provider    = localStorage.getItem('oauth_provider') || 'google'
    const storedState = localStorage.getItem('oauth_state')

    localStorage.removeItem('oauth_state')
    localStorage.removeItem('oauth_provider')

    // Google returned an error (e.g. access_denied, redirect_uri_mismatch)
    if (oauthError) {
      const msg = oauthError === 'access_denied'
        ? 'Sign-in was cancelled. Please try again.'
        : `Sign-in failed: ${oauthError}. Check your Google OAuth settings.`
      router.push('/login?error=' + encodeURIComponent(msg))
      return
    }

    // storedState is null when localStorage was cleared (e.g. after a logout).
    // Only block if both are present but mismatched.
    if (!code || (storedState && state !== storedState)) {
      router.push('/login?error=' + encodeURIComponent('OAuth verification failed. Please try again.'))
      return
    }

    fetch('/api/auth/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider,
        code,
        redirect_uri: `${window.location.origin}/auth/callback`,
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (r.ok && data.access_token) {
          localStorage.setItem('auth_token', data.access_token)
          localStorage.setItem('user_role', data.user?.role ?? '')
          localStorage.setItem('user_data', JSON.stringify(data.user ?? {}))
          document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`
          window.dispatchEvent(new Event('authchange'))
          const role = data.user?.role ?? ''
          const redirectTo = params.get('next') || params.get('redirect')
          router.push(redirectTo || (role === 'admin' || role === 'super_admin' ? '/admin' : '/dashboard'))
        } else {
          const msg = data.detail || `Sign-in failed (${r.status}). Please try again.`
          router.push('/login?error=' + encodeURIComponent(msg))
        }
      })
      .catch((err) => {
        console.error('OAuth callback fetch error:', err)
        router.push('/login?error=' + encodeURIComponent('Could not reach the sign-in server. Please try again.'))
      })
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '20vh', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#57606a' }}>Completing sign in…</p>
    </div>
  )
}
