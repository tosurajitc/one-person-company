import { redirect } from 'next/navigation'

// Legacy route — all CTA buttons now point to /setup-wizard.
// This redirect ensures any bookmarked or external links still work.
export default function GetStartedPage() {
  redirect('/setup-wizard')
}
