import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
