
import React, { useState, useEffect, useMemo } from 'react';
import { X, Briefcase, AlignLeft, Users, Star, Save, User as UserIcon, Plus, Check, Search, UserMinus } from 'lucide-react';
import { Department, StaffMember } from '../../../types';

interface DepartmentDetailsModalProps {
  department: Department | null;
  staffMembers: StaffMember[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (dept: Department, membersToUpdate: number[]) => void;
  isLoading?: boolean;
}

export const DepartmentDetailsModal: React.FC<DepartmentDetailsModalProps> = ({ 
  department, 
  staffMembers, 
  isOpen, 
  onClose, 
  onSave,
  isLoading 
}) => {
  const [formData, setFormData] = useState<Omit<Department, 'id' | 'createdAt'>>({
    name: '',
    code: '',
    description: '',
    managerId: undefined
  });

  const [assignedMemberIds, setAssignedMemberIds] = useState<number[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code || '',
        description: department.description,
        managerId: department.managerId
      });
      const currentIds = staffMembers
        .filter(m => String(m.department) === String(department.id) || m.department === department.name)
        .map(m => Number(m.id));
      setAssignedMemberIds(currentIds);
    } else {
      setFormData({ name: '', code: '', description: '', managerId: undefined });
      setAssignedMemberIds([]);
    }
    setShowAddPanel(false);
    setSearchTerm('');
  }, [department, isOpen, staffMembers]);

  const currentDeptMembers = useMemo(() => {
    return staffMembers.filter(m => assignedMemberIds.includes(Number(m.id)));
  }, [staffMembers, assignedMemberIds]);

  const availableToAdd = useMemo(() => {
    return staffMembers.filter(m => {
      const isNotAssigned = !assignedMemberIds.includes(Number(m.id));
      const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      return isNotAssigned && matchesSearch;
    });
  }, [staffMembers, assignedMemberIds, searchTerm]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalId = department?.id;
    if (!finalId) {
      // Logic tạo ID tự động tăng cho phòng ban mới
      const savedDepts = localStorage.getItem('app_department_list_v2');
      const deptList: Department[] = savedDepts ? JSON.parse(savedDepts) : [];
      const maxId = deptList.reduce((max, d) => (Number(d.id) > max ? Number(d.id) : max), 0);
      finalId = maxId + 1;
    }

    onSave({
      id: finalId,
      createdAt: department?.createdAt || new Date().toISOString().split('T')[0],
      ...formData
    }, assignedMemberIds);
  };

  const toggleMember = (id: number) => {
    setAssignedMemberIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[850px] bg-white rounded-[40px] shadow-2xl border border-slate-50 animate-in zoom-in slide-in-from-bottom-4 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-28 bg-gradient-to-r from-slate-900 to-indigo-950 relative shrink-0">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl transition-all">
            <X size={18} />
          </button>
          <div className="absolute -bottom-10 left-10 flex items-center gap-6">
             <div className="w-24 h-24 bg-white p-1.5 rounded-[28px] shadow-xl">
                <div className="w-full h-full bg-slate-50 rounded-[22px] flex items-center justify-center text-indigo-600 border border-slate-100">
                   <Briefcase size={40} />
                </div>
             </div>
             <div className="mb-[-10px]">
                <h3 className="text-2xl font-black text-white drop-shadow-lg">{department ? department.name : 'Phòng ban mới'}</h3>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Quản lý tổ chức</p>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-16 px-10 pb-10 overflow-y-auto scrollbar-hide flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Info Section */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên bộ phận</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quản lý trực tiếp</label>
                <select
                    value={formData.managerId}
                    onChange={e => setFormData(p => ({ ...p, managerId: Number(e.target.value) }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-xs appearance-none cursor-pointer"
                >
                    <option value="">CHỌN QUẢN LÝ</option>
                    {staffMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName.toUpperCase()}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả chức năng</label>
                <textarea
                    rows={5}
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm resize-none shadow-sm"
                />
              </div>
            </div>

            {/* Members Section */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <Users size={14} className="text-indigo-600" /> THÀNH VIÊN ({currentDeptMembers.length})
                 </h4>
                 <button type="button" onClick={() => setShowAddPanel(!showAddPanel)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${showAddPanel ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                   {showAddPanel ? 'Đóng tìm kiếm' : 'Thêm nhân sự'}
                 </button>
              </div>

              {showAddPanel ? (
                <div className="bg-slate-50 rounded-[30px] p-5 border border-indigo-100 animate-in slide-in-from-top-4">
                  <input 
                    type="text"
                    placeholder="TÌM THEO TÊN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none mb-4 shadow-sm"
                  />
                  <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                    {availableToAdd.map(m => (
                      <div key={m.id} onClick={() => toggleMember(Number(m.id))} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-50 hover:border-indigo-400 cursor-pointer group transition-all">
                        <span className="text-xs font-black text-slate-800">{m.fullName}</span>
                        <Plus size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 rounded-[30px] border border-slate-100 p-2 min-h-[300px] max-h-[400px] overflow-y-auto scrollbar-hide">
                   {currentDeptMembers.map(m => (
                     <div key={m.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-50 mb-2 shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px]">
                              {m.fullName.charAt(0)}
                           </div>
                           <span className="text-[12px] font-black text-slate-800">{m.fullName}</span>
                        </div>
                        <button type="button" onClick={() => toggleMember(Number(m.id))} className="p-1.5 text-slate-200 hover:text-rose-500 transition-colors">
                           <UserMinus size={16} />
                        </button>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 mt-10 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={18} strokeWidth={3} />
                LƯU THAY ĐỔI PHÒNG BAN
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
