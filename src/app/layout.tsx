import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BrandingProvider } from '@/components/providers/BrandingProvider'
import { DEFAULT_BRANDING } from '@/lib/branding/defaults'
import { GlobalCallManager } from '@/components/calls/GlobalCallManager'
import { GlobalPushNotificationManager } from '@/components/notifications/GlobalPushNotificationManager'

export const metadata: Metadata = {
  title: 'Darion Chat | Real-Time Messaging & Calls',
  description: 'Enterprise-grade Real-Time Teams Chat, Voice Notes, and Video Meetings.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B57D0',
}

import { getCurrentUserFast } from '@/lib/supabase/server'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUserFast().catch(() => null)

  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[#070a12] text-[var(--md-sys-color-on-surface)] dark:text-slate-100 font-sans selection:bg-[var(--md-sys-color-primary)] selection:text-white min-h-screen overflow-x-hidden">
        <BrandingProvider initialBranding={DEFAULT_BRANDING}>
          {children}
          <GlobalCallManager currentUserId={user?.id} />
          <GlobalPushNotificationManager userId={user?.id} />
        </BrandingProvider>
      </body>
    </html>
  )
}
