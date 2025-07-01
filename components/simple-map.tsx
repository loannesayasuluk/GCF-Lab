"use client"

import React, { useLayoutEffect, useRef, useState, useEffect } from "react"
import { Report } from "@/types"
import dynamic from "next/dynamic"
import { MapContainer as RLMapContainer, TileLayer as RLTileLayer, Marker as RLMarkerBase, Popup, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Tooltip } from "react-leaflet"
import { useIsMobile } from './ui/use-mobile'

// 전역 타입 선언
declare global {
  interface Window {
    L: any;
    leafletMapInstance: any;
    naver: any;
    naverMaps: any;
  }
}

const NAVER_CLIENT_ID = "czowx453xp";

export interface SimpleMapProps {
  reports: Report[]
  onReportSelect: (report: Report | null) => void
  selectedReport: Report | null
  currentLocation?: { lat: number; lng: number } | null
  isDialogOpen?: boolean
  center?: { lat: number; lng: number }
  zoom?: number
  children?: React.ReactNode
  markerPosition?: { lat: number; lng: number }
  mapStyle?: keyof typeof MAP_TILE_SERVICES
  showMapStyleSelector?: boolean
}

const CATEGORY_STYLES = {
  '쓰레기': { color: 'red', icon: '🗑️' },
  '소음': { color: 'blue', icon: '🔊' },
  '기타': { color: 'gray', icon: '❓' },
  // ...서비스 전체 연동용 분류 추가
};

// Mapbox API 키 설정
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

