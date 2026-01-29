import React from "react"
import type { Metadata } from 'next'
import { Source_Sans_3, Libre_Baskerville } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-body' })
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'TJU Radiation Oncology - LINAC Status Dashboard',
  description: 'Thomas Jefferson University Department of Radiation Oncology LINAC Machine Status Dashboard',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${libreBaskerville.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
