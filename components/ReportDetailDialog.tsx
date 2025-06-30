"use client"
import { useState } from "react"
import { Report } from "@/types"
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, Sparkles, Loader2, X, User, Calendar, MapPin } from "lucide-react"

interface ReportDetailDialogProps {
  report: Report | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ReportDetailDialog({ report, open, onOpenChange }: ReportDetailDialogProps) {
  const [showImages, setShowImages] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [imgIndex, setImgIndex] = useState(0)

  if (!report) return null

  // AI 분석 요청
  const handleAiAnalysis = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `제목: ${report.title}\n유형: ${report.type}\n내용: ${report.description}`
        })
      })
      const data = await res.json()
      setAiResult(data)
    } catch (e) {
      setAiError("AI 분석 요청 실패")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal forceMount>
        <DialogOverlay className="fixed inset-0 bg-transparent backdrop-blur-xs z-[9998]" />
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full p-0 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-visible z-[9999]">
          {/* 상단: 제목/위치/사진버튼 */}
          <div className="flex items-start justify-between px-10 pt-10 pb-2">
            <div>
              <DialogTitle className="text-2xl font-extrabold mb-1 text-gray-900 leading-tight tracking-tight">{report.title}</DialogTitle>
              <div className="flex items-center gap-1 text-xs text-blue-500 font-medium mb-1">
                <MapPin className="w-4 h-4" /> {report.location}
              </div>
            </div>
            {report.images && report.images.length > 0 && (
              <button
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 rounded-full text-xs font-medium text-blue-700 border-0 shadow-sm"
                onClick={() => { setShowImages(true); setImgIndex(0); }}
                title="첨부 이미지 보기"
              >
                <ImageIcon className="w-4 h-4" /> 사진 {report.images.length}
              </button>
            )}
          </div>
          {/* 태그/상태 */}
          <div className="flex flex-wrap gap-2 px-10 pb-1">
            <Badge variant="destructive" className="text-xs px-2 py-0.5 font-medium bg-rose-100 text-rose-600 border-0">{report.severity === 'high' ? '심각' : report.severity === 'medium' ? '보통' : '경미'}</Badge>
            <Badge className="text-xs px-2 py-0.5 font-medium bg-blue-100 text-blue-700 border-0">{report.status}</Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium border-blue-200 text-blue-500 bg-white">{report.type === 'waste' ? '폐기물' : report.type === 'air' ? '대기오염' : report.type === 'water' ? '수질오염' : '소음'}</Badge>
          </div>
          {/* 본문 */}
          <div className="px-10 py-7 bg-gradient-to-b from-white via-gray-50 to-white rounded-2xl mt-2 mb-2">
            <div className="text-gray-900 text-base leading-relaxed mb-4 whitespace-pre-line font-light">{report.description}</div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{report.reporter}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{report.date}</span>
            </div>
          </div>
          {/* AI 분석 */}
          <div className="px-10 pb-8">
            <button
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 font-semibold mb-3 transition-colors text-base shadow-md"
              onClick={handleAiAnalysis}
              disabled={aiLoading}
            >
              <Sparkles className="w-5 h-5 text-yellow-200" />
              {aiLoading ? (<><Loader2 className="w-5 h-5 animate-spin" /> 분석 중...</>) : "AI 분석"}
            </button>
            {aiError && <div className="text-rose-500 text-xs mt-2">{aiError}</div>}
            {aiResult && (
              <div className="mt-4 p-6 bg-white rounded-2xl border-2 border-transparent bg-clip-padding shadow-sm" style={{ borderImage: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%) 1' }}>
                <div className="font-semibold mb-2 flex items-center gap-2 text-blue-700"><Sparkles className="w-4 h-4 text-purple-400" />AI 분석 요약</div>
                <div className="text-gray-900 mb-3 text-base font-light">{aiResult.summary}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {aiResult.keywords && aiResult.keywords.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-medium">{kw}</span>
                  ))}
                  {aiResult.category && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{aiResult.category}</span>}
                  {aiResult.urgency && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">{aiResult.urgency}</span>}
                  {aiResult.estimatedCost && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{aiResult.estimatedCost}</span>}
                  {aiResult.expectedDuration && <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">{aiResult.expectedDuration}</span>}
                </div>
              </div>
            )}
          </div>
          {/* 이미지 라이트박스 모달 */}
          {report.images && report.images.length > 0 && (
            <Dialog open={showImages} onOpenChange={setShowImages}>
              <DialogContent className="max-w-2xl p-0 bg-black/80 flex flex-col items-center justify-center rounded-2xl border-0 shadow-xl">
                <button
                  className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1"
                  onClick={() => setShowImages(false)}
                  title="닫기"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center justify-center w-full h-[340px]">
                  <img
                    src={report.images[imgIndex]}
                    alt={`첨부 이미지 ${imgIndex + 1}`}
                    className="max-h-[320px] max-w-full rounded-xl object-contain mx-auto bg-gray-100 shadow-lg"
                  />
                </div>
                {report.images.length > 1 && (
                  <div className="flex justify-center gap-2 mt-2">
                    {report.images.map((_, i) => (
                      <button
                        key={i}
                        className={`w-3 h-3 rounded-full ${i === imgIndex ? 'bg-blue-500' : 'bg-gray-300'} border-2 border-white shadow`}
                        onClick={() => setImgIndex(i)}
                        aria-label={`이미지 ${i + 1}번 보기`}
                      />
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-200 mt-2">{imgIndex + 1} / {report.images.length}</div>
              </DialogContent>
            </Dialog>
          )}
          <div className="px-10 pb-10 pt-2 flex justify-end">
            <DialogClose asChild>
              <button className="px-8 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-full hover:from-gray-800 hover:to-gray-900 font-semibold transition-colors text-base shadow">닫기</button>
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
} 