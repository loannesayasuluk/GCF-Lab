"use client";
import Link from "next/link";
import { Leaf, Bell, LogOut, User as UserIcon } from "lucide-react";
import LoginButton from "@/components/LoginButton";
import { useAuthUser } from "@/components/AuthUserProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, loading } = useAuthUser();

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 w-full sticky top-0 z-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">GCF Map</h1>
                </div>
                <p className="text-base text-gray-500">인공지능 기반 환경 지도 플랫폼</p>
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
            {!loading && !user && <LoginButton />}
            {!loading && user && (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center px-4 py-2 bg-gray-100 rounded-xl focus:outline-none">
                      <UserIcon className="w-5 h-5 text-emerald-600 mr-2" />
                      <span className="font-semibold text-gray-800 text-base">{user.displayName || user.email}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">내 정보</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-reports">내 제보 현황</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut(auth)}>
                      <LogOut className="w-4 h-4 mr-2" />로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 