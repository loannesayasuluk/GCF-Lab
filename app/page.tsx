"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import {
  MapPin,
  Plus,
  Search,
  Users,
  Leaf,
  Camera,
  LogIn,
  LogOut,
  User as UserIcon,
  Bell,
  Settings,
  BarChart3,
  X,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  PieChart,
  Activity,
  MessageSquare,
  Calendar,
  FileText,
  Target,
  Download,
  ChevronDown,
  ChevronUp,
  Heart,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import SimpleMap from "@/components/simple-map"
import { Menu } from "@headlessui/react"
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, updateEmail } from "firebase/auth";
import { AnalysisView } from "@/components/analysis-view"
import { CommunityView } from "@/components/community-view"
import { StatsView } from "@/components/stats-view"
import { Report, CommunityPost, User, Stats, Filters, Location, Notification } from "@/types"

// OpenAI AI 분석 호출 함수
async function fetchAISummary(content: string) {
  try {
    const res = await fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return await res.json();
  } catch (error) {
    console.error('AI 분석 API 호출 오류:', error);
    throw error;
  }
}

function MobileTabBar({ currentView, setCurrentView }: { currentView: string, setCurrentView: (v: any) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-white border-t flex justify-around items-center z-50 sm:hidden shadow-lg">
      <button onClick={() => setCurrentView("map")}
        className={`flex flex-col items-center flex-1 py-2 ${currentView === "map" ? "text-emerald-600" : "text-gray-400"}`}
      >
        <Home className="w-6 h-6 mb-1" />
        <span className="text-xs">지도</span>
      </button>
      <button onClick={() => setCurrentView("stats")}
        className={`flex flex-col items-center flex-1 py-2 ${currentView === "stats" ? "text-blue-600" : "text-gray-400"}`}
      >
        <BarChart3 className="w-6 h-6 mb-1" />
        <span className="text-xs">통계</span>
      </button>
      <button onClick={() => setCurrentView("analysis")}
        className={`flex flex-col items-center flex-1 py-2 ${currentView === "analysis" ? "text-purple-600" : "text-gray-400"}`}
      >
        <PieChart className="w-6 h-6 mb-1" />
        <span className="text-xs">분석</span>
      </button>
      <button onClick={() => setCurrentView("community")}
        className={`flex flex-col items-center flex-1 py-2 ${currentView === "community" ? "text-green-600" : "text-gray-400"}`}
      >
        <MessageSquare className="w-6 h-6 mb-1" />
        <span className="text-xs">커뮤니티</span>
      </button>
    </nav>
  );
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
}

