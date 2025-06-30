import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 공통 상수 및 유틸 함수
export const typeLabels: { [key: string]: string } = {
  waste: '폐기물',
  air: '대기오염',
  water: '수질오염',
  noise: '소음',
};
export const typeIcons: { [key: string]: string } = {
  waste: '🗑️',
  air: '💨',
  water: '💧',
  noise: '🔊',
};
export const typeColors: { [key: string]: string } = {
  waste: '#22c55e',
  air: '#3b82f6',
  water: '#0ea5e9',
  noise: '#eab308',
};

export function safeDateString(date: any) {
  if (!date) return '날짜 없음';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '날짜 없음' : d.toLocaleDateString();
}
export function safeString(val: any, fallback = '정보 없음') {
  return (typeof val === 'string' && val.trim()) ? val : fallback;
}
export function safeLocation(loc: any) {
  if (!loc) return '위치 없음';
  if (typeof loc === 'object' && 'address' in loc) return (loc as any).address || '위치 없음';
  if (typeof loc === 'string' && loc.trim()) return loc;
  return '위치 없음';
}

// 서비스 전체 연동용 분류별 스타일 상수
export const CATEGORY_STYLES = {
  '쓰레기': { color: 'red', icon: '🗑️' },
  '소음': { color: 'blue', icon: '🔊' },
  '기타': { color: 'gray', icon: '❓' },
  // 필요시 분류 추가
};
