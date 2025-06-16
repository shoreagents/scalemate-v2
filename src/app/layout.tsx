import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import { ThemeProvider } from '@/contexts/theme-provider'
import { AnalyticsProvider } from '@/contexts/analytics-provider'
import { ToastProvider } from '@/contexts/toast-provider'
import MainLayout from '@/components/layout/MainLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ScaleMate - Scale Your Business with Offshore Teams & AI',
    template: '%s | ScaleMate',
  },
  description:
    'The ultimate educational platform for progressive business owners to scale using offshore staff and AI solutions. Follow the ScaleMate system and transform your business.',
  keywords: [
    'offshore staffing',
    'business scaling',
    'AI integration',
    'remote teams',
    'business automation',
    'offshore hiring',
    'team management',
    'business growth',
  ],
  authors: [{ name: 'ScaleMate Team' }],
  creator: 'ScaleMate',
  publisher: 'ScaleMate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'ScaleMate - Scale Your Business with Offshore Teams & AI',
    description:
      'The ultimate educational platform for progressive business owners to scale using offshore staff and AI solutions.',
    siteName: 'ScaleMate',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ScaleMate - Business Scaling Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScaleMate - Scale Your Business with Offshore Teams & AI',
    description:
      'The ultimate educational platform for progressive business owners to scale using offshore staff and AI solutions.',
    images: ['/og-image.jpg'],
    creator: '@scalemate',
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
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <ToastProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </ToastProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 