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
  User,
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
    },
    {
      id: 2,
      title: "미세먼지 측정 결과 공유",
      author: "데이터분석가",
      date: "2024-01-19",
      content: "이번 주 우리 지역 미세먼지 농도 분석 결과를 공유합니다.",
      likes: 23,
      comments: 12,
      category: "정보",
    },
    {
      id: 3,
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

  // GPS 위치 정보 가져오기 - 고정밀 버전 (네이버/카카오/구글 맵 수준)
  const getCurrentLocation = () => {
    return new Promise<{ lat: number; lng: number; accuracy: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS를 지원하지 않는 브라우저입니다."))
        return
      }

      // 고정밀 GPS 설정 (네이버/카카오/구글 맵 수준)
      const options = {
        enableHighAccuracy: true, // 고정밀 모드
        timeout: 15000, // 15초 타임아웃
        maximumAge: 0, // 캐시된 위치 사용 안함 (항상 새로운 위치)
      }

      // 위치 정확도 필터링 함수
      const isAccurateEnough = (accuracy: number) => {
        return accuracy <= 20 // 20미터 이하 정확도만 허용
      }

      // 위치 평균화 함수 (여러 번 측정하여 정확도 향상)
      const getAveragePosition = (positions: GeolocationPosition[]) => {
        if (positions.length === 0) return null
        
        const totalLat = positions.reduce((sum: number, pos: GeolocationPosition) => sum + pos.coords.latitude, 0)
        const totalLng = positions.reduce((sum: number, pos: GeolocationPosition) => sum + pos.coords.longitude, 0)
        const avgLat = totalLat / positions.length
        const avgLng = totalLng / positions.length
        
        // 가장 정확한 측정값의 정확도 사용
        const bestAccuracy = Math.min(...positions.map((pos: GeolocationPosition) => pos.coords.accuracy))
        
        return {
          latitude: avgLat,
          longitude: avgLng,
          accuracy: bestAccuracy
        }
      }

      let positionCount = 0
      const maxPositions = 3 // 최대 3번 측정
      const positions: GeolocationPosition[] = []
      let timeoutId: ReturnType<typeof setTimeout>

      const successCallback = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // 정확도가 충분한 경우에만 수집
        if (isAccurateEnough(accuracy)) {
          positions.push(position)
          positionCount++
          
          // 충분한 측정을 했거나 정확도가 매우 높은 경우
          if (positionCount >= maxPositions || accuracy <= 5) {
            clearTimeout(timeoutId)
            
            const finalPosition = getAveragePosition(positions)
            if (finalPosition) {
              setCurrentLocation({ 
                lat: finalPosition.latitude, 
                lng: finalPosition.longitude 
              })
              setLocationAccuracy(finalPosition.accuracy)
              resolve({ 
                lat: finalPosition.latitude, 
                lng: finalPosition.longitude, 
                accuracy: finalPosition.accuracy 
              })
            } else {
              reject(new Error("정확한 위치를 얻을 수 없습니다."))
            }
          }
        } else {
          // 정확도가 부족한 경우 재시도
          if (positionCount < maxPositions) {
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
            }, 1000)
          } else {
            clearTimeout(timeoutId)
            reject(new Error("GPS 정확도가 부족합니다. 더 개방된 공간에서 시도해주세요."))
          }
        }
      }

      const errorCallback = (error: GeolocationPositionError) => {
        clearTimeout(timeoutId)
        let errorMessage = "위치 정보를 가져올 수 없습니다."
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다. GPS 신호를 확인해주세요."
            break
          case error.TIMEOUT:
            errorMessage = "위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요."
            break
        }
        
        reject(new Error(errorMessage))
      }

      // 전체 타임아웃 설정
      timeoutId = setTimeout(() => {
        if (positions.length > 0) {
          const finalPosition = getAveragePosition(positions)
          setCurrentLocation({ 
            lat: finalPosition.latitude, 
            lng: finalPosition.longitude 
          })
          setLocationAccuracy(finalPosition.accuracy)
          resolve({ 
            lat: finalPosition.latitude, 
            lng: finalPosition.longitude, 
            accuracy: finalPosition.accuracy 
          })
        } else {
          reject(new Error("위치 정보 요청 시간이 초과되었습니다."))
        }
      }, options.timeout)

      // 첫 번째 위치 요청 시작
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
    })
  }

  // 실시간 위치 추적 시작 (고정밀)
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS 지원 안됨",
        description: "이 브라우저는 GPS를 지원하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const successCallback = (position) => {
      const { latitude, longitude, accuracy } = position.coords
      
      // 정확도가 20미터 이하인 경우에만 위치 업데이트
      if (accuracy <= 20) {
        setCurrentLocation({ lat: latitude, lng: longitude })
        setLocationAccuracy(accuracy)
      }
    }

    const errorCallback = (error) => {
      console.warn("실시간 위치 추적 오류:", error)
    }

    // 기존 추적 중지
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    // 새로운 추적 시작
    watchIdRef.current = navigator.geolocation.watchPosition(successCallback, errorCallback, options)
  }

  // 실시간 위치 추적 중지
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  // AI 분석 시뮬레이션
  const analyzeReportWithAI = (title, description, type) => {
    const keywords = {
      waste: ["#폐기물", "#불법투기", "#악취", "#해충", "#생활쓰레기"],
      air: ["#미세먼지", "#대기오염", "#공사장", "#방진막", "#매연"],
      water: ["#수질오염", "#기름유출", "#물고기폐사", "#하천", "#악취"],
      noise: ["#소음공해", "#공사소음", "#야간소음", "#진동", "#데시벨"],
    }

    const selectedKeywords = keywords[type] || keywords.waste
    const analysisKeywords = selectedKeywords.slice(0, 3)

    const urgencyLevels = ["낮음", "보통", "높음", "매우높음"]
    const costs = ["10만원", "30만원", "50만원", "100만원", "200만원"]
    const durations = ["1일", "3일", "5일", "7일", "14일"]

    return {
      keywords: analysisKeywords,
      category:
        type === "waste" ? "폐기물 관리" : type === "air" ? "대기오염" : type === "water" ? "수질오염" : "소음공해",
      urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
      estimatedCost: costs[Math.floor(Math.random() * costs.length)],
      expectedDuration: durations[Math.floor(Math.random() * durations.length)],
    }
  }

  // 알림 추가 (Firestore 연동)
  const addNotification = async (message, type = "info", targetUserId = null) => {
    const newNotification = {
      id: Date.now(),
      message,
      type, // "info", "warning", "success", "error"
      timestamp: new Date().toISOString(),
      read: false,
      targetUserId: targetUserId || currentUser?.uid, // 특정 사용자에게만 알림
      createdAt: new Date().toISOString(),
    }
    
    try {
      // Firestore에 알림 저장
      await addDoc(collection(db, "notifications"), newNotification);
      
      // 현재 사용자에게만 알림 표시
      if (!targetUserId || targetUserId === currentUser?.uid) {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("알림 저장 실패:", error);
    }
  }

  // 알림 읽음 처리 (Firestore 연동)
  const markNotificationAsRead = async (id) => {
    try {
      // Firestore에서 알림 상태 업데이트
      const notificationRef = doc(db, "notifications", String(id));
      await updateDoc(notificationRef, { read: true });
      
      // 로컬 상태 업데이트
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  }

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Firestore에서 일괄 업데이트
      const batch = writeBatch(db);
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", String(notification.id));
        batch.update(notificationRef, { read: true });
      });
      await batch.commit();
      
      // 로컬 상태 업데이트
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("일괄 읽음 처리 실패:", error);
    }
  }

  // 알림 삭제
  const deleteNotification = async (id) => {
    try {
      // Firestore에서 알림 삭제
      await deleteDoc(doc(db, "notifications", String(id)));
      
      // 로컬 상태 업데이트
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("알림 삭제 실패:", error);
    }
  }

  // 로그인 처리 (Firebase Auth)
  const handleLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const isAdmin = ADMIN_EMAILS.includes(userCredential.user.email);
      const name = isAdmin ? ADMIN_NAME : userCredential.user.displayName;
      setIsLoggedIn(true);
      setCurrentUser({
        email: userCredential.user.email,
        name,
        uid: userCredential.user.uid,
        isAdmin,
      });
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify({
        email: userCredential.user.email,
        name,
        uid: userCredential.user.uid,
        isAdmin,
      }));
      
      // 사용자 알림 불러오기
      await loadUserNotifications(userCredential.user.uid);
      
      setShowAuthDialog(false);
      setCurrentView("map");
      toast({
        title: "로그인 성공",
        description: `환영합니다, ${name || userCredential.user.email}님!`,
      });
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 사용자 알림 불러오기
  const loadUserNotifications = async (userId) => {
    try {
      const q = query(
        collection(db, "notifications"),
        where("targetUserId", "==", userId),
        where("createdAt", ">=", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 최근 30일
      );
      const querySnapshot = await getDocs(q);
      const userNotifications = [];
      let unreadCount = 0;
      
      querySnapshot.forEach((doc) => {
        const notification = { ...doc.data(), id: doc.id };
        userNotifications.push(notification);
        if (!notification.read) {
          unreadCount++;
        }
      });
      
      // 최신순으로 정렬
      userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotifications(userNotifications);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("알림 불러오기 실패:", error);
    }
  };

  // 회원가입 처리 (Firebase Auth)
  const handleSignup = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast({
        title: "회원가입 성공",
        description: "이메일 인증 메일이 발송되었습니다.",
      });
      setShowAuthDialog(false);
    } catch (error) {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 비밀번호 찾기 (Firebase Auth)
  const handlePasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "비밀번호 재설정 메일 발송",
        description: "입력하신 이메일로 비밀번호 재설정 링크가 전송되었습니다.",
      });
    } catch (error) {
      toast({
        title: "비밀번호 재설정 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setShowAdminPanel(false)
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    setCurrentView("map"); // 로그아웃 시 메인으로 이동
    toast({
      title: "로그아웃",
      description: "안전하게 로그아웃되었습니다.",
    })
  }

  // 제보 제출 처리 (통합된 제보 기능)
  const handleReportSubmit = async (reportData) => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "제보하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      let location = currentLocation;
      if (!location) {
        location = await getCurrentLocation();
      }

      // 실제 OpenAI API 호출
      let aiAnalysis = null;
      try {
        aiAnalysis = await fetchAISummary(reportData.description);
      } catch (e) {
        aiAnalysis = null;
      }

      const newReport = {
        ...reportData,
        reporter: currentUser?.name || "익명",
        reporterUid: currentUser?.uid,  // Firebase UID 추가
        date: new Date().toISOString().split("T")[0],
        status: "제보접수",
        coordinates: location || { lat: 37.5665 + Math.random() * 0.1, lng: 126.978 + Math.random() * 0.1 },
        aiAnalysis,
        assignedTo: null,
        processingNotes: "",
      };

      // Firestore에 저장
      await addDoc(collection(db, "reports"), newReport);

      setReports([newReport, ...reports]);
      setShowReportDialog(false);

      toast({
        title: "제보 완료",
        description: "환경 문제 제보가 접수되었습니다.",
      });

      addNotification(`새로운 환경 문제가 신고되었습니다: ${newReport.title}`, "warning");
    } catch (error) {
      toast({
        title: "위치 정보 오류",
        description: "GPS 위치를 가져올 수 없습니다. 수동으로 위치를 선택해주세요.",
        variant: "destructive",
      });
    }
  };

  // 신고 상태 업데이트
  const updateReportStatus = async (reportId, newStatus, assignedTo = null, notes = "") => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    try {
      // Firestore에서 제보 상태 업데이트
      const reportRef = doc(db, "reports", String(reportId));
      await updateDoc(reportRef, {
        status: newStatus,
        assignedTo: assignedTo || report.assignedTo,
        processingNotes: notes || report.processingNotes,
        ...(newStatus === "처리완료" && { resolvedDate: new Date().toISOString().split("T")[0] }),
      });

      // 로컬 상태 업데이트
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: newStatus,
                assignedTo: assignedTo || report.assignedTo,
                processingNotes: notes || report.processingNotes,
                ...(newStatus === "처리완료" && { resolvedDate: new Date().toISOString().split("T")[0] }),
              }
            : report,
        ),
      );

      // 제보 작성자에게 개인 알림 전송
      if (report.reporterUid) {
        let notificationMessage = "";
        let notificationType = "info";
        
        switch (newStatus) {
          case "처리중":
            notificationMessage = `귀하의 제보 "${report.title}"이 처리 중입니다.`;
            notificationType = "info";
            break;
          case "처리완료":
            notificationMessage = `귀하의 제보 "${report.title}"이 완료되었습니다.`;
            notificationType = "success";
            break;
          default:
            notificationMessage = `귀하의 제보 "${report.title}" 상태가 ${newStatus}로 변경되었습니다.`;
            notificationType = "info";
        }
        
        await addNotification(notificationMessage, notificationType, report.reporterUid);
      }

      // 관리자에게 전체 알림
      addNotification(`${report.title} 상태가 ${newStatus}로 변경되었습니다.`, "info");
    } catch (error) {
      console.error("제보 상태 업데이트 실패:", error);
      toast({
        title: "상태 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  // 커뮤니티 게시글 추가
  const handleCommunityPost = (postData) => {
    const newPost = {
      id: communityPosts.length + 1,
      ...postData,
      author: currentUser?.name || "익명",
      date: new Date().toISOString().split("T")[0],
      likes: 0,
      comments: 0,
    }
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
  User,
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { AnalysisView } from "@/components/analysis-view"
import { CommunityView } from "@/components/community-view"
import { StatsView } from "@/components/stats-view"

// OpenAI AI 분석 호출 함수
async function fetchAISummary(content: string) {
  const res = await fetch('/api/ai-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  return await res.json();
}

export default function EnvironmentalMapPlatform() {
  const [selectedReport, setSelectedReport] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [currentView, setCurrentView] = useState("map") // map, stats, analysis, community
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    dateRange: "all",
    severity: "all",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationAccuracy, setLocationAccuracy] = useState(null)
  const watchIdRef = useRef<number | null>(null)
  // 1. 상태 추가
  const [searchApplied, setSearchApplied] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const mapContainerRef = useRef(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [detailCardPos, setDetailCardPos] = useState(null)
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  // 제보 데이터
  const [reports, setReports] = useState([
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
  const [communityPosts, setCommunityPosts] = useState([
    {
      id: 1,
      title: "우리 동네 환경 개선 프로젝트 참여하세요!",
      author: "환경지킴이",
      date: "2024-01-20",
      content: "함께 우리 동네를 더 깨끗하게 만들어요. 매주 토요일 오전 10시에 모입니다.",
      likes: 15,
      comments: 8,
      category: "모임",
    },
    {
      id: 2,
      title: "미세먼지 측정 결과 공유",
      author: "데이터분석가",
      date: "2024-01-19",
      content: "이번 주 우리 지역 미세먼지 농도 분석 결과를 공유합니다.",
      likes: 23,
      comments: 12,
      category: "정보",
    },
    {
      id: 3,
      title: "재활용 분리수거 올바른 방법",
      author: "친환경실천가",
      date: "2024-01-18",
      content: "많은 분들이 헷갈려하시는 재활용 분리수거 방법을 정리했습니다.",
      likes: 31,
      comments: 5,
      category: "팁",
    },
  ])

  const { toast } = useToast()

  // GPS 위치 정보 가져오기 - 고정밀 버전 (네이버/카카오/구글 맵 수준)
  const getCurrentLocation = () => {
    return new Promise<{ lat: number; lng: number; accuracy: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS를 지원하지 않는 브라우저입니다."))
        return
      }

      // 고정밀 GPS 설정 (네이버/카카오/구글 맵 수준)
      const options = {
        enableHighAccuracy: true, // 고정밀 모드
        timeout: 15000, // 15초 타임아웃
        maximumAge: 0, // 캐시된 위치 사용 안함 (항상 새로운 위치)
      }

      // 위치 정확도 필터링 함수
      const isAccurateEnough = (accuracy: number) => {
        return accuracy <= 20 // 20미터 이하 정확도만 허용
      }

      // 위치 평균화 함수 (여러 번 측정하여 정확도 향상)
      const getAveragePosition = (positions: GeolocationPosition[]) => {
        if (positions.length === 0) return null
        
        const totalLat = positions.reduce((sum: number, pos: GeolocationPosition) => sum + pos.coords.latitude, 0)
        const totalLng = positions.reduce((sum: number, pos: GeolocationPosition) => sum + pos.coords.longitude, 0)
        const avgLat = totalLat / positions.length
        const avgLng = totalLng / positions.length
        
        // 가장 정확한 측정값의 정확도 사용
        const bestAccuracy = Math.min(...positions.map((pos: GeolocationPosition) => pos.coords.accuracy))
        
        return {
          latitude: avgLat,
          longitude: avgLng,
          accuracy: bestAccuracy
        }
      }

      let positionCount = 0
      const maxPositions = 3 // 최대 3번 측정
      const positions: GeolocationPosition[] = []
      let timeoutId: ReturnType<typeof setTimeout>

      const successCallback = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // 정확도가 충분한 경우에만 수집
        if (isAccurateEnough(accuracy)) {
          positions.push(position)
          positionCount++
          
          // 충분한 측정을 했거나 정확도가 매우 높은 경우
          if (positionCount >= maxPositions || accuracy <= 5) {
            clearTimeout(timeoutId)
            
            const finalPosition = getAveragePosition(positions)
            if (finalPosition) {
              setCurrentLocation({ 
                lat: finalPosition.latitude, 
                lng: finalPosition.longitude 
              })
              setLocationAccuracy(finalPosition.accuracy)
              resolve({ 
                lat: finalPosition.latitude, 
                lng: finalPosition.longitude, 
                accuracy: finalPosition.accuracy 
              })
            } else {
              reject(new Error("정확한 위치를 얻을 수 없습니다."))
            }
          }
        } else {
          // 정확도가 부족한 경우 재시도
          if (positionCount < maxPositions) {
            setTimeout(() => {
              navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
            }, 1000)
          } else {
            clearTimeout(timeoutId)
            reject(new Error("GPS 정확도가 부족합니다. 더 개방된 공간에서 시도해주세요."))
          }
        }
      }

      const errorCallback = (error: GeolocationPositionError) => {
        clearTimeout(timeoutId)
        let errorMessage = "위치 정보를 가져올 수 없습니다."
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다. GPS 신호를 확인해주세요."
            break
          case error.TIMEOUT:
            errorMessage = "위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요."
            break
        }
        
        reject(new Error(errorMessage))
      }

      // 전체 타임아웃 설정
      timeoutId = setTimeout(() => {
        if (positions.length > 0) {
          const finalPosition = getAveragePosition(positions)
          setCurrentLocation({ 
            lat: finalPosition.latitude, 
            lng: finalPosition.longitude 
          })
          setLocationAccuracy(finalPosition.accuracy)
          resolve({ 
            lat: finalPosition.latitude, 
            lng: finalPosition.longitude, 
            accuracy: finalPosition.accuracy 
          })
        } else {
          reject(new Error("위치 정보 요청 시간이 초과되었습니다."))
        }
      }, options.timeout)

      // 첫 번째 위치 요청 시작
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
    })
  }

  // 실시간 위치 추적 시작 (고정밀)
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS 지원 안됨",
        description: "이 브라우저는 GPS를 지원하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const successCallback = (position) => {
      const { latitude, longitude, accuracy } = position.coords
      
      // 정확도가 20미터 이하인 경우에만 위치 업데이트
      if (accuracy <= 20) {
        setCurrentLocation({ lat: latitude, lng: longitude })
        setLocationAccuracy(accuracy)
      }
    }

    const errorCallback = (error) => {
      console.warn("실시간 위치 추적 오류:", error)
    }

    // 기존 추적 중지
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    // 새로운 추적 시작
    watchIdRef.current = navigator.geolocation.watchPosition(successCallback, errorCallback, options)
  }

  // 실시간 위치 추적 중지
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  // AI 분석 시뮬레이션
  const analyzeReportWithAI = (title, description, type) => {
    const keywords = {
      waste: ["#폐기물", "#불법투기", "#악취", "#해충", "#생활쓰레기"],
      air: ["#미세먼지", "#대기오염", "#공사장", "#방진막", "#매연"],
      water: ["#수질오염", "#기름유출", "#물고기폐사", "#하천", "#악취"],
      noise: ["#소음공해", "#공사소음", "#야간소음", "#진동", "#데시벨"],
    }

    const selectedKeywords = keywords[type] || keywords.waste
    const analysisKeywords = selectedKeywords.slice(0, 3)

    const urgencyLevels = ["낮음", "보통", "높음", "매우높음"]
    const costs = ["10만원", "30만원", "50만원", "100만원", "200만원"]
    const durations = ["1일", "3일", "5일", "7일", "14일"]

    return {
      keywords: analysisKeywords,
      category:
        type === "waste" ? "폐기물 관리" : type === "air" ? "대기오염" : type === "water" ? "수질오염" : "소음공해",
      urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
      estimatedCost: costs[Math.floor(Math.random() * costs.length)],
      expectedDuration: durations[Math.floor(Math.random() * durations.length)],
    }
  }

  // 알림 추가 (Firestore 연동)
  const addNotification = async (message, type = "info", targetUserId = null) => {
    const newNotification = {
      id: Date.now(),
      message,
      type, // "info", "warning", "success", "error"
      timestamp: new Date().toISOString(),
      read: false,
      targetUserId: targetUserId || currentUser?.uid, // 특정 사용자에게만 알림
      createdAt: new Date().toISOString(),
    }
    
    try {
      // Firestore에 알림 저장
      await addDoc(collection(db, "notifications"), newNotification);
      
      // 현재 사용자에게만 알림 표시
      if (!targetUserId || targetUserId === currentUser?.uid) {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("알림 저장 실패:", error);
    }
  }

  // 알림 읽음 처리 (Firestore 연동)
  const markNotificationAsRead = async (id) => {
    try {
      // Firestore에서 알림 상태 업데이트
      const notificationRef = doc(db, "notifications", String(id));
      await updateDoc(notificationRef, { read: true });
      
      // 로컬 상태 업데이트
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  }

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Firestore에서 일괄 업데이트
      const batch = writeBatch(db);
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", String(notification.id));
        batch.update(notificationRef, { read: true });
      });
      await batch.commit();
      
      // 로컬 상태 업데이트
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("일괄 읽음 처리 실패:", error);
    }
  }

  // 알림 삭제
  const deleteNotification = async (id) => {
    try {
      // Firestore에서 알림 삭제
      await deleteDoc(doc(db, "notifications", String(id)));
      
      // 로컬 상태 업데이트
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("알림 삭제 실패:", error);
    }
  }

  // 로그인 처리 (Firebase Auth)
  const handleLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const isAdmin = ADMIN_EMAILS.includes(userCredential.user.email);
      const name = isAdmin ? ADMIN_NAME : userCredential.user.displayName;
      setIsLoggedIn(true);
      setCurrentUser({
        email: userCredential.user.email,
        name,
        uid: userCredential.user.uid,
        isAdmin,
      });
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify({
        email: userCredential.user.email,
        name,
        uid: userCredential.user.uid,
        isAdmin,
      }));
      
      // 사용자 알림 불러오기
      await loadUserNotifications(userCredential.user.uid);
      
      setShowAuthDialog(false);
      setCurrentView("map");
      toast({
        title: "로그인 성공",
        description: `환영합니다, ${name || userCredential.user.email}님!`,
      });
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 사용자 알림 불러오기
  const loadUserNotifications = async (userId) => {
    try {
      const q = query(
        collection(db, "notifications"),
        where("targetUserId", "==", userId),
        where("createdAt", ">=", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 최근 30일
      );
      const querySnapshot = await getDocs(q);
      const userNotifications = [];
      let unreadCount = 0;
      
      querySnapshot.forEach((doc) => {
        const notification = { ...doc.data(), id: doc.id };
        userNotifications.push(notification);
        if (!notification.read) {
          unreadCount++;
        }
      });
      
      // 최신순으로 정렬
      userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotifications(userNotifications);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("알림 불러오기 실패:", error);
    }
  };

  // 회원가입 처리 (Firebase Auth)
  const handleSignup = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast({
        title: "회원가입 성공",
        description: "이메일 인증 메일이 발송되었습니다.",
      });
      setShowAuthDialog(false);
    } catch (error) {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 비밀번호 찾기 (Firebase Auth)
  const handlePasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "비밀번호 재설정 메일 발송",
        description: "입력하신 이메일로 비밀번호 재설정 링크가 전송되었습니다.",
      });
    } catch (error) {
      toast({
        title: "비밀번호 재설정 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setShowAdminPanel(false)
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    setCurrentView("map"); // 로그아웃 시 메인으로 이동
    toast({
      title: "로그아웃",
      description: "안전하게 로그아웃되었습니다.",
    })
  }

  // 제보 제출 처리 (통합된 제보 기능)
  const handleReportSubmit = async (reportData) => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "제보하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      let location = currentLocation;
      if (!location) {
        location = await getCurrentLocation();
      }

      // 실제 OpenAI API 호출
      let aiAnalysis = null;
      try {
        aiAnalysis = await fetchAISummary(reportData.description);
      } catch (e) {
        aiAnalysis = null;
      }

      const newReport = {
        ...reportData,
        reporter: currentUser?.name || "익명",
        reporterUid: currentUser?.uid,  // Firebase UID 추가
        date: new Date().toISOString().split("T")[0],
        status: "제보접수",
        coordinates: location || { lat: 37.5665 + Math.random() * 0.1, lng: 126.978 + Math.random() * 0.1 },
        aiAnalysis,
        assignedTo: null,
        processingNotes: "",
      };

      // Firestore에 저장
      await addDoc(collection(db, "reports"), newReport);

      setReports([newReport, ...reports]);
      setShowReportDialog(false);

      toast({
        title: "제보 완료",
        description: "환경 문제 제보가 접수되었습니다.",
      });

      addNotification(`새로운 환경 문제가 신고되었습니다: ${newReport.title}`, "warning");
    } catch (error) {
      toast({
        title: "위치 정보 오류",
        description: "GPS 위치를 가져올 수 없습니다. 수동으로 위치를 선택해주세요.",
        variant: "destructive",
      });
    }
  };

  // 신고 상태 업데이트
  const updateReportStatus = async (reportId, newStatus, assignedTo = null, notes = "") => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    try {
      // Firestore에서 제보 상태 업데이트
      const reportRef = doc(db, "reports", String(reportId));
      await updateDoc(reportRef, {
        status: newStatus,
        assignedTo: assignedTo || report.assignedTo,
        processingNotes: notes || report.processingNotes,
        ...(newStatus === "처리완료" && { resolvedDate: new Date().toISOString().split("T")[0] }),
      });

      // 로컬 상태 업데이트
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: newStatus,
                assignedTo: assignedTo || report.assignedTo,
                processingNotes: notes || report.processingNotes,
                ...(newStatus === "처리완료" && { resolvedDate: new Date().toISOString().split("T")[0] }),
              }
            : report,
        ),
      );

      // 제보 작성자에게 개인 알림 전송
      if (report.reporterUid) {
        let notificationMessage = "";
        let notificationType = "info";
        
        switch (newStatus) {
          case "처리중":
            notificationMessage = `귀하의 제보 "${report.title}"이 처리 중입니다.`;
            notificationType = "info";
            break;
          case "처리완료":
            notificationMessage = `귀하의 제보 "${report.title}"이 완료되었습니다.`;
            notificationType = "success";
            break;
          default:
            notificationMessage = `귀하의 제보 "${report.title}" 상태가 ${newStatus}로 변경되었습니다.`;
            notificationType = "info";
        }
        
        await addNotification(notificationMessage, notificationType, report.reporterUid);
      }

      // 관리자에게 전체 알림
      addNotification(`${report.title} 상태가 ${newStatus}로 변경되었습니다.`, "info");
    } catch (error) {
      console.error("제보 상태 업데이트 실패:", error);
      toast({
        title: "상태 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  // 커뮤니티 게시글 추가
  const handleCommunityPost = (postData) => {
    const newPost = {
      id: communityPosts.length + 1,
      ...postData,
      author: currentUser?.name || "익명",
      date: new Date().toISOString().split("T")[0],
      likes: 0,
      comments: 0,
    }
    setCommunityPosts([newPost, ...communityPosts])
  }

  // 필터링된 신고 목록
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filters.type === "all" || report.type === filters.type
      const matchesStatus = filters.status === "all" || report.status === filters.status
      const matchesSeverity = filters.severity === "all" || report.severity === filters.severity

      let matchesDate = true
      if (filters.dateRange !== "all") {
        const reportDate = new Date(report.date)
        const now = new Date()
        const daysDiff = Math.floor((now - reportDate) / (1000 * 60 * 60 * 24))

        switch (filters.dateRange) {
          case "week":
            matchesDate = daysDiff <= 7
            break
          case "month":
            matchesDate = daysDiff <= 30
            break
          case "3months":
            matchesDate = daysDiff <= 90
            break
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesSeverity && matchesDate
    })
  }, [reports, filters, searchTerm])

  // 통계 계산
  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "제보접수").length,
    processing: reports.filter((r) => r.status === "처리중").length,
    resolved: reports.filter((r) => r.status === "처리완료").length,
    thisWeek: reports.filter((r) => {
      const reportDate = new Date(r.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return reportDate >= weekAgo
    }).length,
  }

  // 초기 위치 가져오기 - 고정밀 버전
  useEffect(() => {
    // 페이지 로드 시 자동으로 고정밀 위치 추적 시작
    startLocationTracking()
    
    // 컴포넌트 언마운트 시 추적 중지
    return () => {
      stopLocationTracking()
    }
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "waste":
        return "🗑️"
      case "air":
        return "💨"
      case "water":
        return "💧"
      case "noise":
        return "🔊"
      default:
        return "🌍"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "처리완료":
        return "bg-green-100 text-green-800"
      case "처리중":
        return "bg-blue-100 text-blue-800"
      case "제보접수":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // 커뮤니티 화면
  function CommunityView({ posts, onAddPost, currentUser, isLoggedIn }) {
    return (
      <CommunityView 
        posts={posts} 
        onAddPost={onAddPost} 
        currentUser={currentUser} 
        isLoggedIn={isLoggedIn} 
      />
    )
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
      <div>
        {/* 인증 다이얼로그 컴포넌트 내용 */}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">커뮤니티</h2>
        <div className="flex items-center space-x-2">
          {/* 커뮤니티 가이드 버튼 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            가이드
          </Button>
          {isLoggedIn && (
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />새 글 작성
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>새 글 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>제목</Label>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>카테고리</Label>
                    <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="모임">모임</SelectItem>
                        <SelectItem value="정보">정보</SelectItem>
                        <SelectItem value="팁">팁</SelectItem>
                        <SelectItem value="질문">질문</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>내용</Label>
                    <Textarea
                      placeholder="내용을 입력하세요"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleSubmitPost}>작성</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 커뮤니티 가이드 (접힌 메뉴) */}
      {showGuide && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">커뮤니티 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🤝 함께 만드는 깨끗한 환경</h4>
                <p className="text-sm text-blue-700">
                  우리 모두가 참여하여 더 나은 환경을 만들어요. 정확한 정보 공유와 건설적인 토론을 통해 실질적인
                  해결책을 찾아보세요.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-2">✅ 권장사항</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 정확하고 유용한 정보 공유</li>
                    <li>• 서로 존중하는 대화</li>
                    <li>• 환경 개선을 위한 건설적 제안</li>
                    <li>• 지역 환경 활동 참여 독려</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-2">❌ 주의사항</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 허위 정보나 과장된 내용</li>
                    <li>• 개인 정보 노출</li>
                    <li>• 상업적 광고나 홍보</li>
                    <li>• 타인에 대한 비방이나 욕설</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 커뮤니티 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">활성 사용자</p>
                <p className="text-3xl font-bold text-blue-600">1,234</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">총 게시글</p>
                <p className="text-3xl font-bold text-green-600">{posts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">이번 주 활동</p>
                <p className="text-3xl font-bold text-purple-600">89</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">{post.category}</Badge>
                    <span className="text-sm text-gray-500">by {post.author}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4">{post.content}</p>
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {post.likes || 0}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleComment(post.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {comments[post.id]?.length || 0}
                    </Button>
                  </div>
                  
                  {/* 댓글 섹션 */}
                  {expandedPosts[post.id] && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-3">
                        {/* 기존 댓글들 */}
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="text-sm text-gray-600">{comment.content}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
