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

  const handleDownloadReport = () => {
    if (!reports || reports.length === 0) {
      toast({
        title: "다운로드 불가",
        description: "다운로드할 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    try {
      // CSV 데이터 생성
      const csvContent = [
        ['ID', '제목', '유형', '심각도', '상태', '제보일', '위치', '제보자'],
        ...reports.map(report => [
          report.id,
          report.title,
          report.type,
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
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'waste': return '🗑️ 폐기물'
      case 'air': return '💨 대기오염'
      case 'water': return '💧 수질오염'
      case 'noise': return '🔊 소음'
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
        <Button variant="outline" onClick={handleDownloadReport}>
          <Download className="h-4 w-4 mr-2" />
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
                const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="flex items-center space-x-2">
                        <span>{getTypeLabel(type)}</span>
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
            {chartData ? (
              <div className="space-y-4">
                {Object.entries(chartData).map(([month, count]) => {
                  const maxCount = Math.max(...Object.values(chartData))
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{month}</span>
                        <span className="font-medium">{count}건</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="h-16 w-16 mx-auto mb-4" />
                  <p>차트 데이터 준비 중...</p>
                </div>
              </div>
            )}
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
                        <span>{getTypeIcon(report.type)}</span>
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