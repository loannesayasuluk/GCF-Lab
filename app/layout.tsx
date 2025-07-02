import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Leaf, Bell, LogIn, Plus } from "lucide-react"
import LoginButton from "@/components/LoginButton"

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
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body className="bg-gradient-to-b from-blue-100 via-white to-white min-h-screen">
        {/* 헤더 삭제됨 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
