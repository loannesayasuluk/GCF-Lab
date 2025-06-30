"use client"

import { useLayoutEffect, useRef, useState, useEffect } from "react"
import { Report } from "@/types"
import dynamic from "next/dynamic"
import { MapContainer as RLMapContainer, TileLayer as RLTileLayer, Marker as RLMarkerBase, Popup, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Tooltip } from "react-leaflet"

// 전역 타입 선언
declare global {
  interface Window {
    leafletMapInstance?: L.Map | null
  }
}

export interface SimpleMapProps {
  reports: Report[]
  onReportSelect: (report: Report | null) => void
  selectedReport: Report | null
  currentLocation?: { lat: number; lng: number } | null
  isDialogOpen?: boolean
}

const CATEGORY_STYLES = {
  '쓰레기': { color: 'red', icon: '🗑️' },
  '소음': { color: 'blue', icon: '🔊' },
  '기타': { color: 'gray', icon: '❓' },
  // ...서비스 전체 연동용 분류 추가
};

// Report 타입에 category, summary가 없다는 에러 해결 (타입 보강)
type ReportWithCategory = Report & { category?: string; summary?: string };

const RLMarker = RLMarkerBase as any;

const CustomMarker = ({ report, onClick, isSelected, color, icon, ariaLabel }: { report: ReportWithCategory; onClick: () => void; isSelected: boolean; color: string; icon: string; ariaLabel: string }) => {
  const customIcon = L.divIcon({
    html: `
      <div style="
        width: 38px;
        height: 38px;
        background: #fff;
        border: ${isSelected ? '5px' : '3px'} solid ${color};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3em;
        transition: transform 0.15s, border-width 0.15s;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
      ">
        ${icon}
      </div>
    `,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
  return (
    <RLMarker
      position={[report.coordinates.lat, report.coordinates.lng]}
      icon={customIcon as any}
      eventHandlers={{ click: onClick }}
      aria-label={ariaLabel}
    >
      <Tooltip>{report.summary || report.category}</Tooltip>
    </RLMarker>
  );
}

const MyLocationMarker = ({ position }: { position: { lat: number; lng: number } }) => {
  const icon = L.divIcon({
    html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>`,
    className: 'current-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
  return <RLMarker position={[position.lat, position.lng]} icon={icon as any} {...({} as any)} />
}

function MapEvents({ onReportSelect }: { onReportSelect: (r: Report | null) => void }) {
  useMapEvents({ click: () => onReportSelect(null) })
  return null
}

// MapContainer를 래핑하여 초기화 문제 방지
const SafeMapContainer = (props: any) => {
  const { children, isDialogOpen, ...restProps } = props;
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 이미 맵이 생성되어 있으면 아무것도 하지 않음
    if (window.leafletMapInstance) {
      return;
    }
    // 컨테이너에 이미 맵이 있는지 확인하고 제거
    if (containerRef.current) {
      const existingMap = containerRef.current.querySelector('.leaflet-container')
      if (existingMap) {
        console.log("[지도 디버그] 기존 맵 컨테이너 발견, 제거 중...")
        existingMap.remove()
      }
    }
    setIsInitialized(true)
    return () => {
      if (mapRef.current) {
        try {
          console.log("[지도 디버그] 맵 인스턴스 정리 중...")
          mapRef.current.remove()
        } catch (e) {
          console.warn("[지도 디버그] 맵 인스턴스 정리 실패:", e)
        }
        mapRef.current = null
        window.leafletMapInstance = null
      }
      setIsInitialized(false)
    }
  }, [])

  if (!isInitialized) {
    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }} className="relative">
      <RLMapContainer
        {...restProps}
        ref={(map) => {
          if (map) {
            mapRef.current = map
            window.leafletMapInstance = map
            console.log("[지도 디버그] 맵 인스턴스 생성됨")
          }
        }}
      >
        {children}
      </RLMapContainer>
      {/* 지도 위 오버레이 (다이얼로그가 열릴 때만) */}
      {isDialogOpen && (
        <div className="absolute inset-0 pointer-events-none bg-transparent backdrop-blur-lg z-[1200]" />
      )}
    </div>
  )
}

export default function SimpleMap({ reports, onReportSelect, selectedReport, currentLocation, isDialogOpen }: SimpleMapProps) {
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.978])
  const [mapZoom, setMapZoom] = useState(11)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.lat, currentLocation.lng])
      setMapZoom(15)
    }
  }, [currentLocation])

  // 커스텀 내 위치 버튼에서 참조할 수 있도록 내부에 선언
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 확인이 지원되지 않습니다.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setMapCenter([pos.coords.latitude, pos.coords.longitude])
        setMapZoom(15)
      },
      (err) => {
        alert("위치 정보를 가져올 수 없습니다: " + err.message)
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="map-root-container relative w-full h-full">
      <SafeMapContainer
        reports={reports}
        onReportSelect={onReportSelect}
        selectedReport={selectedReport}
        currentLocation={currentLocation}
        isDialogOpen={isDialogOpen}
        center={mapCenter}
        zoom={mapZoom}
      >
        <RLTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {reports.map((report) => {
          const r = report as ReportWithCategory;
          const style = CATEGORY_STYLES[r.category || '기타'];
          return (
            <CustomMarker
              key={r.id}
              report={r}
              onClick={() => onReportSelect(r)}
              isSelected={selectedReport?.id === r.id}
              color={style.color}
              icon={style.icon}
              ariaLabel={`제보: ${r.category}, ${r.summary || ''}`}
            />
          );
        })}
        {myLocation && <MyLocationMarker position={myLocation} />}
        <MapEvents onReportSelect={onReportSelect} />
      </SafeMapContainer>
    </div>
  )
}