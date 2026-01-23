
import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Mail, Phone, Shield, Briefcase, Calendar, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { StaffMember, UserRole } from '../../../types';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: StaffMember) => void;
  initialData?: StaffMember | null;
  isLoading?: boolean;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, onSave, initialData, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Omit<StaffMember, 'id'>>({
    fullName: '',
    username: '',
    password: '',
    role: UserRole.STAFF,
    email: '',
    phone: '',
    active: true,
    department: '',
    joinDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        username: initialData.username || '',
        password: initialData.password || '',
        role: initialData.role,
        email: initialData.email,
        phone: initialData.phone,
        active: initialData.active,
        department: initialData.department || '',
        joinDate: initialData.joinDate || ''
      });
    } else {
      setFormData({
        fullName: '',
        username: '',
        password: '',
        role: UserRole.STAFF,
        email: '',
        phone: '',
        active: true,
        department: '',
        joinDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowPassword(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let newId: number;
    if (initialData) {
      newId = initialData.id;
    } else {
      const savedStaff = localStorage.getItem('app_staff_list_v1');
      const staffList: StaffMember[] = savedStaff ? JSON.parse(savedStaff) : [];
      const maxId = staffList.reduce((max, s) => (s.id > max ? s.id : max), 0);
      newId = maxId + 1;
    }

    onSave({
      id: newId,
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
              {initialData ? 'Cập nhật nhân sự' : 'Thêm nhân sự mới'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vui lòng nhập đầy đủ thông tin</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Họ và tên</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Vai trò hệ thống</label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <select
                  value={formData.role}
                  onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 appearance-none"
                >
                  <option value={UserRole.STAFF}>Nhân viên (Staff)</option>
                  <option value={UserRole.ADMIN}>Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Tài khoản</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Mật khẩu</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!initialData}
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Email liên hệ</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="email@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Số điện thoại</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="0901 234 567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Phòng ban</label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="VD: Kỹ thuật, Kinh doanh..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Ngày vào làm</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={e => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div>
                <p className="text-[12px] font-black text-slate-800">Trạng thái tài khoản</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Cho phép truy cập hệ thống</p>
             </div>
             <button
               type="button"
               onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
               className={`w-14 h-8 rounded-full transition-all relative p-1 ${formData.active ? 'bg-indigo-600' : 'bg-slate-300'}`}
             >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </button>
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
                   LƯU THÔNG TIN
                 </>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
