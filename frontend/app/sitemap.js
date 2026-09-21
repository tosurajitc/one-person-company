export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://opcgenie.com'
  const currentDate = new Date().toISOString()

  const routes = [
    '',
    '/pricing',
    '/templates',
    '/resources',
    '/contact',
    '/get_started',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))

  return routes
}