// 지도 타일 서비스 정의 (Mapbox만)
const MAP_TILE_SERVICES = {
  'mapbox-streets': {
    name: 'Mapbox 도로 지도',
    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  },
  'mapbox-satellite': {
    name: 'Mapbox 위성 이미지',
    url: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  },
  'mapbox-satellite-streets': {
    name: 'Mapbox 위성 + 도로',
    url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  },
  'mapbox-light': {
    name: 'Mapbox 라이트 테마',
    url: `https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  },
  'mapbox-dark': {
    name: 'Mapbox 다크 테마',
    url: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  },
  'mapbox-navigation-day': {
    name: 'Mapbox 내비게이션 (주간)',
    url: `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  },
  'mapbox-navigation-night': {
    name: 'Mapbox 내비게이션 (야간)',
    url: `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  },
  'mapbox-outdoors': {
    name: 'Mapbox 아웃도어',
    url: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    attribution: '© Mapbox',
    maxZoom: 22
  }
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
      ariaLabel={ariaLabel}
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

// 에러 바운더리 컴포넌트
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("[지도 디버그] 지도 에러 발생:", error);
    // 에러 발생 시 전역 지도 인스턴스 정리
    if (typeof window !== 'undefined' && window.leafletMapInstance) {
      try {
        if (window.leafletMapInstance.remove) {
          window.leafletMapInstance.remove();
        }
      } catch (e) {
        console.warn("[지도 디버그] 에러 바운더리에서 지도 정리 실패:", e);
      }
      window.leafletMapInstance = null;
    }
    
    // onError 콜백 호출
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// MapContainer를 래핑하여 초기화 문제 방지
const SafeMapContainer = (props: any) => {
  const { children, isDialogOpen, center, zoom, reports, onReportSelect, selectedReport, currentLocation, ...restProps } = props;
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [mapKey, setMapKey] = useState(0) // 강제 재생성을 위한 key
  const [shouldRenderMap, setShouldRenderMap] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [useFallbackMap, setUseFallbackMap] = useState(false)
  const uniqueId = useRef(`map-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [sdkLoaded, setSdkLoaded] = useState(false)

  // 1. 네이버 지도 SDK 동적 로드
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.naver && window.naver.maps) {
      setSdkLoaded(true);
      return;
    }

    // 이미 스크립트가 있으면 onload만 추가
    const existingScript = document.getElementById("naver-map-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setSdkLoaded(true));
      return;
    }

    // 새로 스크립트 추가
    const script = document.createElement("script");
    script.id = "naver-map-script";
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}`;
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 2. SDK가 완전히 로드된 후에만 지도 생성
  useEffect(() => {
    if (!sdkLoaded) return;
    if (!mapRef.current) return;
    if (!window.naver || !window.naver.maps) return;

    // 생성 지연 (DOM이 완전히 렌더링된 후)
    const timer = setTimeout(() => {
      // 기존 지도 제거
      if (mapRef.current!.firstChild) {
        mapRef.current!.innerHTML = "";
      }
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom,
      });
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(center.lat, center.lng),
        map,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [sdkLoaded, center, zoom]);

  // 마커 생성 함수
  const createMarker = (report: ReportWithCategory) => {
    if (!mapRef.current || !window.L) return null;

    const style = CATEGORY_STYLES[report.category || '기타'];
    const isSelected = selectedReport?.id === report.id;

    // 커스텀 아이콘 생성
    const customIcon = window.L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${style.color};
          color: white;
          border: 2px solid ${isSelected ? '#000' : 'white'};
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${style.icon}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // 마커 생성
    const marker = window.L.marker([report.coordinates.lat, report.coordinates.lng], { icon: customIcon })
      .addTo(mapRef.current)
      .on('click', () => {
        onReportSelect(report);
      });

    // 툴크 추가
    if (report.summary) {
      marker.bindTooltip(report.summary, {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip'
      });
    }

    return marker;
  };

  // 에러 발생 시 재시도 함수
  const retryMap = () => {
    setHasError(false);
    setRetryCount(prev => prev + 1);
    setMapKey(prev => prev + 1);
    setShouldRenderMap(false);
    setUseFallbackMap(false);
    
    // 잠시 후 다시 렌더링
    setTimeout(() => {
      setShouldRenderMap(true);
    }, 100);
  };

  // 선택된 지도 스타일 상태
  const [selectedMapStyle, setSelectedMapStyle] = useState<keyof typeof MAP_TILE_SERVICES>(
    props.mapStyle || 'mapbox-streets'
  );

  // 순수 Leaflet으로 지도 생성
  const createPureLeafletMap = () => {
    if (!containerRef.current || !window.L) return;

    try {
      // 기존 맵 완전 정리
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // 무시
        }
        mapRef.current = null;
      }

      // 마커들 정리
      markersRef.current.forEach(marker => {
        try {
          if (marker && marker.remove) {
            marker.remove();
          }
        } catch (e) {
          // 무시
        }
      });
      markersRef.current = [];

      // DOM 정리
      const existingMaps = containerRef.current.querySelectorAll('[class*="leaflet"]');
      existingMaps.forEach(element => {
        try {
          element.remove();
        } catch (e) {
          // 무시
        }
      });

      // 컨테이너 ID 설정
      containerRef.current.id = uniqueId.current;

      // 순수 Leaflet으로 지도 생성
      const map = window.L.map(uniqueId.current, {
        center: center || [37.5665, 126.978],
        zoom: zoom || 11,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true,
        tap: true,
      });

      // 선택된 지도 스타일로 타일 레이어 추가
      const selectedService = MAP_TILE_SERVICES[selectedMapStyle];
      if (selectedService) {
        window.L.tileLayer(selectedService.url, {
          attribution: selectedService.attribution,
          maxZoom: selectedService.maxZoom,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(map);
      } else {
        // 기본값으로 Mapbox 도로 지도 사용
        window.L.tileLayer(MAP_TILE_SERVICES['mapbox-streets'].url, {
          attribution: MAP_TILE_SERVICES['mapbox-streets'].attribution,
          maxZoom: MAP_TILE_SERVICES['mapbox-streets'].maxZoom,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(map);
      }

      // 맵 인스턴스 저장
      mapRef.current = map;
      window.leafletMapInstance = map;
      
      // 마커들 생성
      if (reports) {
        reports.forEach(report => {
          const marker = createMarker(report as ReportWithCategory);
          if (marker) {
            markersRef.current.push(marker);
          }
        });
      }

      console.log("[지도 디버그] 순수 Leaflet 지도 생성됨 - 스타일:", selectedMapStyle);
    } catch (e) {
      console.warn("[지도 디버그] 순수 Leaflet 지도 생성 실패:", e);
    }
  };

  useEffect(() => {
    // 에러 상태 초기화
    setHasError(false);
    setUseFallbackMap(false);
    
    // 기존 맵 인스턴스가 있으면 완전히 정리
    if (window.leafletMapInstance) {
      try {
        if (window.leafletMapInstance.remove) {
          window.leafletMapInstance.remove();
        }
      } catch (e) {
        // 모든 에러를 무시하고 강제로 null 처리
        console.warn("[지도 디버그] 기존 맵 인스턴스 정리 중 에러 발생, 무시:", e);
      }
      window.leafletMapInstance = null;
    }
    
    // DOM에서 모든 Leaflet 관련 요소 완전 제거
    const allLeafletElements = document.querySelectorAll('[class*="leaflet"]');
    allLeafletElements.forEach(element => {
      try {
        element.remove();
      } catch (e) {
        // DOM 요소 제거 에러도 무시
      }
    });
    
    // 컨테이너에 이미 맵이 있는지 확인하고 제거
    if (containerRef.current) {
      const existingMaps = containerRef.current.querySelectorAll('.leaflet-container, .leaflet-map-pane, .leaflet-tile-pane, .leaflet-overlay-pane, .leaflet-marker-pane, .leaflet-tooltip-pane, .leaflet-popup-pane, .leaflet-shadow-pane');
      if (existingMaps.length > 0) {
        console.log("[지도 디버그] 기존 맵 컨테이너 발견, 제거 중...", existingMaps.length, "개 요소")
        existingMaps.forEach(element => {
          try {
            element.remove();
          } catch (e) {
            // DOM 요소 제거 에러도 무시
          }
        });
      }
    }
    
    // 새로운 key로 강제 재생성
    setMapKey(prev => prev + 1);
    setIsInitialized(true)
    
    // 지도 렌더링을 지연시켜 DOM 정리 완료 후 실행
    setTimeout(() => {
      setShouldRenderMap(true);
    }, 300); // 지연 시간을 더 늘려서 DOM 정리가 완전히 완료되도록 함
    
    return () => {
      setShouldRenderMap(false);
      setHasError(false);
      setUseFallbackMap(false);
      
      // 안전한 정리 함수
      const safeCleanup = () => {
        try {
          // 1. 마커들 정리
          markersRef.current.forEach(marker => {
            try {
              if (marker && marker.remove) {
                marker.remove();
              }
            } catch (e) {
              // 에러 무시
            }
          });
          markersRef.current = [];

          // 2. 현재 map 인스턴스 정리
          if (mapRef.current) {
            try {
              if (mapRef.current.remove) mapRef.current.remove();
            } catch (e) {
              // 모든 에러를 무시
            }
            mapRef.current = null;
          }
          
          // 3. 전역 leafletMapInstance 정리
          if (window.leafletMapInstance) {
            try {
              if (window.leafletMapInstance.remove) window.leafletMapInstance.remove();
            } catch (e) {
              // 모든 에러를 무시
            }
            window.leafletMapInstance = null;
          }
          
          // 4. DOM 컨테이너에서 모든 Leaflet 관련 요소 완전 제거
          if (containerRef.current) {
            const allLeafletElements = containerRef.current.querySelectorAll('[class*="leaflet"]');
            allLeafletElements.forEach(element => {
              try {
                element.remove();
              } catch (e) {
                // DOM 요소 제거 에러도 무시
              }
            });
          }
        } catch (e) {
          // 정리 과정에서 발생하는 모든 에러를 무시
        }
      };
      
      // 지연된 정리 실행
      setTimeout(safeCleanup, 150); // 지연 시간을 늘려서 안전하게 정리
      
      setIsInitialized(false)
    }
  }, [retryCount]) // retryCount가 변경될 때마다 재실행

  // 순수 Leaflet 지도 생성 useEffect
  useEffect(() => {
    if (shouldRenderMap && window.L && containerRef.current) {
      // 지연 후 지도 생성
      const timer = setTimeout(() => {
        createPureLeafletMap();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [shouldRenderMap, selectedMapStyle]);

  if (!isInitialized) {
    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
  }

  const fallbackComponent = (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div className="text-gray-500 mb-2">지도 로딩 중...</div>
      {hasError && (
        <button 
          onClick={retryMap}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      )}
    </div>
  );

  // 에러가 발생했거나 지도를 렌더링하지 않을 때
  if (hasError || !shouldRenderMap) {
    return (
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} className="relative">
        {fallbackComponent}
        {/* 지도 위 오버레이 (다이얼로그가 열릴 때만) */}
        {isDialogOpen && (
          <div className="absolute inset-0 pointer-events-none bg-transparent backdrop-blur-lg z-[1200]" />
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }} className="relative">
      {/* 지도 스타일 선택기 */}
      {props.showMapStyleSelector && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
          <select
            value={selectedMapStyle}
            onChange={(e) => {
              setSelectedMapStyle(e.target.value as keyof typeof MAP_TILE_SERVICES);
              // 지도 재생성
              setTimeout(() => {
                createPureLeafletMap();
              }, 100);
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            {Object.entries(MAP_TILE_SERVICES).map(([key, service]) => (
              <option key={key} value={key}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div 
        id={uniqueId.current}
        style={{ width: "100%", height: "100%" }}
      />
      {/* 지도 위 오버레이 (다이얼로그가 열릴 때만) */}
      {isDialogOpen && (
        <div className="absolute inset-0 pointer-events-none bg-transparent backdrop-blur-lg z-[1200]" />
      )}
    </div>
  )
}

export default function SimpleMap({
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 11,
  markerPosition,
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 지도 제거
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    // 지도 생성
    const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
    leafletMapRef.current = map;

    // 예쁜 CartoDB Voyager 타일 적용
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // 마커 추가 (옵션)
    if (markerPosition) {
      const marker = L.marker([markerPosition.lat, markerPosition.lng]).addTo(map);
      markerRef.current = marker;
    }

    // Clean up
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [center, zoom, markerPosition]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "500px",
        minHeight: "300px",
        border: "2px solid #10b981",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#e5e7eb",
        position: "relative",
        display: "block",
      }}
    />
  );
}

/*
사용 예시:

// 기본 사용 (Mapbox 도로 지도)
<SimpleMap
  reports={reports}
  onReportSelect={handleReportSelect}
  selectedReport={selectedReport}
  center={{ lat: 37.5665, lng: 126.978 }}
  zoom={11}
/>

// Mapbox 위성 이미지 사용
<SimpleMap
  reports={reports}
  onReportSelect={handleReportSelect}
  selectedReport={selectedReport}
  center={{ lat: 37.5665, lng: 126.978 }}
  zoom={11}
  mapStyle="mapbox-satellite"
/>

// 지도 스타일 선택기 표시
<SimpleMap
  reports={reports}
  onReportSelect={handleReportSelect}
  selectedReport={selectedReport}
  center={{ lat: 37.5665, lng: 126.978 }}
  zoom={11}
  showMapStyleSelector={true}
/>

// Mapbox 다크 테마 사용
<SimpleMap
  reports={reports}
  onReportSelect={handleReportSelect}
  selectedReport={selectedReport}
  center={{ lat: 37.5665, lng: 126.978 }}
  zoom={11}
  mapStyle="mapbox-dark"
/>

사용 가능한 Mapbox 지도 스타일:
- mapbox-streets: Mapbox 도로 지도 (기본값)
- mapbox-satellite: Mapbox 위성 이미지
- mapbox-satellite-streets: Mapbox 위성 + 도로
- mapbox-light: Mapbox 라이트 테마
- mapbox-dark: Mapbox 다크 테마
- mapbox-navigation-day: Mapbox 내비게이션 (주간)
- mapbox-navigation-night: Mapbox 내비게이션 (야간)
- mapbox-outdoors: Mapbox 아웃도어

환경 변수 설정:
.env.local 파일에 NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token 추가
*/