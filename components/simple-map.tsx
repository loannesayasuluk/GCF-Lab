"use client"

import { Separator } from "@/components/ui/separator"
import { Report } from "@/types"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, MapPin, RotateCcw } from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'react-leaflet-markercluster/dist/styles.min.css';

interface SimpleMapProps {
  reports: Report[]
  selectedReport: Report | null
  onReportSelect: (report: Report | null) => void
  currentLocation?: { lat: number; lng: number } | null
}

export default function SimpleMap({ reports, selectedReport, onReportSelect, currentLocation }: SimpleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapType, setMapType] = useState<"leaflet" | "iframe" | "static">("static")
  const [detailCardPos, setDetailCardPos] = useState<{x: number, y: number} | null>(null)
  const [windowSize, setWindowSize] = useState<{width: number, height: number}>({ width: 0, height: 0 })
  const mapRef = useRef<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "심각":
        return "#ef4444"
      case "보통":
        return "#eab308"
      case "경미":
        return "#22c55e"
      default:
        return "#6b7280"
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

  // 정적 지도 생성 (개선된 버전)
  const createStaticMap = () => {
    if (!mapContainerRef.current) return

    const container = mapContainerRef.current
    container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
        position: relative;
        overflow: hidden;
        border-radius: 0 0 8px 8px;
      ">
        <!-- 서울 지역 배경 -->
        <div style="
          position: absolute;
          top: 20%;
          left: 10%;
          width: 80%;
          height: 60%;
          background: rgba(255, 255, 255, 0.3);
          border: 2px solid rgba(34, 197, 94, 0.3);
          border-radius: 20px;
        "></div>
        
        <!-- 한강 -->
        <div style="
          position: absolute;
          top: 45%;
          left: 5%;
          width: 90%;
          height: 8px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8, #3b82f6);
          border-radius: 4px;
          transform: rotate(-2deg);
        "></div>
        
        <!-- 도로망 -->
        <div style="
          position: absolute;
          top: 25%;
          left: 0;
          width: 100%;
          height: 2px;
          background: #e5e7eb;
        "></div>
        <div style="
          position: absolute;
          top: 35%;
          left: 0;
          width: 100%;
          height: 2px;
          background: #e5e7eb;
        "></div>
        <div style="
          position: absolute;
          top: 65%;
          left: 0;
          width: 100%;
          height: 2px;
          background: #e5e7eb;
        "></div>
        <div style="
          position: absolute;
          top: 75%;
          left: 0;
          width: 100%;
          height: 2px;
          background: #e5e7eb;
        "></div>
        
        <!-- 세로 도로 -->
        <div style="
          position: absolute;
          top: 0;
          left: 25%;
          width: 2px;
          height: 100%;
          background: #e5e7eb;
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          background: #e5e7eb;
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 75%;
          width: 2px;
          height: 100%;
          background: #e5e7eb;
        "></div>
        
        <!-- 지역 라벨 -->
        <div style="
          position: absolute;
          top: 15%;
          left: 15%;
          color: #374151;
          font-size: 12px;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
        ">강북구</div>
        
        <div style="
          position: absolute;
          top: 15%;
          right: 15%;
          color: #374151;
          font-size: 12px;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
        ">강동구</div>
        
        <div style="
          position: absolute;
          bottom: 15%;
          left: 15%;
          color: #374151;
          font-size: 12px;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
        ">강서구</div>
        
        <div style="
          position: absolute;
          bottom: 15%;
          right: 15%;
          color: #374151;
          font-size: 12px;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
        ">강남구</div>
        
        <!-- 서울시청 -->
        <div style="
          position: absolute;
          top: 48%;
          left: 48%;
          width: 8px;
          height: 8px;
          background: #1f2937;
          border-radius: 50%;
          border: 2px solid white;
        "></div>
        <div style="
          position: absolute;
          top: 52%;
          left: 45%;
          color: #1f2937;
          font-size: 10px;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.9);
          padding: 1px 4px;
          border-radius: 3px;
        ">서울시청</div>
      </div>
    `

    // 제보 마커 추가 (유형별 색상과 아이콘)
    reports.forEach((report, index) => {
      const marker = document.createElement("div")
      marker.style.cssText = `
        position: absolute;
        width: 32px;
        height: 32px;
        background: ${getSeverityColor(report.severity)};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10;
        top: ${20 + (index % 4) * 15}%;
        left: ${20 + (index % 5) * 15}%;
        transition: all 0.2s ease;
        pointer-events: auto;
      `
      marker.innerHTML = getTypeIcon(report.type)
      marker.title = `${report.title} - ${report.status}`

      marker.addEventListener("click", () => {
        onReportSelect(report)
      })

      marker.addEventListener("mouseenter", () => {
        marker.style.transform = "scale(1.2)"
        marker.style.zIndex = "20"
      })

      marker.addEventListener("mouseleave", () => {
        marker.style.transform = "scale(1)"
        marker.style.zIndex = "10"
      })

      container.appendChild(marker)
    })

    // 현재 위치 마커
    if (currentLocation) {
      const currentMarker = document.createElement("div")
      currentMarker.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
        animation: pulse 2s infinite;
        z-index: 15;
      `
      container.appendChild(currentMarker)

      // CSS 애니메이션 추가
      if (!document.querySelector("#pulse-animation")) {
        const style = document.createElement("style")
        style.id = "pulse-animation"
        style.textContent = `
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
        `
        document.head.appendChild(style)
      }
    }

    setMapReady(true)
    setMapType("static")
  }

  // Leaflet 지도 초기화
  const createLeafletMap = async () => {
    if (!mapContainerRef.current) return
    // 기존 map 인스턴스와 leaflet-container 클래스 완전 제거
    if (mapRef.current && mapRef.current.remove) {
      mapRef.current.remove()
      mapRef.current = null
    }
    mapContainerRef.current.className = ""
    mapContainerRef.current.innerHTML = ""

    try {
      // Leaflet CSS 로드
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Leaflet JS 로드
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"

      return new Promise((resolve, reject) => {
        // 타임아웃 설정 (10초)
        const timeout = setTimeout(() => {
          reject(new Error("Leaflet 로딩 타임아웃"))
        }, 10000)

        script.onload = () => {
          clearTimeout(timeout)
          setTimeout(() => {
            try {
              const L = (window as any).L
              if (!L) throw new Error("Leaflet not loaded")

              const map = L.map(mapContainerRef.current, {
                center: [37.5665, 126.978],
                zoom: 11,
                zoomControl: true,
              })
              mapRef.current = map

              L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
                maxZoom: 19,
              }).addTo(map)

              // 유형별 마커 추가
              reports.forEach((report) => {
                const customIcon = L.divIcon({
                  html: `
                    <div style="
                      background-color: ${getSeverityColor(report.severity)};
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      border: 3px solid white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 16px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      cursor: pointer;
                    ">
                      ${getTypeIcon(report.type)}
                    </div>
                  `,
                  className: "custom-marker",
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })

                const marker = L.marker([report.coordinates.lat, report.coordinates.lng], {
                  icon: customIcon,
                }).addTo(map)

                marker.on("click", (e: any) => {
                  handleMarkerClick(report, e)
                })
              })

              // 현재 위치 마커
              if (currentLocation) {
                const currentLocationIcon = L.divIcon({
                  html: `
                    <div style="
                      background-color: #3b82f6;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      border: 3px solid white;
                      box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
                      animation: pulse 2s infinite;
                    "></div>
                  `,
                  className: "current-location-marker",
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })

                L.marker([currentLocation.lat, currentLocation.lng], {
                  icon: currentLocationIcon,
                })
                  .addTo(map)
                  .bindTooltip("현재 위치", {
                    permanent: false,
                    direction: "top",
                  })
              }

              // setMapReady는 initializeMap에서 호출되므로 여기서는 제거
              resolve(map)
            } catch (error) {
              reject(error)
            }
          }, 500)
        }

        script.onerror = () => {
          clearTimeout(timeout)
          reject(new Error("Failed to load Leaflet"))
        }
        document.head.appendChild(script)
      })
    } catch (error) {
      throw error
    }
  }

  // 지도 초기화 (정적 지도 우선, Leaflet 백그라운드 로드)
  const initializeMap = async () => {
    setMapReady(false)

    // 방법 1: 정적 지도 즉시 로드 (항상 성공)
    try {
      createStaticMap()
      setMapType("static")
      setMapReady(true)
      console.log("정적 지도 로드 성공")
    } catch (error) {
      console.error("정적 지도 실패:", error)
      // 최후의 수단: 기본 정적 지도라도 표시
      setMapType("static")
      setMapReady(true)
    }

    // 방법 2: Leaflet 백그라운드에서 로드 시도
    try {
      await createLeafletMap()
      setMapType("leaflet")
      console.log("Leaflet 지도 로드 성공")
    } catch (error) {
      console.warn("Leaflet 지도 실패:", error)
      // Leaflet 실패해도 정적 지도는 이미 로드되어 있음
    }
  }

  // 내 위치로 이동하는 함수 개선
  const handleMoveToCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (mapType === "leaflet" && mapRef.current) {
            const L = (window as any).L
            if (L && mapRef.current.setView) {
              mapRef.current.setView([latitude, longitude], 15, { animate: true, duration: 1.0 })
              // 마커도 갱신
              if (mapRef.current._currentLocationMarker) {
                mapRef.current.removeLayer(mapRef.current._currentLocationMarker)
              }
              const currentLocationIcon = L.divIcon({
                html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); animation: pulse 2s infinite;"></div>`,
                className: "current-location-marker",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })
              const marker = L.marker([latitude, longitude], { icon: currentLocationIcon }).addTo(mapRef.current)
              marker.bindTooltip("현재 위치", { permanent: false, direction: "top" })
              mapRef.current._currentLocationMarker = marker
            }
          }
        },
        (error) => {
          alert("현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.")
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      alert("이 브라우저는 위치 정보를 지원하지 않습니다.")
    }
  }

  // 화면 크기 추적
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 마커 클릭 시 상세 안내 카드 위치 계산 (Leaflet) - 화면 밖 나가기 방지 개선
  const handleMarkerClick = (report: Report, e?: any) => {
    if (typeof onReportSelect === 'function') {
      onReportSelect(report)
    }
    if (windowSize.width < 640) {
      setDetailCardPos(null)
      return
    }
    if (e && e.latlng && mapContainerRef.current) {
      // 지도 위 좌표(LatLng)를 픽셀 좌표로 변환
      const L = (window as any).L
      const map = L && L.Map && L.Map._instances && L.Map._instances[0]
      if (map && map.project) {
        const point = map.latLngToContainerPoint(e.latlng)
        const containerRect = mapContainerRef.current.getBoundingClientRect()
        
        // 카드 크기 (실제 렌더링 크기 고려)
        const cardWidth = Math.min(400, windowSize.width * 0.8) // 화면 너비의 80% 제한
        const cardHeight = Math.min(400, windowSize.height * 0.6) // 화면 높이의 60% 제한
        const margin = 16
        
        // 초기 위치 (마커 우상단)
        let x = point.x + margin
        let y = point.y - margin
        
        // 오른쪽 경계 체크 - 카드가 화면을 벗어나면 마커 왼쪽에 배치
        if (x + cardWidth > containerRect.width - margin) {
          x = point.x - cardWidth - margin
        }
        
        // 위쪽 경계 체크 - 카드가 화면 위로 나가면 마커 아래쪽에 배치
        if (y < margin) {
          y = point.y + margin
        }
        
        // 아래쪽 경계 체크 - 카드가 화면 아래로 나가면 위쪽으로 조정
        if (y + cardHeight > containerRect.height - margin) {
          y = containerRect.height - cardHeight - margin
        }
        
        // 왼쪽 경계 체크 - 카드가 화면 왼쪽으로 나가면 오른쪽으로 조정
        if (x < margin) {
          x = margin
        }
        
        // 최종 위치가 여전히 화면 밖이면 중앙에 배치
        if (x < 0 || y < 0 || x + cardWidth > containerRect.width || y + cardHeight > containerRect.height) {
          x = (containerRect.width - cardWidth) / 2
          y = (containerRect.height - cardHeight) / 2
        }
        
        setDetailCardPos({ x, y })
        return
      }
    }
    setDetailCardPos(null)
  }

  // 상세 안내 닫기
  const closeDetailCard = () => {
    onReportSelect(null)
    setDetailCardPos(null)
  }

  // 컴포넌트 마운트시 지도 초기화
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 제보 데이터 변경시 지도 업데이트
  useEffect(() => {
    if (mapReady && mapType === "static") {
      createStaticMap()
    }
  }, [reports, mapReady, mapType])

  // 3) getDetailCardPosition에서 detailCardPos를 사용해 카드 위치 지정
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

  useEffect(() => {
    // 지도 인스턴스 및 leaflet-container 완전 제거
    if (mapRef.current && mapRef.current.remove) {
      mapRef.current.remove()
      mapRef.current = null
    }
    if (mapContainerRef.current) {
      mapContainerRef.current.className = ""
      mapContainerRef.current.innerHTML = ""
    }
    if (!mapContainerRef.current) return
    if (mapType === "leaflet") {
      createLeafletMap()
    } else {
      createStaticMap()
    }
    // selectedReport, detailCardPos 등은 의존성에서 제외
  }, [mapType, reports])

  // selectedReport가 바뀔 때마다 AI 분석 결과/로딩 초기화
  useEffect(() => {
    setAiResult(null);
    setAiLoading(false);
  }, [selectedReport]);

  // AI 분석 결과를 제보 유형에 따라 동적으로 생성
  function getDynamicAIResult(report) {
    switch (report.type) {
      case 'waste':
        return {
          summary: 'AI가 분석한 결과, 해당 지역의 폐기물 불법투기가 심각하며 신속한 수거 및 단속이 필요합니다.',
          insights: ['최근 1개월간 유사 제보 2건', '불법투기 발생 빈도 증가'],
          recommendations: ['즉각적인 수거 조치', '불법투기 단속 강화', '주민 대상 계도 활동']
        };
      case 'air':
        return {
          summary: 'AI가 분석한 결과, 해당 지역의 대기오염이 심각하며 신속한 조치가 필요합니다.',
          insights: ['최근 1개월간 유사 제보 3건', '심각도 높은 제보 비율 60%'],
          recommendations: ['즉각적인 현장 점검', '주민 대상 안내문 발송']
        };
      case 'water':
        return {
          summary: 'AI가 분석한 결과, 해당 지역의 수질오염이 우려되며 정밀 조사가 필요합니다.',
          insights: ['최근 1개월간 수질오염 제보 1건', '주변 하천 오염도 증가'],
          recommendations: ['수질 정밀 조사', '오염원 추적 및 차단']
        };
      case 'noise':
        return {
          summary: 'AI가 분석한 결과, 해당 지역의 소음 민원이 증가하고 있습니다. 신속한 현장 점검이 필요합니다.',
          insights: ['최근 1개월간 소음 관련 제보 4건', '야간 소음 빈도 증가'],
          recommendations: ['현장 소음 측정', '공사장/사업장 점검', '주민 안내문 발송']
        };
      default:
        return {
          summary: 'AI가 분석한 결과, 해당 지역의 환경 문제가 지속적으로 제기되고 있습니다.',
          insights: ['최근 유사 제보 다수', '문제 해결 필요'],
          recommendations: ['현장 점검', '관계 기관 협조 요청']
        };
    }
  }

  async function handleAIAnalysis(report: Report) {
    setAiLoading(true)
    setAiResult(null)
    // 실제 AI 분석 API 호출 또는 시뮬레이션
    await new Promise(res => setTimeout(res, 1200))
    setAiResult(getDynamicAIResult(report))
    setAiLoading(false)
  }

  return (
    <div className="relative h-full w-full">
      {/* 지도 컨테이너 (z-index: 0) */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: 500, minWidth: 300, zIndex: 0, position: 'relative' }} />

      {/* 로딩 상태 */}
      {!mapReady && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-b-lg z-[2000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600">지도를 불러오는 중...</p>
            <p className="text-sm text-gray-500 mt-1">서울시 환경 모니터링 지도</p>
          </div>
        </div>
      )}

      {/* 범례 - 오른쪽 하단 (z-index 조정) */}
      {mapReady && (
        <div className="hidden md:fixed md:bottom-4 md:right-4 md:bg-white md:p-3 md:rounded-lg md:shadow-lg md:z-[1050] md:border md:max-w-xs md:block absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1050] border max-w-xs sm:absolute sm:bottom-4 sm:right-4 sm:bg-white sm:p-3 sm:rounded-lg sm:shadow-lg sm:z-[1050] sm:border sm:max-w-xs">
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
          <Separator className="my-2" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🗑️</span>
              <span className="text-xs">폐기물</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">💨</span>
              <span className="text-xs">대기오염</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">💧</span>
              <span className="text-xs">수질오염</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🔊</span>
              <span className="text-xs">소음</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-gray-500">
            지도: {mapType === "leaflet" ? "Leaflet" : "정적 지도"}
          </div>
        </div>
      )}

      {/* 내 위치 버튼 - PC/모바일 완전 분리 */}
      {mapReady && (
        <>
          {/* PC: 오른쪽 상단 */}
          <button
            className="hidden md:block fixed top-4 right-4 w-12 h-12 rounded-full bg-white border shadow-lg hover:bg-blue-50 flex items-center justify-center z-[2000] transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.10)' }}
            onClick={handleMoveToCurrentLocation}
            aria-label="내 위치로 이동"
          >
            <MapPin className="h-6 w-6 text-blue-600" />
          </button>
          {/* 모바일: 오른쪽 하단 */}
          <button
            className="block md:hidden fixed bottom-24 right-4 w-16 h-16 rounded-full bg-white shadow-xl border flex flex-col items-center justify-center z-[1100] active:scale-95 transition-transform"
            style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.10)' }}
            onClick={handleMoveToCurrentLocation}
            aria-label="내 위치로 이동"
          >
            <MapPin className="h-6 w-6 text-blue-600" />
          </button>
        </>
      )}

      {/* 세부내용 카드: 항상 화면 중앙, 잘리지 않게, 정보 중복/정렬/라벨/스타일/반응형 개선 */}
      {selectedReport && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[3000] px-2"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-md w-full animate-fade-in flex flex-col gap-4"
            style={{ pointerEvents: 'auto', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* 상단: 아이콘, 제목, 상태, 닫기 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getTypeIcon(selectedReport.type)}</span>
                <span className="font-bold text-xl text-gray-900">{selectedReport.title}</span>
                <Badge className={getStatusColor(selectedReport.status)}>{selectedReport.status}</Badge>
              </div>
              <button
                className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={closeDetailCard}
                aria-label="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 주요 정보: 각 항목을 줄바꿈/구분해서 가독성 및 여백 개선 */}
            <div className="flex flex-col gap-2 text-sm text-gray-700 mb-4 px-1">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /><span className="font-medium">{selectedReport.location}</span></div>
              <div className="flex items-center gap-2"><span className="font-medium">제보자:</span> {selectedReport.reporter}</div>
              <div className="flex items-center gap-2"><span className="font-medium">일자:</span> {selectedReport.date}</div>
              <div className="flex items-center gap-2"><span className="font-medium">유형:</span> {getTypeLabel(selectedReport.type)}</div>
              <div className="flex items-center gap-2"><span className="font-medium">심각도:</span> {selectedReport.severity}</div>
              {selectedReport.assignedTo && (
                <div className="flex items-center gap-2"><span className="font-medium">담당자:</span> {selectedReport.assignedTo}</div>
              )}
              {selectedReport.resolvedDate && (
                <div className="flex items-center gap-2"><span className="font-medium text-green-700">해결일:</span> {selectedReport.resolvedDate}</div>
              )}
            </div>

            {/* 상세 설명 */}
            <div className="bg-gray-50 rounded-lg p-3 text-gray-800 text-base max-h-32 overflow-y-auto border mb-4">
              {selectedReport.description}
            </div>

            {/* 처리 노트 */}
            {selectedReport.processingNotes && (
              <div className="bg-orange-50 rounded-lg p-3 text-orange-800 text-sm border-l-4 border-orange-200 mb-2">
                <span className="font-semibold mr-2">처리 노트:</span>{selectedReport.processingNotes}
              </div>
            )}
            {/* 해결 보고서 */}
            {selectedReport.resolutionReport && (
              <div className="bg-green-50 rounded-lg p-3 text-green-800 text-sm border-l-4 border-green-200 mb-2">
                <span className="font-semibold mr-2">해결 보고서:</span>{selectedReport.resolutionReport}
              </div>
            )}
            {/* 첨부 이미지 */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold text-gray-700 mb-1">첨부 이미지</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedReport.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`제보 이미지 ${idx + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI 분석 */}
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2 rounded-lg shadow hover:from-blue-600 hover:to-purple-600"
                onClick={() => handleAIAnalysis(selectedReport)}
                disabled={aiLoading}
              >
                {aiLoading ? 'AI 분석 중...' : 'AI 분석 실행'}
              </Button>
              {aiResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-1 text-sm text-blue-900 animate-fade-in">
                  <div className="font-bold mb-2">AI 분석 결과</div>
                  <div className="mb-2">{aiResult.summary}</div>
                  {aiResult.insights && aiResult.insights.length > 0 && (
                    <ul className="list-disc pl-5 mb-2 space-y-1">
                      {aiResult.insights.map((insight: string, idx: number) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  )}
                  {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold mb-1">추천 조치</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {aiResult.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'waste': return '폐기물';
    case 'air': return '대기오염';
    case 'water': return '수질오염';
    case 'noise': return '소음';
    default: return type;
  }
}