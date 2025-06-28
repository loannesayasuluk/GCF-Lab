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
  Menu,
  Filter,
  Grid,
  List,
  Star,
  Share2,
  Bookmark,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  Shield,
  Globe,
  Zap,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  Thermometer,
  Gauge,
  AlertTriangle,
  Info,
  Check,
  XCircle,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  Send,
  Paperclip,
  Smile,
  Image,
  File,
  Folder,
  HardDrive,
  Database,
  Server,
  Network,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Lock,
  Unlock,
  Key,
  EyeOff,
  EyeOn,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Verified,
  Award,
  Trophy,
  Medal,
  Crown,
  Diamond,
  Gem,
  Sparkles,
  Magic,
  Wand,
  Hat,
  Glasses,
  Watch,
  Timer,
  Stopwatch,
  Hourglass,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarWeek,
  CalendarMonth,
  CalendarYear,
  CalendarTime,
  CalendarClock,
  CalendarEvent,
  CalendarHeart,
  CalendarStar,
  CalendarUser,
  CalendarSettings,
  CalendarSearch,
  CalendarEdit,
  CalendarTrash,
  CalendarDownload,
  CalendarUpload,
  CalendarShare,
  CalendarLock,
  CalendarUnlock,
  CalendarKey,
  CalendarEye,
  CalendarEyeOff,
  CalendarShield,
  CalendarAlert,
  CalendarCheckCircle,
  CalendarXCircle,
  CalendarMinusCircle,
  CalendarPlusCircle,
  CalendarHeartCircle,
  CalendarStarCircle,
  CalendarUserCircle,
  CalendarSettingsCircle,
  CalendarSearchCircle,
  CalendarEditCircle,
  CalendarTrashCircle,
  CalendarDownloadCircle,
  CalendarUploadCircle,
  CalendarShareCircle,
  CalendarLockCircle,
  CalendarUnlockCircle,
  CalendarKeyCircle,
  CalendarEyeCircle,
  CalendarEyeOffCircle,
  CalendarShieldCircle,
  CalendarAlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Menu as HeadlessUIMenu } from "@headlessui/react"
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, writeBatch, orderBy, Timestamp } from "firebase/firestore";
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
  onClose,
}: {
  onLogin: (email: string, password: string) => void
  onSignup: (email: string, password: string, name: string) => void
  onClose: () => void
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">환경지킴이에 오신 것을 환영합니다</DialogTitle>
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
    </Dialog>
  );
}

