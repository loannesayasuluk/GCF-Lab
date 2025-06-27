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
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showMyReports, setShowMyReports] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [profileName, setProfileName] = useState(currentUser?.name || "")
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || "")
  const [profileLoading, setProfileLoading] = useState(false)

  // 제보 데이터
  const [reports, setReports] = useState<Report[]>([
    {
      id: 1,
      title: "강북구 공원 쓰레기 무단투기",
      location: "강북구 번동 공원",
      type: "waste",
      severity: "보통",
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
        urgency: "보통",
        estimatedCost: "50만원",
        expectedDuration: "3일"
      }
    },
    {
      id: 2,
      title: "성북구 대기오염 심각",
      location: "성북구 동소문로",
      type: "air",
      severity: "심각",
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
      severity: "심각",
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
      severity: "보통",
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
      severity: "경미",
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
      console.log('로그인 버튼 클릭됨', email, password); // 디버깅용
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
      console.log('회원가입 버튼 클릭됨', email, password, name); // 디버깅용
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
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[450px] max-h-[90vh] overflow-y-auto p-6 sm:p-8">
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
    )
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 md:h-28">
            {/* 로고/타이틀 */}
            <a href="/" className="flex items-center gap-4 group select-none focus:outline-none">
              <span className="flex items-center justify-center bg-gradient-to-br from-green-300 via-emerald-400 to-green-600 rounded-full p-2 shadow-lg">
                <Leaf className="h-8 w-8 text-emerald-700 group-hover:text-emerald-900 transition-all duration-300" />
              </span>
              <span className="flex flex-col justify-center">
                <span className="text-2xl font-extrabold tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors" style={{ fontFamily: 'Pretendard, Noto Sans KR, sans-serif' }}>GCF LAB</span>
                <span className="text-xs md:text-sm text-gray-500 font-medium mt-1 group-hover:text-emerald-600 transition-colors">인공지능 환경 제보 플랫폼</span>
              </span>
            </a>
            {/* 네비게이션 */}
            <nav className="flex-1 flex justify-center items-center space-x-10">
              <button onClick={() => setCurrentView("map")} className={`px-5 py-2 rounded-xl text-lg font-bold transition-colors ${currentView === "map" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-emerald-700"}`}>지도</button>
              <button onClick={() => setCurrentView("stats")} className={`px-5 py-2 rounded-xl text-lg font-bold transition-colors ${currentView === "stats" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-emerald-700"}`}>통계</button>
              <button onClick={() => setCurrentView("analysis")} className={`px-5 py-2 rounded-xl text-lg font-bold transition-colors ${currentView === "analysis" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-emerald-700"}`}>분석</button>
              <button onClick={() => setCurrentView("community")} className={`px-5 py-2 rounded-xl text-lg font-bold transition-colors ${currentView === "community" ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-emerald-700"}`}>커뮤니티</button>
            </nav>
            {/* 제보하기/프로필 */}
            <div className="flex items-center gap-6">
              {isLoggedIn ? (
                <>
                  <Button onClick={() => setShowReportDialog(true)} className="bg-green-600 hover:bg-green-700 text-base px-6 py-3">제보하기</Button>
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center focus:outline-none">
                      <Avatar className="h-10 w-10 border-2 border-green-200 shadow">
                        <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-3 z-50 border flex flex-col gap-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setShowProfileDialog(true)}
                            className={`flex items-center gap-3 w-full px-5 py-3 text-base rounded-xl transition-all ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-800 hover:bg-gray-50'}`}
                          >
                            <UserIcon className="h-5 w-5" /> 내 정보
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setShowMyReports(true)}
                            className={`flex items-center gap-3 w-full px-5 py-3 text-base rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-gray-50'}`}
                          >
                            <BarChart3 className="h-5 w-5" /> 내 제보 현황
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 w-full px-5 py-3 text-base rounded-xl transition-all ${active ? 'bg-red-50 text-red-700' : 'text-gray-800 hover:bg-gray-50'}`}
                          >
                            <LogOut className="h-5 w-5" /> 로그아웃
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </>
              ) : (
                <Button onClick={() => setShowAuthDialog(true)} className="relative overflow-hidden bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white font-extrabold text-sm px-4 py-2 rounded-lg shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-2">
                  <LogIn className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">로그인</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-md mx-auto px-2 sm:px-0 py-8">
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
                    onReportSelect={setSelectedReport}
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
            onAddComment={handleAddComment}
            onToggleLike={handleToggleLike}
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
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2"
          onClick={(e) => {
            // 오버레이(배경) 클릭 시 닫기. 상세 카드 클릭 시에는 닫히지 않게(e.stopPropagation)
            if (e.target === e.currentTarget) setSelectedReport(null);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* 상단 심각도 컬러 바 */}
            <div className={`h-2 w-full ${severityColor(selectedReport.severity)} transition-all`} />
            {/* 닫기 버튼 */}
            <button
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full p-1"
              onClick={() => setSelectedReport(null)}
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            {/* 제목/위치 */}
            <div className="px-8 pt-8 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">
                  {selectedReport.severity === '심각' ? '❗' : selectedReport.severity === '보통' ? '⚠️' : '✅'}
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900">{selectedReport.title}</h2>
              </div>
              <div className="text-sm text-gray-500">{selectedReport.location}</div>
            </div>
            {/* 주요 정보 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-8 py-4 text-sm">
              <InfoRow icon={<UserIcon className="w-4 h-4" />} label="제보자" value={selectedReport.reporter} />
              <InfoRow icon={<BarChart3 className="w-4 h-4" />} label="유형" value={selectedReport.type} />
              <InfoRow icon={<AlertCircle className="w-4 h-4" />} label="심각도" value={selectedReport.severity} />
              <InfoRow icon={<CheckCircle className="w-4 h-4" />} label="상태" value={selectedReport.status} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="제보일" value={selectedReport.date} />
            </div>
            {/* 상세 설명 */}
            <div className="px-8 pb-4">
              <div className="font-semibold text-gray-800 mb-1">상세 설명</div>
              <blockquote className="bg-gray-50 border-l-4 border-blue-200 text-gray-700 p-4 rounded-lg italic">
                {selectedReport.description}
              </blockquote>
            </div>
            {/* AI 분석 결과 */}
            {selectedReport.aiAnalysis && (
              <div className="px-8 pb-8">
                <div className="font-semibold text-blue-900 mb-1">AI 분석 결과</div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">{selectedReport.aiAnalysis.summary}</p>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {selectedReport.aiAnalysis.keywords?.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    {selectedReport.aiAnalysis.category && <div>카테고리: {selectedReport.aiAnalysis.category}</div>}
                    {selectedReport.aiAnalysis.urgency && <div>긴급도: {selectedReport.aiAnalysis.urgency}</div>}
                    {selectedReport.aiAnalysis.estimatedCost && <div>예상비용: {selectedReport.aiAnalysis.estimatedCost}</div>}
                    {selectedReport.aiAnalysis.expectedDuration && <div>예상소요: {selectedReport.aiAnalysis.expectedDuration}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 내 정보 다이얼로그 */}
      <Dialog open={showProfileDialog} onOpenChange={(open) => {
        setShowProfileDialog(open)
        if (open) {
          setEditProfile(false)
          setProfileName(currentUser?.name || "")
          setProfileEmail(currentUser?.email || "")
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>내 정보</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-20 w-20 border-2 border-emerald-300">
              <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            {editProfile ? (
              <>
                <input
                  className="border rounded px-3 py-2 w-full text-lg font-bold text-center mb-2"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="이름"
                  disabled={profileLoading}
                />
                <input
                  className="border rounded px-3 py-2 w-full text-center mb-2"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  placeholder="이메일"
                  disabled={profileLoading}
                />
              </>
            ) : (
              <>
                <div className="text-lg font-bold">{currentUser?.name}</div>
                <div className="text-gray-600">{currentUser?.email}</div>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {editProfile ? (
              <>
                <Button
                  onClick={async () => {
                    setProfileLoading(true)
                    try {
                      if (auth.currentUser) {
                        if (profileName !== currentUser?.name) {
                          await updateProfile(auth.currentUser, { displayName: profileName })
                        }
                        if (profileEmail !== currentUser?.email) {
                          await updateEmail(auth.currentUser, profileEmail)
                        }
                        setCurrentUser({ ...currentUser, name: profileName, email: profileEmail })
                        toast({ title: "정보 수정 완료", description: "내 정보가 성공적으로 변경되었습니다." })
                        setEditProfile(false)
                      }
                    } catch (error: any) {
                      toast({ title: "수정 실패", description: error.message || "정보 수정 중 오류가 발생했습니다.", variant: "destructive" })
                    } finally {
                      setProfileLoading(false)
                    }
                  }}
                  disabled={profileLoading || (!profileName.trim() || !profileEmail.trim())}
                  className="flex-1"
                >
                  저장
                </Button>
                <Button onClick={() => { setEditProfile(false); setProfileName(currentUser?.name || ""); setProfileEmail(currentUser?.email || "") }} disabled={profileLoading} variant="outline" className="flex-1">취소</Button>
              </>
            ) : (
              <Button onClick={() => setEditProfile(true)} className="w-full">수정</Button>
            )}
            <Button onClick={() => setShowProfileDialog(false)} className="w-full">닫기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 내 제보 현황 다이얼로그 */}
      <Dialog open={showMyReports} onOpenChange={setShowMyReports}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>내 제보 현황</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {reports.filter(r => r.reporter === currentUser?.name).length === 0 ? (
              <div className="text-center text-gray-500 py-8">내가 작성한 제보가 없습니다.</div>
            ) : (
              reports.filter(r => r.reporter === currentUser?.name).map((report) => (
                <Card key={report.id} className="border">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{report.title}</span>
                      <Badge className="ml-2" variant="outline">{report.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700 mb-2">{report.location}</div>
                    <div className="text-xs text-gray-500 mb-2">{report.date}</div>
                    <div className="text-sm text-gray-800">{report.description}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <Button onClick={() => setShowMyReports(false)} className="w-full mt-4">닫기</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
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