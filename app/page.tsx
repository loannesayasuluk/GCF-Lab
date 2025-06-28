"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  User, 
  MessageCircle, 
  Heart, 
  Share2, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  BarChart3,
  Users,
  Globe,
  Settings,
  LogOut,
  LogIn
} from 'lucide-react'
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { AnalysisView } from "@/components/analysis-view"
import { CommunityView } from "@/components/community-view"
import { StatsView } from "@/components/stats-view"
import { Report, CommunityPost, User as GCFUser, Stats, Filters, Location, Notification } from "@/types"

// Utility functions
function getSeverityLabel(severity: string) {
  const labels = { low: '낮음', medium: '보통', high: '높음' }
  return labels[severity as keyof typeof labels] || severity
}

function getTypeLabel(type: string) {
  const labels = { waste: '폐기물', air: '대기', water: '수질', noise: '소음' }
  return labels[type as keyof typeof labels] || type
}

function getStatusLabel(status: string) {
  const labels = { '제보접수': '제보접수', '처리중': '처리중', '처리완료': '처리완료' }
  return labels[status as keyof typeof labels] || status
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return '날짜 없음'
  }
}

function severityColor(severity: string) {
  const colors = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-red-500' }
  return colors[severity as keyof typeof colors] || 'bg-gray-500'
}

