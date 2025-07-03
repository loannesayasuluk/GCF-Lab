"use client";
import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin?: (email: string, password: string) => void;
  onSignup?: (email: string, password: string, name: string) => void;
}

export default function AuthDialog({ open, onClose, onLogin, onSignup }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      if (onLogin) await onLogin(email, password);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      if (onSignup) await onSignup(email, password, name);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-4 sm:p-8">
      <DialogHeader>
        <DialogTitle className="text-xl sm:text-2xl font-bold text-center">로그인 / 회원가입</DialogTitle>
      </DialogHeader>
      <div className="flex space-x-1 p-2 bg-gray-100 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab("login")}
          className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-all ${
            activeTab === "login"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => setActiveTab("signup")}
          className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-all ${
            activeTab === "signup"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          회원가입
        </button>
      </div>
      {activeTab === "login" && (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="login-email" className="text-base font-medium">이메일</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="login-password" className="text-base font-medium">비밀번호</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </div>
      )}
      {activeTab === "signup" && (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="signup-name" className="text-base font-medium">이름</Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="signup-email" className="text-base font-medium">이메일</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="signup-password" className="text-base font-medium">비밀번호</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSignup}
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? "회원가입 중..." : "회원가입"}
          </Button>
        </div>
      )}
    </DialogContent>
  );
} 