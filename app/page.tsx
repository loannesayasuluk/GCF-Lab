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
  Brain
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
import { Menu as HeadlessUIMenu } from "@headlessui/react"
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, writeBatch, orderBy, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, updateEmail } from "firebase/auth";
import AnalysisView from "@/components/analysis-view"
import { CommunityView } from "@/components/community-view"
import { StatsView } from "@/components/stats-view"
import { Report, CommunityPost, User, Stats, Filters, Location, Notification } from "@/types"
import { typeLabels, typeIcons, typeColors, safeDateString, safeString, safeLocation } from '@/lib/utils';
import dynamic from "next/dynamic";
import ReportDetailDialog from "@/components/ReportDetailDialog"
import { CATEGORY_STYLES } from '../lib/utils'
import Link from "next/link";
import { useRouter } from "next/navigation";
import MapLegendOverlay from "@/components/map-legend-overlay";
import type { SimpleMapRef } from "@/components/simple-map"
const SimpleMap = dynamic(() => import("@/components/simple-map"), { ssr: false })

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

function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-white border-t flex justify-around items-center z-50 sm:hidden shadow-lg">
      <Link href="/" className="flex flex-col items-center flex-1 py-2 text-emerald-600">
        <Home className="w-6 h-6 mb-1" />
        <span className="text-xs">지도</span>
      </Link>
      <Link href="/stats" className="flex flex-col items-center flex-1 py-2 text-blue-600">
        <BarChart3 className="w-6 h-6 mb-1" />
        <span className="text-xs">통계</span>
      </Link>
      <Link href="/analysis" className="flex flex-col items-center flex-1 py-2 text-purple-600">
        <PieChart className="w-6 h-6 mb-1" />
        <span className="text-xs">분석</span>
      </Link>
      <Link href="/community" className="flex flex-col items-center flex-1 py-2 text-green-600">
        <MessageSquare className="w-6 h-6 mb-1" />
        <span className="text-xs">커뮤니티</span>
      </Link>
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

// 기기 및 화면비율 체크 유틸리티
function useDeviceType() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'pc'>('pc');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userAgent = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const width = window.innerWidth;
    
    if (isMobile || width < 600) setDevice('mobile');
    else if (width < 1024) setDevice('tablet');
    else setDevice('pc');
  }, []);
  return device;
}

// 타입 가드 함수 추가
function hasAddressField(location: any): location is { address: string } {
  return typeof location === 'object' && location !== null && 'address' in location;
}

// 한글 변환 유틸
function getSeverityLabel(severity: string) {
  if (severity === 'high' || severity === '심각') return '심각';
  if (severity === 'medium' || severity === '보통') return '보통';
  if (severity === 'low' || severity === '경미') return '경미';
  return severity;
}
function getTypeLabel(type: string) {
  if (type === 'waste') return '폐기물';
  if (type === 'air') return '대기오염';
  if (type === 'water') return '수질오염';
  if (type === 'noise') return '소음';
  return type;
}
function getStatusLabel(status: string) {
  if (status === '제보접수') return '제보접수';
  if (status === '처리중') return '처리중';
  if (status === '처리완료') return '처리완료';
  return status;
}
function formatDate(date: string) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ko-KR');
}

// 주소 검색 결과 타입 정의
interface AddressSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

