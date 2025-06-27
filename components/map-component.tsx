"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, MapPin, RotateCcw } from "lucide-react"

interface Report {
  id: number
  title: string
  location: string
  type: string
  severity: string
  reporter: string
  date: string
  status: string
  description: string
  coordinates: { lat: number; lng: number }
  images?: string[]
  aiAnalysis?: {
    keywords: string[]
    category: string
    urgency: string
    estimatedCost: string
    expectedDuration: string
  }
  assignedTo?: string
  processingNotes?: string
  resolvedDate?: string
  resolutionReport?: string
}

interface MapComponentProps {
  reports: Report[]
  selectedReport: Report | null
  onReportSelect: (report: Report | null) => void
  currentLocation?: { lat: number; lng: number } | null
}

export default function MapComponent({ reports, selectedReport, onReportSelect, currentLocation }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const currentLocationMarkerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [loadingMethod, setLoadingMethod] = useState("Leaflet")

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "#ef4444"
      case "medium":
        return "#eab308"
      case "low":
        return "#22c55e"
      default:
        return "#6b7280"
    }
  }

  const getStatusColor = (status: string) => {
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

  const getTypeIcon = (type: string) => {
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

  // 방법 1: Leaflet 지도 초기화
  const initLeafletMap = () => {
    return new Promise((resolve, reject) => {
      if (!mapRef.current) {
        reject(new Error("Map container not found"))
        return
      }

      // 기존 지도 제거
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Leaflet CSS 로드
      const existingLink = document.querySelector('link[href*="leaflet"]')
      if (!existingLink) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }

      // Leaflet JS 로드
      const existingScript = document.querySelector('script[src*="leaflet"]')
      if (!existingScript) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""

        script.onload = () => {
          setTimeout(() => {
            try {
              const L = (window as any).L
              if (!L) {
                reject(new Error("Leaflet not loaded"))
                return
              }

              // 기본 아이콘 설정
              delete (L.Icon.Default.prototype as any)._getIconUrl
              L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
              })

              // 지도 생성
              const map = L.map(mapRef.current, {
                center: [37.5665, 126.978],
                zoom: 11,
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                dragging: true,
              })

              // 타일 레이어 추가 (여러 백업 옵션)
              const tileUrls = [
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
                "https://tiles.wmflabs.org/osm/{z}/{x}/{y}.png",
              ]

              let tileLayerAdded = false
              for (const url of tileUrls) {
                try {
                  L.tileLayer(url, {
                    attribution: "© OpenStreetMap contributors",
                    maxZoom: 19,
                  }).addTo(map)
                  tileLayerAdded = true
                  break
                } catch (e) {
                  console.warn(`Failed to load tiles from ${url}`)
                }
              }

              if (!tileLayerAdded) {
                reject(new Error("Failed to load map tiles"))
                return
              }

              mapInstanceRef.current = map
              resolve(map)
            } catch (error) {
              reject(error)
            }
          }, 100)
        }

        script.onerror = () => {
          reject(new Error("Failed to load Leaflet script"))
        }

        document.head.appendChild(script)
      } else {
        // 이미 로드된 경우
        setTimeout(() => {
          try {
            const L = (window as any).L
            if (!L) {
              reject(new Error("Leaflet not available"))
              return
            }

            const map = L.map(mapRef.current, {
              center: [37.5665, 126.978],
              zoom: 11,
            })

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
              maxZoom: 19,
            }).addTo(map)

            mapInstanceRef.current = map
            resolve(map)
          } catch (error) {
            reject(error)
          }
        }, 100)
      }
    })
  }

  // 방법 2: Google Maps 초기화
  const initGoogleMap = () => {
    return new Promise((resolve, reject) => {
      if (!mapRef.current) {
        reject(new Error("Map container not found"))
        return
      }

      // Google Maps API 로드
      const script = document.createElement("script")
      script.src = "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"
      script.async = true
      script.defer = true(window as any).initMap = () => {
        try {
          const map = new (window as any).google.maps.Map(mapRef.current, {
            center: { lat: 37.5665, lng: 126.978 },
            zoom: 11,
          })
          mapInstanceRef.current = map
          resolve(map)
        } catch (error) {
          reject(error)
        }
      }

      script.onerror = () => {
        reject(new Error("Failed to load Google Maps"))
      }

      document.head.appendChild(script)
    })
  }

  // 방법 3: 대체 지도 (Canvas 기반)
  const initFallbackMap = () => {
    return new Promise((resolve) => {
      if (!mapRef.current) return

      // Canvas 기반 대체 지도 생성
      const canvas = document.createElement("canvas")
      canvas.width = mapRef.current.offsetWidth
      canvas.height = mapRef.current.offsetHeight
      canvas.style.width = "100%"
      canvas.style.height = "100%"
      canvas.style.cursor = "grab"

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // 서울 지역 그리기
      ctx.fillStyle = "#f0f9ff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 한강 그리기
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.moveTo(50, canvas.height * 0.5)
      ctx.quadraticCurveTo(canvas.width * 0.3, canvas.height * 0.45, canvas.width * 0.5, canvas.height * 0.52)
      ctx.quadraticCurveTo(canvas.width * 0.7, canvas.height * 0.55, canvas.width - 50, canvas.height * 0.57)
      ctx.stroke()

      // 도로망 그리기
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 2
      for (let i = 1; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(0, (canvas.height / 5) * i)
        ctx.lineTo(canvas.width, (canvas.height / 5) * i)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo((canvas.width / 5) * i, 0)
        ctx.lineTo((canvas.width / 5) * i, canvas.height)
        ctx.stroke()
      }

      // 구역 표시
      ctx.fillStyle = "rgba(34, 197, 94, 0.1)"
      ctx.strokeStyle = "rgba(34, 197, 94, 0.3)"
      ctx.lineWidth = 1

      const districts = [
        { x: 50, y: 50, w: 150, h: 120 },
        { x: 250, y: 80, w: 120, h: 100 },
        { x: 450, y: 60, w: 140, h: 110 },
        { x: 100, y: canvas.height - 180, w: 160, h: 130 },
        { x: 350, y: canvas.height - 150, w: 130, h: 120 },
      ]

      districts.forEach((district) => {
        ctx.fillRect(district.x, district.y, district.w, district.h)
        ctx.strokeRect(district.x, district.y, district.w, district.h)
      })

      // 지도 제목
      ctx.fillStyle = "#374151"
      ctx.font = "16px Arial"
      ctx.fillText("서울시 환경 모니터링 지도", 20, 30)

      mapRef.current.innerHTML = ""
      mapRef.current.appendChild(canvas)

      // 가상의 지도 객체 생성
      const fallbackMap = {
        type: "fallback",
        canvas: canvas,
        addMarker: (lat: number, lng: number, options: any) => {
          // 좌표를 캔버스 좌표로 변환
          const x = ((lng - 126.8) / 0.4) * canvas.width
          const y = ((37.7 - lat) / 0.3) * canvas.height

          // 마커 그리기
          ctx.fillStyle = options.color || "#ef4444"
          ctx.beginPath()
          ctx.arc(x, y, 8, 0, 2 * Math.PI)
          ctx.fill()

          ctx.fillStyle = "white"
          ctx.font = "12px Arial"
          ctx.textAlign = "center"
          ctx.fillText(options.icon || "📍", x, y + 4)
        },
      }

      mapInstanceRef.current = fallbackMap
      resolve(fallbackMap)
    })
  }

  // 지도 초기화 (여러 방법 시도)
  const initializeMap = async () => {
    setMapLoaded(false)
    setMapError(false)

    const methods = [
      { name: "Leaflet", init: initLeafletMap },
      { name: "Fallback", init: initFallbackMap },
    ]

    for (const method of methods) {
      try {
        setLoadingMethod(method.name)
        console.log(`Trying ${method.name} map...`)

        await method.init()
        setMapLoaded(true)
        console.log(`${method.name} map loaded successfully`)
        return
      } catch (error) {
        console.error(`${method.name} map failed:`, error)
      }
    }

    setMapError(true)
    console.error("All map initialization methods failed")
  }

  // 마커 추가/업데이트
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !mapLoaded) return

    // Leaflet 지도인 경우
    if (mapInstanceRef.current.type !== "fallback") {
      const L = (window as any).L
      if (!L) return

      // 기존 마커 제거
      markersRef.current.forEach((marker) => {
        mapInstanceRef.current.removeLayer(marker)
      })
      markersRef.current = []

      // 새 마커 추가
      reports.forEach((report) => {
        try {
          const customIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${getSeverityColor(report.severity)};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: pointer;
              ">
                ${getTypeIcon(report.type)}
              </div>
            `,
            className: "custom-marker",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })

          const marker = L.marker([report.coordinates.lat, report.coordinates.lng], {
            icon: customIcon,
          }).addTo(mapInstanceRef.current)

          marker.on("click", () => {
            onReportSelect(report)
            mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 15)
          })

          marker.bindTooltip(
            `<div style="text-align: center;">
              <strong>${report.title}</strong><br>
              ${report.location}<br>
              <span style="color: ${getSeverityColor(report.severity)};">●</span> ${report.status}
            </div>`,
            {
              permanent: false,
              direction: "top",
              offset: [0, -10],
            },
          )

          markersRef.current.push(marker)
        } catch (error) {
          console.error("마커 생성 오류:", error)
        }
      })
    } else {
      // Fallback 지도인 경우
      reports.forEach((report) => {
        mapInstanceRef.current.addMarker(report.coordinates.lat, report.coordinates.lng, {
          color: getSeverityColor(report.severity),
          icon: getTypeIcon(report.type),
        })
      })
    }
  }

  // 현재 위치 마커 업데이트
  const updateCurrentLocationMarker = () => {
    if (!mapInstanceRef.current || !mapLoaded || !currentLocation) return

    if (mapInstanceRef.current.type !== "fallback") {
      const L = (window as any).L
      if (!L) return

      // 기존 현재 위치 마커 제거
      if (currentLocationMarkerRef.current) {
        mapInstanceRef.current.removeLayer(currentLocationMarkerRef.current)
      }

      try {
        const currentLocationIcon = L.divIcon({
          html: `
            <div style="
              background-color: #3b82f6;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
              animation: pulse 2s infinite;
            "></div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>
          `,
          className: "current-location-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const marker = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: currentLocationIcon,
        }).addTo(mapInstanceRef.current)

        marker.bindTooltip("현재 위치", {
          permanent: false,
          direction: "top",
        })

        currentLocationMarkerRef.current = marker
      } catch (error) {
        console.error("현재 위치 마커 생성 오류:", error)
      }
    }
  }

  // 내 위치로 이동
  const moveToCurrentLocation = () => {
    if (currentLocation && mapInstanceRef.current && mapInstanceRef.current.type !== "fallback") {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 15)
    } else {
      // GPS 위치 가져오기
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            if (mapInstanceRef.current && mapInstanceRef.current.type !== "fallback") {
              mapInstanceRef.current.setView([latitude, longitude], 15)
            }
          },
          (error) => {
            console.error("위치 정보를 가져올 수 없습니다:", error)
            alert("위치 정보를 가져올 수 없습니다. 브라우저 설정을 확인해주세요.")
          },
        )
      }
    }
  }

  // 지도 재시도
  const retryMap = () => {
    initializeMap()
  }

  // 초기 지도 로드
  useEffect(() => {
    initializeMap()

    return () => {
      if (mapInstanceRef.current && mapInstanceRef.current.type !== "fallback") {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn("Map cleanup error:", e)
        }
      }
      mapInstanceRef.current = null
      setMapLoaded(false)
    }
  }, [])

  // 마커 업데이트
  useEffect(() => {
    if (mapLoaded) {
      updateMarkers()
    }
  }, [reports, mapLoaded, onReportSelect])

  // 현재 위치 마커 업데이트
  useEffect(() => {
    if (mapLoaded) {
      updateCurrentLocationMarker()
    }
  }, [currentLocation, mapLoaded])

  return (
    <div className="w-full max-w-none lg:max-w-screen-2xl mx-auto px-4 sm:px-10 lg:px-16 py-4 space-y-4 overflow-x-hidden">
      <div ref={mapRef} className="relative h-full">
        <div className="h-full w-full rounded-b-lg bg-gray-100" />

        {/* 로딩 상태 */}
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-b-lg z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-gray-600">지도를 불러오는 중...</p>
              <p className="text-sm text-gray-500 mt-1">{loadingMethod} 방식 시도 중</p>
            </div>
          </div>
        )}

        {/* 오류 상태 */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-b-lg z-10">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-gray-600 mb-2">지도를 불러올 수 없습니다</p>
              <Button onClick={retryMap} size="sm" className="bg-green-600 hover:bg-green-700">
                <RotateCcw className="h-4 w-4 mr-1" />
                다시 시도
              </Button>
            </div>
          </div>
        )}

        {/* 범례 - 오른쪽 하단으로 이동 */}
        {mapLoaded && (
          <div
            className="absolute bottom-4 right-4 sm:bottom-4 sm:right-4"
          >
            {/* 모바일: 내 위치 버튼과 겹치지 않게 right-24, bottom-6 등으로 위치 조정, 크기/여백 확대 */}
            <div className="sm:hidden fixed bottom-6 right-24 bg-white p-4 rounded-xl shadow-xl z-[1000] border flex flex-col gap-2 min-w-[120px]">
              <h4 className="text-sm font-bold mb-2">범례</h4>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm">심각</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm">보통</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm">경미</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                <span className="text-sm">내 위치</span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-2 text-xs"><span className="">🗑️</span>폐기물</div>
                <div className="flex items-center gap-2 text-xs"><span className="">💨</span>대기오염</div>
                <div className="flex items-center gap-2 text-xs"><span className="">💧</span>수질오염</div>
                <div className="flex items-center gap-2 text-xs"><span className="">🔊</span>소음</div>
              </div>
            </div>
            {/* PC: 기존 범례 스타일 유지 */}
            <div className="hidden sm:block bg-white p-3 rounded-lg shadow-lg z-[1000] border">
              <h4 className="text-sm font-medium mb-2">범례</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs">심각</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">보통</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">경미</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-xs">내 위치</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 선택된 제보 정보 */}
        {selectedReport && (
          <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm max-h-96 overflow-y-auto z-[1000] border">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium">{selectedReport.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => onReportSelect(null)} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">{selectedReport.location}</p>
              <p className="text-sm">{selectedReport.description}</p>

              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="mt-2">
                  <img
                    src={selectedReport.images[0] || "/placeholder.svg?height=200&width=300"}
                    alt="제보 사진"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}

              {selectedReport.aiAnalysis && (
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">AI 분석 결과</h4>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedReport.aiAnalysis.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>카테고리: {selectedReport.aiAnalysis.category}</p>
                    <p>긴급도: {selectedReport.aiAnalysis.urgency}</p>
                    <p>예상 비용: {selectedReport.aiAnalysis.estimatedCost}</p>
                    <p>예상 기간: {selectedReport.aiAnalysis.expectedDuration}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <Badge className={getStatusColor(selectedReport.status)}>{selectedReport.status}</Badge>
                <span className="text-xs text-gray-500">제보자: {selectedReport.reporter}</span>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                <p>제보일: {selectedReport.date}</p>
                {selectedReport.assignedTo && <p>담당자: {selectedReport.assignedTo}</p>}
                {selectedReport.resolvedDate && <p>해결일: {selectedReport.resolvedDate}</p>}
              </div>

              {selectedReport.processingNotes && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <h4 className="text-sm font-medium mb-1">처리 현황</h4>
                  <p className="text-xs text-gray-700">{selectedReport.processingNotes}</p>
                </div>
              )}

              {selectedReport.resolutionReport && (
                <div className="mt-2 p-2 bg-green-50 rounded">
                  <h4 className="text-sm font-medium text-green-800 mb-1">해결 보고서</h4>
                  <p className="text-xs text-green-700">{selectedReport.resolutionReport}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 내 위치 버튼 */}
        {mapLoaded && (
          <>
            {/* PC: 지도 상단 오른쪽 */}
            <div className="absolute top-4 right-4 z-[1000] hidden sm:block">
              <Button variant="outline" size="sm" className="bg-white shadow-md" onClick={moveToCurrentLocation}>
                <MapPin className="h-4 w-4 mr-1" />내 위치
              </Button>
            </div>
            {/* 모바일: 지도 오른쪽 하단, 범례 위에만 고정 */}
            <button
              onClick={moveToCurrentLocation}
              className="fixed sm:hidden bottom-24 right-4 w-16 h-16 rounded-full bg-white shadow-xl border flex flex-col items-center justify-center z-[1100] active:scale-95 transition-transform"
              style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.13)' }}
              aria-label="내 위치로 이동"
            >
              <MapPin className="h-8 w-8 text-blue-600 mb-1" />
              <span className="text-[12px] text-gray-700">내 위치</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
