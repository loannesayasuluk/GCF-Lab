"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
  Brain,
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
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
    <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-4 sm:p-8">
      <DialogHeader>
        <DialogTitle className="text-xl sm:text-2xl font-bold text-center">로그인 / 회원가입</DialogTitle>
      </DialogHeader>
      
      {/* 탭 버튼 */}
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

      {/* 로그인 폼 */}
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
              className="w-full py-3 px-4 text-lg sm:py-2 sm:text-base rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full py-3 px-4 text-lg sm:py-2 sm:text-base rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

      {/* 회원가입 폼 */}
      {activeTab === "signup" && (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="signup-name" className="text-base font-medium">이름</Label>
            <Input
              id="signup-name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-3 px-4 text-lg sm:py-2 sm:text-base rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full py-3 px-4 text-lg sm:py-2 sm:text-base rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full py-3 px-4 text-lg sm:py-2 sm:text-base rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
  )
}

export default function EnvironmentalMapPlatform() {
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

  // 제보 데이터
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
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
      id: "2",
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
      id: "3",
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
      id: "4",
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
      id: "5",
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
      id: "1",
      title: "우리 동네 환경 개선 프로젝트 참여하세요!",
      author: "환경지킴이",
      date: "2024-01-20",
      content: "함께 우리 동네를 더 깨끗하게 만들어요. 매주 토요일 오전 10시에 모입니다.",
      likes: 15,
      comments: 8,
      category: "모임",
    },
    {
      id: "2",
      title: "미세먼지 측정 결과 공유",
      author: "데이터분석가",
      date: "2024-01-19",
      content: "이번 주 우리 지역 미세먼지 농도 분석 결과를 공유합니다.",
      likes: 23,
      comments: 12,
      category: "정보",
    },
    {
      id: "3",
      title: "환경 보호를 위한 실천 방법",
      author: "환경전문가",
      date: "2024-01-18",
      content: "일상에서 쉽게 실천할 수 있는 환경 보호 방법들을 소개합니다.",
      likes: 45,
      comments: 18,
      category: "팁",
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

  const handleCommunityPost = (postData: Omit<CommunityPost, 'id' | 'likes' | 'comments'>) => {
    const newPost: CommunityPost = {
      ...postData,
      id: Date.now().toString(),
      likes: 0,
      comments: 0
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 및 타이틀 */}
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
              <Leaf className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg sm:text-2xl font-bold text-gray-900">GCF Lab</span>
                <span className="text-xs sm:text-sm text-gray-500">환경 지도 플랫폼</span>
              </div>
            </div>

            {/* 네비게이션 */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setCurrentView("map")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "map"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                지도
              </button>
              <button
                onClick={() => setCurrentView("stats")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "stats"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                통계
              </button>
              <button
                onClick={() => setCurrentView("analysis")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "analysis"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                분석
              </button>
              <button
                onClick={() => setCurrentView("community")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "community"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                커뮤니티
              </button>
            </nav>

            {/* 사용자 메뉴 */}
            <div className="flex items-center space-x-4">
              {/* 제보하기 버튼 - 로그인 여부와 관계없이 표시 */}
              <Button
                onClick={() => {
                  if (!isLoggedIn) {
                    setShowAuthDialog(true)
                    toast({
                      title: "로그인 필요",
                      description: "제보를 작성하려면 로그인이 필요합니다.",
                      variant: "destructive",
                    })
                  } else {
                    setShowReportDialog(true)
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                제보하기
              </Button>

              {isLoggedIn ? (
                <>
                  <div className="relative">
                    <Button variant="ghost" size="sm">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </div>
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {currentUser?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                          >
                            프로필
                          </button>
                        )}
                      </Menu.Item>
                      {currentUser?.isAdmin && (
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setShowAdminPanel(true)}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                            >
                              관리자 패널
                            </button>
                          )}
                        </Menu.Item>
                      )}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                          >
                            로그아웃
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </>
              ) : (
                <Button
                  onClick={() => setShowAuthDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        {(currentView === "map" || !currentView) && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="제보 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchApplied && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                검색
              </Button>
            </div>

            {/* 필터 */}
            <div className="flex flex-wrap gap-2">
              <Select value={filters.type} onValueChange={(value: Filters['type']) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  <SelectItem value="waste">폐기물</SelectItem>
                  <SelectItem value="air">대기오염</SelectItem>
                  <SelectItem value="water">수질오염</SelectItem>
                  <SelectItem value="noise">소음</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value: Filters['status']) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="제보접수">제보접수</SelectItem>
                  <SelectItem value="처리중">처리중</SelectItem>
                  <SelectItem value="처리완료">처리완료</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.severity} onValueChange={(value: Filters['severity']) => setFilters(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 심각도</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 뷰별 콘텐츠 */}
        {currentView === "map" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* 지도 영역 */}
            <div className="order-1 xl:order-2 xl:col-span-2">
              <Card className="h-[500px] sm:h-[600px] lg:h-[700px] relative z-0">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg sm:text-xl">환경 제보 지도</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {displayReports.length}건 표시
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 relative z-0" style={{ minHeight: '400px' }}>
                  <SimpleMap
                    reports={displayReports}
                    selectedReport={selectedReport}
                    onReportSelect={(report) => setSelectedReport(report)}
                    currentLocation={currentLocation}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* 사이드바 */}
            <div className="order-2 xl:order-1 xl:col-span-1 space-y-4 sm:space-y-6">
              {/* 실시간 통계 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>실시간 통계</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.total}</div>
                      <div className="text-sm sm:text-base text-gray-600">총 제보건수</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.thisWeek}</div>
                      <div className="text-sm sm:text-base text-gray-600">이번 주</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-sm sm:text-base text-gray-600">제보접수</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.processing}</div>
                      <div className="text-sm sm:text-base text-gray-600">처리중</div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>처리 완료율</span>
                      <span>{Math.round((stats.resolved / stats.total) * 100)}%</span>
                    </div>
                    <Progress value={(stats.resolved / stats.total) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* 최근 제보 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl">최근 제보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayReports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm line-clamp-1">{report.title}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              report.severity === "high"
                                ? "border-red-200 text-red-700"
                                : report.severity === "medium"
                                  ? "border-yellow-200 text-yellow-700"
                                  : "border-green-200 text-green-700"
                            }`}
                          >
                            {report.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{report.location}</p>
                        <p className="text-xs text-gray-400 mt-1">{report.date}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentView === "stats" && (
          <StatsView reports={reports} stats={stats} />
        )}

        {currentView === "analysis" && (
          <AnalysisView reports={reports} />
        )}

        {currentView === "community" && (
          <CommunityView
            posts={communityPosts}
            onAddPost={handleCommunityPost}
            onAddComment={(postId, comment) => {
              setCommunityPosts(prev => prev.map(post => 
                post.id === String(postId) 
                  ? { ...post, comments: post.comments + 1, commentsList: [...(post.commentsList || []), comment] }
                  : post
              ))
            }}
            onToggleLike={(postId, isLike) => {
              setCommunityPosts(prev => prev.map(post => 
                post.id === String(postId) 
                  ? { ...post, likes: post.likes + (isLike ? 1 : -1), isLiked: isLike }
                  : post
              ))
            }}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
          />
        )}
      </main>

      {/* 다이얼로그들 */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AuthDialog onLogin={handleLogin} onSignup={handleSignup} />
      </Dialog>

      {/* 제보 상세 카드 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge 
                      className={`${
                        selectedReport.severity === "high" 
                          ? "bg-red-100 text-red-800 border-red-200" 
                          : selectedReport.severity === "medium" 
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200" 
                            : "bg-green-100 text-green-800 border-green-200"
                      }`}
                    >
                      {selectedReport.severity === "high" ? "🔴 심각" : 
                       selectedReport.severity === "medium" ? "🟡 보통" : "🟢 경미"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedReport.type === "waste" ? "🗑️ 폐기물" :
                       selectedReport.type === "air" ? "💨 대기오염" :
                       selectedReport.type === "water" ? "💧 수질오염" :
                       selectedReport.type === "noise" ? "🔊 소음" : selectedReport.type}
                    </Badge>
                    <Badge 
                      className={`${
                        selectedReport.status === "처리완료" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : selectedReport.status === "처리중" 
                            ? "bg-blue-100 text-blue-800 border-blue-200" 
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }`}
                    >
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-gray-900">{selectedReport.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  className="hover:bg-gray-100 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">위치</span>
                    <span className="font-medium">{selectedReport.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">제보자</span>
                    <span className="font-medium">{selectedReport.reporter}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">제보일</span>
                    <span className="font-medium">{selectedReport.date}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedReport.assignedTo && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">담당자</span>
                      <span className="font-medium">{selectedReport.assignedTo}</span>
                    </div>
                  )}
                  {selectedReport.resolvedDate && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">해결일</span>
                      <span className="font-medium text-green-600">{selectedReport.resolvedDate}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* 상세 설명 */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>상세 설명</span>
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">{selectedReport.description}</p>
                </div>
              </div>

              {/* 처리 노트 */}
              {selectedReport.processingNotes && (
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>처리 노트</span>
                  </h4>
                  <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-200">
                    <p className="text-orange-800">{selectedReport.processingNotes}</p>
                  </div>
                </div>
              )}

              {/* 해결 보고서 */}
              {selectedReport.resolutionReport && (
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>해결 보고서</span>
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-200">
                    <p className="text-green-800">{selectedReport.resolutionReport}</p>
                  </div>
                </div>
              )}

              {/* AI 분석 결과 */}
              {selectedReport.aiAnalysis && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <h4 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                    <div className="relative">
                      <Brain className="h-5 w-5 text-purple-600 animate-bounce" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-bold">AI 분석 결과</span>
                    <span className="ml-2 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold animate-fade-in">Powered by AI</span>
                  </h4>
                  <div className="space-y-4">
                    {/* 분석 요약 */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 shadow-md animate-fade-in">
                      <h5 className="font-medium text-purple-800 mb-2 flex items-center space-x-2">
                        <Activity className="h-4 w-4 animate-spin-slow" />
                        <span>분석 요약</span>
                      </h5>
                      <p className="text-purple-700 leading-relaxed">{selectedReport.aiAnalysis.summary}</p>
                    </div>

                    {/* 키워드 */}
                    <div className="bg-blue-50 p-4 rounded-lg animate-fade-in">
                      <h5 className="font-medium text-blue-800 mb-3 flex items-center space-x-2">
                        <Target className="h-4 w-4 animate-pulse" />
                        <span>주요 키워드</span>
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.aiAnalysis.keywords.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors animate-bounce"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 분석 세부사항 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg animate-fade-in">
                        <h5 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
                          <PieChart className="h-4 w-4 animate-bounce" />
                          <span>분류</span>
                        </h5>
                        <p className="text-green-700">{selectedReport.aiAnalysis.category}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg animate-fade-in">
                        <h5 className="font-medium text-yellow-800 mb-2 flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 animate-bounce" />
                          <span>긴급도</span>
                        </h5>
                        <p className="text-yellow-700">{selectedReport.aiAnalysis.urgency}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg animate-fade-in">
                        <h5 className="font-medium text-red-800 mb-2 flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 animate-bounce" />
                          <span>예상 비용</span>
                        </h5>
                        <p className="text-red-700">{selectedReport.aiAnalysis.estimatedCost}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg animate-fade-in">
                        <h5 className="font-medium text-indigo-800 mb-2 flex items-center space-x-2">
                          <Clock className="h-4 w-4 animate-bounce" />
                          <span>예상 소요시간</span>
                        </h5>
                        <p className="text-indigo-700">{selectedReport.aiAnalysis.expectedDuration}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 이미지 */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <Camera className="h-5 w-5 text-gray-600" />
                    <span>첨부 이미지</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`제보 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 