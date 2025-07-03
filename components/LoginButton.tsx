// 더 이상 사용하지 않는 컴포넌트입니다. (헤더/로그인 버튼은 page.tsx에서 직접 구현)

"use client";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AuthDialog from "@/components/AuthDialog";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginButton() {
  const [open, setOpen] = useState(false);

  // 로그인
  const handleLogin = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  // 회원가입
  const handleSignup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2 touch-optimized text-base font-semibold rounded-xl flex items-center"
            onClick={() => setOpen(true)}
          >
            <LogIn className="w-5 h-5 mr-2" />
            로그인
          </button>
        </DialogTrigger>
        <AuthDialog open={open} onClose={() => setOpen(false)} onLogin={handleLogin} onSignup={handleSignup} />
      </Dialog>
    </>
  );
} 