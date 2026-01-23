
import React, { useState, useEffect } from 'react';
import { X, Save, Briefcase, AlignLeft, User } from 'lucide-react';
import { Department, StaffMember } from '../../../types';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dept: Department) => void;
  initialData?: Department | null;
  isLoading?: boolean;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({ isOpen, onClose, onSave, initialData, isLoading }) => {
  const [formData, setFormData] = useState<Omit<Department, 'id' | 'createdAt'>>({
    name: '',
    code: '',
    description: '',
    managerId: undefined
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  useEffect(() => {
    const savedStaff = localStorage.getItem('app_staff_list_v1');
    if (savedStaff) setStaffMembers(JSON.parse(savedStaff));
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        code: initialData.code || '',
        description: initialData.description,
        managerId: initialData.managerId
      });
    } else {
      setFormData({ name: '', code: '', description: '', managerId: undefined });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let newId: number;
    if (initialData) {
      newId = initialData.id;
    } else {
      const savedDepts = localStorage.getItem('app_department_list_v1');
      const deptList: Department[] = savedDepts ? JSON.parse(savedDepts) : [];
      const maxId = deptList.reduce((max, d) => (d.id > max ? d.id : max), 0);
      newId = maxId + 1;
    }

    onSave({
      id: newId,
      createdAt: initialData?.createdAt || new Date().toISOString().split('T')[0],
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[600px] bg-white rounded-[40px] shadow-2xl border border-slate-50 animate-in zoom-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Cập nhật phòng ban' : 'Thêm phòng ban mới'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vui lòng nhập đầy đủ thông tin</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Tên phòng ban</label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="VD: Phòng Hành chính Nhân sự"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Quản lý (Trưởng phòng)</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <select
                  value={formData.managerId}
                  onChange={e => setFormData(prev => ({ ...prev, managerId: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 appearance-none"
                >
                  <option value="">Chọn người quản lý</option>
                  {staffMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Mô tả chức năng</label>
              <div className="relative group">
                <AlignLeft className="absolute left-4 top-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 resize-none"
                  placeholder="Nhập mô tả về vai trò của phòng ban..."
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button
               type="button"
               onClick={onClose}
               className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-sm uppercase tracking-wider"
             >
               HỦY BỎ
             </button>
             <button
               type="submit"
               disabled={isLoading}
               className="flex-[2] px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
             >
               {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <>
                   <Save size={18} />
                   LƯU PHÒNG BAN
                 </>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
