/**
 * Layout for founder-generated website pages: /[username]
 *
 * Strips the global OPC Genie platform header and footer so the
 * founder's own site nav and footer render without interference.
 *
 * The [offer-slug] and community sub-routes have their own layouts
 * that take precedence over this one, so this only affects the root
 * /[username] page.
 */
export default function FounderSiteLayout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
