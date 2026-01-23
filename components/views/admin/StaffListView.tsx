
import React, { useState, useEffect, useMemo } from 'react';
import { User as UserIcon, BadgeCheck, RefreshCw, Plus, Trash2, CheckCircle, X, AlertCircle, Mail, Phone, Shield, Circle } from 'lucide-react';
import { StaffMember, UserRole, Department } from '../../../types';
import { StaffDetailsModal } from './StaffDetailsModal';
import { HARDCODED_DEPARTMENTS } from '../../../constants';
import { API_CONFIG } from '../../../config/apiConfig';
import { addLog } from '../../../actions/logger';

export const StaffListView: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('app_staff_list_v1');
    return saved ? JSON.parse(saved) : [
      { id: 1, fullName: 'Nguyễn Văn Admin', username: 'admin', password: '123', role: UserRole.ADMIN, email: 'admin@system.com', phone: '0901 234 567', active: true, department: '1', joinDate: '2023-01-01' },
    ];
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
    localStorage.setItem('app_staff_list_v1', JSON.stringify(staffMembers));
    window.dispatchEvent(new Event('app_data_updated'));
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

  const robustParseJSON = (rawText: string) => {
    try {
      return JSON.parse(rawText);
    } catch (e) {
      const fixedText = rawText.replace(/"data":\s*({[\s\S]*})\s*}/g, (match, p1) => {
        if (p1.includes('}, {')) return `"data": [${p1}]}`;
        return match;
      });
      return JSON.parse(fixedText);
    }
  };

  const handleSync = async () => {
    const url = localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
    if (!url || !url.startsWith('http')) {
      showToast("Chưa cấu hình Webhook URL", "error");
      return;
    }
    
    setIsSyncing(true);
    addLog({ type: 'REMOTE', status: 'PENDING', action: 'SYNC_STAFF', message: 'Đang tải dữ liệu nhân sự...' });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_STAFF', timestamp: new Date().toISOString() }),
        mode: 'cors'
      });
      
      const rawText = await response.text();
      const result = robustParseJSON(rawText);
      
      let processedList: StaffMember[] = [];
      if (result.status === "success" && Array.isArray(result.data)) {
        processedList = result.data.map((item: any) => item.data?.member || item.member || item).filter(Boolean);
      } else if (Array.isArray(result)) {
        processedList = result;
      }

      if (processedList.length > 0) {
        setStaffMembers(processedList);
        showToast(`Đồng bộ thành công ${processedList.length} nhân sự`);
        addLog({ type: 'REMOTE', status: 'SUCCESS', action: 'SYNC_STAFF', message: `Đã cập nhật danh sách nhân sự.` });
      } else {
        showToast("Không tìm thấy dữ liệu hợp lệ", "error");
      }
    } catch (e: any) {
      showToast("Lỗi dữ liệu: " + e.message, "error");
      addLog({ type: 'REMOTE', status: 'ERROR', action: 'SYNC_STAFF', message: 'Lỗi: ' + e.message });
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
              {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase tracking-wider">THÀNH CÔNG</p>
              <p className="text-[10px] font-bold opacity-80 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">Danh sách nhân sự</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1 pl-1">Quản trị hệ thống thành viên</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={isSyncing} className="flex items-center gap-2.5 bg-white border border-slate-100 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-md transition-all">
            <RefreshCw size={16} strokeWidth={3} className={`${isSyncing ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
            {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ MAKE'}
          </button>
          <button onClick={() => { setSelectedMember(null); setIsDetailsOpen(true); }} className="flex items-center gap-2.5 bg-indigo-600 text-white px-7 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus size={18} strokeWidth={4} /> THÊM MỚI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staffMembers.map((member) => (
          <div key={member.id} onClick={() => { setSelectedMember(member); setIsDetailsOpen(true); }} className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-2xl shadow-slate-200/40 hover:shadow-indigo-100/60 transition-all group cursor-pointer active:scale-[0.98] border-b-[6px] border-b-transparent hover:border-b-indigo-500 overflow-hidden">
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
      </div>

      <StaffDetailsModal isOpen={isDetailsOpen} member={selectedMember} onClose={() => setIsDetailsOpen(false)} onSave={handleSaveStaff} isLoading={isSubmitting} />
    </div>
  );
};
