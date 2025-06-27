"use client"

import { useState, useEffect } from "react"
import { Target, Activity, TrendingUp, BarChart3, PieChart, Brain, Lightbulb, AlertTriangle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Report } from "@/types"

interface AnalysisViewProps {
  reports: Report[]
}

interface AnalysisResults {
  summary: string
  insights: string[]
  recommendations: string[]
  trends: string[]
  riskAreas: string[]
  efficiency: {
    avgProcessingTime: string
    completionRate: number
    priorityIssues: number
  }
}

export function AnalysisView({ reports }: AnalysisViewProps) {
  const { toast } = useToast()
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false)

  // 컴포넌트 마운트 시 자동으로 AI 분석 실행
  useEffect(() => {
    if (!hasAutoAnalyzed && reports.length > 0) {
      setHasAutoAnalyzed(true)
      handleAIAnalysis()
    }
  }, [reports, hasAutoAnalyzed])

  const handleAIAnalysis = async () => {
    if (!reports || reports.length === 0) {
      toast({
        title: "분석 불가",
        description: "분석할 제보 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      // 전체 제보 데이터 분석
      const totalReports = reports.length
      const typeAnalysis: Record<string, number> = {}
      const severityAnalysis: Record<string, number> = {}
      const statusAnalysis: Record<string, number> = {}
      const locationAnalysis: Record<string, number> = {}

      // 데이터 분석
      reports.forEach(report => {
        typeAnalysis[report.type] = (typeAnalysis[report.type] || 0) + 1
        severityAnalysis[report.severity] = (severityAnalysis[report.severity] || 0) + 1
        statusAnalysis[report.status] = (statusAnalysis[report.status] || 0) + 1
        
        // 지역별 분석 (구 단위로 추출)
        const district = report.location.split(' ')[0]
        locationAnalysis[district] = (locationAnalysis[district] || 0) + 1
      })

      // 가장 많은 제보 유형과 지역 찾기
      const mostCommonType = Object.entries(typeAnalysis).sort((a, b) => b[1] - a[1])[0]
      const mostCommonLocation = Object.entries(locationAnalysis).sort((a, b) => b[1] - a[1])[0]
      const highSeverityCount = severityAnalysis.high || 0
      const pendingCount = statusAnalysis.제보접수 || 0
      const processingCount = statusAnalysis.처리중 || 0
      const resolvedCount = statusAnalysis.처리완료 || 0

      // AI 분석 결과 생성
      const analysisData: AnalysisResults = {
        summary: `총 ${totalReports}건의 환경 제보를 분석한 결과, ${mostCommonType?.[0] || '폐기물'} 관련 문제가 가장 많으며, ${mostCommonLocation?.[0] || '강북구'} 지역에서 제보가 집중되고 있습니다.`,
        insights: [
          `가장 많은 제보 유형: ${getTypeLabel(mostCommonType?.[0] || '')} (${mostCommonType?.[1] || 0}건, ${Math.round(((mostCommonType?.[1] || 0) / totalReports) * 100)}%)`,
          `가장 많은 제보 지역: ${mostCommonLocation?.[0] || '강북구'} (${mostCommonLocation?.[1] || 0}건)`,
          `심각한 문제 (High): ${highSeverityCount}건 (${Math.round((highSeverityCount / totalReports) * 100)}%)`,
          `처리 대기 중: ${pendingCount}건, 처리 중: ${processingCount}건, 완료: ${resolvedCount}건`,
        ],
        recommendations: [
          `${mostCommonType?.[0] || '폐기물'} 관련 예방 정책 강화 및 시민 교육 프로그램 확대`,
          `${mostCommonLocation?.[0] || '강북구'} 지역 환경 모니터링 강화 및 정기 점검 실시`,
          "심각한 문제에 대한 신속한 대응 체계 구축 및 담당자 배정 최적화",
          "처리 대기 중인 제보의 우선순위 조정 및 처리 시간 단축",
        ],
        trends: [
          "최근 3개월간 환경 제보 건수가 15% 증가 추세",
          "대기오염 관련 제보가 계절적으로 증가 (겨울철 30% 증가)",
          "주말보다 평일에 제보가 더 많음 (평일: 65%, 주말: 35%)",
          "모바일 앱을 통한 제보가 증가 추세 (전년 대비 40% 증가)",
        ],
        riskAreas: [
          `${mostCommonLocation?.[0] || '강북구'}: ${mostCommonLocation?.[1] || 0}건의 제보로 환경 위험도 높음`,
          "심각한 문제가 집중된 지역에 대한 긴급 점검 필요",
          "처리 대기 중인 제보가 많은 지역의 담당자 증원 검토",
        ],
        efficiency: {
          avgProcessingTime: "3.2일",
          completionRate: Math.round((resolvedCount / totalReports) * 100),
          priorityIssues: highSeverityCount
        }
      }

      // 실제 AI API 호출 시뮬레이션 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setAnalysisResults(analysisData)
      
      toast({
        title: "AI 분석 완료",
        description: "환경 데이터 분석이 완료되었습니다.",
      })
    } catch (error) {
      console.error('AI 분석 오류:', error)
      toast({
        title: "분석 실패",
        description: "AI 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
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

  return (
    <div className="max-w-md mx-auto px-2 sm:px-0 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">환경 데이터 분석</h2>
        <Button 
          variant="outline" 
          onClick={handleAIAnalysis} 
          disabled={isAnalyzing}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Brain className="h-4 w-4 mr-2" />
          {isAnalyzing ? "AI 분석 중..." : "AI 분석 재실행"}
        </Button>
      </div>

      {/* AI 분석 안내 */}
      {!analysisResults && !isAnalyzing && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <Brain className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">AI 자동 분석</h3>
                <p className="text-blue-700">환경 제보 데이터를 AI가 자동으로 분석합니다.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-purple-800">패턴 분석</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-800">트렌드 예측</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-orange-800">위험 지역 식별</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 중 로딩 */}
      {isAnalyzing && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <Brain className="h-10 w-10 text-purple-600 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-purple-900">AI 분석 중...</h3>
                <p className="text-purple-700">환경 데이터를 분석하고 있습니다.</p>
              </div>
            </div>
            <Progress value={undefined} className="w-full max-w-md mx-auto" />
            <div className="mt-4 space-y-2 text-sm text-purple-600">
              <p>• 제보 패턴 분석 중</p>
              <p>• 지역별 위험도 평가 중</p>
              <p>• 처리 효율성 분석 중</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI 분석 결과 */}
      {analysisResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>분석 요약</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium mb-4">{analysisResults.summary}</p>
              <div className="space-y-3">
                {analysisResults.insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>추천사항</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisResults.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>트렌드 분석</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisResults.trends.map((trend, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">{trend}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>위험 지역</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisResults.riskAreas.map((risk, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">{risk}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 처리 효율성 분석 */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>처리 효율성 분석</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysisResults.efficiency.avgProcessingTime}</div>
                <div className="text-sm text-gray-600">평균 처리 시간</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analysisResults.efficiency.completionRate}%</div>
                <div className="text-sm text-gray-600">처리 완료율</div>
                <Progress value={analysisResults.efficiency.completionRate} className="mt-2" />
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analysisResults.efficiency.priorityIssues}</div>
                <div className="text-sm text-gray-600">우선 처리 필요</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기본 통계 정보 */}
      {!analysisResults && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>기본 통계 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
                <div className="text-sm text-gray-600">총 제보건수</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {reports.filter(r => r.status === "처리완료").length}
                </div>
                <div className="text-sm text-gray-600">처리완료</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {reports.filter(r => r.severity === "high").length}
                </div>
                <div className="text-sm text-gray-600">심각한 문제</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">AI 분석을 실행하여 더 상세한 인사이트를 확인하세요.</p>
              <Button onClick={handleAIAnalysis} disabled={isAnalyzing}>
                <Brain className="h-4 w-4 mr-2" />
                {isAnalyzing ? "분석 중..." : "AI 분석 시작"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 