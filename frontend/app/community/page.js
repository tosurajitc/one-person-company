import { redirect } from 'next/navigation'

// The old global /community page has been removed.
// Community is now per-founder at /{username}/community/{slug}.
// Redirect to get started page as a graceful fallback.
export default function CommunityPage() {
  redirect('/setup-wizard')
}
