
import React from 'react';

interface StatCardProps {
  done: number;
  doing: number;
  pending: number;
  cancelled: number;
  backlog: number;
  total: number;
}

export const StatCard: React.FC<StatCardProps> = ({ done, doing, pending, cancelled, backlog, total }) => {
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow w-full">
      <h4 className="font-extrabold text-[#475569] text-[11px] md:text-[13px] uppercase tracking-[0.1em] mb-6 md:mb-8 pl-1">
        TIẾN ĐỘ HÔM NAY
      </h4>
      
      <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
        {/* Progress Circle Container */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 80 80" className="w-24 h-24 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-indigo-600 transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-xl font-black text-slate-800 tracking-tighter">{percentage}%</span>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 flex-1 w-full">
          {/* HOÀN THÀNH */}
          <div className="flex items-center gap-2 bg-[#f0fdf4] px-3 py-2 rounded-2xl border border-green-50 shadow-sm min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0"></span>
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[13px] md:text-[14px] font-black text-[#1e293b] leading-none">{done}</span>
              <span className="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">HOÀN THÀNH</span>
            </div>
          </div>

          {/* ĐANG LÀM */}
          <div className="flex items-center gap-2 bg-[#f5f3ff] px-3 py-2 rounded-2xl border border-indigo-50 shadow-sm min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse shrink-0"></span>
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[13px] md:text-[14px] font-black text-[#1e293b] leading-none">{doing}</span>
              <span className="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">ĐANG LÀM</span>
            </div>
          </div>

          {/* TỒN ĐỌNG */}
          <div className="flex items-center gap-2 bg-[#fef2f2] px-3 py-2 rounded-2xl border border-red-50 shadow-sm min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shrink-0"></span>
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[13px] md:text-[14px] font-black text-[#1e293b] leading-none">{backlog}</span>
              <span className="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">TỒN ĐỌNG</span>
            </div>
          </div>

          {/* MỚI */}
          <div className="flex items-center gap-2 bg-[#eff6ff] px-3 py-2 rounded-2xl border border-blue-50 shadow-sm min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0"></span>
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[13px] md:text-[14px] font-black text-[#1e293b] leading-none">{pending}</span>
              <span className="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">MỚI</span>
            </div>
          </div>

          {/* HỦY */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100 shadow-sm min-w-0 col-span-2 sm:col-span-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[13px] md:text-[14px] font-black text-[#1e293b] leading-none">{cancelled}</span>
              <span className="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">HỦY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
