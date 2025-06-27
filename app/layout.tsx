import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: '환경 지도 플랫폼',
  description: '환경 모니터링 및 제보 서비스',
  generator: 'GCF Lab',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}
        <Toaster />
      </body>
    </html>
  )
}
