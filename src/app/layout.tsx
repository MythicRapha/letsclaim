import type { Metadata } from 'next'
import { Sora, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import NotificationBar from '@/components/NotificationBar'
import Footer from '@/components/Footer'
import Providers from './providers'

const sora = Sora({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://letsclaim.fun'),
  title: 'letsclaim.fun | Reclaim Your SOL',
  description: 'Close empty token accounts and reclaim your rent SOL. Free tool for Solana and Mythic L2.',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://letsclaim.fun',
    siteName: 'letsclaim.fun',
    title: 'letsclaim.fun | Reclaim Your SOL',
    description: 'Close empty token accounts and reclaim your rent SOL. Free tool for Solana and Mythic L2.',
    images: ['/brand/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'letsclaim.fun | Reclaim Your SOL',
    description: 'Close empty token accounts and reclaim your rent SOL. Free tool for Solana and Mythic L2.',
    images: ['/brand/og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-black text-[#A0A0B0] font-sans antialiased">
        <NotificationBar />
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
