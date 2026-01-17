
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, RotateCcw, ListChecks, AlertCircle, Trophy } from 'lucide-react';
import { Task, TaskStatus, Quadrant } from '../../../types';
import { QUADRANT_CONFIG } from '../../../constants';
import { TaskCard } from '../tasks/TaskCard';

interface ReportViewProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ tasks, onUpdateStatus, onUpdateTitle }) => {
  const [activePeriod, setActivePeriod] = useState('Tuần');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  
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
    
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${day}/${month}`;
      
      const dayTasks = tasks.filter(t => getDateFromTaskStr(t.startTime) === dateStr);
      const doneOnDay = dayTasks.filter(t => t.status === TaskStatus.DONE).length;
      
      result.push({
        label: dateStr,
        total: dayTasks.length,
        done: doneOnDay
      });
    }
    return result;
  }, [tasks]);

  const periods = ['Hôm nay', 'Tuần', 'Tháng', 'Năm'];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto pb-12 px-1">
      <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit self-start mb-2">
        {periods.map(p => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`px-4 md:px-5 py-2 text-[11px] md:text-sm font-bold rounded-lg transition-all ${
              activePeriod === p ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="relative bg-gradient-to-br from-[#7c3aed] to-[#6366f1] rounded-[24px] p-6 md:p-10 text-white overflow-hidden shadow-2xl shadow-indigo-100 min-h-[180px] md:min-h-[220px] flex flex-col justify-center">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={20} className="text-white opacity-90" />
            <span className="text-[13px] md:text-[15px] font-bold opacity-90 tracking-wide">Hoàn thành tuần này</span>
          </div>
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-5xl md:text-7xl font-black tracking-tight leading-none">{completedCount}</span>
            <span className="text-lg md:text-xl font-bold opacity-80 mb-1">công việc</span>
          </div>
          <div className="mt-6 px-4 py-1.5 bg-white/10 w-fit rounded-lg text-[10px] md:text-[12px] font-bold tracking-wider backdrop-blur-sm border border-white/10">
            DỮ LIỆU TỔNG HỢP
          </div>
        </div>
        <div className="absolute right-[-20px] top-[-20px] bottom-[-20px] aspect-square flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[80%] rounded-full border-[20px] md:border-[30px] border-white/5 flex items-center justify-center">
               <CheckCircle2 size={100} className="text-white opacity-[0.07]" />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-4 md:p-10 border border-gray-50 shadow-xl shadow-gray-100/50 overflow-hidden">
        <div className="flex items-center justify-between mb-8 md:mb-12">
           <h3 className="text-[13px] md:text-[15px] font-bold text-gray-800 flex items-center gap-2">
             Biểu đồ tiến độ <span className="text-gray-400 font-medium text-[10px] md:text-xs whitespace-nowrap">(10 ngày gần nhất)</span>
           </h3>
        </div>
        
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] md:text-[11px] text-gray-300 font-bold h-[200px] md:h-[288px] pb-10 z-20 bg-white/80 pr-1">
            <span>12</span>
            <span>9</span>
            <span>6</span>
            <span>3</span>
            <span>0</span>
          </div>

          <div className="overflow-x-auto scrollbar-hide ml-6">
            <div className="h-52 md:h-72 flex items-end justify-between gap-1 md:gap-4 relative min-w-0 md:min-w-full pb-1">
              <div className="absolute inset-0 flex flex-col justify-between h-[200px] md:h-[288px] pb-10 pointer-events-none left-0 right-0">
                 {[0,1,2,3,4].map(i => <div key={i} className="w-full border-t border-gray-50 border-dashed" />)}
              </div>

