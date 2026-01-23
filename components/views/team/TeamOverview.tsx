
import React, { useMemo, useState } from 'react';
import { Users, Briefcase, CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronLeft, User as UserIcon, ArrowRight, XCircle, ListTodo } from 'lucide-react';
import { Task, TaskStatus, StaffMember, Department, User, UserRole } from '../../../types';
import { isTimePassed } from '../../../actions/taskTimeUtils';
import { TaskCard } from '../tasks/TaskCard';

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

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  // 1. Lọc danh sách nhân sự được phép xem
  const visibleStaff = useMemo(() => {
    if (isAdmin) return staff;
    return staff.filter(m => String(m.department) === String(currentUser.departmentId));
  }, [staff, currentUser, isAdmin]);

  const visibleStaffIds = useMemo(() => visibleStaff.map(s => s.id), [visibleStaff]);

  // 2. Thống kê theo phòng ban (chỉ hiện phòng ban của mình nếu là Manager)
  const departmentStats = useMemo(() => {
    const activeDepts = isAdmin
      ? departments
      : departments.filter(d => String(d.id) === String(currentUser.departmentId));

    return activeDepts.map(dept => {
      const deptStaff = staff.filter(s => String(s.department) === String(dept.id));
      const deptStaffIds = deptStaff.map(s => s.id);
      const deptTasks = tasks.filter(t => deptStaffIds.includes(t.assigneeId));

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
        members: deptStaff.map(s => {
          const userTasks = tasks.filter(t => t.assigneeId === s.id);
          return {
            ...s,
            stats: {
              total: userTasks.length,
              done: userTasks.filter(t => t.status === TaskStatus.DONE).length,
              doing: userTasks.filter(t => t.status === TaskStatus.DOING).length,
              pending: userTasks.filter(t => t.status === TaskStatus.PENDING).length,
              cancelled: userTasks.filter(t => t.status === TaskStatus.CANCELLED).length,
              overdue: userTasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length,
            }
          };
        })
      };
    });
  }, [tasks, staff, departments, currentUser, isAdmin]);

  // 3. Thống kê tổng thể (Dựa trên những gì User được thấy)
  const globalStats = useMemo(() => {
    const relevantTasks = tasks.filter(t => visibleStaffIds.includes(t.assigneeId));
    return {
      totalStaff: visibleStaff.length,
      done: relevantTasks.filter(t => t.status === TaskStatus.DONE).length,
      doing: relevantTasks.filter(t => t.status === TaskStatus.DOING).length,
      pending: relevantTasks.filter(t => t.status === TaskStatus.PENDING).length,
      cancelled: relevantTasks.filter(t => t.status === TaskStatus.CANCELLED).length,
      overdue: relevantTasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length,
    };
  }, [tasks, visibleStaff, visibleStaffIds]);

  const selectedDept = useMemo(() => 
    departmentStats.find(d => Number(d.id) === Number(selectedDeptId)), 
  [departmentStats, selectedDeptId]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return staff.find(s => s.id === selectedMemberId);
  }, [staff, selectedMemberId]);

  const memberTasks = useMemo(() => {
    if (!selectedMemberId) return [];
    return tasks.filter(t => t.assigneeId === selectedMemberId)
                .sort((a, b) => b.id - a.id);
  }, [tasks, selectedMemberId]);

  // VIEW 3: CHI TIẾT CÔNG VIỆC CỦA NHÂN VIÊN
  if (selectedMemberId && selectedMember) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedMemberId(null)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[12px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            QUAY LẠI PHÒNG BAN
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedMember.fullName}</h2>
            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1">Danh sách công việc chi tiết</p>
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
                    <p className={`text-[10px] font-black text-${s.color}-600 uppercase mb-1 tracking-wider`}>{s.label}</p>
                    <p className={`text-xl font-black text-${s.color}-700`}>{s.val}</p>
                </div>
            ))}
        </div>

        <div className="space-y-4">
          {memberTasks.length === 0 ? (
            <div className="bg-white rounded-[32px] p-20 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40 text-center">
               <ListTodo size={48} className="mb-4 text-slate-200" />
               <p className="font-black text-sm uppercase tracking-widest text-slate-400">Chưa có công việc nào được giao</p>
            </div>
          ) : (
            memberTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdateStatus={onUpdateStatus || (() => {})} 
                onUpdateTitle={onUpdateTitle || (() => {})}
                onDelete={onDeleteTask}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // VIEW 2: CHI TIẾT PHÒNG BAN
  if (selectedDeptId && selectedDept) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedDeptId(null)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[12px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            QUAY LẠI TỔNG QUAN
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedDept.name}</h2>
            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1">Thống kê nhân sự trong bộ phận</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {selectedDept.members.length === 0 ? (
            <div className="bg-white rounded-[40px] p-24 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
               <Users size={64} className="mb-4 text-slate-200" />
               <p className="font-black text-sm uppercase tracking-[0.2em] text-slate-400">Phòng ban này chưa có nhân sự</p>
            </div>
          ) : (
            selectedDept.members.map(member => (
              <div 
                key={member.id} 
                onClick={() => setSelectedMemberId(member.id)}
                className="bg-white rounded-[32px] p-6 border border-slate-50 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row lg:items-center gap-6 group cursor-pointer"
              >
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-16 h-16 bg-slate-50 rounded-[22px] flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 border border-slate-100 shrink-0 transition-colors">
                    <UserIcon size={32} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xl font-black text-slate-800 truncate leading-none">{member.fullName}</h4>
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">{member.role.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{member.username}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 lg:w-[750px]">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center shadow-sm group-hover:bg-white transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Tổng</p>
                    <p className="text-xl font-black text-slate-800 leading-none">{member.stats.total}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center shadow-sm">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 tracking-wider">Hoàn thành</p>
                    <p className="text-xl font-black text-emerald-700 leading-none">{member.stats.done}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center shadow-sm">
                    <p className="text-[9px] font-black text-indigo-600 uppercase mb-1.5 tracking-wider">Đang làm</p>
                    <p className="text-xl font-black text-indigo-700 leading-none">{member.stats.doing}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center shadow-sm">
                    <p className="text-[9px] font-black text-blue-600 uppercase mb-1.5 tracking-wider">Mới</p>
                    <p className="text-xl font-black text-blue-700 leading-none">{member.stats.pending}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center shadow-sm">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-wider">Hủy</p>
                    <p className="text-xl font-black text-slate-700 leading-none">{member.stats.cancelled}</p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col items-center shadow-sm ring-1 ring-rose-200/50">
                    <p className="text-[9px] font-black text-rose-600 uppercase mb-1.5 tracking-wider">Tồn đọng</p>
                    <p className="text-xl font-black text-rose-700 leading-none">{member.stats.overdue}</p>
                  </div>
                </div>
                
                <div className="hidden lg:flex w-14 h-14 rounded-[20px] bg-slate-50 items-center justify-center text-slate-200 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-all border border-transparent group-hover:border-indigo-100">
                   <ArrowRight size={24} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // VIEW 1: TỔNG QUAN (ADMIN thấy hết, Manager thấy phòng ban mình)
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl"><Users size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng nhân sự</span>
           </div>
           <p className="text-3xl font-black text-slate-900 leading-none">{globalStats.totalStaff}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hoàn thành</span>
           </div>
           <p className="text-3xl font-black text-emerald-600 leading-none">{globalStats.done}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Clock size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Đang làm</span>
           </div>
           <p className="text-3xl font-black text-indigo-600 leading-none">{globalStats.doing}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><AlertCircle size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mới</span>
           </div>
           <p className="text-3xl font-black text-blue-600 leading-none">{globalStats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl"><XCircle size={20}/></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hủy</span>
           </div>
           <p className="text-3xl font-black text-slate-600 leading-none">{globalStats.cancelled}</p>
        </div>
        <div className="bg-rose-50/30 p-6 rounded-[32px] border border-rose-100 shadow-sm hover:shadow-md transition-shadow ring-1 ring-rose-100/50">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200"><AlertCircle size={20}/></div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest whitespace-nowrap">Tồn đọng</span>
           </div>
           <p className="text-3xl font-black text-rose-600 leading-none">{globalStats.overdue}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
             <Briefcase className="text-indigo-600" /> Phân bổ theo phòng ban
          </h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departmentStats.map(dept => (
            <div 
              key={dept.id} 
              onClick={() => setSelectedDeptId(dept.id)}
              className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h4 className="text-2xl font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{dept.name}</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-3">{dept.memberCount} thành viên đội ngũ</p>
                </div>
                <div className="w-14 h-14 bg-slate-50 group-hover:bg-indigo-500 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-200">
                  <TrendingUp size={28} />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 relative z-10">
                 <div className="bg-emerald-50/60 p-4 rounded-[22px] border border-emerald-100/50 flex flex-col items-center">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 tracking-wider">Hoàn thành</p>
                    <p className="text-xl font-black text-emerald-700 leading-none">{dept.taskStats.done}</p>
                 </div>
                 <div className="bg-indigo-50/60 p-4 rounded-[22px] border border-indigo-100/50 flex flex-col items-center">
                    <p className="text-[9px] font-black text-indigo-600 uppercase mb-1.5 tracking-wider">Đang làm</p>
                    <p className="text-xl font-black text-indigo-700 leading-none">{dept.taskStats.doing}</p>
                 </div>
                 <div className="bg-blue-50/60 p-4 rounded-[22px] border border-blue-100/50 flex flex-col items-center">
                    <p className="text-[9px] font-black text-blue-600 uppercase mb-1.5 tracking-wider">Mới</p>
                    <p className="text-xl font-black text-blue-800 leading-none">{dept.taskStats.pending}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-[22px] border border-slate-200 flex flex-col items-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-wider">Hủy</p>
                    <p className="text-xl font-black text-slate-800 leading-none">{dept.taskStats.cancelled}</p>
                 </div>
                 <div className="bg-rose-50/60 p-4 rounded-[22px] border border-rose-200/50 flex flex-col items-center ring-1 ring-rose-100">
                    <p className="text-[9px] font-black text-rose-600 uppercase mb-1.5 tracking-wider">Tồn đọng</p>
                    <p className="text-xl font-black text-rose-800 leading-none">{dept.taskStats.overdue}</p>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-5 relative z-10">
                 <div className="flex items-center justify-between">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tiến độ tổng quát</p>
                   <span className="text-[11px] font-black text-indigo-600 group-hover:translate-x-1 transition-transform uppercase">XEM CHI TIẾT →</span>
                 </div>
                 <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    {dept.taskStats.total > 0 ? (
                      <>
                        <div style={{width: `${(dept.taskStats.done/dept.taskStats.total)*100}%`}} className="h-full bg-emerald-500 transition-all duration-1000" />
                        <div style={{width: `${(dept.taskStats.doing/dept.taskStats.total)*100}%`}} className="h-full bg-indigo-500 transition-all duration-1000" />
                        <div style={{width: `${(dept.taskStats.pending/dept.taskStats.total)*100}%`}} className="h-full bg-blue-500 transition-all duration-1000" />
                        <div style={{width: `${(dept.taskStats.overdue/dept.taskStats.total)*100}%`}} className="h-full bg-rose-500 transition-all duration-1000" />
                      </>
                    ) : <div className="w-full h-full bg-slate-200" />}
                 </div>
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -translate-y-16 translate-x-16 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