// 제보 유형별 색상 반환 함수
function getTypeColor(type: string): string {
  switch (type) {
    case 'waste': return 'bg-purple-500'
    case 'air': return 'bg-blue-500'
    case 'water': return 'bg-cyan-500'
    case 'noise': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressSearchResults, setAddressSearchResults] = useState<AddressSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<SimpleMapRef>(null)
  const [aiSummary, setAiSummary] = useState<any>(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)

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

  // reports 초기값 빈 배열
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Firestore에서 reports 실시간 반영
  useEffect(() => {
    console.log('[지도 디버그] Firestore 데이터 로딩 시작');
    setReportsLoading(true);
    
    try {
      const q = collection(db, "reports");
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('[지도 디버그] Firestore에서', querySnapshot.docs.length, '개 문서 로딩됨');
        
        const data = querySnapshot.docs.map(doc => {
          const d = doc.data();
          
          // coordinates 타입 및 범위 검사
          let lat = d.coordinates?.lat;
          let lng = d.coordinates?.lng;
          let coordValid = true;
          if (typeof lat !== 'number' || typeof lng !== 'number') {
            coordValid = false;
          }
          if (coordValid && (lat < 33 || lat > 39 || lng < 124 || lng > 132)) {
            coordValid = false;
          }
          if (!coordValid) {
            console.warn(`잘못된 coordinates:`, d.coordinates, `문서ID:`, doc.id);
          }
          return {
            id: doc.id,
            title: safeString(d.title),
            location: safeLocation(d.location),
            type: d.type || "all",
            severity: d.severity || "all",
            reporter: safeString(d.reporter),
            date: d.date ? safeDateString(d.date) : '',
            status: d.status || "all",
            description: safeString(d.description),
            coordinates: coordValid ? { lat, lng } : { lat: 0, lng: 0 },
            images: d.images ?? [],
            assignedTo: d.assignedTo,
            processingNotes: d.processingNotes,
            resolvedDate: d.resolvedDate,
            resolutionReport: d.resolutionReport,
            aiAnalysis: d.aiAnalysis,
          } as Report;
        });
        
        const validReports = data.filter(r => r.coordinates.lat !== 0 && r.coordinates.lng !== 0);
        console.log('[지도 디버그] 유효한 coordinates를 가진 제보:', validReports.length, '개');
        
        // 중복 위치 확인
        const coordinates = validReports.map(r => `${r.coordinates.lat.toFixed(4)},${r.coordinates.lng.toFixed(4)}`);
        const uniqueCoordinates = new Set(coordinates);
        console.log('[지도 디버그] 고유한 좌표 개수:', uniqueCoordinates.size, '개');
        console.log('[지도 디버그] 모든 좌표:', coordinates);
        
        if (coordinates.length !== uniqueCoordinates.size) {
          console.log('[지도 디버그] 중복된 좌표가 있습니다!');
          const duplicates = coordinates.filter((coord, index) => coordinates.indexOf(coord) !== index);
          console.log('[지도 디버그] 중복된 좌표:', [...new Set(duplicates)]);
        }
        
        setReports(data);
        setReportsLoading(false);
      }, (error) => {
        console.error('[지도 디버그] Firestore 데이터 로딩 오류:', error);
        setReportsLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('[지도 디버그] Firestore 쿼리 생성 오류:', error);
      setReportsLoading(false);
    }
  }, []);

  // displayReports는 Firestore 데이터만 사용 (유효한 coordinates만 필터링)
  const displayReports = useMemo(() => {
    const validReports = reports.filter(report => 
      report.coordinates && 
      typeof report.coordinates.lat === 'number' && 
      typeof report.coordinates.lng === 'number' &&
      report.coordinates.lat !== 0 && 
      report.coordinates.lng !== 0
    );
    // filters 적용
    return validReports.filter(report => {
      const typeMatch = filters.type === 'all' || report.type === filters.type;
      const statusMatch = filters.status === 'all' || report.status === filters.status;
      return typeMatch && statusMatch;
    });
  }, [reports, filters]);

  // Firestore에서 communityPosts 불러오기
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      title: '우리 동네 환경 개선 프로젝트 참여하세요!',
      author: '환경지킴이',
      date: '2024-01-20',
      content: '함께 우리 동네를 더 깨끗하게 만들어요. 매주 토요일 오전 10시에 모입니다.',
      likes: 15,
      comments: 8,
      category: '모임',
    },
    {
      id: '2',
      title: '미세먼지 측정 결과 공유',
      author: '데이터분석가',
      date: '2024-01-19',
      content: '이번 주 우리 지역 미세먼지 농도 분석 결과를 공유합니다.',
      likes: 23,
      comments: 12,
      category: '정보',
    }
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
          isLiked: false,
          commentsList: []
        } as CommunityPost;
      });
      if (data.length > 0) {
        setCommunityPosts(data);
      }
    };
    fetchPosts();
  }, []);

  // stats 초기값 설정
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    thisWeek: 0,
    totalReports: 0,
    activeReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    averageResolutionTime: 0,
    reportsByType: {},
    reportsBySeverity: {},
    reportsByStatus: {},
    monthlyTrends: [],
    topLocations: []
  });

  // stats 업데이트
  useEffect(() => {
    // 전체 제보 수 (coordinates 유효성과 관계없이)
    const totalAllReports = reports.length;
    // 지도에 표시되는 제보 수 (유효한 coordinates만)
    const totalDisplayReports = displayReports.length;
    
    const newStats: Stats = {
      total: totalAllReports, // 전체 제보 수로 변경
      pending: reports.filter(r => r.status === '제보접수').length,
      processing: reports.filter(r => r.status === '처리중').length,
      resolved: reports.filter(r => r.status === '처리완료').length,
      thisWeek: 0,
      totalReports: totalAllReports, // 전체 제보 수
      activeReports: reports.filter(r => r.status === '처리중').length,
      resolvedReports: reports.filter(r => r.status === '처리완료').length,
      totalUsers: new Set(reports.map(r => r.reporter)).size,
      averageResolutionTime: 0,
      reportsByType: {},
      reportsBySeverity: {},
      reportsByStatus: {},
      monthlyTrends: [],
      topLocations: []
    };

    // 유형별 집계 (전체 제보 기준)
    const typeCounts: { [key: string]: number } = {};
    const severityCounts: { [key: string]: number } = {};
    const statusCounts: { [key: string]: number } = {};

    reports.forEach(report => {
      typeCounts[report.type] = (typeCounts[report.type] || 0) + 1;
      severityCounts[report.severity] = (severityCounts[report.severity] || 0) + 1;
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });

    newStats.reportsByType = typeCounts;
    newStats.reportsBySeverity = severityCounts;
    newStats.reportsByStatus = statusCounts;

    setStats(newStats);
  }, [reports, displayReports]);

  // currentView 변경 시 지도 인스턴스 정리
  useEffect(() => {
    if (currentView !== "map") {
      // 지도 뷰가 아닐 때 지도 인스턴스 정리
      if (typeof window !== 'undefined' && (window as any).leafletMapInstance) {
        try {
          if ((window as any).leafletMapInstance.remove) {
            (window as any).leafletMapInstance.remove();
          }
        } catch (e) {
          console.warn("[지도 디버그] currentView 변경 시 지도 정리 실패:", e);
        }
        (window as any).leafletMapInstance = null;
      }
      
      // DOM에서 Leaflet 관련 요소들 제거
      const allLeafletElements = document.querySelectorAll('[class*="leaflet"]');
      allLeafletElements.forEach(element => {
        try {
          element.remove();
        } catch (e) {
          console.warn("[지도 디버그] DOM 요소 정리 실패:", e);
        }
      });
    }
  }, [currentView]);

  // 컴포넌트 언마운트 시 지도 인스턴스 정리
  useEffect(() => {
    return () => {
      // 전역 지도 인스턴스 정리
      if (typeof window !== 'undefined' && (window as any).leafletMapInstance) {
        try {
          if ((window as any).leafletMapInstance.remove) {
            (window as any).leafletMapInstance.remove();
          }
        } catch (e) {
          console.warn("[지도 디버그] 컴포넌트 언마운트 시 지도 정리 실패:", e);
        }
        (window as any).leafletMapInstance = null;
      }
      
      // DOM에서 모든 Leaflet 관련 요소 완전 제거
      const allLeafletElements = document.querySelectorAll('[class*="leaflet"]');
      allLeafletElements.forEach(element => {
        try {
          element.remove();
        } catch (e) {
          console.warn("[지도 디버그] 컴포넌트 언마운트 시 DOM 요소 정리 실패:", e);
        }
      });
      
      // 추가: 모든 Leaflet 관련 스타일시트 제거
      const leafletStylesheets = document.querySelectorAll('link[href*="leaflet"]');
      leafletStylesheets.forEach(link => {
        try {
          link.remove();
        } catch (e) {
          console.warn("[지도 디버그] Leaflet 스타일시트 제거 실패:", e);
        }
      });
      
      // 추가: 모든 Leaflet 관련 스크립트 제거
      const leafletScripts = document.querySelectorAll('script[src*="leaflet"]');
      leafletScripts.forEach(script => {
        try {
          script.remove();
        } catch (e) {
          console.warn("[지도 디버그] Leaflet 스크립트 제거 실패:", e);
        }
      });
    };
  }, []);

  const handleAddReport = async (reportData: Omit<Report, "id">) => {
    try {
      const docRef = await addDoc(collection(db, "reports"), reportData);
      toast({
        title: "제보 성공",
        description: "환경 제보가 성공적으로 등록되었습니다.",
      });
      setShowReportDialog(false);
    } catch (error) {
      console.error("Error adding report: ", error);
      toast({
        title: "제보 실패",
        description: "제보 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'isLiked' | 'commentsList'>) => {
    try {
      const docRef = await addDoc(collection(db, "communityPosts"), {
        ...postData,
        likes: 0,
        comments: 0,
        date: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "게시 성공",
        description: "게시글이 성공적으로 등록되었습니다.",
      });
    } catch (error) {
      console.error("Error adding post: ", error);
      toast({
        title: "게시 실패",
        description: "게시글 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setCurrentUser({
        id: user.uid,
        name: user.displayName || "사용자",
        email: user.email || "",
        avatar: user.photoURL || "",
        role: "user",
        isAdmin: false
      });
      setIsLoggedIn(true);
      setShowAuthDialog(false);
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "로그인 중 오류가 발생했습니다.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "등록되지 않은 이메일입니다.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "비밀번호가 올바르지 않습니다.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      }
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      setCurrentUser({
        id: user.uid,
        name: name,
        email: user.email || "",
        avatar: "",
        role: "user",
        isAdmin: false
      });
      setIsLoggedIn(true);
      setShowAuthDialog(false);
      toast({
        title: "회원가입 성공",
        description: "환경지킴이에 오신 것을 환영합니다!",
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "이미 사용 중인 이메일입니다.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "비밀번호가 너무 약합니다.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      }
      toast({
        title: "회원가입 실패",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setCurrentUser(null);
    setIsLoggedIn(false);
    toast({
      title: "로그아웃",
      description: "안전하게 로그아웃되었습니다.",
    });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchApplied(true);
      const results = displayReports.filter(report => {
        const loc = report.location;
        return (
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (
            loc != null &&
            (
              typeof loc === 'object' && (loc as object) !== null && 'address' in (loc as object)
                ? ((loc as unknown as { address: string }).address.toLowerCase().includes(searchTerm.toLowerCase()))
                : typeof loc === 'string'
                  ? (loc as string).toLowerCase().includes(searchTerm.toLowerCase())
                  : false
            )
          ) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.reporter.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setSearchResults(results);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchApplied(false);
    setSearchResults([]);
  };

  const handleAddComment = (postId: string, comment: { author: string; content: string; date: string }) => {
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...(post.commentsList || []), comment]
        };
      }
      return post;
    }));
  };

  const handleToggleLike = (postId: string, isLike: boolean) => {
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isLike ? post.likes + 1 : post.likes - 1,
          isLiked: isLike
        };
      }
      return post;
    }));
  };

  useEffect(() => {
    console.log('[디버그] selectedReport 값 변경:', selectedReport);
  }, [selectedReport]);

  // 주소 검색 함수 (OpenStreetMap Nominatim API 사용)
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAddressSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // 한국 지역으로 제한하고, 주소 검색에 최적화된 파라미터
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=kr&` +
        `addressdetails=1&` +
        `limit=10&` +
        `format=json&` +
        `accept-language=ko`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAddressSearchResults(data)
      } else {
        console.error('주소 검색 실패:', response.status)
        setAddressSearchResults([])
      }
    } catch (error) {
      console.error('주소 검색 오류:', error)
      setAddressSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 검색어 변경 시 디바운스 적용
  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value)
    setShowSearchResults(true)
    
    // 이전 타이머 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // 500ms 후에 검색 실행 (디바운스)
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value)
    }, 500)
  }

  // 주소 선택 시 지도 이동
  const handleAddressSelect = (result: AddressSearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    
    // 지도 중심 이동
    if (mapRef.current) {
      mapRef.current.flyTo(lat, lng, 15)
    }
    
    setSearchTerm(result.display_name)
    setShowSearchResults(false)
    setAddressSearchResults([])
  }

  // 검색 결과 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // AI 분석 요약 호출
  useEffect(() => {
    const callAISummary = async () => {
      if (displayReports.length === 0) {
        setAiSummary(null)
        return
      }

      setAiSummaryLoading(true)
      try {
        // 제보 데이터를 문자열로 변환하여 AI 분석에 전달
        const reportsData = displayReports.map(report => ({
          title: report.title,
          description: report.description,
          type: report.type,
          status: report.status,
          severity: report.severity,
          location: report.location,
          date: report.date
        }))
        
        const content = JSON.stringify(reportsData, null, 2)
        const result = await fetchAISummary(content)
        setAiSummary(result)
      } catch (error) {
        console.error('AI 분석 오류:', error)
        setAiSummary(null)
      } finally {
        setAiSummaryLoading(false)
      }
    }

    // 디바운스 적용 (1초 후 실행)
    const timeoutId = setTimeout(callAISummary, 1000)
    return () => clearTimeout(timeoutId)
  }, [displayReports])

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* 좌측 사이드바: 검색, 필터, 최근 제보, AI 분석 요약 등 */}
          <div className="space-y-6 bg-blue-50/80 rounded-2xl p-2">
            {/* 필터 */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <span>필터</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">유형</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value as any})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="waste">폐기물</SelectItem>
                      <SelectItem value="air">대기오염</SelectItem>
                      <SelectItem value="water">수질오염</SelectItem>
                      <SelectItem value="noise">소음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">상태</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value as any})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="제보접수">제보접수</SelectItem>
                      <SelectItem value="처리중">처리중</SelectItem>
                      <SelectItem value="처리완료">처리완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            {/* 현황 요약 */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <span>현황 요약</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 주요 통계 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-emerald-600 font-medium">전체 제보</div>
                        <div className="text-lg font-bold text-emerald-700">{stats.totalReports}</div>
                      </div>
                      <div className="text-emerald-500">
                        <Activity className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-blue-600 font-medium">처리중</div>
                        <div className="text-lg font-bold text-blue-700">{stats.activeReports}</div>
                      </div>
                      <div className="text-blue-500">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-green-600 font-medium">해결완료</div>
                        <div className="text-lg font-bold text-green-700">{stats.resolvedReports}</div>
                      </div>
                      <div className="text-green-500">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-purple-600 font-medium">활성 사용자</div>
                        <div className="text-lg font-bold text-purple-700">{stats.totalUsers}</div>
                      </div>
                      <div className="text-purple-500">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* 메인 지도 영역 */}
          <div className="xl:col-span-3 bg-blue-50/80 rounded-2xl p-2">
            <Card className="bg-white border-0 shadow-lg h-[700px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span>환경 지도</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowReportDialog(true)}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      제보하기
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative w-full h-[700px] min-h-[600px] p-0 flex-1" style={{height: 700, minHeight: 600}}>
                {currentView === "map" && (
                  <>
                    {reportsLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">제보 데이터를 불러오는 중...</p>
                        </div>
                      </div>
                    ) : (
                      <SimpleMap
                        ref={mapRef}
                        reports={displayReports}
                        onReportSelect={(report) => {
                          console.log('[디버그] onReportSelect 호출:', report);
                          setSelectedReport(report);
                        }}
                        selectedReport={selectedReport}
                        currentLocation={currentLocation}
                        isDialogOpen={!!selectedReport}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            <MapLegendOverlay />
          </div>
        </div>
        {selectedReport && (
          <ReportDetailDialog
            report={selectedReport}
            open={!!selectedReport}
            onOpenChange={(open) => {
              if (!open) setSelectedReport(null);
            }}
          />
        )}
      </div>
    </>
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