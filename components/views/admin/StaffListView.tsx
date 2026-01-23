
import React, { useState, useEffect } from 'react';
import { User as UserIcon, RefreshCw, Plus, Trash2, CheckCircle, X, AlertCircle, Mail, Phone } from 'lucide-react';
import { StaffMember, UserRole, Department } from '../../../types';
import { StaffDetailsModal } from './StaffDetailsModal';
import { HARDCODED_DEPARTMENTS } from '../../../constants';
import { syncStaffDataFromServer } from '../../../actions/authActions';

export const StaffListView: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('app_staff_list_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('app_department_list_v2');
    if (saved) return JSON.parse(saved);
    return HARDCODED_DEPARTMENTS.map(d => ({ ...d, createdAt: new Date().toISOString().split('T')[0] }));
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleDataUpdate = () => {
      const saved = localStorage.getItem('app_staff_list_v1');
      if (saved) setStaffMembers(JSON.parse(saved));
    };
    window.addEventListener('app_data_updated', handleDataUpdate);
    return () => window.removeEventListener('app_data_updated', handleDataUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_staff_list_v1', JSON.stringify(staffMembers));
  }, [staffMembers]);

  const getDeptName = (deptIdOrName: string | undefined) => {
    if (!deptIdOrName) return 'Chưa phân phòng';
    const matched = departments.find(d => String(d.id) === String(deptIdOrName) || d.name === deptIdOrName);
    return matched ? matched.name : deptIdOrName;
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const freshStaff = await syncStaffDataFromServer();
      setStaffMembers(freshStaff);
      showToast(`Đồng bộ thành công ${freshStaff.length} nhân sự`);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveStaff = (memberData: StaffMember) => {
    setIsSubmitting(true);
    setStaffMembers(prev => {
      const exists = prev.some(m => m.id === memberData.id);
      return exists ? prev.map(m => m.id === memberData.id ? memberData : m) : [memberData, ...prev];
    });
    showToast(`Đã lưu nhân sự ${memberData.fullName}`);
    setIsDetailsOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-20 px-1 relative">
      {toast && (
        <div className="fixed top-24 right-8 z-[2000] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className={`px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-4 border min-w-[320px] backdrop-blur-md ${
            toast.type === 'success' ? 'bg-slate-900/95 border-white/10 text-white' : 'bg-rose-600 border-rose-500 text-white'
          }`}>
            <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-indigo-500' : 'bg-white/20'}`}>
              <CheckCircle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase tracking-wider">{toast.type === 'success' ? 'THÀNH CÔNG' : 'LỖI HỆ THỐNG'}</p>
              <p className="text-[10px] font-bold opacity-80 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase font-['Lexend']">Danh sách nhân sự</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1 pl-1 font-['Lexend']">Quản trị hệ thống thành viên</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={isSyncing} className="flex items-center gap-2.5 bg-white border border-slate-100 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95 group font-['Lexend']">
            <RefreshCw size={16} strokeWidth={3} className={`${isSyncing ? 'animate-spin text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500'}`} />
            {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ MAKE'}
          </button>
          <button onClick={() => { setSelectedMember(null); setIsDetailsOpen(true); }} className="flex items-center gap-2.5 bg-indigo-600 text-white px-7 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 font-['Lexend']">
            <Plus size={18} strokeWidth={4} /> THÊM MỚI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staffMembers.map((member) => (
          <div key={member.id} onClick={() => { setSelectedMember(member); setIsDetailsOpen(true); }} className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-2xl shadow-slate-200/40 hover:shadow-indigo-100/60 transition-all group cursor-pointer active:scale-[0.98] border-b-[6px] border-b-transparent hover:border-b-indigo-500 overflow-hidden font-['Lexend']">
            <div className="flex items-center gap-6 mb-6">
               <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all shrink-0 border border-slate-100">
                  <UserIcon size={40} />
               </div>
               <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-xl leading-tight truncate">{member.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                     <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">{getDeptName(member.department)}</span>
                     <span className="text-slate-200 font-bold">•</span>
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{member.role}</span>
                  </div>
               </div>
            </div>
            <div className="space-y-3 py-6 border-y border-slate-50">
               <div className="flex items-center gap-3 text-slate-500">
                  <Mail size={14} strokeWidth={3} className="text-slate-300" />
                  <span className="text-[12px] font-bold truncate">{member.email}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-500">
                  <Phone size={14} strokeWidth={3} className="text-slate-300" />
                  <span className="text-[12px] font-black tracking-tight">{member.phone || 'N/A'}</span>
               </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
               <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${member.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  {member.active ? 'ĐANG HOẠT ĐỘNG' : 'TẠM KHÓA'}
               </div>
               <button onClick={(e) => { e.stopPropagation(); setStaffMembers(p => p.filter(m => m.id !== member.id)); }} className="p-2.5 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        {staffMembers.length === 0 && !isSyncing && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
            <UserIcon size={48} strokeWidth={1} />
            <p className="mt-4 font-black text-sm uppercase tracking-widest font-['Lexend']">Chưa có dữ liệu nhân sự</p>
            <button onClick={handleSync} className="mt-4 text-indigo-500 font-black text-[10px] uppercase tracking-widest hover:underline font-['Lexend']">Đồng bộ ngay</button>
          </div>
        )}
      </div>

      <StaffDetailsModal isOpen={isDetailsOpen} member={selectedMember} onClose={() => setIsDetailsOpen(false)} onSave={handleSaveStaff} isLoading={isSubmitting} />
    </div>
  );
};
