import React from "react";

export default function MapLegendOverlay() {
  return (
    <div className="bg-white/90 rounded-xl shadow-lg border border-gray-200 p-4 text-xs flex flex-col gap-2 w-full mt-4">
      <div className="font-semibold text-gray-700 mb-1">범례</div>
      <div className="flex flex-wrap gap-2 items-center mb-1">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>심각</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>보통</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>경미</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>내 위치</span>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-[#a78bfa] text-base flex items-center justify-center">🗑️</span>폐기물</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-[#60a5fa] text-base flex items-center justify-center">💨</span>대기오염</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-[#38bdf8] text-base flex items-center justify-center">💧</span>수질오염</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-[#facc15] text-base flex items-center justify-center">🔊</span>소음</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-[#a3a3a3] text-base flex items-center justify-center">❓</span>기타</span>
      </div>
    </div>
  );
} 