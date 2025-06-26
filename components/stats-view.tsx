"use client"

import { useState, useEffect } from "react"
import { Download, Activity, Clock, TrendingUp, CheckCircle, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Report, Stats } from "@/types"

interface StatsViewProps {
  reports: Report[]
  stats: Stats
}

interface ChartData {
  [key: string]: number
}

export function StatsView({ reports, stats }: StatsViewProps) {
  const { toast } = useToast()
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

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

  return (
    <div className="space-y-6">
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
                  <span className="font-medium capitalize">{severity}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{count}</span>
                    <Badge 
                      variant="outline"
                      className={
                        severity === "심각" ? "border-red-200 text-red-700" :
                        severity === "보통" ? "border-yellow-200 text-yellow-700" :
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
    </div>
  )
} 