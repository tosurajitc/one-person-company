import './globals.css'
import { Inter } from 'next/font/google'
import Header from './header'
import Footer from './footer'
import Providers from './providers'
import siteConfig from '../site.config'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  keywords: siteConfig.seo.keywords,
  authors: [{ name: siteConfig.brand.name }],
  creator: siteConfig.brand.name,
  publisher: siteConfig.brand.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteConfig.seo.siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    url: siteConfig.seo.siteUrl,
    siteName: siteConfig.brand.name,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OPC Genie – Launch Your One-Person Company',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    creator: `@${siteConfig.brand.name.toLowerCase().replace(/\s/g, '')}`,
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-white`}>
      <Providers>
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        {/* Header with Navigation */}
        <Header />
        
        {/* Main content */}
        <main id="main-content" className="relative">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Analytics and other scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Analytics initialization
              if (typeof window !== 'undefined') {
                // Add your analytics code here
                console.log('AI Services Platform loaded');
              }
            `,
          }}
        />
        </Providers>
      </body>
    </html>
  )
}