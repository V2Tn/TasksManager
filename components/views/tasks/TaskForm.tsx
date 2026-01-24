
import React, { useState, useMemo } from 'react';
import { Plus, Users, CheckSquare, Square } from 'lucide-react';
import { Quadrant, TaskStatus, User, UserRole, StaffMember } from '../../../types';
import { QUADRANT_CONFIG } from '../../../constants';
import { getCurrentTimeFormatted, getEndOfDayTimeFormatted } from '../../../actions/taskTimeUtils';

interface TaskFormProps {
  onAdd: (task: any) => void;
  currentUser: User | null;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onAdd, currentUser }) => {
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<Quadrant>(Quadrant.Q1);
  const [startTime, setStartTime] = useState(getCurrentTimeFormatted());
  const [endTime, setEndTime] = useState(getEndOfDayTimeFormatted());
  
  const [isAssigning, setIsAssigning] = useState(false);
  const [assigneeId, setAssigneeId] = useState<number>(currentUser?.id || 0);

  const canAssign = useMemo(() => {
    return currentUser?.role === UserRole.ADMIN || 
           currentUser?.role === UserRole.SUPER_ADMIN || 
           currentUser?.role === UserRole.MANAGER || 
           currentUser?.isManager === true;
  }, [currentUser]);

  const staffList = useMemo(() => {
    const saved = localStorage.getItem('app_staff_list_v1');
    const members: StaffMember[] = saved ? JSON.parse(saved) : [];
    
    return members.filter(m => {
      if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) {
        return m.id !== currentUser.id;
      }
      if (currentUser?.role === UserRole.MANAGER) {
        const isSameDept = String(m.department) === String(currentUser.departmentId);
        const isNotSelf = m.id !== currentUser.id;
        const isSubordinate = m.role === UserRole.STAFF || m.role === UserRole.INTERN;
        return isSameDept && isNotSelf && isSubordinate;
      }
      return false;
    });
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalAssigneeId = currentUser?.id || 0;
    let finalAssigneeLabel = currentUser?.fullName || 'Tôi';

    if (isAssigning && canAssign && assigneeId !== currentUser?.id) {
      const selected = staffList.find(s => s.id === assigneeId);
      if (selected) {
        finalAssigneeId = selected.id;
        finalAssigneeLabel = selected.fullName;
      }
    }

    onAdd({
      title,
      quadrant,
      status: TaskStatus.PENDING,
      startTime,
      endTime,
      createdById: currentUser?.id || 0,
      createdByLabel: currentUser?.fullName || 'Tôi',
      assigneeId: finalAssigneeId,
      assigneeLabel: finalAssigneeLabel
    });

    setTitle('');
    setIsAssigning(false);
    setAssigneeId(currentUser?.id || 0);
  };

  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 w-full relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Thêm công việc mới</h3>
        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
           <Plus size={16} className="text-slate-400" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bạn cần làm gì hôm nay?"
            className={`w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 shadow-sm ${
              quadrant === Quadrant.Q1 ? 'focus:ring-rose-50 focus:border-rose-400' :
              quadrant === Quadrant.Q2 ? 'focus:ring-sky-50 focus:border-sky-400' :
              quadrant === Quadrant.Q3 ? 'focus:ring-indigo-50 focus:border-indigo-400' :
              'focus:ring-slate-50 focus:border-slate-400'
            }`}
          />
        </div>

        {/* Tăng khoảng cách margin-top cho phần phân loại */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {(Object.values(Quadrant) as Quadrant[]).map((q) => {
            const config = QUADRANT_CONFIG[q];
            const isSelected = quadrant === q;
            let selectedStyles = '';
            let dotStyles = '';
            let titleStyles = '';

            if (isSelected) {
              if (q === Quadrant.Q1) {
                selectedStyles = 'border-rose-500 ring-2 ring-rose-50 bg-[#fffafa] shadow-md';
                dotStyles = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
                titleStyles = 'text-rose-700';
              } else if (q === Quadrant.Q2) {
                selectedStyles = 'border-sky-500 ring-2 ring-sky-50 bg-[#fcfdff] shadow-md';
                dotStyles = 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]';
                titleStyles = 'text-sky-700';
              } else if (q === Quadrant.Q3) {
                selectedStyles = 'border-indigo-500 ring-2 ring-indigo-50 bg-[#fafafe] shadow-md';
                dotStyles = 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]';
                titleStyles = 'text-indigo-700';
              } else {
                selectedStyles = 'border-slate-500 ring-2 ring-slate-100 bg-[#f9fafb] shadow-md';
                dotStyles = 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]';
                titleStyles = 'text-slate-700';
              }
            }

            return (
              <button
                key={q}
                type="button"
                onClick={() => setQuadrant(q)}
                className={`p-3 rounded-2xl border text-left transition-all relative h-20 flex flex-col justify-center ${
                  isSelected ? selectedStyles : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? titleStyles : 'text-slate-500'}`}>{config.title}</div>
                <div className="text-[8px] text-slate-400 leading-tight mt-1.5 font-bold uppercase tracking-tight">{config.description}</div>
                {isSelected && <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${dotStyles}`} />}
              </button>
            );
          })}
        </div>

        {canAssign && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAssigning(!isAssigning)}
              className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-2 -ml-2 rounded-xl transition-colors"
            >
              <div className={`transition-colors ${isAssigning ? (quadrant === Quadrant.Q1 ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-300'}`}>
                {isAssigning ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={2} />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isAssigning ? 'text-slate-900' : 'text-slate-400'}`}>
                Giao việc cho người khác
              </span>
            </button>

            {isAssigning && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors ${quadrant === Quadrant.Q1 ? 'group-focus-within:text-rose-500' : 'group-focus-within:text-indigo-500'}`}>
                    <Users size={14} />
                  </div>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-black text-slate-800 text-[10px] appearance-none cursor-pointer"
                  >
                    <option value={currentUser?.id}>{currentUser?.fullName} (TÔI)</option>
                    {staffList.map(m => <option key={m.id} value={m.id}>{m.fullName.toUpperCase()} ({m.role.replace('_', ' ')})</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bắt đầu</label>
            <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-50 shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hết hạn</label>
            <input type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-50 shadow-sm" />
          </div>
        </div>

        <button type="submit" disabled={!title.trim()} className={`w-full text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] group ${quadrant === Quadrant.Q1 ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : quadrant === Quadrant.Q2 ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-100' : quadrant === Quadrant.Q3 ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-slate-600 hover:bg-slate-700 shadow-slate-100'} disabled:opacity-50`}>
          <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
          <span className="text-xs uppercase tracking-widest">Thêm công việc</span>
        </button>
      </form>
    </div>
  );
};