// 기기 및 화면비율 체크 유틸리티
function useDeviceType() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'pc'>('pc');
  useEffect(() => {
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const width = window.innerWidth;
    if (isMobile || width < 600) setDevice('mobile');
    else if (width < 1024) setDevice('tablet');
    else setDevice('pc');
  }, []);
  return device;
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

  const device = useDeviceType();

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

  // Firestore에서 reports 불러오기
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
      assignedTo: undefined,
      processingNotes: undefined,
      resolvedDate: undefined,
      resolutionReport: undefined,
      aiAnalysis: undefined,
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
      processingNotes: "대기질 측정 장비 설치 완료. 24시간 모니터링 중입니다.",
      resolvedDate: undefined,
      resolutionReport: undefined,
      aiAnalysis: undefined,
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
      assignedTo: undefined,
      processingNotes: undefined,
      resolvedDate: "2024-01-20",
      resolutionReport: "하천 정화 작업 완료. 오염원 차단 조치 완료.",
      aiAnalysis: undefined,
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
      images: ["/placeholder.jpg"],
      assignedTo: undefined,
      processingNotes: undefined,
      resolvedDate: undefined,
      resolutionReport: undefined,
      aiAnalysis: undefined,
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
      assignedTo: "청소과 박대리",
      processingNotes: undefined,
      resolvedDate: undefined,
      resolutionReport: undefined,
      aiAnalysis: undefined,
    },
  ]);
  useEffect(() => {
    const fetchReports = async () => {
      const q = query(collection(db, "reports"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title ?? "",
          location: d.location ?? "",
          type: d.type ?? "waste",
          severity: d.severity ?? "low",
          reporter: d.reporter ?? "",
          date: d.date ?? "",
          status: d.status ?? "제보접수",
          description: d.description ?? "",
          coordinates: d.coordinates ?? { lat: 0, lng: 0 },
          images: d.images ?? [],
          assignedTo: d.assignedTo,
          processingNotes: d.processingNotes,
          resolvedDate: d.resolvedDate,
          resolutionReport: d.resolutionReport,
          aiAnalysis: d.aiAnalysis,
        } as Report;
      });
      if (data.length > 0) setReports(data);
    };
    fetchReports();
  }, []);

  // Firestore에서 communityPosts 불러오기
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
      severity: "medium",
      isLiked: false,
      commentsList: [],
    },
    {
      id: "2",
      title: "미세먼지 측정 결과 공유",
      author: "데이터분석가",
      date: "2024-01-19",
      content: "이번 주 미세먼지 측정 결과를 공유합니다. 전반적으로 양호한 수준을 보이고 있습니다.",
      likes: 12,
      comments: 5,
      category: "정보",
      severity: "low",
      isLiked: false,
      commentsList: [],
    },
    {
      id: "3",
      title: "환경 교육 프로그램 추천해주세요",
      author: "초보환경인",
      date: "2024-01-18",
      content: "환경에 대해 더 배우고 싶은데, 좋은 교육 프로그램이나 강의를 추천해주세요.",
      likes: 8,
      comments: 12,
      category: "질문",
      severity: "medium",
      isLiked: false,
      commentsList: [],
    },
    {
      id: "4",
      title: "플라스틱 사용 줄이기 캠페인 제안",
      author: "그린라이프",
      date: "2024-01-17",
      content: "우리 동네에서 플라스틱 사용을 줄이는 캠페인을 진행해보는 건 어떨까요?",
      likes: 25,
      comments: 15,
      category: "제안",
      severity: "high",
      isLiked: false,
      commentsList: [],
    },
  ]);
  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "communityPosts"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title ?? "",
          author: d.author ?? "",
          date: d.date ?? "",
          content: d.content ?? "",
          likes: d.likes ?? 0,
          comments: d.comments ?? 0,
          category: d.category ?? "정보",
          severity: d.severity ?? "low",
          isLiked: d.isLiked ?? false,
          commentsList: d.commentsList ?? [],
        } as CommunityPost;
      });
      if (data.length > 0) setCommunityPosts(data);
    };
    fetchPosts();
  }, []);

  // 제보 작성/추가 시 Firestore에 저장
  const handleAddReport = async (reportData: Omit<Report, "id">) => {
    const docRef = await addDoc(collection(db, "reports"), {
      ...reportData,
      date: reportData.date || Timestamp.now(),
    });
    setReports(prev => [{ id: docRef.id, ...reportData }, ...prev]);
  };

  // 커뮤니티 글 작성 시 Firestore에 저장
  const handleCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'isLiked' | 'commentsList'>) => {
    const docRef = await addDoc(collection(db, "communityPosts"), {
      ...postData,
      date: postData.date || Timestamp.now(),
      likes: 0,
      comments: 0,
      isLiked: false,
      commentsList: [],
    });
    setCommunityPosts(prev => [{ id: docRef.id, ...postData, likes: 0, comments: 0, isLiked: false, commentsList: [] }, ...prev]);
  };

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
      report.location.address.toLowerCase().includes(term) ||
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
  const handleAddComment = (postId: string, comment: { author: string; content: string; date: string }) => {
    setCommunityPosts(prevPosts => prevPosts.map(post =>
      post.id === String(postId)
        ? {
            ...post,
            comments: (post.comments || 0) + 1,
            commentsList: [...(post.commentsList || []), comment]
          }
        : post
    ))
  }

  // 커뮤니티 공감(좋아요) 추가/취소
  const handleToggleLike = (postId: string, isLike: boolean) => {
    setCommunityPosts(prevPosts => prevPosts.map(post =>
      post.id === String(postId)
        ? {
            ...post,
            likes: Math.max(0, (post.likes || 0) + (isLike ? 1 : -1)),
            isLiked: isLike
          }
        : post
    ))
  }

  if (device === 'mobile') {
    return (
      <MobileMainPage
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        handleLogout={handleLogout}
        showAuthDialog={showAuthDialog}
        setShowAuthDialog={setShowAuthDialog}
        handleLogin={handleLogin}
        handleSignup={handleSignup}
        currentView={currentView}
        setCurrentView={setCurrentView}
        displayReports={displayReports}
        stats={stats}
        communityPosts={communityPosts}
        handleCommunityPost={handleCommunityPost}
        handleAddComment={handleAddComment}
        handleToggleLike={handleToggleLike}
        selectedReport={selectedReport}
        setSelectedReport={setSelectedReport}
        handleAddReport={handleAddReport}
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
      />
    );
  }
  // 태블릿은 PC와 동일하게 처리하거나, 필요시 TabletMainPage로 분기 가능
  return (
    <PCMainPage
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      handleLogout={handleLogout}
      showAuthDialog={showAuthDialog}
      setShowAuthDialog={setShowAuthDialog}
      handleLogin={handleLogin}
      handleSignup={handleSignup}
      currentView={currentView}
      setCurrentView={setCurrentView}
      displayReports={displayReports}
      stats={stats}
      communityPosts={communityPosts}
      handleCommunityPost={handleCommunityPost}
      handleAddComment={handleAddComment}
      handleToggleLike={handleToggleLike}
      selectedReport={selectedReport}
      setSelectedReport={setSelectedReport}
      handleAddReport={handleAddReport}
      searchQuery={searchTerm}
      setSearchQuery={setSearchTerm}
    />
  );
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

