
import React, { useState, useMemo } from 'react';
import { ChevronRight, CheckCircle2, ListChecks, Trophy } from 'lucide-react';
import { Task, TaskStatus } from '../../../types';
import { TaskCard } from '../tasks/TaskCard';

interface ReportViewProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ tasks, onUpdateStatus, onUpdateTitle }) => {
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
      // Hiển thị năm hiện tại và 4 năm trước
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        // Vì dữ liệu task hiện tại không lưu năm, tạm coi mọi task là của năm nay
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
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto pb-12 px-1">
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

      {/* Main Stats Summary */}
      <div className="relative bg-gradient-to-br from-[#7c3aed] to-[#6366f1] rounded-[24px] p-6 md:p-10 text-white overflow-hidden shadow-2xl shadow-indigo-100 min-h-[180px] flex flex-col justify-center">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={20} className="text-white opacity-90" />
            <span className="text-[13px] md:text-[15px] font-bold opacity-90 tracking-wide">Hoàn thành tổng cộng</span>
          </div>
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-5xl md:text-7xl font-black tracking-tight leading-none">{completedCount}</span>
            <span className="text-lg md:text-xl font-bold opacity-80 mb-1">công việc</span>
          </div>
        </div>
        <div className="absolute right-[-20px] top-[-20px] bottom-[-20px] aspect-square flex items-center justify-center pointer-events-none">
            <CheckCircle2 size={100} className="text-white opacity-[0.07]" />
        </div>
      </div>

      {/* Interactive Chart Area */}
      <div className="bg-white rounded-[24px] p-4 md:p-10 border border-gray-50 shadow-xl shadow-gray-100/50 overflow-visible relative">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-[14px] md:text-[15px] font-black text-gray-800 uppercase tracking-tight">Biểu đồ tiến độ ({activePeriod})</h3>
           <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-indigo-600 rounded-full"></span> Xong</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-100 rounded-full border border-gray-200"></span> Tổng</div>
           </div>
        </div>
        
        {/* pt-32 ensures space for the tooltip at the top */}
        <div className="relative pt-32 pb-8 px-2 overflow-visible">
          <div className="h-64 md:h-80 flex items-end justify-between gap-1 md:gap-3 relative min-w-full overflow-visible">
            {chartData.map((data, idx) => {
              const totalH = (data.total / maxVal) * 100;
              const doneH = (data.done / maxVal) * 100;
              const isHovered = hoveredIdx === idx;
              
              const isLast = idx >= chartData.length - 2;
              const isFirst = idx <= 1;
              const tooltipPosClass = isLast ? 'right-0' : isFirst ? 'left-0' : 'left-1/2 -translate-x-1/2';
              const arrowPosClass = isLast ? 'right-4' : isFirst ? 'left-4' : 'left-1/2 -translate-x-1/2';

              return (
                <div 
                  key={idx} 
                  className="flex-1 flex flex-col items-center justify-end h-full gap-3 relative group overflow-visible"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className={`absolute bottom-[calc(100%+24px)] ${tooltipPosClass} bg-[#1e293b] text-white p-4 rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.4)] z-[999] min-w-[160px] animate-in fade-in zoom-in duration-200 border border-white/10`}>
                      <div className="text-[10px] font-black text-indigo-400 uppercase mb-3 border-b border-white/5 pb-2 whitespace-nowrap tracking-wider">
                        {data.fullLabel}
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center gap-6">
                           <span className="text-[11px] font-bold opacity-60">Tổng cộng:</span>
                           <span className="text-[14px] font-black">{data.total}</span>
                        </div>
                        <div className="flex justify-between items-center gap-6">
                           <span className="text-[11px] font-bold text-green-400">Đã xong:</span>
                           <span className="text-[14px] font-black text-green-400">{data.done}</span>
                        </div>
                        {data.total > 0 && (
                           <div className="mt-1 pt-2 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[9px] font-bold opacity-40 uppercase">Tỷ lệ:</span>
                              <span className="text-[12px] font-black text-indigo-300">{Math.round((data.done/data.total)*100)}%</span>
                           </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1.5 ${arrowPosClass} w-3 h-3 bg-[#1e293b] rotate-45 border-r border-b border-white/10`}></div>
                    </div>
                  )}

                  {/* The Bar Columns */}
                  <div className={`w-full flex items-end justify-center gap-0.5 md:gap-1.5 h-full transition-all duration-300 ${isHovered ? 'opacity-100 scale-x-110' : 'opacity-70'}`}>
                    <div 
                      className={`w-3 md:w-8 bg-indigo-600 rounded-t-lg transition-all duration-500 relative ${isHovered ? 'shadow-[0_0_20px_rgba(79,70,229,0.5)] brightness-125' : ''}`} 
                      style={{height: `${Math.max(doneH, 2)}%`}}
                    />
                    <div 
                      className={`w-3 md:w-8 bg-slate-100 border-x border-t border-gray-100 rounded-t-lg transition-all duration-500 ${isHovered ? 'bg-slate-200 border-slate-200' : ''}`} 
                      style={{height: `${Math.max(totalH, 2)}%`}}
                    />
                  </div>
                  
                  <span className={`text-[10px] md:text-[12px] font-black transition-all duration-300 mt-1 ${isHovered ? 'text-indigo-600 scale-110' : 'text-gray-400'} ${data.label === '' ? 'opacity-0' : 'opacity-100'}`}>
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Work History Section */}
      <div className="bg-white rounded-[24px] border border-gray-50 shadow-xl shadow-gray-100/50 overflow-hidden">
        <div className="px-6 md:px-10 py-5 flex items-center gap-3 border-b border-gray-50 bg-gray-50/20">
          <ListChecks size={20} className="text-indigo-600" />
          <h3 className="text-[14px] md:text-[16px] font-black text-gray-800">Lịch sử công việc</h3>
        </div>

        <div className="divide-y divide-gray-50">
          {groupedTasks.length === 0 ? (
             <div className="p-20 text-center opacity-30 flex flex-col items-center">
                <ListChecks size={48} className="mb-4" />
                <span className="font-black text-xs uppercase tracking-widest">Chưa có dữ liệu công việc</span>
             </div>
          ) : groupedTasks.map((group) => (
            <div key={group.rawDate} className="flex flex-col">
              <button 
                onClick={() => setExpandedDate(expandedDate === group.rawDate ? null : group.rawDate)}
                className={`w-full px-6 md:px-10 py-5 flex items-center justify-between hover:bg-indigo-50/10 transition-all ${expandedDate === group.rawDate ? 'bg-indigo-50/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`transition-transform duration-300 ${expandedDate === group.rawDate ? 'rotate-90 text-indigo-600' : 'text-gray-300'}`}>
                    <ChevronRight size={18} />
                  </div>
                  <span className="text-[14px] font-black text-gray-800">{group.dateLabel}</span>
                </div>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 border border-white shadow-sm">{group.count} task</span>
              </button>

              {expandedDate === group.rawDate && (
                <div className="px-6 md:px-10 pb-8 flex flex-col gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                  {group.tasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onUpdateStatus={onUpdateStatus}
                      onUpdateTitle={onUpdateTitle}
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
