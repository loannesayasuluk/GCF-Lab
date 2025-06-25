"use client"

import { useState } from "react"
import { Target, Activity, TrendingUp, BarChart3, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

export function AnalysisView({ reports }: AnalysisViewProps) {
  const { toast } = useToast()
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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

      // 유형별 분석
      reports.forEach(report => {
        typeAnalysis[report.type] = (typeAnalysis[report.type] || 0) + 1
        severityAnalysis[report.severity] = (severityAnalysis[report.severity] || 0) + 1
        statusAnalysis[report.status] = (statusAnalysis[report.status] || 0) + 1
      })

      // AI 분석 결과 생성 (실제로는 OpenAI API 호출)
      const analysisData: AnalysisResults = {
        summary: `총 ${totalReports}건의 환경 제보가 분석되었습니다.`,
        insights: [
          `가장 많은 제보 유형: ${Object.entries(typeAnalysis).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음'}`,
          `심각도 분포: ${Object.entries(severityAnalysis).map(([k, v]) => `${k}: ${v}건`).join(', ')}`,
          `처리 상태: ${Object.entries(statusAnalysis).map(([k, v]) => `${k}: ${v}건`).join(', ')}`,
        ],
        recommendations: [
          "가장 많은 제보 유형에 대한 예방 정책 강화 필요",
          "처리 대기 중인 제보의 신속한 처리 필요",
          "시민들의 환경 인식 제고를 위한 교육 프로그램 확대",
        ],
        trends: [
          "최근 3개월간 제보 건수가 증가 추세",
          "대기오염 관련 제보가 계절적으로 증가",
          "주말보다 평일에 제보가 더 많음",
        ]
      }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">환경 데이터 분석</h2>
        <Button variant="outline" onClick={handleAIAnalysis} disabled={isAnalyzing}>
          <Target className="h-4 w-4 mr-2" />
          {isAnalyzing ? "분석 중..." : "AI 분석 실행"}
        </Button>
      </div>

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
                <TrendingUp className="h-5 w-5" />
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
                <BarChart3 className="h-5 w-5" />
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
                <PieChart className="h-5 w-5" />
                <span>데이터 시각화</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">차트 시각화 준비 중...</p>
                  <p className="text-sm text-gray-500 mt-2">향후 업데이트 예정</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 기본 통계 정보 */}
      {!analysisResults && (
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
              <p className="text-gray-600">AI 분석을 실행하여 더 자세한 인사이트를 확인하세요.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 