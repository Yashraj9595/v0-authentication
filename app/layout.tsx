import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { RootClientWrapper } from "@/components/root-client-wrapper"
import { PerformanceMonitor } from "@/components/performance-monitor"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: "MessHub - Kitchen Management Platform",
  description: "Efficiently manage your mess/kitchen operations with MessHub - Your complete kitchen management solution",
  keywords: "mess management, kitchen management, food service, restaurant management",
  authors: [{ name: "MessHub Team" }],
  creator: "MessHub",
  publisher: "MessHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MessHub",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "MessHub",
    "msapplication-TileColor": "#ffffff",
    "msapplication-config": "/browserconfig.xml",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="mask-icon" href="/icon-192x192.png" color="#000000" />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        <RootClientWrapper>
          {children}
          <PerformanceMonitor />
        </RootClientWrapper>
      </body>
    </html>
  )
}