              {chartData.map((data, idx) => {
                const maxVal = 12; 
                const totalHeight = Math.max((data.total / maxVal) * 100, 2);
                const doneHeight = Math.max((data.done / maxVal) * 100, 2);
                const isHovered = hoveredDay === data.label;
                
                return (
                  <div 
                    key={data.label} 
                    className="flex flex-col items-center gap-2 md:gap-4 flex-1 h-full justify-end relative z-10 group cursor-pointer"
                    onMouseEnter={() => setHoveredDay(data.label)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setHoveredDay(isHovered ? null : data.label)}
                  >
                    {isHovered && (
                      <div className={`absolute bottom-[calc(100%-40px)] ${idx > 7 ? 'right-0' : idx < 2 ? 'left-0' : 'left-1/2 -translate-x-1/2'} bg-white rounded-xl p-3 md:p-4 shadow-2xl border border-gray-100 min-w-[110px] md:min-w-[130px] z-[100] animate-in fade-in zoom-in duration-200`}>
                        <div className="text-[10px] md:text-[12px] font-black text-gray-800 mb-2 pb-2 border-b border-gray-50">
                          {data.label}
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center justify-between gap-2">
                             <span className="text-[9px] md:text-[11px] font-bold text-gray-400">Tổng:</span>
                             <span className="text-[9px] md:text-[11px] font-black text-gray-800">{data.total}</span>
                           </div>
                           <div className="flex items-center justify-between gap-2">
                             <span className="text-[9px] md:text-[11px] font-bold text-indigo-600">Xong:</span>
                             <span className="text-[9px] md:text-[11px] font-black text-indigo-600">{data.done}</span>
                           </div>
                        </div>
                        <div className={`absolute -bottom-1.5 ${idx > 7 ? 'right-4' : idx < 2 ? 'left-4' : 'left-1/2 -translate-x-1/2'} w-3 h-3 bg-white rotate-45 border-b border-r border-gray-100`}></div>
                      </div>
                    )}

                    <div className="w-full flex items-end justify-center h-[160px] md:h-[248px] gap-0.5 md:gap-1 relative">
                       {isHovered && <div className="absolute inset-x-[-2px] top-[-10px] bottom-[-10px] bg-indigo-50/20 rounded-lg -z-10"></div>}
                       <div 
                         className={`w-2.5 md:w-5 bg-indigo-600 rounded-t-sm transition-all duration-300 relative ${isHovered ? 'brightness-110 shadow-lg shadow-indigo-100' : ''}`} 
                         style={{height: `${doneHeight}%`}}
                       ></div>
                       <div 
                         className={`w-2.5 md:w-5 bg-[#eef2ff] rounded-t-sm transition-all duration-300 relative ${isHovered ? 'bg-[#e0e7ff]' : ''}`} 
                         style={{height: `${totalHeight}%`}}
                       ></div>
                    </div>
                    <span className={`text-[8px] md:text-[11px] font-black transition-colors ${isHovered ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {data.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-50 shadow-xl shadow-gray-100/50 overflow-hidden">
        <div className="px-6 md:px-10 py-5 md:py-6 flex items-center justify-between border-b border-gray-50 bg-gray-50/20">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
               <ListChecks size={20} strokeWidth={2.5} className="md:w-[22px] md:h-[22px]" />
             </div>
             <h3 className="text-[14px] md:text-[16px] font-bold text-gray-800">Nhật ký công việc</h3>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {groupedTasks.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-xs md:text-sm font-medium text-gray-300 uppercase tracking-widest">Chưa có dữ liệu</span>
            </div>
          ) : groupedTasks.map((group) => (
            <div key={group.rawDate} className="flex flex-col">
              <button 
                onClick={() => setExpandedDate(expandedDate === group.rawDate ? null : group.rawDate)}
                className={`w-full px-6 md:px-10 py-5 md:py-6 flex items-center justify-between hover:bg-indigo-50/20 transition-all ${expandedDate === group.rawDate ? 'bg-indigo-50/10' : ''}`}
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <div className={`p-1.5 rounded-lg bg-white shadow-sm border border-gray-50 transition-transform duration-300 ${expandedDate === group.rawDate ? 'rotate-90 text-indigo-600' : 'text-gray-300'}`}>
                    <ChevronRight size={16} strokeWidth={3} className="md:w-[18px] md:h-[18px]" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[13px] md:text-[15px] font-black text-gray-800 truncate max-w-[150px] md:max-w-none">{group.dateLabel}</span>
                    <span className="text-[10px] font-bold text-gray-400 mt-0.5 whitespace-nowrap">{group.count} mục</span>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 shadow-sm border border-white">
                  {group.count}
                </div>
              </button>

              {expandedDate === group.rawDate && (
                <div className="px-6 md:px-10 pb-6 bg-indigo-50/5">
                  <div className="flex flex-col gap-4 pt-4">
                    {group.tasks.map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onUpdateStatus={onUpdateStatus}
                        onUpdateTitle={onUpdateTitle}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
