
import { Briefcase, RefreshCw, Plus, Trash2, Users, CheckCircle, X, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Department, StaffMember } from '../../../types';
import { DepartmentDetailsModal } from './DepartmentDetailsModal';
import { SYSTEM_DEFAULTS, HARDCODED_DEPARTMENTS } from '../../../constants';
import { API_CONFIG } from '../../../config/apiConfig';
import { addLog } from '../../../actions/logger';

export const DepartmentListView: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('app_department_list_v2');
    if (saved) return JSON.parse(saved);
    return HARDCODED_DEPARTMENTS.map(d => ({ ...d, createdAt: new Date().toISOString().split('T')[0] }));
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('app_staff_list_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const syncData = () => {
      const savedStaff = localStorage.getItem('app_staff_list_v1');
      if (savedStaff) setStaffMembers(JSON.parse(savedStaff));
    };
    window.addEventListener('app_data_updated', syncData);
    return () => window.removeEventListener('app_data_updated', syncData);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_department_list_v2', JSON.stringify(departments));
    window.dispatchEvent(new Event('app_data_updated'));
  }, [departments]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getAdminWebhookUrl = () => {
    return localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
  };

  const sendAdminWebhook = async (action: string, data: any) => {
    const url = getAdminWebhookUrl();
    if (!url || !url.startsWith('http')) return;
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');
      
      // Chuyển đổi các trường thời gian trong data sang Unix Epoch nếu có
      const dataForMake = { ...data };
      if (dataForMake.createdAt) dataForMake.createdAt = Math.floor(new Date(dataForMake.createdAt).getTime() / 1000);
      if (dataForMake.updatedAt) dataForMake.updatedAt = Math.floor(new Date(dataForMake.updatedAt).getTime() / 1000);
      
      // Xử lý sâu hơn nếu data chứa object lồng nhau (VD: { department: ..., memberIds: ... })
      if (dataForMake.department && dataForMake.department.createdAt) {
          dataForMake.department.createdAt = Math.floor(new Date(dataForMake.department.createdAt).getTime() / 1000);
      }

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          performedBy: currentUser.username || 'admin',
          data: dataForMake,
          timestamp: Math.floor(Date.now() / 1000) // Chuyển sang Unix Epoch
        }),
        mode: 'cors'
      });
    } catch (e) {
      console.error("Webhook Error:", e);
    }
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
    const url = getAdminWebhookUrl();
    if (!url || !url.startsWith('http')) return showToast("Chưa cấu hình URL", "error");
    
    setIsSyncing(true);
    addLog({ type: 'REMOTE', status: 'PENDING', action: 'SYNC_DEPT', message: 'Đang xử lý gói dữ liệu phòng ban...' });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'SYNC_DEPARTMENTS', 
          timestamp: Math.floor(Date.now() / 1000) // Chuyển sang Unix Epoch
        }),
        mode: 'cors'
      });
      
      const rawText = await response.text();
      const result = robustParseJSON(rawText);
      let processedList: Department[] = [];

      if (result.status === "success" && Array.isArray(result.data)) {
        processedList = result.data.map((item: any) => item.data?.department || item.department || item).filter(Boolean);
      } else if (Array.isArray(result)) {
        processedList = result;
      }
      
      if (processedList.length > 0) {
        setDepartments(processedList);
        showToast(`Đã đồng bộ ${processedList.length} phòng ban`);
      }
    } catch (e: any) {
      showToast("Lỗi đồng bộ: " + e.message, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveDept = (deptData: Department, membersToUpdate: number[]) => {
    const isUpdate = departments.some(d => Number(d.id) === Number(deptData.id));

    setDepartments(prev => {
      return isUpdate ? prev.map(d => Number(d.id) === Number(deptData.id) ? deptData : d) : [deptData, ...prev];
    });

    const currentFullStaff = JSON.parse(localStorage.getItem('app_staff_list_v1') || '[]');
    const updatedStaff = currentFullStaff.map((member: StaffMember) => {
      const isSelected = membersToUpdate.includes(Number(member.id));
      const isCurrentlyInThisDept = String(member.department) === String(deptData.id);

      if (isSelected) {
        return { ...member, department: String(deptData.id) };
      } else if (isCurrentlyInThisDept) {
        return { ...member, department: "" };
      }
      return member;
    });

    localStorage.setItem('app_staff_list_v1', JSON.stringify(updatedStaff));
    setStaffMembers(updatedStaff);
    window.dispatchEvent(new Event('app_data_updated'));

    // Gọi Webhook đồng bộ
    sendAdminWebhook(isUpdate ? 'UPDATE_DEPT' : 'CREATE_DEPT', {
      department: deptData,
      memberIds: membersToUpdate
    });

    showToast(`Đã cập nhật ${deptData.name}`);
    setIsDetailsOpen(false);
  };

  const handleDeleteDept = (id: number) => {
    const dept = departments.find(d => Number(d.id) === Number(id));
    if (dept && window.confirm(`Xóa phòng ban "${dept.name}"? Nhân sự trong phòng sẽ trở về trạng thái "Chưa phân phòng".`)) {
      setDepartments(prev => prev.filter(d => Number(d.id) !== Number(id)));
      
      const currentFullStaff = JSON.parse(localStorage.getItem('app_staff_list_v1') || '[]');
      const updatedStaff = currentFullStaff.map((m: StaffMember) => 
        String(m.department) === String(id) ? { ...m, department: "" } : m
      );
      
      localStorage.setItem('app_staff_list_v1', JSON.stringify(updatedStaff));
      setStaffMembers(updatedStaff);
      window.dispatchEvent(new Event('app_data_updated'));

      // Gọi Webhook xóa
      sendAdminWebhook('DELETE_DEPT', dept);

      showToast("Đã xóa phòng ban");
    }
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
              <p className="text-[11px] font-black uppercase tracking-wider">CẬP NHẬT</p>
              <p className="text-[10px] font-bold opacity-80 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">Sơ đồ tổ chức</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1 pl-1">Cơ cấu phòng ban nội bộ</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={isSyncing} className="bg-white border border-slate-100 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 shadow-sm transition-all flex items-center gap-2">
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> ĐỒNG BỘ
          </button>
          <button onClick={() => { setSelectedDept(null); setIsDetailsOpen(true); }} className="bg-indigo-600 text-white px-7 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95">
            + THÊM PHÒNG BAN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {departments.map((dept) => {
          const memberCount = staffMembers.filter(m => String(m.department) === String(dept.id)).length;

          return (
            <div key={dept.id} onClick={() => { setSelectedDept(dept); setIsDetailsOpen(true); }} className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-2xl shadow-slate-200/40 hover:shadow-indigo-100/60 transition-all cursor-pointer group flex flex-col h-full border-b-4 border-b-transparent hover:border-b-indigo-500">
              <div className="flex items-center gap-5 mb-5">
                <div className="w-16 h-16 bg-slate-50 rounded-[22px] flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors shrink-0 border border-slate-100">
                  <Briefcase size={32} />
                </div>
                <h3 className="font-black text-slate-900 text-lg truncate leading-tight uppercase tracking-tight">{dept.name}</h3>
              </div>
              <p className="text-xs text-slate-500 font-bold leading-relaxed line-clamp-2 min-h-[40px] mb-6">{dept.description || 'Thông tin phòng ban...'}</p>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-2.5 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
                    <Users size={14} className="text-indigo-500" strokeWidth={3} />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{memberCount} NHÂN VIÊN</span>
                 </div>
                 
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }} className="p-2.5 text-slate-200 hover:text-rose-500 transition-all">
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>
          );
        })}
      </div>
      <DepartmentDetailsModal isOpen={isDetailsOpen} department={selectedDept} staffMembers={staffMembers} onClose={() => setIsDetailsOpen(false)} onSave={handleSaveDept} />
    </div>
  );
};
