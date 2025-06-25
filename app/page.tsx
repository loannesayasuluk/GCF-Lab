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
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  // 실시간 알림 추가
  const addNotification = (message, type = "info") => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleString(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
    setUnreadCount((prev) => prev + 1)
  }

  // 알림 읽음 처리
  const markNotificationAsRead = (id) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  // 로그인 처리
  const handleLogin = async (email, password) => {
    if (email && password) {
      // Firestore에서 이메일/비밀번호로 사용자 조회
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("password", "==", password)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        setIsLoggedIn(true);
        setCurrentUser(userData);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(userData));
        setShowAuthDialog(false);
        setCurrentView("map");
        toast({
          title: "로그인 성공",
          description: `환영합니다, ${userData.name}님!`,
        });
        addNotification(`${userData.name}님이 로그인했습니다.`, "success");
      } else {
        toast({
          title: "로그인 실패",
          description: "이메일 또는 비밀번호가 올바르지 않습니다.",
          variant: "destructive",
        });
      }
    }
  };

  // 회원가입 처리
  const handleSignup = async (email, password, name) => {
    if (email && password && name) {
      // 1. 중복 체크 (이메일)
      const q = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        toast({
          title: "회원가입 실패",
          description: "이미 가입된 이메일입니다.",
          variant: "destructive",
        });
        return;
      }
      // 2. Firestore에 회원 정보 저장
      await addDoc(collection(db, "users"), {
        email,
        password, // 실제 서비스에서는 암호화 필요!
        name,
        joindate: new Date().toISOString().split("T")[0],
      });
      toast({
        title: "회원가입 성공",
        description: "계정이 생성되었습니다!",
      });
      setShowAuthDialog(false);
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
  const updateReportStatus = (reportId, newStatus, assignedTo = null, notes = "") => {
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
    )

    const report = reports.find((r) => r.id === reportId)
    if (report) {
      addNotification(`${report.title} 상태가 ${newStatus}로 변경되었습니다.`, "info")
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
    const [showNewPostDialog, setShowNewPostDialog] = useState(false)
    const [newPostTitle, setNewPostTitle] = useState("")
    const [newPostContent, setNewPostContent] = useState("")
    const [newPostCategory, setNewPostCategory] = useState("")

    const handleSubmitPost = () => {
      if (newPostTitle && newPostContent && newPostCategory) {
        onAddPost({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory,
        })
        setNewPostTitle("")
        setNewPostContent("")
        setNewPostCategory("")
        setShowNewPostDialog(false)
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">커뮤니티</h2>
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
                      <Button variant="ghost" size="sm">
                        <span className="mr-1">👍</span>
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.comments}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 커뮤니티 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle>커뮤니티 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🤝 함께 만드는 깨끗한 환경</h4>
                <p className="text-sm text-blue-700">
                  우리 모두가 참여하여 더 나은 환경을 만들어갑니다. 정확한 정보 공유와 건설적인 토론을 통해 실질적인
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
      </div>
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

    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>로그인 / 회원가입</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">이메일</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">비밀번호</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => onLogin(email, password)}>
              로그인
            </Button>
            <div className="text-center text-sm text-gray-600">
              <p>관리자 계정으로 로그인하려면</p>
              <p>이메일에 "admin" 또는 "관리자"를 포함하세요</p>
            </div>
          </TabsContent>
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">이름</Label>
              <Input
                id="signup-name"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">이메일</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">비밀번호</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => onSignup(email, password, name)}>
              회원가입
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    )
  }

  // 제보 다이얼로그 컴포넌트 (통합된 기능)
  function ReportDialog({
    onSubmit,
    currentLocation,
    setShowReportDialog,
  }: {
    onSubmit: (data: any) => void
    currentLocation: any
    setShowReportDialog: (open: boolean) => void
  }) {
    const [title, setTitle] = useState("")
    const [location, setLocation] = useState("")
    const [type, setType] = useState("")
    const [severity, setSeverity] = useState("")
    const [description, setDescription] = useState("")
    const [images, setImages] = useState([])
    const [useCurrentLocation, setUseCurrentLocation] = useState(false)
    const [isUrgent, setIsUrgent] = useState(false)

    const handleImageUpload = (event) => {
      const files = Array.from(event.target.files)
      const imageUrls = files.map((file) => URL.createObjectURL(file))
      setImages((prev) => [...prev, ...imageUrls])
    }

    const removeImage = (index) => {
      setImages((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
      if (title && location && type && severity && description) {
        onSubmit({
          title: isUrgent ? `[긴급] ${title}` : title,
          location:
            useCurrentLocation && currentLocation
              ? `GPS: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
              : location,
          type,
          severity: isUrgent ? "high" : severity,
          description,
          images,
        })
        // 폼 초기화
        setTitle("")
        setLocation("")
        setType("")
        setSeverity("")
        setDescription("")
        setImages([])
        setUseCurrentLocation(false)
        setIsUrgent(false)
      }
    }

    return (
      <DialogContent className="sm:max-w-xl w-full max-w-[95vw] max-h-[90vh] overflow-y-auto p-8 rounded-2xl shadow-2xl border border-gray-100 animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-800 tracking-tight mb-2 flex items-center gap-2">
            <Camera className="h-6 w-6 text-green-600" /> 환경 문제 제보하기
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* 긴급 제보 스위치 */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-400 via-red-300 to-orange-200 rounded-xl border-2 border-red-500 shadow-md animate-soft-pulse">
            <Switch id="urgent-report" checked={isUrgent} onCheckedChange={setIsUrgent} />
            <Label htmlFor="urgent-report" className="text-base font-bold text-red-800 flex items-center gap-1">
              🚨 긴급 제보 <span className="text-xs font-semibold text-red-700">(즉시 처리가 필요한 심각한 환경 문제)</span>
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">제목 *</Label>
            <Input
              id="title"
              placeholder="문제 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base px-4 py-3 rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">위치 *</Label>
            {currentLocation && (
              <div className="flex items-center gap-2 mb-2">
                <Switch id="use-current-location" checked={useCurrentLocation} onCheckedChange={setUseCurrentLocation} />
                <Label htmlFor="use-current-location" className="text-sm text-gray-700">
                  현재 GPS 위치 사용 <span className="text-xs text-gray-400">(정확도: ±{Math.round(Math.random() * 20 + 5)}m)</span>
                </Label>
              </div>
            )}
            <Input
              id="location"
              placeholder="상세 주소를 입력하세요"
              value={
                useCurrentLocation
                  ? `GPS 위치 (${currentLocation?.lat.toFixed(6)}, ${currentLocation?.lng.toFixed(6)})`
                  : location
              }
              onChange={(e) => setLocation(e.target.value)}
              disabled={useCurrentLocation}
              className="text-base px-4 py-3 rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 disabled:bg-gray-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">문제 유형 *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-base px-4 py-3 rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200">
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waste">🗑️ 폐기물</SelectItem>
                  <SelectItem value="air">💨 대기오염</SelectItem>
                  <SelectItem value="water">💧 수질오염</SelectItem>
                  <SelectItem value="noise">🔊 소음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">심각도 *</Label>
              <Select value={severity} onValueChange={setSeverity} disabled={isUrgent}>
                <SelectTrigger className="text-base px-4 py-3 rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 disabled:bg-gray-100">
                  <SelectValue placeholder={isUrgent ? "긴급 (자동 설정)" : "심각도 선택"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">경미</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">심각</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">상세 설명 *</Label>
            <Textarea
              id="description"
              placeholder="문제 상황을 자세히 설명해주세요. 사진과 함께 제보하시면 더 정확한 처리가 가능합니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="text-base px-4 py-3 rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">사진 첨부 (권장)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer">
                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-base text-gray-600">클릭하여 사진을 업로드하세요</p>
                <p className="text-xs text-gray-500">현장 사진이 있으면 더 빠른 처리가 가능합니다</p>
              </label>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`업로드된 이미지 ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-7 w-7 p-0 opacity-80 group-hover:opacity-100"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-base font-semibold text-blue-800 mb-1 flex items-center gap-1">📊 AI 자동 분석 기능</h4>
            <p className="text-xs text-blue-700">
              제보 내용을 AI가 자동으로 분석하여 적절한 키워드를 생성하고, 예상 처리 비용과 기간을 산출합니다.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)} className="px-6 py-2 text-base rounded-lg border-gray-300">
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              className={isUrgent ? "bg-red-600 hover:bg-red-700 px-6 py-2 text-base rounded-lg" : "bg-green-600 hover:bg-green-700 px-6 py-2 text-base rounded-lg"}
              disabled={!title || !location || !type || !severity || !description}
            >
              {isUrgent ? "🚨 긴급 제보" : "📝 제보하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    )
  }

  // 관리자 패널 컴포넌트
  function AdminPanel({
    reports,
    onUpdateStatus,
    stats,
  }: {
    reports: any[]
    onUpdateStatus: (id: number, status: string, assignedTo?: string, notes?: string) => void
    stats: any
  }) {
    const [selectedReportId, setSelectedReportId] = useState(null)
    const [newStatus, setNewStatus] = useState("")
    const [assignedTo, setAssignedTo] = useState("")
    const [processingNotes, setProcessingNotes] = useState("")

    const handleStatusUpdate = () => {
      if (selectedReportId && newStatus) {
        onUpdateStatus(selectedReportId, newStatus, assignedTo, processingNotes)
        setSelectedReportId(null)
        setNewStatus("")
        setAssignedTo("")
        setProcessingNotes("")
      }
    }

    return (
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">관리자 대시보드</h2>
            <p className="text-gray-600">환경 문제 제보를 관리하고 처리 상태를 업데이트하세요.</p>
          </div>

          {/* 관리자 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">대기중</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">처리중</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">완료</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">처리율</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((stats.resolved / stats.total) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 제보 관리 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle>제보 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">제목</th>
                      <th className="text-left p-2">유형</th>
                      <th className="text-left p-2">심각도</th>
                      <th className="text-left p-2">상태</th>
                      <th className="text-left p-2">담당자</th>
                      <th className="text-left p-2">제보일</th>
                      <th className="text-left p-2">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{report.id}</td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{report.title}</p>
                            <p className="text-xs text-gray-500">{report.location}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <span>
                              {report.type === "waste" && "🗑️"}
                              {report.type === "air" && "💨"}
                              {report.type === "water" && "💧"}
                              {report.type === "noise" && "🔊"}
                            </span>
                            <span className="capitalize">{report.type}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              report.severity === "high"
                                ? "bg-red-500"
                                : report.severity === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                          />
                        </td>
                        <td className="p-2">
                          <Badge
                            className={
                              report.status === "처리완료"
                                ? "bg-green-100 text-green-800"
                                : report.status === "처리중"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {report.status}
                          </Badge>
                        </td>
                        <td className="p-2">{report.assignedTo || <span className="text-gray-400">미배정</span>}</td>
                        <td className="p-2">{report.date}</td>
                        <td className="p-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReportId(report.id)
                                  setNewStatus(report.status)
                                  setAssignedTo(report.assignedTo || "")
                                  setProcessingNotes(report.processingNotes || "")
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                관리
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>제보 관리 - #{report.id}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">{report.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2">{report.location}</p>
                                  <p className="text-sm">{report.description}</p>
                                </div>

                                {report.aiAnalysis && (
                                  <div className="p-3 bg-blue-50 rounded">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">AI 분석 결과</h4>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {report.aiAnalysis.keywords.map((keyword, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="text-xs text-blue-700 space-y-1">
                                      <p>예상 비용: {report.aiAnalysis.estimatedCost}</p>
                                      <p>예상 기간: {report.aiAnalysis.expectedDuration}</p>
                                      <p>긴급도: {report.aiAnalysis.urgency}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <div>
                                    <Label>처리 상태</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="제보접수">제보접수</SelectItem>
                                        <SelectItem value="처리중">처리중</SelectItem>
                                        <SelectItem value="처리완료">처리완료</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>담당자 배정</Label>
                                    <Input
                                      placeholder="담당자 이름을 입력하세요"
                                      value={assignedTo}
                                      onChange={(e) => setAssignedTo(e.target.value)}
                                    />
                                  </div>

                                  <div>
                                    <Label>처리 현황 메모</Label>
                                    <Textarea
                                      placeholder="처리 과정이나 특이사항을 기록하세요"
                                      value={processingNotes}
                                      onChange={(e) => setProcessingNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline">취소</Button>
                                  <Button onClick={handleStatusUpdate}>업데이트</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 컴포넌트 마운트 시 실시간 위치 추적 시작
  useEffect(() => {
    // 페이지 로드 시 자동으로 위치 추적 시작
    startLocationTracking()
    
    // 컴포넌트 언마운트 시 추적 중지
    return () => {
      stopLocationTracking()
    }
  }, [])

  // 2. handleSearch 함수 개선
  const handleSearch = () => {
    setSearchApplied(true)
    setSearchResults(filteredReports)
  }

  const getDetailCardPosition = () => {
    if (!selectedReport || !mapContainerRef.current) return {}
    if (windowSize.width < 640 || !detailCardPos) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -55%)', position: 'fixed', zIndex: 2001 }
    }
    
    // 화면 경계 체크 및 조정
    const cardWidth = 400
    const cardHeight = 400
    const margin = 20
    
    let x = detailCardPos.x
    let y = detailCardPos.y
    
    // 오른쪽 경계 체크
    if (x + cardWidth > windowSize.width - margin) {
      x = windowSize.width - cardWidth - margin
    }
    
    // 아래쪽 경계 체크
    if (y + cardHeight > windowSize.height - margin) {
      y = windowSize.height - cardHeight - margin
    }
    
    // 왼쪽 경계 체크
    if (x < margin) {
      x = margin
    }
    
    // 위쪽 경계 체크
    if (y < margin) {
      y = margin
    }
    
    return { top: y, left: x, position: 'fixed', zIndex: 2001 }
  }

  // 사진 뷰어 모달 상태
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  // 앱 시작 시 localStorage에서 로그인 상태 복원
  useEffect(() => {
    const savedLogin = localStorage.getItem("isLoggedIn");
    const savedUser = localStorage.getItem("currentUser");
    if (savedLogin === "true" && savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView("map")}> 
                <Leaf className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">GCF Lab</h1>
                  <p className="text-xs text-gray-500">환경 모니터링 플랫폼</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setCurrentView("map")}
                className={`font-medium flex items-center space-x-1 ${
                  currentView === "map" ? "text-green-600" : "text-gray-700 hover:text-green-600"
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>환경 지도</span>
              </button>
              <button
                onClick={() => setCurrentView("stats")}
                className={`font-medium flex items-center space-x-1 ${
                  currentView === "stats" ? "text-green-600" : "text-gray-700 hover:text-green-600"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>통계 및 데이터</span>
              </button>
              <button
                onClick={() => setCurrentView("analysis")}
                className={`font-medium flex items-center space-x-1 ${
                  currentView === "analysis" ? "text-green-600" : "text-gray-700 hover:text-green-600"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>분석</span>
              </button>
              <button
                onClick={() => setCurrentView("community")}
                className={`font-medium flex items-center space-x-1 ${
                  currentView === "community" ? "text-green-600" : "text-gray-700 hover:text-green-600"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>커뮤니티</span>
              </button>
            </nav>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>메뉴</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <button
                      onClick={() => setCurrentView("map")}
                      className={`w-full text-left p-3 rounded-lg flex items-center space-x-2 ${
                        currentView === "map" ? "bg-green-50 text-green-600" : "hover:bg-gray-50"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>환경 지도</span>
                    </button>
                    <button
                      onClick={() => setCurrentView("stats")}
                      className={`w-full text-left p-3 rounded-lg flex items-center space-x-2 ${
                        currentView === "stats" ? "bg-green-50 text-green-600" : "hover:bg-gray-50"
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>통계 및 데이터</span>
                    </button>
                    <button
                      onClick={() => setCurrentView("analysis")}
                      className={`w-full text-left p-3 rounded-lg flex items-center space-x-2 ${
                        currentView === "analysis" ? "bg-green-50 text-green-600" : "hover:bg-gray-50"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>분석</span>
                    </button>
                    <button
                      onClick={() => setCurrentView("community")}
                      className={`w-full text-left p-3 rounded-lg flex items-center space-x-2 ${
                        currentView === "community" ? "bg-green-50 text-green-600" : "hover:bg-gray-50"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>커뮤니티</span>
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center space-x-4">
              {/* 알림 벨 (로그인 시만) */}
              {isLoggedIn && (
                <div className="relative">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                            {unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>알림</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">새로운 알림이 없습니다.</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                notif.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                              }`}
                              onClick={() => markNotificationAsRead(notif.id)}
                            >
                              <p className="text-sm font-medium">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* 제보하기 버튼 (항상 노출) */}
              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-blue-400 text-white font-bold text-base shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                    style={{ height: '40px', minWidth: '130px', letterSpacing: '0.01em' }}
                    onClick={(e) => {
                      if (!isLoggedIn) {
                        e.preventDefault();
                        setShowLoginRequired(true);
                      }
                    }}
                  >
                    <Camera className="h-5 w-5 text-white drop-shadow" />
                    제보하기
                  </Button>
                </DialogTrigger>
                {isLoggedIn && (
                  <ReportDialog onSubmit={handleReportSubmit} currentLocation={currentLocation} setShowReportDialog={setShowReportDialog} />
                )}
              </Dialog>
              {/* 로그인 필요 안내 모달 */}
              <Dialog open={showLoginRequired} onOpenChange={setShowLoginRequired}>
                <DialogContent className="max-w-xs w-full rounded-2xl shadow-2xl border border-gray-100 animate-fade-in flex flex-col items-center justify-center text-center">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-red-600 mb-2">로그인이 필요한 기능입니다</DialogTitle>
                  </DialogHeader>
                  <p className="mb-4 text-gray-700">제보 등록을 위해 로그인이 필요합니다.<br/>로그인 후 이용해 주세요.</p>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg mt-2" onClick={() => { setShowLoginRequired(false); setShowAuthDialog(true); }}>로그인하러 가기</Button>
                  <Button variant="outline" className="w-full mt-2" onClick={() => setShowLoginRequired(false)}>닫기</Button>
                </DialogContent>
              </Dialog>

              {/* 사용자 정보 (로그인 시만) */}
              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center focus:outline-none">
                      <Avatar>
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`w-full text-left px-4 py-2 ${active ? "bg-gray-100" : ""}`}
                            onClick={() => setCurrentView("myinfo")}
                          >
                            내 정보
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`w-full text-left px-4 py-2 ${active ? "bg-gray-100" : ""}`}
                            onClick={() => setCurrentView("myreports")}
                          >
                            내 제보 내역
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    {currentUser?.isAdmin && <p className="text-xs text-blue-600">관리자</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <LogIn className="h-4 w-4 mr-2" />
                      로그인
                    </Button>
                  </DialogTrigger>
                  <AuthDialog onLogin={handleLogin} onSignup={handleSignup} />
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 관리자 패널 */}
      {showAdminPanel && currentUser?.isAdmin && (
        <AdminPanel reports={reports} onUpdateStatus={updateReportStatus} stats={stats} />
      )}

      {/* Main Content */}
      <div className="relative">
        {selectedReport && (
          <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[3px] pointer-events-auto transition-all duration-200" />
        )}
        <div className={selectedReport ? "pointer-events-none select-none blur-[3px] transition-all duration-200" : "transition-all duration-200"}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* 내 정보 화면 */}
            {currentView === "myinfo" && isLoggedIn && (
              <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">내 정보</h2>
                <p><b>이름:</b> {currentUser?.name}</p>
                <p><b>이메일:</b> {currentUser?.email}</p>
                <p><b>가입일:</b> {currentUser?.joinDate}</p>
                {currentUser?.isAdmin && <p className="text-blue-600">관리자 계정</p>}
              </div>
            )}
            {/* 내 제보 내역 화면 */}
            {currentView === "myreports" && isLoggedIn && (
              <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">내 제보 내역</h2>
                {reports.filter(r => r.reporter === currentUser?.name).length === 0 ? (
                  <p>아직 작성한 제보가 없습니다.</p>
                ) : (
                  <ul className="space-y-4">
                    {reports
                      .filter(r => r.reporter === currentUser?.name)
                      .map((report) => (
                        <li key={report.id} className="border-b pb-2">
                          <b>{report.title}</b> <span className="text-xs text-gray-500">({report.date})</span>
                          <div className="text-sm text-gray-700">{report.description}</div>
                          <div className="text-xs text-gray-400">상태: {report.status}</div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
            {/* 기존 메인 지도 화면 (기본) */}
            {(currentView === "map" || !currentView) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                {/* 지도 영역 */}
                <div className="order-1 lg:order-2 lg:col-span-2">
                  <Card className="h-[600px] relative z-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">환경 제보 지도</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {filteredReports.length}건 표시
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 relative z-0" style={{ minHeight: '700px' }}>
                      <SimpleMap
                        reports={filteredReports}
                        selectedReport={selectedReport}
                        onReportSelect={setSelectedReport}
                        currentLocation={currentLocation}
                        mapContainerRef={mapContainerRef}
                        setWindowSize={setWindowSize}
                        setDetailCardPos={setDetailCardPos}
                      />
                    </CardContent>
                  </Card>
                </div>
                {/* 사이드바 */}
                <div className="order-2 lg:order-1 lg:col-span-1 space-y-4 sm:space-y-6">
                  {/* 실시간 통계 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>실시간 통계</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.total}</div>
                          <div className="text-sm text-gray-600">총 제보건수</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
                          <div className="text-sm text-gray-600">이번 주</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                          <div className="text-sm text-gray-600">제보접수</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{stats.processing}</div>
                          <div className="text-sm text-gray-600">처리중</div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>처리 완료율</span>
                          <span>{Math.round((stats.resolved / stats.total) * 100)}%</span>
                        </div>
                        <Progress value={(stats.resolved / stats.total) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                  {/* 고급 검색 및 필터 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Search className="h-5 w-5" />
                        <span>검색 및 필터</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="제목, 위치, 내용 검색"
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                        />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">제보 유형</Label>
                          <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">전체</SelectItem>
                              <SelectItem value="waste">🗑️ 폐기물</SelectItem>
                              <SelectItem value="air">💨 대기오염</SelectItem>
                              <SelectItem value="water">💧 수질오염</SelectItem>
                              <SelectItem value="noise">🔊 소음</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">처리 상태</Label>
                          <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                          >
                            <SelectTrigger>
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
                        <div>
                          <Label className="text-sm font-medium">심각도</Label>
                          <Select
                            value={filters.severity}
                            onValueChange={(value) => setFilters({ ...filters, severity: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">전체</SelectItem>
                              <SelectItem value="low">경미</SelectItem>
                              <SelectItem value="medium">보통</SelectItem>
                              <SelectItem value="high">심각</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">기간</Label>
                          <Select
                            value={filters.dateRange}
                            onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">전체</SelectItem>
                              <SelectItem value="week">최근 1주일</SelectItem>
                              <SelectItem value="month">최근 1개월</SelectItem>
                              <SelectItem value="3months">최근 3개월</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 gap-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white"
                          onClick={handleSearch}
                        >
                          검색하기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 py-1 text-xs"
                          onClick={() => { setFilters({ type: 'all', status: 'all', dateRange: 'all', severity: 'all' }); setSearchApplied(false); }}
                        >
                          필터 초기화
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {/* 최근 제보 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">최근 제보</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredReports.slice(0, 5).map((report) => (
                          <div
                            key={report.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setSelectedReport(report)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="text-lg">{getTypeIcon(report.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-medium truncate">{report.title}</h4>
                                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(report.severity)}`} />
                                </div>
                                <p className="text-xs text-gray-600 truncate">{report.location}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <Badge className={`text-xs ${getStatusColor(report.status)}`}>{report.status}</Badge>
                                  <span className="text-xs text-gray-500">{report.date}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            {/* 통계 및 데이터 화면 */}
            {currentView === "stats" && <StatsView reports={reports} stats={stats} />}
            {/* 분석 화면 */}
            {currentView === "analysis" && <AnalysisView reports={reports} />}
            {/* 커뮤니티 화면 */}
            {currentView === "community" && (
              <CommunityView
                posts={communityPosts}
                onAddPost={handleCommunityPost}
                currentUser={currentUser}
                isLoggedIn={isLoggedIn}
              />
            )}
            {/* 5. 환경 문제 제보하기 하단에 검색 결과 섹션 추가 */}
            {searchApplied && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-3">검색 결과</h3>
                {searchResults.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">검색 결과가 없습니다.</div>
                ) : (
                  <div className="grid gap-4">
                    {searchResults.map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getTypeIcon(report.type)}</span>
                          <span className="font-semibold text-base">{report.title}</span>
                          <span className={`w-2 h-2 rounded-full ${getSeverityColor(report.severity)}`}></span>
                          <Badge className={`text-xs ${getStatusColor(report.status)}`}>{report.status}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">{report.location} | {report.date}</div>
                        <div className="text-sm text-gray-700 line-clamp-2">{report.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* 세부내용 모달 */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto animate-fade-in relative bg-white rounded-2xl shadow-xl border border-gray-100">
              {/* 1. 제목 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl flex-shrink-0">{getTypeIcon(selectedReport.type)}</span>
                <h3 className="font-bold text-lg text-gray-900">{selectedReport.title}</h3>
                <button
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedReport(null)}
                  aria-label="닫기"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* 2. 상태/장소/사진 한 줄 */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span>
                <span className="text-xs text-gray-500">{selectedReport.location}</span>
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <button
                    className="px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold shadow"
                    onClick={() => { setShowImageViewer(true); setImageIndex(0); }}
                  >
                    사진 보기
                  </button>
                )}
              </div>

              {/* 3. AI 분석 or 설명 */}
              {selectedReport.aiAnalysis ? (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 border-2 border-blue-400 shadow-xl relative overflow-hidden animate-fade-in">
                  {/* AI 뱃지/아이콘 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold shadow animate-soft-pulse">
                      <svg className="w-4 h-4 mr-1 text-white animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v2m6.364 1.636l-1.414 1.414M22 12h-2m-1.636 6.364l-1.414-1.414M12 22v-2m-6.364-1.636l1.414-1.414M2 12h2m1.636-6.364l1.414 1.414" /></svg>
                      AI 분석
                    </span>
                    <span className="text-xs text-blue-900 font-semibold">AI 기반 자동 요약 및 태그</span>
                  </div>
                  {/* 요약문 */}
                  {selectedReport.aiAnalysis.summary && (
                    <div className="mb-2 text-sm text-blue-900 font-bold leading-relaxed">
                      <span className="font-bold mr-1">요약:</span>
                      {selectedReport.aiAnalysis.summary}
                    </div>
                  )}
                  {/* 태그 */}
                  {selectedReport.aiAnalysis.keywords && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedReport.aiAnalysis.keywords.map((kw, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm border border-blue-300 animate-soft-pulse">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 기타 정보 */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-900 font-semibold">
                    {selectedReport.aiAnalysis.category && <span className="bg-white/90 rounded px-2 py-1">카테고리: {selectedReport.aiAnalysis.category}</span>}
                    {selectedReport.aiAnalysis.urgency && <span className="bg-white/90 rounded px-2 py-1">긴급도: {selectedReport.aiAnalysis.urgency}</span>}
                    {selectedReport.aiAnalysis.estimatedCost && <span className="bg-white/90 rounded px-2 py-1">예상비용: {selectedReport.aiAnalysis.estimatedCost}</span>}
                    {selectedReport.aiAnalysis.expectedDuration && <span className="bg-white/90 rounded px-2 py-1">예상기간: {selectedReport.aiAnalysis.expectedDuration}</span>}
                  </div>
                  {/* soft pulse 효과 (더 진하게) */}
                  <span className="absolute -inset-2 rounded-xl bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 opacity-40 animate-soft-pulse z-0" />
                </div>
              ) : (
                <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm leading-relaxed">
                  {selectedReport.description}
                </div>
              )}

              {/* 사진 뷰어 모달 */}
              {showImageViewer && selectedReport.images && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                  <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-lg w-full flex flex-col items-center">
                    <button className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700" onClick={() => setShowImageViewer(false)}>
                      <X className="h-4 w-4" />
                    </button>
                    <img src={selectedReport.images[imageIndex]} alt="제보 이미지" className="max-h-[60vh] rounded-lg border mb-2" style={{objectFit:'contain'}} />
                    {selectedReport.images.length > 1 && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={()=>setImageIndex((imageIndex-1+selectedReport.images.length)%selectedReport.images.length)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">◀</button>
                        <span className="text-xs text-gray-600">{imageIndex+1} / {selectedReport.images.length}</span>
                        <button onClick={()=>setImageIndex((imageIndex+1)%selectedReport.images.length)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">▶</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 통계 및 데이터 뷰 컴포넌트
function StatsView({ reports, stats }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">통계 및 데이터</h2>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          리포트 다운로드
        </Button>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">총 제보건수</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">처리 대기</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">처리 중</p>
                <p className="text-3xl font-bold text-orange-600">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">처리 완료</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 유형별 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>유형별 제보 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["waste", "air", "water", "noise"].map((type) => {
                const count = reports.filter((r) => r.type === type).length
                const percentage = (count / reports.length) * 100
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="flex items-center space-x-2">
                        <span>
                          {type === "waste" && "🗑️ 폐기물"}
                          {type === "air" && "💨 대기오염"}
                          {type === "water" && "💧 수질오염"}
                          {type === "noise" && "🔊 소음"}
                        </span>
                      </span>
                      <span className="text-sm font-medium">{count}건</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>월별 제보 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart className="h-16 w-16 mx-auto mb-4" />
                <p>차트 데이터 준비 중...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 데이터 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>상세 제보 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">제목</th>
                  <th className="text-left p-2">유형</th>
                  <th className="text-left p-2">심각도</th>
                  <th className="text-left p-2">상태</th>
                  <th className="text-left p-2">제보일</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{report.id}</td>
                    <td className="p-2 font-medium">{report.title}</td>
                    <td className="p-2">
                      <span className="flex items-center space-x-1">
                        <span>
                          {report.type === "waste" && "🗑️"}
                          {report.type === "air" && "💨"}
                          {report.type === "water" && "💧"}
                          {report.type === "noise" && "🔊"}
                        </span>
                        <span className="capitalize">{report.type}</span>
                      </span>
                    </td>
                    <td className="p-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          report.severity === "high"
                            ? "bg-red-500"
                            : report.severity === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      />
                    </td>
                    <td className="p-2">
                      <Badge
                        className={
                          report.status === "처리완료"
                            ? "bg-green-100 text-green-800"
                            : report.status === "처리중"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className="p-2">{report.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 분석 뷰 컴포넌트
function AnalysisView({ reports }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">환경 데이터 분석</h2>
        <Button variant="outline">
          <Target className="h-4 w-4 mr-2" />
          AI 분석 실행
        </Button>
      </div>

      {/* AI 분석 결과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI 키워드 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {["#폐기물", "#불법투기", "#미세먼지", "#수질오염", "#소음공해", "#악취", "#대기오염"].map(
                  (keyword) => (
                    <Badge key={keyword} variant="outline" className="text-sm">
                      {keyword}
                    </Badge>
                  ),
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p>• 가장 빈번한 키워드: #폐기물 (35%)</p>
                <p>• 증가 추세: #미세먼지 (+15%)</p>
                <p>• 감소 추세: #소음공해 (-8%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지역별 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["강남구", "중구", "마포구", "송파구", "종로구"].map((district, index) => {
                const count = Math.floor(Math.random() * 10) + 1
                return (
                  <div key={district} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{district}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / 10) * 100}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{count}건</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 예측 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>예측 분석 및 권장사항</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">단기 예측 (1주일)</h4>
              <p className="text-sm text-blue-700">폐기물 관련 제보 15% 증가 예상</p>
              <p className="text-xs text-blue-600 mt-2">권장: 청소 인력 증원</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">중기 예측 (1개월)</h4>
              <p className="text-sm text-yellow-700">대기오염 문제 집중 발생 예상</p>
              <p className="text-xs text-yellow-600 mt-2">권장: 모니터링 강화</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">장기 예측 (3개월)</h4>
              <p className="text-sm text-green-700">전체적인 환경 개선 추세</p>
              <p className="text-xs text-green-600 mt-2">권장: 현재 정책 유지</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 처리 효율성 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>처리 효율성 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">평균 처리 시간</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">폐기물</span>
                    <span className="text-sm font-medium">2.3일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">대기오염</span>
                    <span className="text-sm font-medium">1.8일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">수질오염</span>
                    <span className="text-sm font-medium">4.1일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">소음</span>
                    <span className="text-sm font-medium">1.2일</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">처리 성공률</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">폐기물</span>
                    <span className="text-sm font-medium text-green-600">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">대기오염</span>
                    <span className="text-sm font-medium text-green-600">88%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">수질오염</span>
                    <span className="text-sm font-medium text-yellow-600">76%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">소음</span>
                    <span className="text-sm font-medium text-green-600">92%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
