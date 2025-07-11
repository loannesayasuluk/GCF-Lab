// 환경 제보 관련 타입
export interface Report {
  id: string
  title: string
  location: string
  type: 'waste' | 'air' | 'water' | 'noise'
  severity: 'low' | 'medium' | 'high'
  reporter: string
  date: string
  status: '제보접수' | '처리중' | '처리완료' | '긴급'
  description: string
  coordinates: {
    lat: number
    lng: number
  }
  images: string[]
  assignedTo?: string
  processingNotes?: string
  resolvedDate?: string
  resolutionReport?: string
  aiAnalysis?: {
    summary: string
    keywords: string[]
    category: string
    urgency: string
    estimatedCost: string
    expectedDuration: string
  }
}

// 커뮤니티 포스트 타입
export interface CommunityPost {
  id: string
  title: string
  author: string
  date: string
  content: string
  likes: number
  comments: number
  category: '모임' | '정보' | '팁' | '질문' | '제안'
  severity?: 'low' | 'medium' | 'high'
  isLiked?: boolean
  commentsList?: Array<{
    author: string
    content: string
    date: string
  }>
}

// 댓글 타입
export interface Comment {
  id: number
  content: string
  author: string
  date: string
}

// 사용자 타입
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  isAdmin: boolean
}

// 통계 타입
export interface Stats {
  total: number
  pending: number
  processing: number
  resolved: number
  thisWeek: number
  totalReports: number
  activeReports: number
  resolvedReports: number
  totalUsers: number
  averageResolutionTime: number
  reportsByType: { [key: string]: number }
  reportsBySeverity: { [key: string]: number }
  reportsByStatus: { [key: string]: number }
  monthlyTrends: any[]
  topLocations: any[]
}

// 필터 타입
export interface Filters {
  type: 'all' | 'waste' | 'air' | 'water' | 'noise'
  status: 'all' | '제보접수' | '처리중' | '처리완료' | '긴급'
  dateRange: 'all' | 'today' | 'week' | 'month'
  severity: 'all' | 'low' | 'medium' | 'high'
}

// 위치 타입
export interface Location {
  lat: number
  lng: number
  accuracy?: number
}

// 알림 타입
export interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  targetUserId?: string
  isRead: boolean
  createdAt: Date
} 