// Main component
export default function EnvironmentalMapPlatform() {
  const { toast } = useToast()
  
  // State
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    thisWeek: 0
  })
  const [reports, setReports] = useState<Report[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [currentView, setCurrentView] = useState('map')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchApplied, setSearchApplied] = useState(false)
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    severity: 'all',
    dateRange: 'all'
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<GCFUser | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showCommunityDialog, setShowCommunityDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        title: '강변에 쓰레기 무단 투기',
        description: '한강변에 대량의 쓰레기가 무단으로 버려져 있습니다.',
        location: '서울시 강남구',
        type: 'waste',
        severity: 'high',
        status: '처리중',
        date: '2024-01-15',
        reporter: '김철수',
        images: ['/placeholder.jpg'],
        assignedTo: '환경과 김영희',
        coordinates: { lat: 37.5665, lng: 126.9780 }
      },
      {
        id: '2',
        title: '공장에서 검은 연기 발생',
        description: '산업단지 내 공장에서 검은 연기가 지속적으로 발생하고 있습니다.',
        location: '서울시 마포구',
        type: 'air',
        severity: 'medium',
        status: '제보접수',
        date: '2024-01-14',
        reporter: '이영희',
        images: ['/placeholder.jpg'],
        coordinates: { lat: 37.5665, lng: 126.9780 }
      },
      {
        id: '3',
        title: '하천에 기름 유출',
        description: '작은 하천에 기름이 유출되어 물고기가 떠다니고 있습니다.',
        location: '서울시 서초구',
        type: 'water',
        severity: 'high',
        status: '처리완료',
        date: '2024-01-13',
        reporter: '박민수',
        images: ['/placeholder.jpg'],
        assignedTo: '수질과 최성호',
        resolvedDate: '2024-01-16',
        coordinates: { lat: 37.5665, lng: 126.9780 }
      }
    ]

    const mockPosts: CommunityPost[] = [
      {
        id: '1',
        title: '우리 동네 환경 개선 프로젝트 참여하세요!',
        author: '환경지킴이',
        date: '2024-01-20',
        content: '함께 우리 동네를 더 깨끗하게 만들어요. 매주 토요일 오전 10시에 모입니다.',
        likes: 15,
        comments: 8,
        category: '모임',
        commentsList: [
          { author: '김철수', content: '좋은 아이디어네요!', date: '2024-01-15' },
          { author: '이영희', content: '참여하고 싶습니다.', date: '2024-01-15' }
        ]
      }
    ]

    setReports(mockReports)
    setCommunityPosts(mockPosts)
    setStats({
      total: mockReports.length,
      pending: mockReports.filter(r => r.status !== '처리완료').length,
      processing: mockReports.filter(r => r.status === '처리중').length,
      resolved: mockReports.filter(r => r.status === '처리완료').length,
      thisWeek: mockReports.filter(r => new Date(r.date) >= new Date(new Date().toISOString().split('T')[0])).length
    })
    setIsLoading(false)
  }, [])

  // Filtered reports
  const filteredReports = useMemo(() => {
    let result = [...reports]
    
    if (filters.type !== "all") {
      result = result.filter(r => r.type === filters.type)
    }
    if (filters.status !== "all") {
      result = result.filter(r => r.status === filters.status)
    }
    if (filters.severity !== "all") {
      result = result.filter(r => r.severity === filters.severity)
    }
    if (searchTerm) {
      result = result.filter(r => 
        r.title.includes(searchTerm) || 
        r.description.includes(searchTerm) ||
        r.reporter.includes(searchTerm)
      )
    }
    if (filters.dateRange !== "all") {
      const [start, end] = filters.dateRange.split(' - ')
      result = result.filter(r => {
        const date = new Date(r.date)
        return date >= new Date(start) && date <= new Date(end)
      })
    }
    
    return result
  }, [reports, filters, searchTerm])

  // Handlers
  const handleAddReport = async (reportData: Omit<Report, "id">) => {
    const newReport: Report = {
      ...reportData,
      id: Date.now().toString()
    }
    setReports(prev => [newReport, ...prev])
    setShowReportDialog(false)
    toast({
      title: "제보 등록 완료",
      description: "환경 제보가 성공적으로 등록되었습니다.",
    })
  }

  const handleCommunityPost = (postData: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'isLiked' | 'commentsList'>) => {
    const newPost: CommunityPost = {
      id: String(Date.now()),
      ...postData,
      likes: 0,
      comments: 0,
      commentsList: [],
      category: postData.category || '모임'
    }
    setCommunityPosts(prev => [newPost, ...prev])
    setShowCommunityDialog(false)
    toast({
      title: "글 등록 완료",
      description: "커뮤니티 글이 성공적으로 등록되었습니다.",
    })
  }

  const handleAddComment = (postId: string, comment: { author: string; content: string; date: string }) => {
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

  const handleToggleLike = (postId: string, isLike: boolean) => {
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
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: "이메일 또는 비밀번호가 올바르지 않습니다.",
        variant: "destructive",
      })
    }
  }

  const handleSignup = async (email: string, password: string, name: string) => {
    // Mock signup
    setCurrentUser({
      id: '1',
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
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsLoggedIn(false)
    toast({
      title: "로그아웃",
      description: "로그아웃되었습니다.",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Skeleton className="h-96 w-full" />
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Globe className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">환경 제보 플랫폼</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-gray-700">{currentUser?.name}님</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowAuthDialog(true)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  실시간 통계
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600">총 제보</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    <div className="text-sm text-gray-600">해결됨</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-gray-600">처리중</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
                    <div className="text-sm text-gray-600">이번주</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  필터
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>유형</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="waste">폐기물</SelectItem>
                      <SelectItem value="air">대기</SelectItem>
                      <SelectItem value="water">수질</SelectItem>
                      <SelectItem value="noise">소음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>상태</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
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
                  <Label>심각도</Label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 액션</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => setShowReportDialog(true)}
                  aria-label="환경 제보 등록"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  제보 등록
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowCommunityDialog(true)}
                  aria-label="커뮤니티 글쓰기"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  글쓰기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <div className="flex space-x-2">
              <Input
                placeholder="검색어를 입력하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
                aria-label="검색"
              />
              <Button onClick={() => setSearchApplied(true)} aria-label="검색 실행">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={currentView} onValueChange={setCurrentView}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map">지도</TabsTrigger>
                <TabsTrigger value="list">목록</TabsTrigger>
                <TabsTrigger value="community">커뮤니티</TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>환경 제보 지도</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">지도가 여기에 표시됩니다</p>
                        <p className="text-sm text-gray-500">react-leaflet을 사용한 실제 지도 구현</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <div className="grid gap-4">
                  {filteredReports.map((report) => (
                    <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">{report.title}</h3>
                              <Badge variant={report.severity === 'high' ? 'destructive' : report.severity === 'medium' ? 'default' : 'secondary'}>
                                {getSeverityLabel(report.severity)}
                              </Badge>
                              <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                              <Badge variant={report.status === '처리완료' ? 'default' : 'outline'}>
                                {getStatusLabel(report.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {report.reporter}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(report.date)}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {report.location}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                            aria-label="상세보기"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="community" className="space-y-4">
                <div className="grid gap-4">
                  {communityPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{post.title}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{post.author}</span>
                            <span>•</span>
                            <span>{formatDate(post.date)}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{post.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleLike(post.id, !post.isLiked)}
                              aria-label={post.isLiked ? "좋아요 취소" : "좋아요"}
                            >
                              <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                              {post.likes}
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="댓글">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post.comments}
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" aria-label="공유">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>로그인 / 회원가입</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="이메일을 입력하세요" />
            </div>
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" placeholder="비밀번호를 입력하세요" />
            </div>
            <div className="flex space-x-2">
              <Button className="flex-1" onClick={() => handleLogin('test@example.com', 'password')}>
                로그인
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleSignup('test@example.com', 'password', '테스트 사용자')}>
                회원가입
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환경 제보 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목</Label>
              <Input id="title" placeholder="제보 제목을 입력하세요" />
            </div>
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" placeholder="상세한 설명을 입력하세요" />
            </div>
            <div>
              <Label htmlFor="type">유형</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waste">폐기물</SelectItem>
                  <SelectItem value="air">대기</SelectItem>
                  <SelectItem value="water">수질</SelectItem>
                  <SelectItem value="noise">소음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">심각도</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="심각도를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => handleAddReport({
              title: '새로운 환경 제보',
              description: '환경 문제에 대한 상세한 설명',
              location: '서울시',
              type: 'waste',
              severity: 'medium',
              status: '제보접수',
              date: new Date().toISOString(),
              reporter: currentUser?.name || '익명',
              images: [],
              coordinates: { lat: 37.5665, lng: 126.9780 }
            })}>
              제보 등록
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>커뮤니티 글쓰기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="post-title">제목</Label>
              <Input id="post-title" placeholder="글 제목을 입력하세요" />
            </div>
            <div>
              <Label htmlFor="post-content">내용</Label>
              <Textarea id="post-content" placeholder="글 내용을 입력하세요" />
            </div>
            <Button className="w-full" onClick={() => handleCommunityPost({
              title: '새로운 커뮤니티 글',
              content: '환경에 대한 의견과 아이디어를 공유합니다.',
              author: currentUser?.name || '익명',
              date: new Date().toISOString(),
              category: '모임'
            })}>
              글 등록
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant={selectedReport.severity === 'high' ? 'destructive' : selectedReport.severity === 'medium' ? 'default' : 'secondary'}>
                  {getSeverityLabel(selectedReport.severity)}
                </Badge>
                <Badge variant="outline">{getTypeLabel(selectedReport.type)}</Badge>
                <Badge variant={selectedReport.status === '처리완료' ? 'default' : 'outline'}>
                  {getStatusLabel(selectedReport.status)}
                </Badge>
              </div>
              <p className="text-gray-600">{selectedReport.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">제보자:</span> {selectedReport.reporter}
                </div>
                <div>
                  <span className="font-medium">제보일:</span> {formatDate(selectedReport.date)}
                </div>
                <div>
                  <span className="font-medium">위치:</span> {selectedReport.location}
                </div>
                {selectedReport.assignedTo && (
                  <div>
                    <span className="font-medium">담당자:</span> {selectedReport.assignedTo}
                  </div>
                )}
              </div>
              {selectedReport.images.length > 0 && (
                <div>
                  <span className="font-medium">이미지:</span>
                  <Carousel className="w-full max-w-xs">
                    <CarouselContent>
                      {selectedReport.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="p-1">
                            <img src={image} alt={`제보 이미지 ${index + 1}`} className="w-full h-32 object-cover rounded" />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 