
import React, { useState, useMemo } from 'react';
import { ChevronRight, CheckCircle2, ListChecks, Trophy } from 'lucide-react';
import { Task, TaskStatus, User } from '../../../types';
import { TaskCard } from '../tasks/TaskCard';

interface ReportViewProps {
  tasks: Task[];
  onUpdateStatus: (id: number, status: TaskStatus) => void;
  onUpdateTitle: (id: number, title: string) => void;
  currentUser?: User | null;
}

export const ReportView: React.FC<ReportViewProps> = ({ tasks, onUpdateStatus, onUpdateTitle, currentUser }) => {
  const [activePeriod, setActivePeriod] = useState('Tuần');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const getDateFromTaskStr = (timeStr: string) => {
    const parts = timeStr.split(' ');
    return parts.length > 1 ? parts[1] : ''; 
  };

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const sortedTasks = [...tasks].sort((a, b) => b.startTime.localeCompare(a.startTime));

    sortedTasks.forEach(task => {
      const dateKey = getDateFromTaskStr(task.startTime);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });

    return Object.entries(groups).map(([date, items]) => ({
      dateLabel: `Ngày ${date}`,
      rawDate: date,
      count: items.length,
      tasks: items
    }));
  }, [tasks]);

  const [expandedDate, setExpandedDate] = useState<string | null>(
    groupedTasks.length > 0 ? groupedTasks[0].rawDate : null
  );

  const completedCount = useMemo(() => 
    tasks.filter(t => t.status === TaskStatus.DONE).length
  , [tasks]);

  const chartData = useMemo(() => {
    const result = [];
    const now = new Date();
    
    if (activePeriod === 'Hôm nay') {
      for (let i = 0; i < 24; i++) {
        const hourLabel = `${i}h`;
        const dayMonth = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const hourTasks = tasks.filter(t => {
          return t.startTime.startsWith(`${String(i).padStart(2, '0')}:`) && t.startTime.endsWith(dayMonth);
        });

        result.push({
          label: i % 4 === 0 ? hourLabel : '',
          fullLabel: `Giờ: ${i}h:00 - ${dayMonth}`,
          total: hourTasks.length,
          done: hourTasks.filter(t => t.status === TaskStatus.DONE).length
        });
      }
    } else if (activePeriod === 'Tuần') {
      const monday = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);

      const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const fullDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => getDateFromTaskStr(t.startTime) === dateStr);
        result.push({
          label: days[i],
          fullLabel: `${fullDays[i]} (${dateStr})`,
          total: dayTasks.length,
          done: dayTasks.filter(t => t.status === TaskStatus.DONE).length
        });
      }
    } else if (activePeriod === 'Tháng') {
      const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      const currentYear = now.getFullYear();
      for (let i = 0; i < 12; i++) {
        const monthYearSuffix = `/${String(i + 1).padStart(2, '0')}`;
        const monthTasks = tasks.filter(t => t.startTime.includes(monthYearSuffix));
        
        result.push({
          label: monthNames[i],
          fullLabel: `Tháng ${i + 1}/${currentYear}`,
          total: monthTasks.length,
          done: monthTasks.filter(t => t.status === TaskStatus.DONE).length
        });
      }
    } else if (activePeriod === 'Năm') {
      const currentYear = now.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearTasks = (i === 0) ? tasks : [];

        result.push({
          label: year.toString(),
          fullLabel: `Năm ${year}`,
          total: yearTasks.length,
          done: yearTasks.filter(t => t.status === TaskStatus.DONE).length
        });
      }
    }
    return result;
  }, [tasks, activePeriod]);

  const maxVal = useMemo(() => {
    const vals = chartData.map(d => d.total);
    return Math.max(...vals, 5);
  }, [chartData]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto pb-12 px-1 font-['Lexend']">
      {/* Period Selectors */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit self-start mb-2">
        {['Hôm nay', 'Tuần', 'Tháng', 'Năm'].map(p => (
          <button
            key={p}
            onClick={() => {
              setActivePeriod(p);
              setHoveredIdx(null);
            }}
            className={`px-4 md:px-5 py-2 text-[11px] md:text-sm font-black rounded-lg transition-all ${
              activePeriod === p ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="relative bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] rounded-[32px] p-8 md:p-12 text-white overflow-hidden shadow-2xl shadow-indigo-100 flex flex-col justify-center">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={20} className="text-indigo-300" />
            <span className="text-[12px] md:text-[14px] font-black opacity-70 tracking-[0.2em] uppercase">HIỆU SUẤT CÁ NHÂN</span>
          </div>
          <div className="flex items-baseline gap-2 md:gap-4">
            <span className="text-6xl md:text-8xl font-[900] tracking-tighter leading-none">{completedCount}</span>
            <span className="text-xl md:text-2xl font-black opacity-50 uppercase tracking-widest">Công việc hoàn thành</span>
          </div>
        </div>
        <div className="absolute right-[-40px] top-[-40px] pointer-events-none">
            <CheckCircle2 size={240} className="text-white opacity-[0.03]" />
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-6 md:p-10 border border-slate-50 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <div>
              <h3 className="text-xl font-[900] text-slate-900 uppercase tracking-tight">Biểu đồ tiến độ</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Dữ liệu theo {activePeriod}</p>
           </div>
           <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></span> Hoàn thành</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-slate-200 rounded-full"></span> Tổng số</div>
           </div>
        </div>
        
        {/* Container cuộn ngang thông minh */}
        <div className="relative pt-24 pb-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing">
          <div 
            className="h-64 md:h-80 flex items-end justify-between gap-2 md:gap-4 relative" 
            style={{ minWidth: activePeriod === 'Hôm nay' ? '1200px' : activePeriod === 'Tháng' ? '800px' : '100%' }}
          >
            {chartData.map((data, idx) => {
              const totalH = (data.total / maxVal) * 100;
              const doneH = (data.done / maxVal) * 100;
              const isHovered = hoveredIdx === idx;
              
              // Tính toán vị trí Tooltip để không bị tràn
              const isLast = idx >= chartData.length - 3;
              const isFirst = idx <= 2;
              const tooltipPosClass = isLast ? 'right-0' : isFirst ? 'left-0' : 'left-1/2 -translate-x-1/2';
              const arrowPosClass = isLast ? 'right-4' : isFirst ? 'left-4' : 'left-1/2 -translate-x-1/2';

              return (
                <div 
                  key={idx} 
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHovered && (
                    <div className={`absolute bottom-[calc(100%+24px)] ${tooltipPosClass} bg-slate-900 text-white p-5 rounded-3xl shadow-2xl z-50 min-w-[180px] animate-in fade-in zoom-in-95 duration-200 border border-white/10 backdrop-blur-md`}>
                      <div className="text-[10px] font-black text-indigo-400 uppercase mb-3 border-b border-white/5 pb-2 tracking-widest">
                        {data.fullLabel}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black opacity-40 uppercase">Tổng cộng</span>
                           <span className="text-[14px] font-[900]">{data.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-indigo-400 uppercase">Hoàn thành</span>
                           <span className="text-[14px] font-[900] text-indigo-400">{data.done}</span>
                        </div>
                        {data.total > 0 && (
                           <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[9px] font-black opacity-30 uppercase">Hiệu suất</span>
                              <span className="text-[12px] font-[900] text-emerald-400">{Math.round((data.done/data.total)*100)}%</span>
                           </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1.5 ${arrowPosClass} w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-white/10`}></div>
                    </div>
                  )}

                  <div className={`w-full flex items-end justify-center gap-1 h-full transition-all duration-500 ${isHovered ? 'scale-x-105' : 'opacity-80'}`}>
                    <div 
                      className={`w-4 md:w-8 bg-indigo-600 rounded-t-xl transition-all duration-700 relative z-10 ${isHovered ? 'brightness-125 shadow-lg shadow-indigo-500/40' : ''}`} 
                      style={{height: `${Math.max(doneH, 4)}%`}}
                    >
                      {isHovered && data.done > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-indigo-600">{data.done}</div>
                      )}
                    </div>
                    <div 
                      className={`w-4 md:w-8 bg-slate-100 rounded-t-xl transition-all duration-700 ${isHovered ? 'bg-slate-200' : ''}`} 
                      style={{height: `${Math.max(totalH, 4)}%`}}
                    />
                  </div>
                  
                  <span className={`text-[9px] md:text-[11px] font-black transition-all duration-300 mt-4 tracking-tighter ${isHovered ? 'text-indigo-600' : 'text-slate-400'} ${data.label === '' ? 'opacity-0' : 'opacity-100'}`}>
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-50 shadow-sm overflow-hidden">
        <div className="px-8 md:px-10 py-6 flex items-center justify-between border-b border-slate-50 bg-slate-50/20">
          <div className="flex items-center gap-3">
             <ListChecks size={22} className="text-indigo-600" />
             <h3 className="text-lg font-[900] text-slate-900 uppercase tracking-tight">Nhật ký công việc</h3>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{groupedTasks.length} Ngày ghi nhận</p>
        </div>

        <div className="divide-y divide-slate-50">
          {groupedTasks.length === 0 ? (
             <div className="py-24 text-center opacity-20 flex flex-col items-center">
                <ListChecks size={64} strokeWidth={1} className="mb-4" />
                <span className="font-black text-sm uppercase tracking-[0.2em]">Hệ thống chưa ghi nhận dữ liệu</span>
             </div>
          ) : groupedTasks.map((group) => (
            <div key={group.rawDate} className="flex flex-col">
              <button 
                onClick={() => setExpandedDate(expandedDate === group.rawDate ? null : group.rawDate)}
                className={`w-full px-8 md:px-10 py-6 flex items-center justify-between hover:bg-slate-50 transition-all ${expandedDate === group.rawDate ? 'bg-slate-50/50' : ''}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-all duration-500 ${expandedDate === group.rawDate ? 'rotate-90 text-indigo-600 scale-110' : 'text-slate-300'}`}>
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                  <span className="text-base font-black text-slate-800 uppercase tracking-tight">{group.dateLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-500 tracking-widest shadow-sm">
                      {group.tasks.filter(t => t.status === TaskStatus.DONE).length}/{group.count} XONG
                   </div>
                </div>
              </button>

              {expandedDate === group.rawDate && (
                <div className="px-8 md:px-10 pb-10 flex flex-col gap-5 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  {group.tasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onUpdateStatus={onUpdateStatus}
                      onUpdateTitle={onUpdateTitle}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
