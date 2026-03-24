import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import  PWAInit  from '@/components/pwa-init';
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Zeno Trading Journal | Control your emotions, Follow the system.',
  description: 'Premium trading journal with AI-powered strategy recommendations, psychology coaching, and discipline enforcement. Master your trading system with personalized guidance.',
  keywords: 'trading journal, trading system, strategy coaching, trading psychology, discipline, Zeno trading',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zeno Trading',
  },
  icons: {
    icon: [
      
      {
        url: '/favicon-32x32.png',
        type: 'image/png',
      },
      {
        url: '/high-resolution-color-logo.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Zeno Trading" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#00ff87" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <PWAInit />
        <Analytics />
      </body>
    </html>
  )
}

