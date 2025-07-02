import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Leaf, Bell, LogIn, Plus } from "lucide-react"

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
        {/* 원래 메인 페이지에서 사용하던 헤더 전체 복원 */}
        <header className="bg-white shadow-lg border-b border-gray-200 w-full sticky top-0 z-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Leaf className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">환경지킴이</h1>
                    <p className="text-base text-gray-500">우리 동네 환경을 지켜요</p>
                  </div>
                </div>
                <div className="ml-20" />
                <nav className="hidden md:flex items-center space-x-6">
                  <Link href="/" className="px-7 py-3.5 rounded-xl text-lg font-semibold transition-all focus-visible:outline-2 focus-visible:outline-emerald-500 touch-optimized">지도</Link>
                  <Link href="/stats" className="px-7 py-3.5 rounded-xl text-lg font-semibold transition-all focus-visible:outline-2 focus-visible:outline-blue-500 touch-optimized">통계 및 데이터</Link>
                  <Link href="/analysis" className="px-7 py-3.5 rounded-xl text-lg font-semibold transition-all focus-visible:outline-2 focus-visible:outline-purple-500 touch-optimized">분석</Link>
                  <Link href="/community" className="px-7 py-3.5 rounded-xl text-lg font-semibold transition-all focus-visible:outline-2 focus-visible:outline-green-500 touch-optimized">커뮤니티</Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative touch-optimized px-3 py-2">
                  <Bell className="w-6 h-6 text-gray-600" />
                </button>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2 touch-optimized text-base font-semibold rounded-xl flex items-center">
                  <LogIn className="w-5 h-5 mr-2" />
                  로그인
                </button>
              </div>
            </div>
          </div>
        </header>
        {/* 본문 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
