import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Syne, Space_Grotesk } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'BriefBuddy — AI Meeting Assistant',
  description: 'Record, transcribe, summarise and query your meetings with AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${syne.variable} ${spaceGrotesk.variable}`}>
        <body suppressHydrationWarning className="mesh-bg min-h-screen font-[var(--font-body)]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}