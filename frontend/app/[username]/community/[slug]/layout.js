/**
 * Public community landing layout.
 * Mirrors /{username}/[offer-slug]/layout.js — strips global nav,
 * shows only a minimal OPC Genie top bar.
 */
import Link from 'next/link'

export default function CommunityPageLayout({ children }) {
  return (
    <>
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-primary-600 tracking-tight">
            OPC Genie
          </Link>
          <Link
            href="/setup-wizard"
            className="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-full transition-colors"
          >
            Launch your own business →
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-100 bg-white mt-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-center">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <Link href="/" className="text-primary-600 font-medium hover:underline">
              OPC Genie
            </Link>{' '}
            — launch your one-person company today.
          </p>
        </div>
      </footer>
    </>
  )
}
