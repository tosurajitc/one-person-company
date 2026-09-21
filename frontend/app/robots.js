export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://opcgenie.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/platform/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
