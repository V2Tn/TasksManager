
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Users, Briefcase, CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronLeft, User as UserIcon, ArrowRight, XCircle, ListTodo, Medal, Calendar, ThumbsUp, ThumbsDown, Star, LayoutList, ChevronDown, Check } from 'lucide-react';
import { Task, TaskStatus, StaffMember, Department, User, UserRole, Evaluation } from '../../../types';
import { isTimePassed } from '../../../actions/taskTimeUtils';
import { TaskCard } from '../tasks/TaskCard';
import { API_CONFIG } from '../../../config/apiConfig';

interface TeamOverviewProps {
  tasks: Task[];
  staff: StaffMember[];
  departments: Department[];
  currentUser: User;
  onUpdateStatus?: (id: number, status: TaskStatus) => void;
  onUpdateTitle?: (id: number, title: string) => void;
  onDeleteTask?: (id: number) => void;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ 
  tasks, 
  staff, 
  departments, 
  currentUser,
  onUpdateStatus,
  onUpdateTitle,
  onDeleteTask
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [filterDays, setFilterDays] = useState<string>("30");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>(() => {
    const saved = localStorage.getItem('app_member_evaluations');
    return saved ? JSON.parse(saved) : {};
  });

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    localStorage.setItem('app_member_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize string để so sánh
  const normalize = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Trọng số sắp xếp vai trò (Quản lý lên đầu)
  const getRoleWeight = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 0;
      case UserRole.ADMIN: return 1;
      case UserRole.MANAGER: return 2;
      default: return 3;
    }
  };

  // Lọc Task theo thời gian
  const filteredTasksByPeriod = useMemo(() => {
    const days = parseInt(filterDays);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate >= cutoffDate;
    });
  }, [tasks, filterDays]);

  const getTasksForMember = (member: StaffMember, allTasks: Task[]) => {
    return allTasks.filter(t => {
      if (Number(t.assigneeId) === Number(member.id)) return true;
      const label = normalize(t.assigneeLabel || '');
      const name = normalize(member.fullName || '');
      const user = normalize(member.username || '');
      return label === name || label === user;
    });
  };

  const handleUpdateEvaluation = async (userId: number, type: 'excellent' | 'good' | 'bad') => {
    const evalKey = `${userId}_${filterDays}`;
    const newEval: Evaluation = {
      userId,
      excellent: type === 'excellent',
      good: type === 'good',
      bad: type === 'bad',
      period: filterDays
    };

    setEvaluations(prev => ({ ...prev, [evalKey]: newEval }));

    // Gửi Webhook
    const url = localStorage.getItem('system_task_webhook_url') || API_CONFIG.TASK_WEBHOOK_URL;
    if (url && url.startsWith('http')) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_evaluation',
          user: currentUser.username,
          data: {
            userid: userId,
            excellent: newEval.excellent,
            good: newEval.good,
            bad: newEval.bad,
            period: filterDays
          },
          timestamp: Math.floor(Date.now() / 1000)
        }),
        mode: 'cors'
      }).catch(err => console.error("Lỗi gửi đánh giá:", err));
    }
  };

  const departmentStats = useMemo(() => {
    const activeDepts = isAdmin
      ? departments
      : departments.filter(d => String(d.id) === String(currentUser.departmentId));

    return activeDepts.map(dept => {
      const deptStaff = staff.filter(s => {
        const sDept = normalize(String(s.department || ''));
        const dId = normalize(String(dept.id));
        const dName = normalize(String(dept.name));
        return sDept === dId || sDept === dName;
      });

      const processedMembers = deptStaff.map(s => {
        const userTasks = getTasksForMember(s, filteredTasksByPeriod);
        const evalKey = `${s.id}_${filterDays}`;
        const currentEval = evaluations[evalKey];
        const doneCount = userTasks.filter(t => t.status === TaskStatus.DONE).length;
        const totalCount = userTasks.length;
        const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        return {
          ...s,
          evaluation: currentEval,
          completionRate,
          stats: {
            total: totalCount,
            done: doneCount,
            doing: userTasks.filter(t => t.status === TaskStatus.DOING).length,
            pending: userTasks.filter(t => t.status === TaskStatus.PENDING).length,
            cancelled: userTasks.filter(t => t.status === TaskStatus.CANCELLED).length,
            overdue: userTasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length,
          }
        };
      })
      // Sắp xếp: Quản lý (Admin/Manager) lên đầu, sau đó là Tên
      .sort((a, b) => {
        const weightA = getRoleWeight(a.role);
        const weightB = getRoleWeight(b.role);
        if (weightA !== weightB) return weightA - weightB;
        return a.fullName.localeCompare(b.fullName);
      });

      const deptTasks = filteredTasksByPeriod.filter(t => 
        processedMembers.some(m => Number(m.id) === Number(t.assigneeId) || normalize(t.assigneeLabel) === normalize(m.fullName))
      );

      return {
        ...dept,
        memberCount: deptStaff.length,
        taskStats: {
          total: deptTasks.length,
          done: deptTasks.filter(t => t.status === TaskStatus.DONE).length,
          doing: deptTasks.filter(t => t.status === TaskStatus.DOING).length,
          pending: deptTasks.filter(t => t.status === TaskStatus.PENDING).length,
          cancelled: deptTasks.filter(t => t.status === TaskStatus.CANCELLED).length,
          overdue: deptTasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length,
        },
        members: processedMembers
      };
    });
  }, [filteredTasksByPeriod, staff, departments, currentUser, isAdmin, evaluations, filterDays]);

  const globalStats = useMemo(() => {
    const done = filteredTasksByPeriod.filter(t => t.status === TaskStatus.DONE).length;
    const doing = filteredTasksByPeriod.filter(t => t.status === TaskStatus.DOING).length;
    const pending = filteredTasksByPeriod.filter(t => t.status === TaskStatus.PENDING).length;
    const cancelled = filteredTasksByPeriod.filter(t => t.status === TaskStatus.CANCELLED).length;
    const overdue = filteredTasksByPeriod.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length;
    return { totalStaff: staff.length, done, doing, pending, cancelled, overdue };
  }, [filteredTasksByPeriod, staff]);

  const selectedDept = useMemo(() => 
    departmentStats.find(d => Number(d.id) === Number(selectedDeptId)), 
  [departmentStats, selectedDeptId]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return staff.find(s => Number(s.id) === Number(selectedMemberId));
  }, [staff, selectedMemberId]);

  const memberTasks = useMemo(() => {
    if (!selectedMemberId || !selectedMember) return [];
    return getTasksForMember(selectedMember, filteredTasksByPeriod).sort((a, b) => b.id - a.id);
  }, [filteredTasksByPeriod, selectedMember, selectedMemberId]);

  const timeOptions = [
    { value: '7', label: '07 NGÀY QUA', desc: 'Dữ liệu tuần qua' },
    { value: '14', label: '14 NGÀY QUA', desc: 'Dữ liệu nửa tháng' },
    { value: '30', label: '30 NGÀY QUA', desc: 'Dữ liệu tháng qua' },
  ];

  if (selectedMemberId && selectedMember) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedMemberId(null)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[12px] font-[900] text-slate-500 hover:text-indigo-600 transition-all shadow-sm group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> QUAY LẠI
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-[900] text-slate-900 uppercase tracking-tight">{selectedMember.fullName}</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Lọc trong {filterDays} ngày qua</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
                { label: 'Hoàn thành', val: memberTasks.filter(t => t.status === TaskStatus.DONE).length, color: 'emerald' },
                { label: 'Đang làm', val: memberTasks.filter(t => t.status === TaskStatus.DOING).length, color: 'indigo' },
                { label: 'Mới', val: memberTasks.filter(t => t.status === TaskStatus.PENDING).length, color: 'blue' },
                { label: 'Hủy', val: memberTasks.filter(t => t.status === TaskStatus.CANCELLED).length, color: 'slate' },
                { label: 'Tồn đọng', val: memberTasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length, color: 'rose' },
            ].map(s => (
                <div key={s.label} className={`bg-${s.color}-50/50 p-4 rounded-2xl border border-${s.color}-100 flex flex-col items-center`}>
                    <p className={`text-[9px] font-black text-${s.color}-600 uppercase mb-1 tracking-wider`}>{s.label}</p>
                    <p className={`text-xl font-[900] text-${s.color}-700`}>{s.val}</p>
                </div>
            ))}
        </div>
        <div className="space-y-4">
          {memberTasks.length === 0 ? (
            <div className="bg-white rounded-[32px] p-20 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
               <ListTodo size={48} className="mb-4 text-slate-200" />
               <p className="font-black text-xs uppercase tracking-widest text-slate-400">Không có dữ liệu trong thời gian này</p>
            </div>
          ) : (
            memberTasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdateStatus={onUpdateStatus || (() => {})} onUpdateTitle={onUpdateTitle || (() => {})} onDelete={onDeleteTask} currentUser={currentUser} />
            ))
          )}
        </div>
      </div>
    );
  }

  if (selectedDeptId && selectedDept) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setSelectedDeptId(null)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[12px] font-[900] text-slate-500 hover:text-indigo-600 transition-all shadow-sm">
            <ChevronLeft size={18} /> QUAY LẠI TỔNG QUAN
          </button>
          
          <div className="relative ml-auto" ref={timeDropdownRef}>
            <div 
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="flex items-center gap-4 bg-white pl-5 pr-4 h-[56px] rounded-[24px] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group"
            >
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Calendar size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Thời gian:</p>
                    <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{filterDays} NGÀY QUA</p>
                  </div>
               </div>
               <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${showTimeDropdown ? 'rotate-180 text-indigo-500' : ''}`} />
            </div>

            {showTimeDropdown && (
              <div className="absolute top-[calc(100%+12px)] right-0 w-64 bg-white rounded-[32px] border border-slate-100 shadow-2xl z-[100] p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                  Chọn khoảng thời gian
                </div>
                {timeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilterDays(opt.value);
                      setShowTimeDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                      filterDays === opt.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-left">
                       <p className={`text-[11px] font-black uppercase tracking-tight ${filterDays === opt.value ? 'text-indigo-600' : 'text-slate-800'}`}>
                         {opt.label}
                       </p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{opt.desc}</p>
                    </div>
                    {filterDays === opt.value && <Check size={16} strokeWidth={4} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-[900] text-slate-900 uppercase tracking-tighter leading-none">{selectedDept.name}</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">Phòng ban</p>
          </div>
        </div>

        <div className="space-y-4">
          {selectedDept.members.map(member => (
            <div key={member.id} className="bg-white rounded-[32px] p-6 border border-slate-50 shadow-sm hover:shadow-xl transition-all flex flex-col xl:flex-row xl:items-center gap-6 group relative border-b-4 border-b-transparent hover:border-b-indigo-500">
              <div onClick={() => setSelectedMemberId(Number(member.id))} className="flex items-center gap-5 xl:w-[320px] shrink-0 cursor-pointer">
                <div className="w-16 h-16 bg-slate-50 rounded-[22px] flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 border border-slate-100 shrink-0 transition-colors relative">
                  <UserIcon size={32} />
                  {member.evaluation?.excellent && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-lg animate-bounce z-10 border-2 border-white">
                       <Medal size={14} strokeWidth={3} />
                    </div>
                  )}
                  {member.evaluation?.bad && (
                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg z-10 border-2 border-white">
                       <AlertCircle size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xl font-[900] text-slate-800 truncate leading-none mb-3 uppercase tracking-tight flex items-center gap-2">
                    {member.fullName}
                    {member.evaluation?.bad && <AlertCircle size={18} className="text-rose-500 animate-pulse shrink-0" />}
                    {member.evaluation?.excellent && <Medal size={18} className="text-amber-500 shrink-0" />}
                  </h4>
                  
                  {/* Thanh tiến độ xử lý công việc */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiến độ công việc</span>
                      <span className="text-[10px] font-black text-indigo-600">{member.completionRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${member.completionRate}%` }} 
                        className={`h-full transition-all duration-1000 ${
                          member.completionRate > 80 ? 'bg-emerald-500' : 
                          member.completionRate > 50 ? 'bg-indigo-500' : 'bg-rose-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 flex-1">
                {[
                  { label: 'Tổng', val: member.stats.total, color: 'slate' },
                  { label: 'Xong', val: member.stats.done, color: 'emerald' },
                  { label: 'Đang làm', val: member.stats.doing, color: 'indigo' },
                  { label: 'Mới', val: member.stats.pending, color: 'blue' },
                  { label: 'Hủy', val: member.stats.cancelled, color: 'slate' },
                  { label: 'Tồn đọng', val: member.stats.overdue, color: 'rose' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50/50 p-4 rounded-2xl border border-${s.color}-100 flex flex-col items-center shadow-sm`}>
                    <p className={`text-[8px] font-black text-${s.color}-600 uppercase mb-1 tracking-wider`}>{s.label}</p>
                    <p className="text-xl font-[900] text-slate-800 leading-none">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Bảng đánh giá cho từng nhân viên */}
              <div className="flex flex-col gap-2 xl:w-[120px] shrink-0 border-l border-slate-100 pl-6">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Đánh giá</p>
                 <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleUpdateEvaluation(member.id, 'excellent')}
                      title="Xuất sắc"
                      className={`p-2 rounded-xl border transition-all ${member.evaluation?.excellent ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-300 hover:bg-amber-50 hover:text-amber-500'}`}
                    >
                       <Star size={16} fill={member.evaluation?.excellent ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={() => handleUpdateEvaluation(member.id, 'good')}
                      title="Tốt"
                      className={`p-2 rounded-xl border transition-all ${member.evaluation?.good ? 'bg-indigo-100 border-indigo-300 text-indigo-600 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-300 hover:bg-indigo-50 hover:text-indigo-500'}`}
                    >
                       <ThumbsUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleUpdateEvaluation(member.id, 'bad')}
                      title="Tệ"
                      className={`p-2 rounded-xl border transition-all ${member.evaluation?.bad ? 'bg-rose-100 border-rose-300 text-rose-600 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-300 hover:bg-rose-50 hover:text-rose-500'}`}
                    >
                       <ThumbsDown size={16} />
                    </button>
                 </div>
              </div>
              
              <div onClick={() => setSelectedMemberId(Number(member.id))} className="hidden xl:flex w-14 h-14 rounded-[20px] bg-slate-50 items-center justify-center text-slate-200 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-all shrink-0 cursor-pointer">
                 <ArrowRight size={24} strokeWidth={3} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Tổng nhân sự', val: globalStats.totalStaff, color: 'slate', icon: Users },
          { label: 'Hoàn thành', val: globalStats.done, color: 'emerald', icon: CheckCircle2 },
          { label: 'Đang làm', val: globalStats.doing, color: 'indigo', icon: Clock },
          { label: 'Mới', val: globalStats.pending, color: 'blue', icon: AlertCircle },
          { label: 'Hủy', val: globalStats.cancelled, color: 'slate', icon: XCircle },
          { label: 'Tồn đọng', val: globalStats.overdue, color: 'rose', icon: AlertCircle },
        ].map(s => (
          <div key={s.label} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 bg-${s.color}-50 text-${s.color}-600 rounded-xl`}><s.icon size={18}/></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
             </div>
             <p className={`text-3xl font-[900] text-${s.color === 'slate' ? 'slate-900' : s.color + '-600'} leading-none`}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <h3 className="text-xl font-[900] text-slate-900 uppercase tracking-tight flex items-center gap-3 px-1">
           <Briefcase className="text-indigo-600" /> Phân bổ phòng ban
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departmentStats.map(dept => (
            <div key={dept.id} onClick={() => setSelectedDeptId(Number(dept.id))} className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all cursor-pointer group relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h4 className="text-2xl font-[900] text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{dept.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">{dept.memberCount} thành viên</p>
                </div>
                <div className="w-14 h-14 bg-slate-50 group-hover:bg-indigo-500 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-sm">
                  <TrendingUp size={28} />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2.5 relative z-10">
                 {[
                   { label: 'Xong', val: dept.taskStats.done, color: 'emerald' },
                   { label: 'Đang làm', val: dept.taskStats.doing, color: 'indigo' },
                   { label: 'Mới', val: dept.taskStats.pending, color: 'blue' },
                   { label: 'Hủy', val: dept.taskStats.cancelled, color: 'slate' },
                   { label: 'Trễ', val: dept.taskStats.overdue, color: 'rose' },
                 ].map(s => (
                   <div key={s.label} className={`bg-${s.color}-50/60 p-4 rounded-[22px] border border-${s.color}-100/50 flex flex-col items-center`}>
                      <p className={`text-[8px] font-black text-${s.color}-600 uppercase mb-1.5 tracking-wider`}>{s.label}</p>
                      <p className="text-xl font-[900] text-slate-800 leading-none">{s.val}</p>
                   </div>
                 ))}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -translate-y-16 translate-x-16 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