// 인증 다이얼로그 컴포넌트
function AuthDialog({
  onLogin,
  onSignup,
}: {
  onLogin: (email: string, password: string) => void
  onSignup: (email: string, password: string, name: string) => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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
      await onLogin(email, password);
    } finally {
      setIsLoading(false);
    }
  }

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
      await onSignup(email, password, name);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-8">
      <DialogHeader>
        <DialogTitle className="text-xl sm:text-2xl font-bold text-center">로그인 / 회원가입</DialogTitle>
      </DialogHeader>
      <div className="flex space-x-1 p-2 bg-gray-100 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab("login")}
          className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-all ${
            activeTab === "login"
              ? "bg-white text-green-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => setActiveTab("signup")}
          className={`flex-1 py-3 px-4 rounded-md text-base font-medium transition-all ${
            activeTab === "signup"
              ? "bg-white text-green-600 shadow-sm"
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
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
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
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-lg transition-colors text-base" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
          <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="text-base">관리자 계정으로 로그인하려면</p>
            <p className="text-sm">이메일에 "admin" 또는 "관리자"를 포함하세요</p>
          </div>
        </div>
      )}
      {activeTab === "signup" && (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="signup-name" className="text-base font-medium">이름</Label>
            <Input
              id="signup-name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
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
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="signup-password" className="text-base font-medium">비밀번호</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              disabled={isLoading}
            />
          </div>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-lg transition-colors text-base" 
            onClick={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? "회원가입 중..." : "회원가입"}
          </Button>
        </div>
      )}
    </DialogContent>
  );
}

export default function EnvironmentalMapPlatform() {
  // 모든 훅은 컴포넌트 최상단에서 선언
  const { toast } = useToast()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [currentView, setCurrentView] = useState<"map" | "stats" | "analysis" | "community">("map")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    status: "all",
    dateRange: "all",
    severity: "all",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [searchApplied, setSearchApplied] = useState(false)
  const [searchResults, setSearchResults] = useState<Report[]>([])
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [detailCardPos, setDetailCardPos] = useState<{ x: number; y: number } | null>(null)
  const [showLoginRequired, setShowLoginRequired] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showMyReports, setShowMyReports] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setChecked(true);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || "");
      setProfileEmail(currentUser.email || "");
    }
  }, [currentUser]);

  if (!checked) return null; // 렌더링 전 userAgent 체크 대기

  // 제보 데이터
  const [reports, setReports] = useState<Report[]>([
    {
      id: 1,
      title: "강북구 공원 쓰레기 무단투기",
      location: "강북구 번동 공원",
      type: "waste",
      severity: "medium",
      reporter: "김철수",
      date: "2024-01-20",
      status: "제보접수",
      description: "공원 내 벤치 주변에 음식물 쓰레기와 플라스틱 병들이 무단으로 버려져 있습니다. 아이들이 놀기 전에 정리가 필요합니다.",
      coordinates: { lat: 37.5665, lng: 126.9780 },
      images: ["/placeholder-user.jpg", "/placeholder-logo.png"],
      aiAnalysis: {
        summary: "공원 내 쓰레기 무단투기 문제로, 신속한 정리가 필요합니다.",
        keywords: ["쓰레기", "공원", "정리"],
        category: "폐기물 관리",
        urgency: "medium",
        estimatedCost: "50만원",
        expectedDuration: "3일"
      }
    },
    {
      id: 2,
      title: "성북구 대기오염 심각",
      location: "성북구 동소문로",
      type: "air",
      severity: "high",
      reporter: "이영희",
      date: "2024-01-19",
      status: "처리중",
      description: "도로변에서 매연 냄새가 심하게 나고 있습니다. 특히 오후 시간대에 더욱 심해집니다.",
      coordinates: { lat: 37.5894, lng: 127.0167 },
      images: ["/placeholder-logo.svg"],
      assignedTo: "환경과 김과장",
      processingNotes: "대기질 측정 장비 설치 완료. 24시간 모니터링 중입니다."
    },
    {
      id: 3,
      title: "종로구 하천 오염",
      location: "종로구 청운동 하천",
      type: "water",
      severity: "high",
      reporter: "박민수",
      date: "2024-01-18",
      status: "처리완료",
      description: "하천에 기름기가 떠다니고 물이 탁해졌습니다. 생태계에 영향을 줄 수 있습니다.",
      coordinates: { lat: 37.5735, lng: 126.9789 },
      images: ["/placeholder.jpg"],
      resolvedDate: "2024-01-20",
      resolutionReport: "하천 정화 작업 완료. 오염원 차단 조치 완료."
    },
    {
      id: 4,
      title: "마포구 야간 소음",
      location: "마포구 합정동",
      type: "noise",
      severity: "medium",
      reporter: "최지영",
      date: "2024-01-17",
      status: "제보접수",
      description: "새벽 2시경부터 공사장 소음이 들립니다. 주민들의 수면에 지장을 주고 있습니다.",
      coordinates: { lat: 37.5492, lng: 126.9136 },
      images: ["/placeholder.jpg"]
    },
    {
      id: 5,
      title: "용산구 폐건축자재 불법투기",
      location: "용산구 한강대로",
      type: "waste",
      severity: "low",
      reporter: "정수민",
      date: "2024-01-16",
      status: "처리중",
      description: "도로변에 건축자재들이 버려져 있습니다. 통행에 불편을 주고 있습니다.",
      coordinates: { lat: 37.5320, lng: 126.9904 },
      images: ["/placeholder.jpg"],
      assignedTo: "청소과 박대리"
    }
  ])

  // 커뮤니티 데이터
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([
    {
      id: 1,
      title: "우리 동네 환경 개선 프로젝트 참여하세요!",
      author: "환경지킴이",
      date: "2024-01-20",
      content: "함께 우리 동네를 더 깨끗하게 만들어요. 매주 토요일 오전 10시에 모입니다.",
      likes: 15,
      comments: 8,
      category: "모임",
      severity: "medium",
      isLiked: false,
      commentsList: [
        { author: "유저1", content: "좋은 프로젝트네요!", date: "2024-01-20" },
        { author: "유저2", content: "저도 참여하고 싶어요!", date: "2024-01-20" },
        { author: "유저3", content: "매주 토요일 기대됩니다.", date: "2024-01-21" },
        { author: "유저4", content: "친구랑 같이 가도 되나요?", date: "2024-01-21" },
        { author: "유저5", content: "장소가 어디인가요?", date: "2024-01-21" },
        { author: "유저6", content: "준비물이 있나요?", date: "2024-01-22" },
        { author: "유저7", content: "아이도 참여 가능한가요?", date: "2024-01-22" },
        { author: "유저8", content: "좋은 취지네요!", date: "2024-01-22" }
      ]
    },
    {
      id: 2,
      title: "미세먼지 측정 결과 공유",
      author: "데이터분석가",
      date: "2024-01-19",
      content: "이번 주 미세먼지 측정 결과를 공유합니다. 전반적으로 양호한 수준을 보이고 있습니다.",
      likes: 12,
      comments: 5,
      category: "정보",
      severity: "low",
      isLiked: false,
      commentsList: [
        { author: "유저A", content: "정보 감사합니다!", date: "2024-01-19" },
        { author: "유저B", content: "측정 위치가 어디인가요?", date: "2024-01-19" },
        { author: "유저C", content: "다음 주도 기대할게요.", date: "2024-01-20" },
        { author: "유저D", content: "수고 많으십니다.", date: "2024-01-20" },
        { author: "유저E", content: "데이터 공유 고맙습니다.", date: "2024-01-20" }
      ]
    },
    {
      id: 3,
      title: "환경 교육 프로그램 추천해주세요",
      author: "초보환경인",
      date: "2024-01-18",
      content: "환경에 대해 더 배우고 싶은데, 좋은 교육 프로그램이나 강의를 추천해주세요.",
      likes: 8,
      comments: 12,
      category: "질문",
      severity: "medium",
      isLiked: false,
      commentsList: [
        { author: "답변1", content: "환경부 공식 사이트 참고해보세요!", date: "2024-01-18" },
        { author: "답변2", content: "지역 도서관에서 강의가 있어요.", date: "2024-01-18" },
        { author: "답변3", content: "온라인 강의도 많아요!", date: "2024-01-19" },
        { author: "답변4", content: "유튜브에 좋은 채널 많아요.", date: "2024-01-19" },
        { author: "답변5", content: "저도 추천 부탁드려요!", date: "2024-01-19" },
        { author: "답변6", content: "환경교육센터 추천합니다.", date: "2024-01-19" },
        { author: "답변7", content: "아이들과 함께 듣기 좋아요.", date: "2024-01-20" },
        { author: "답변8", content: "무료 강의도 있나요?", date: "2024-01-20" },
        { author: "답변9", content: "링크 공유 부탁드려요.", date: "2024-01-20" },
        { author: "답변10", content: "오프라인 강의도 있나요?", date: "2024-01-20" },
        { author: "답변11", content: "관심있는 분들 모여요!", date: "2024-01-21" },
        { author: "답변12", content: "좋은 정보 감사합니다.", date: "2024-01-21" }
      ]
    },
    {
      id: 4,
      title: "플라스틱 사용 줄이기 캠페인 제안",
      author: "그린라이프",
      date: "2024-01-17",
      content: "우리 동네에서 플라스틱 사용을 줄이는 캠페인을 진행해보는 건 어떨까요?",
      likes: 25,
      comments: 15,
      category: "제안",
      severity: "high",
      isLiked: false,
      commentsList: [
        { author: "참여1", content: "좋은 제안입니다!", date: "2024-01-17" },
        { author: "참여2", content: "저도 동참할게요.", date: "2024-01-17" },
        { author: "참여3", content: "구체적인 계획이 있나요?", date: "2024-01-17" },
        { author: "참여4", content: "포스터 만들어볼까요?", date: "2024-01-18" },
        { author: "참여5", content: "SNS 홍보도 필요해요.", date: "2024-01-18" },
        { author: "참여6", content: "학교에도 알릴게요.", date: "2024-01-18" },
        { author: "참여7", content: "플라스틱 줄이기 실천 중입니다.", date: "2024-01-18" },
        { author: "참여8", content: "동네 카페와 협업하면 좋겠어요.", date: "2024-01-19" },
        { author: "참여9", content: "참여 방법이 궁금해요.", date: "2024-01-19" },
        { author: "참여10", content: "캠페인 일정이 있나요?", date: "2024-01-19" },
        { author: "참여11", content: "아이디어 모임 열어요!", date: "2024-01-19" },
        { author: "참여12", content: "포인트 제도 도입 어떨까요?", date: "2024-01-20" },
        { author: "참여13", content: "분리수거 교육도 함께!", date: "2024-01-20" },
        { author: "참여14", content: "동참할게요!", date: "2024-01-20" },
        { author: "참여15", content: "좋은 캠페인 기대합니다.", date: "2024-01-20" }
      ]
    }
  ])

  // 통계 데이터 계산
  const stats: Stats = useMemo(() => {
    const total = reports.length
    const pending = reports.filter(r => r.status === "제보접수").length
    const processing = reports.filter(r => r.status === "처리중").length
    const resolved = reports.filter(r => r.status === "처리완료").length
    
    // 이번 주 제보 수 계산
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek = reports.filter(r => {
      const reportDate = new Date(r.date)
      return reportDate >= weekAgo && reportDate <= now
    }).length

    return { total, pending, processing, resolved, thisWeek }
  }, [reports])

  // 필터링된 제보
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (filters.type !== "all" && report.type !== filters.type) return false
      if (filters.status !== "all" && report.status !== filters.status) return false
      if (filters.severity !== "all" && report.severity !== filters.severity) return false
      return true
    })
  }, [reports, filters])

  // 검색 결과
  const searchResultsFiltered = useMemo(() => {
    if (!searchApplied || !searchTerm.trim()) return []
    
    const term = searchTerm.toLowerCase()
    return reports.filter(report => 
      report.title.toLowerCase().includes(term) ||
      report.location.toLowerCase().includes(term) ||
      report.description.toLowerCase().includes(term) ||
      report.reporter.toLowerCase().includes(term)
    )
  }, [reports, searchTerm, searchApplied])

  // 현재 표시할 제보 목록
  const displayReports = searchApplied ? searchResultsFiltered : filteredReports

  // 핸들러 함수들
  const handleLogin = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // 관리자 권한 확인
      const isAdmin = email.includes('admin') || email.includes('관리자')
      
      setCurrentUser({
        id: user.uid,
        name: user.displayName || '사용자',
        email: user.email || '',
        isAdmin
      })
      setIsLoggedIn(true)
      setShowAuthDialog(false)
      
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      })
    } catch (error: any) {
      console.error('로그인 오류:', error)
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      await updateProfile(user, { displayName: name })
      
      setCurrentUser({
        id: user.uid,
        name,
        email,
        isAdmin: false
      })
      setIsLoggedIn(true)
      setShowAuthDialog(false)
      
      toast({
        title: "회원가입 성공",
        description: "환영합니다!",
      })
    } catch (error: any) {
      console.error('회원가입 오류:', error)
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    auth.signOut()
    setCurrentUser(null)
    setIsLoggedIn(false)
    toast({
      title: "로그아웃",
      description: "로그아웃되었습니다.",
    })
  }

  const handleCommunityPost = (postData: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'isLiked' | 'commentsList'>) => {
    const newPost: CommunityPost = {
      ...postData,
      id: Date.now(),
      likes: 0,
      comments: 0,
      isLiked: false,
      commentsList: []
    }
    setCommunityPosts(prev => [newPost, ...prev])
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchApplied(true)
    } else {
      setSearchApplied(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchApplied(false)
  }

  // 커뮤니티 댓글 추가
  const handleAddComment = (postId: number, comment: { author: string; content: string; date: string }) => {
    setCommunityPosts(prevPosts => prevPosts.map(post =>
      post.id === postId
        ? {
            ...post,
            comments: (post.comments || 0) + 1,
            commentsList: [...(post.commentsList || []), comment]
          }
        : post
    ))
  }

  // 커뮤니티 공감(좋아요) 추가/취소
  const handleToggleLike = (postId: number, isLike: boolean) => {
    setCommunityPosts(prevPosts => prevPosts.map(post =>
      post.id === postId
        ? {
            ...post,
            likes: Math.max(0, (post.likes || 0) + (isLike ? 1 : -1)),
            isLiked: isLike
          }
        : post
    ))
  }

  if (isMobile) {
    // 모바일 전용 JSX (모바일 반응형만 적용)
    return <div>모바일 화면</div>;
  } else {
    // PC 전용 JSX (PC 반응형만 적용)
    return <div>PC 화면</div>;
  }
}

// InfoRow 컴포넌트와 severityColor 함수 추가 (컴포넌트 하단에 위치)
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function severityColor(severity: string) {
  if (severity === '심각') return 'bg-red-400';
  if (severity === '보통') return 'bg-yellow-300';
  return 'bg-green-400';
}