// 모바일 전용 메인 페이지
function MobileMainPage({
  isLoggedIn, currentUser, handleLogout, showAuthDialog, setShowAuthDialog, handleLogin, handleSignup,
  currentView, setCurrentView, displayReports, stats, communityPosts, handleCommunityPost, handleAddComment, handleToggleLike,
  selectedReport, setSelectedReport, handleAddReport, searchQuery, setSearchQuery
}: any) {
  // 탭 상태는 상위에서 props로 관리
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">환경지킴이</h1>
              <p className="text-xs text-gray-500">우리 동네 환경을 지켜요</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-sm">
                    {currentUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setShowAuthDialog(true)}>
                <LogIn className="w-4 h-4 mr-2" />
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="pb-20">
        {currentView === "map" && (
          <div className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="지역이나 문제를 검색해보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/70 backdrop-blur-sm border-gray-200"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">실시간 환경 현황</h3>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {displayReports.length}건
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {displayReports.slice(0, 3).map((report) => (
                      <div key={report.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          report.severity === 'high' ? 'bg-red-500' :
                          report.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{report.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{report.location.address}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {report.category === 'air' ? '대기' : 
                               report.category === 'water' ? '수질' : 
                               report.category === 'noise' ? '소음' : '기타'}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(report.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-5 h-5" />
                    <span className="font-semibold">활성 신고</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.activeReports}</p>
                  <p className="text-xs opacity-90">현재 처리 중</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">참여자</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs opacity-90">환경 지킴이</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentView === "stats" && (
          <div className="p-4">
            <StatsView stats={stats} />
          </div>
        )}

        {currentView === "analysis" && (
          <div className="p-4">
            <AnalysisView reports={displayReports} />
          </div>
        )}

        {currentView === "community" && (
          <div className="p-4">
            <CommunityView 
              posts={communityPosts}
              onAddPost={handleCommunityPost}
              onAddComment={handleAddComment}
              onToggleLike={handleToggleLike}
              isLoggedIn={isLoggedIn}
            />
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setCurrentView("map")}
            className={`flex flex-col items-center space-y-1 p-2 ${
              currentView === "map" ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">지도</span>
          </button>
          <button
            onClick={() => setCurrentView("stats")}
            className={`flex flex-col items-center space-y-1 p-2 ${
              currentView === "stats" ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs">통계</span>
          </button>
          <button
            onClick={() => setCurrentView("analysis")}
            className={`flex flex-col items-center space-y-1 p-2 ${
              currentView === "analysis" ? "text-purple-600" : "text-gray-400"
            }`}
          >
            <PieChart className="w-6 h-6" />
            <span className="text-xs">분석</span>
          </button>
          <button
            onClick={() => setCurrentView("community")}
            className={`flex flex-col items-center space-y-1 p-2 ${
              currentView === "community" ? "text-green-600" : "text-gray-400"
            }`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">커뮤니티</span>
          </button>
        </div>
      </nav>

      {/* 인증 다이얼로그 */}
      {showAuthDialog && (
        <AuthDialog
          onLogin={handleLogin}
          onSignup={handleSignup}
          onClose={() => setShowAuthDialog(false)}
        />
      )}
    </div>
  )
}

// PC 전용 메인 페이지
function PCMainPage({
  isLoggedIn, currentUser, handleLogout, showAuthDialog, setShowAuthDialog, handleLogin, handleSignup,
  currentView, setCurrentView, displayReports, stats, communityPosts, handleCommunityPost, handleAddComment, handleToggleLike,
  selectedReport, setSelectedReport, handleAddReport, searchQuery, setSearchQuery
}: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">환경지킴이</h1>
                <p className="text-sm text-gray-500">우리 동네 환경을 함께 지켜요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="지역이나 환경 문제를 검색해보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 bg-white/70 backdrop-blur-sm border-gray-200"
                />
              </div>
              
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    신고하기
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      {currentUser?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowAuthDialog(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* 사이드바 */}
          <div className="col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* 네비게이션 */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <button
                      onClick={() => setCurrentView("map")}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        currentView === "map" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Home className="w-5 h-5" />
                      <span className="font-medium">지도 보기</span>
                    </button>
                    <button
                      onClick={() => setCurrentView("stats")}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        currentView === "stats" 
                          ? "bg-blue-100 text-blue-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="font-medium">통계</span>
                    </button>
                    <button
                      onClick={() => setCurrentView("analysis")}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        currentView === "analysis" 
                          ? "bg-purple-100 text-purple-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <PieChart className="w-5 h-5" />
                      <span className="font-medium">분석</span>
                    </button>
                    <button
                      onClick={() => setCurrentView("community")}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        currentView === "community" 
                          ? "bg-green-100 text-green-700" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-medium">커뮤니티</span>
                    </button>
                  </nav>
                </CardContent>
              </Card>

              {/* 빠른 통계 */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">빠른 통계</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">총 신고</span>
                    <span className="font-semibold text-gray-900">{stats.totalReports}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">활성 신고</span>
                    <span className="font-semibold text-red-600">{stats.activeReports}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">해결 완료</span>
                    <span className="font-semibold text-green-600">{stats.resolvedReports}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">참여자</span>
                    <span className="font-semibold text-blue-600">{stats.totalUsers}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 메인 컨텐츠 영역 */}
          <div className="col-span-9">
            {currentView === "map" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        <span>실시간 환경 현황</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {displayReports.slice(0, 5).map((report) => (
                          <div key={report.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className={`w-4 h-4 rounded-full mt-2 flex-shrink-0 ${
                              report.severity === 'high' ? 'bg-red-500' :
                              report.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{report.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">{report.location.address}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline">
                                  {report.category === 'air' ? '대기오염' : 
                                   report.category === 'water' ? '수질오염' : 
                                   report.category === 'noise' ? '소음공해' : '기타'}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {new Date(report.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span>최근 활동</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {communityPosts.slice(0, 3).map((post) => (
                          <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">{post.title}</h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              <span>{post.author}</span>
                              <span>{new Date(post.date).toLocaleDateString()}</span>
                              <span>❤️ {post.likes}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-emerald-600" />
                      <span>환경 지도</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">지도가 여기에 표시됩니다</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentView === "stats" && (
              <div className="space-y-6">
                <StatsView stats={stats} />
              </div>
            )}

            {currentView === "analysis" && (
              <div className="space-y-6">
                <AnalysisView reports={displayReports} />
              </div>
            )}

            {currentView === "community" && (
              <div className="space-y-6">
                <CommunityView 
                  posts={communityPosts}
                  onAddPost={handleCommunityPost}
                  onAddComment={handleAddComment}
                  onToggleLike={handleToggleLike}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 인증 다이얼로그 */}
      {showAuthDialog && (
        <AuthDialog
          onLogin={handleLogin}
          onSignup={handleSignup}
          onClose={() => setShowAuthDialog(false)}
        />
      )}
    </div>
  )
}