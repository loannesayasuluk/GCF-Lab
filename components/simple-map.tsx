"use client"

import React, { useEffect, useRef } from "react"
import { Report } from "@/types"
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet'
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Leaflet 기본 마커 아이콘 경로 문제 해결
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// 아이콘 경로를 직접 지정
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
  iconUrl: markerIcon.src ?? markerIcon,
  shadowUrl: markerShadow.src ?? markerShadow,
})

// 유형별 마커 색상 이미지 경로
const markerIcons: Record<string, string> = {
  waste: '/marker-purple.png',   // 폐기물
  air: '/marker-blue.png',       // 대기오염
  water: '/marker-cyan.png',     // 수질오염
  noise: '/marker-yellow.png',   // 소음
  default: '/marker-gray.png',   // 기타
};

function getTypeLabel(type: string): string {
  switch (type) {
    case 'waste': return '폐기물';
    case 'air': return '대기오염';
    case 'water': return '수질오염';
    case 'noise': return '소음';
    default: return '기타';
  }
}

// 상태별 색상 반환
function getStatusColor(status: string): string {
  switch (status) {
    case '심각':
    case 'high':
      return '#ef4444'; // 빨강
    case '보통':
    case 'medium':
      return '#facc15'; // 노랑
    case '경미':
    case 'low':
      return '#22c55e'; // 초록
    default:
      return '#a3a3a3'; // 회색
  }
}

export interface SimpleMapProps {
  reports: Report[]
  onReportSelect: (report: Report | null) => void
  selectedReport: Report | null
  currentLocation?: { lat: number; lng: number } | null
  isDialogOpen?: boolean
  center?: { lat: number; lng: number }
  zoom?: number
}

function FlyToSelected({ selectedReport }: { selectedReport: Report | null }) {
  const map = useMap()
  useEffect(() => {
    if (selectedReport && selectedReport.coordinates) {
      map.flyTo([selectedReport.coordinates.lat, selectedReport.coordinates.lng], map.getZoom(), { duration: 0.7 })
    }
  }, [selectedReport])
  return null
}

export default function SimpleMap({
  reports,
  onReportSelect,
  selectedReport,
  currentLocation,
  isDialogOpen,
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 11,
}: SimpleMapProps) {
  const mapRef = useRef<any>(null)

  return (
    <MapContainer
      {...{
        center: [center.lat, center.lng],
        zoom,
        scrollWheelZoom: true,
        style: { height: 600, width: '100%' },
        whenCreated: (mapInstance: any) => { mapRef.current = mapInstance; },
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // @ts-ignore
        attribution="&copy; OpenStreetMap contributors"
      />
      {reports.map((report) => {
        const color = getStatusColor(report.severity || report.status);
        const iconHtml = `
          <div style="
            background: ${color};
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border: 2.5px solid white;
            font-size: 22px;
            font-weight: bold;
            color: #fff;
          ">
            ${getTypeIcon(report.type)}
          </div>
        `;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38],
        }) as any;
        return (
          <Marker
            key={report.id}
            position={[report.coordinates.lat, report.coordinates.lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => onReportSelect(report),
            }}
          >
            {selectedReport && selectedReport.id === report.id && (
              <Popup>
                <div>
                  <div className="flex items-center gap-2 font-bold text-base mb-1">
                    <span style={{fontSize: 20}}>{getTypeIcon(report.type)}</span>
                    {getTypeLabel(report.type)}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{report.title}</div>
                  <div className="text-xs text-gray-400 mb-1">{report.date}</div>
                  <div className="text-sm">{report.description}</div>
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]}>
          <Popup>내 위치</Popup>
        </Marker>
      )}
      <FlyToSelected selectedReport={selectedReport} />
    </MapContainer>
  )
}

// 타입별 아이콘 반환 함수
function getTypeIcon(type: string): string {
  switch (type) {
    case 'waste': return '🗑️'
    case 'air': return '💨'
    case 'water': return '💧'
    case 'noise': return '🔊'
    default: return '📍'
  }
}