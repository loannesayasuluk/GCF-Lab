// 더 이상 사용하지 않는 컴포넌트입니다. (헤더/로그인 버튼은 page.tsx에서 직접 구현)

"use client";
import { LogIn } from "lucide-react";

export default function LoginButton() {
  return (
    <button
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2 touch-optimized text-base font-semibold rounded-xl flex items-center"
      onClick={() => { console.log('로그인 버튼 클릭됨'); }}
    >
      <LogIn className="w-5 h-5 mr-2" />
      로그인
    </button>
  );
} 