"use client"

import { useState, useEffect } from "react"
import { Download, Activity, Clock, TrendingUp, CheckCircle, PieChart, List, Filter, Search, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Report, Stats } from "@/types"
import ReportDetailDialog from "./ReportDetailDialog"

interface StatsViewProps {
  reports: Report[]
  stats: Stats
}

interface ChartData {
  [key: string]: number
}

interface FilterState {
  search: string
  type: string
  status: string
  severity: string
  dateFrom: string
  dateTo: string
}

const STATUS = [
  { key: 'waste', label: '폐기물', icon: '🗑️', color: 'red' },
  { key: 'air', label: '대기오염', icon: '💨', color: 'blue' },
  { key: 'water', label: '수질오염', icon: '💧', color: 'sky' },
  { key: 'noise', label: '소음', icon: '🔊', color: 'gray' },
];

export function StatsView({ reports, stats }: StatsViewProps) {
  const { toast } = useToast()
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState("stats")
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "all",
    status: "all",
    severity: "all",
    dateFrom: "",
    dateTo: ""
  })
  const [filteredReports, setFilteredReports] = useState<Report[]>(reports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  // filters 상태 변경 추적
  useEffect(() => {
    console.log("[filters 상태 변경] 현재 filters:", filters);
    Object.entries(filters).forEach(([key, value]) => {
      // search, dateFrom, dateTo 필터는 빈 문자열이 정상이므로 제외
      if (!['search', 'dateFrom', 'dateTo'].includes(key) && value === "") {
        console.error(`[filters 디버그] ${key} 필터가 빈 문자열입니다!`, { key, value, filters });
      }
    });
  }, [filters]);

  // 필터링된 제보 목록 업데이트
  useEffect(() => {
    let filtered = [...reports]

    // 검색어 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.reporter.toLowerCase().includes(searchLower) ||
        (typeof report.location === 'string' && report.location.toLowerCase().includes(searchLower))
      )
    }

    // 유형 필터
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter(report => report.type === filters.type)
    }

    // 상태 필터
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(report => report.status === filters.status)
    }

    // 심각도 필터
    if (filters.severity && filters.severity !== "all") {
      filtered = filtered.filter(report => report.severity === filters.severity)
    }

    // 날짜 범위 필터
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(report => new Date(report.date) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // 해당 날짜의 마지막 시간으로 설정
      filtered = filtered.filter(report => new Date(report.date) <= toDate)
    }

    setFilteredReports(filtered)
  }, [reports, filters])

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all",
      status: "all",
      severity: "all",
      dateFrom: "",
      dateTo: ""
    })
  }

  // 필터가 적용되어 있는지 확인
  const hasActiveFilters = Object.values(filters).some(value => value !== "")

  // 월별 데이터 생성
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setChartData(null)
      return
    }

    const monthlyData: ChartData = {}
    const currentYear = new Date().getFullYear()
    
    // 최근 12개월 데이터 생성
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, new Date().getMonth() - i, 1)
      const monthKey = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
      monthlyData[monthKey] = 0
    }
    
    // 실제 데이터로 채우기
    reports.forEach(report => {
      try {
        const reportDate = new Date(report.date)
        if (isNaN(reportDate.getTime())) {
          console.warn('Invalid date format:', report.date)
          return
        }
        const monthKey = reportDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey]++
        }
      } catch (error) {
        console.error('Error processing report date:', error)
      }
    })
    
    setChartData(monthlyData)
  }, [reports])

  const handleDownloadReport = async () => {
    if (!reports || reports.length === 0) {
      toast({
        title: "다운로드 불가",
        description: "다운로드할 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsDownloading(true)
    try {
      // CSV 데이터 생성
      const csvContent = [
        ['ID', '제목', '유형', '심각도', '상태', '제보일', '위치', '제보자'],
        ...reports.map(report => [
          report.id,
          report.title,
          getTypeLabel(report.type),
          report.severity,
          report.status,
          report.date,
          report.location,
          report.reporter
        ])
      ].map(row => row.join(',')).join('\n')

      // 파일 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `환경제보_통계_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "다운로드 완료",
        description: "환경 제보 통계 리포트가 다운로드되었습니다.",
      })
    } catch (error) {
      console.error('다운로드 오류:', error)
      toast({
        title: "다운로드 실패",
        description: "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'waste': return '폐기물'
      case 'air': return '대기오염'
      case 'water': return '수질오염'
      case 'noise': return '소음'
      default: return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'waste': return '🗑️'
      case 'air': return '💨'
      case 'water': return '💧'
      case 'noise': return '🔊'
      default: return ''
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '심각'
      case 'medium': return '보통'
      case 'low': return '경미'
      default: return severity
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '제보접수': return '제보접수'
      case '처리중': return '처리중'
      case '처리완료': return '처리완료'
      default: return status
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-700 border-green-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '제보접수': return 'bg-blue-100 text-blue-700 border-blue-300'
      case '처리중': return 'bg-orange-100 text-orange-700 border-orange-300'
      case '처리완료': return 'bg-green-100 text-green-700 border-green-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const counts = STATUS.map(s => ({
    ...s,
    count: reports.filter(r => r.type === s.key).length
  }));

  useEffect(() => {
    if (filters.type === "" || filters.status === "" || filters.severity === "") {
      console.error("[디버그] Select 필터 value에 빈 문자열 감지!", filters);
    }
  }, [filters]);

  return (
    <div className="w-full max-w-none lg:max-w-screen-2xl mx-auto px-4 sm:px-10 lg:px-16 py-4 space-y-4 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">통계 및 데이터</h2>
        <Button 
          variant="outline" 
          onClick={handleDownloadReport} 
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? "다운로드 중..." : "리포트 다운로드"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            통계
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            제보 목록
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {/* 주요 통계 카드 */}
          <div className="grid grid-cols-2 gap-4">
            {counts.map(({ key, label, icon, color, count }) => (
              <div key={key} className={`bg-white rounded-xl shadow p-4 flex flex-col items-center border-2 border-${color}-200`}>
                <span className="text-3xl mb-1">{icon}</span>
                <span className={`text-lg font-bold text-${color}-600`}>{label}</span>
                <span className={`text-2xl font-extrabold text-${color}-700 mt-2`}>{count}건</span>
              </div>
            ))}
          </div>

          {/* 유형별 통계 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>유형별 제보 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    reports.reduce((acc, report) => {
                      acc[report.type] = (acc[report.type] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">
                          {type === 'waste' ? '🗑️' : type === 'air' ? '💨' : type === 'water' ? '💧' : type === 'noise' ? '🔊' : ''}
                        </span>
                        <span className="text-base font-medium">{getTypeLabel(type)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{count}</span>
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {Math.round((count / reports.length) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>심각도별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    reports.reduce((acc, report) => {
                      acc[report.severity] = (acc[report.severity] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{getSeverityLabel(severity)}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{count}</span>
                        <Badge 
                          variant="outline"
                          className={
                            severity === "high" ? "border-red-200 text-red-700" :
                            severity === "medium" ? "border-yellow-200 text-yellow-700" :
                            "border-green-200 text-green-700"
                          }
                        >
                          {Math.round((count / reports.length) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 월별 트렌드 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>월별 제보 트렌드</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(chartData).map(([month, count]) => (
                      <div key={month} className="text-center">
                        <div className="text-sm text-gray-600 mb-1">{month}</div>
                        <div className="text-lg font-bold">{count}</div>
                        <div 
                          className="bg-blue-200 rounded mt-1"
                          style={{ 
                            height: `${Math.max(4, (count / Math.max(...Object.values(chartData))) * 100)}px` 
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    최근 12개월간의 제보 현황
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">차트 데이터 준비 중...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* 필터 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                필터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 검색 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="제목, 내용, 제보자 검색..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>

                {/* 유형 필터 */}
                <Select value={filters.type} onValueChange={(value) => {
                  console.log("[유형 Select] onValueChange 호출됨:", { value, type: typeof value, isEmpty: value === "" });
                  if (value === "") {
                    console.error("[디버그] 유형 Select value가 빈 문자열로 세팅됨!", value, filters);
                  }
                  setFilters(prev => ({ ...prev, type: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="waste">폐기물</SelectItem>
                    <SelectItem value="air">대기오염</SelectItem>
                    <SelectItem value="water">수질오염</SelectItem>
                    <SelectItem value="noise">소음</SelectItem>
                  </SelectContent>
                </Select>

                {/* 상태 필터 */}
                <Select value={filters.status} onValueChange={(value) => {
                  console.log("[상태 Select] onValueChange 호출됨:", { value, type: typeof value, isEmpty: value === "" });
                  if (value === "") {
                    console.error("[디버그] 상태 Select value가 빈 문자열로 세팅됨!", value, filters);
                  }
                  setFilters(prev => ({ ...prev, status: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="제보접수">제보접수</SelectItem>
                    <SelectItem value="처리중">처리중</SelectItem>
                    <SelectItem value="처리완료">처리완료</SelectItem>
                  </SelectContent>
                </Select>

                {/* 심각도 필터 */}
                <Select value={filters.severity} onValueChange={(value) => {
                  console.log("[심각도 Select] onValueChange 호출됨:", { value, type: typeof value, isEmpty: value === "" });
                  if (value === "") {
                    console.error("[디버그] 심각도 Select value가 빈 문자열로 세팅됨!", value, filters);
                  }
                  setFilters(prev => ({ ...prev, severity: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="심각도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="high">심각</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="low">경미</SelectItem>
                  </SelectContent>
                </Select>

                {/* 날짜 범위 */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">~</span>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* 필터 초기화 버튼 */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    필터 초기화
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 제보 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>
                제보 목록 ({filteredReports.length}건)
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (전체 {reports.length}건 중)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReports.length > 0 ? (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl">
                            {getTypeIcon(report.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {report.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {report.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className={`${getSeverityColor(report.severity)} border`}>
                                {getSeverityLabel(report.severity)}
                              </Badge>
                              <Badge className={`${getStatusColor(report.status)} border`}>
                                {getStatusLabel(report.status)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(report.type)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                <span>제보자: {report.reporter}</span>
                                <span>제보일: {formatDate(report.date)}</span>
                              </div>
                              <span className="text-xs">ID: {report.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <List className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">
                    {hasActiveFilters ? "필터 조건에 맞는 제보가 없습니다." : "등록된 제보가 없습니다."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="mt-2">
                      필터 초기화
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {/* 세부정보 다이얼로그 */}
          <ReportDetailDialog report={selectedReport} open={!!selectedReport} onOpenChange={(open) => {
            if (!open) setSelectedReport(null)
          }} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 