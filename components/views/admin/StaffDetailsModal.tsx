
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, User as UserIcon, Mail, Phone, Briefcase, Shield, Save, Key, Eye, EyeOff, ChevronDown, Check, ShieldCheck, ShieldAlert, UserCheck, GraduationCap } from 'lucide-react';
import { StaffMember, UserRole, Department } from '../../../types';
import { HARDCODED_DEPARTMENTS } from '../../../constants';

interface StaffDetailsModalProps {
  member: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: StaffMember) => void;
  isLoading?: boolean;
}

export const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({ member, isOpen, onClose, onSave, isLoading }) => {
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
    joinDate: ''
  });

  // Dropdown states
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const departments = useMemo((): Department[] => {
    const saved = localStorage.getItem('app_department_list_v2');
    if (saved) return JSON.parse(saved);
    return HARDCODED_DEPARTMENTS.map(d => ({ 
      ...d, 
      createdAt: new Date().toISOString().split('T')[0],
      description: d.description || '' 
    })) as Department[];
  }, [isOpen]);

  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName,
        username: member.username || '',
        password: member.password || '',
        role: member.role,
        email: member.email,
        phone: member.phone,
        active: member.active,
        department: member.department || '',
        joinDate: member.joinDate || ''
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
    setShowDeptDropdown(false);
    setShowRoleDropdown(false);
  }, [member, isOpen]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) setShowDeptDropdown(false);
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) setShowRoleDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDeptName = useMemo(() => {
    if (!formData.department) return 'CHƯA PHÂN PHÒNG';
    const dept = departments.find(d => String(d.id) === String(formData.department));
    return dept ? dept.name.toUpperCase() : 'PHÒNG BAN KHÔNG XÁC ĐỊNH';
  }, [formData.department, departments]);

  const roleOptions = [
    { value: UserRole.SUPER_ADMIN, label: 'SUPER ADMIN', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { value: UserRole.ADMIN, label: 'ADMIN', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { value: UserRole.MANAGER, label: 'QUẢN LÝ', icon: UserCheck, color: 'text-sky-600', bg: 'bg-sky-50' },
    { value: UserRole.STAFF, label: 'NHÂN VIÊN', icon: UserIcon, color: 'text-slate-600', bg: 'bg-slate-50' },
    { value: UserRole.INTERN, label: 'THỰC TẬP', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const selectedRole = roleOptions.find(r => r.value === formData.role) || roleOptions[3];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalId = member?.id;
    if (!finalId) {
      const savedStaff = localStorage.getItem('app_staff_list_v1');
      const staffList: StaffMember[] = savedStaff ? JSON.parse(savedStaff) : [];
      const maxId = staffList.reduce((max, s) => (Number(s.id) > max ? Number(s.id) : max), 0);
      finalId = maxId + 1;
    }
    onSave({ id: finalId, ...formData });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto scrollbar-hide">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in slide-in-from-bottom-10 duration-500 overflow-hidden flex flex-col">
        <div className="h-24 bg-[#1e1b4b] relative shrink-0">
          <button onClick={onClose} type="button" className="absolute top-5 right-7 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-xl border border-white/10 group active:scale-90">
            <X size={20} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-10 pb-10 -mt-12 relative">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-white p-1 rounded-[28px] shadow-2xl relative z-10 border border-slate-50">
              <div className="w-full h-full bg-slate-50 rounded-[22px] flex items-center justify-center text-slate-300 border border-slate-100">
                 <UserIcon size={44} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Họ tên nhân viên</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all font-bold text-slate-800 text-sm shadow-sm"
                  placeholder="Họ và tên..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Tài khoản</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all font-bold text-slate-800 text-sm shadow-sm"
                  placeholder="username"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Email liên hệ</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all font-bold text-slate-800 text-sm shadow-sm"
                  placeholder="email@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all font-bold text-slate-800 text-sm shadow-sm"
                  placeholder="09xx.xxx.xxx"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!member}
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 focus:bg-white transition-all font-bold text-slate-800 text-sm shadow-sm"
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Custom Department Dropdown */}
              <div className="space-y-1.5 relative" ref={deptRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Phòng ban</label>
                <div 
                  onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white hover:border-indigo-300 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className={`${formData.department ? 'text-indigo-500' : 'text-slate-300'}`} />
                    <span className="text-[10px] font-black text-slate-800 uppercase">{selectedDeptName}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-300 transition-transform ${showDeptDropdown ? 'rotate-180 text-indigo-500' : ''}`} />
                </div>
                
                {showDeptDropdown && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden">
                    <div className="max-h-[220px] overflow-y-auto scrollbar-hide">
                      <button
                        type="button"
                        onClick={() => { setFormData(p => ({ ...p, department: '' })); setShowDeptDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${!formData.department ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        <span className="text-[10px] font-black uppercase">CHƯA PHÂN PHÒNG</span>
                        {!formData.department && <Check size={14} strokeWidth={3} />}
                      </button>
                      {departments.map(dept => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => { setFormData(p => ({ ...p, department: String(dept.id) })); setShowDeptDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${String(formData.department) === String(dept.id) ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="text-[10px] font-black uppercase">{dept.name}</span>
                          {String(formData.department) === String(dept.id) && <Check size={14} strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Role Dropdown */}
              <div className="space-y-1.5 relative" ref={roleRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Phân quyền</label>
                <div 
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white hover:border-indigo-300 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <selectedRole.icon size={16} className={selectedRole.color} />
                    <span className="text-[10px] font-black text-slate-800 uppercase">{selectedRole.label}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-300 transition-transform ${showRoleDropdown ? 'rotate-180 text-indigo-500' : ''}`} />
                </div>

                {showRoleDropdown && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden">
                    {roleOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setFormData(p => ({ ...p, role: opt.value })); setShowRoleDropdown(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all mb-1 last:mb-0 ${formData.role === opt.value ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className={`w-8 h-8 ${opt.bg} ${opt.color} rounded-lg flex items-center justify-center`}>
                            <opt.icon size={16} />
                          </div>
                          <span className={`text-[10px] font-black uppercase ${formData.role === opt.value ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {opt.label}
                          </span>
                        </div>
                        {formData.role === opt.value && <Check size={14} strokeWidth={3} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl mt-auto h-[58px]">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${formData.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hoạt động</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                  className={`w-11 h-6 rounded-full transition-all relative p-1 flex items-center ${formData.active ? 'bg-[#34d399]' : 'bg-slate-300'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-[#5b61f1] text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-sm uppercase tracking-[0.25em] flex items-center justify-center gap-3 active:scale-[0.98] mt-10"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={20} strokeWidth={3} />
                LƯU THÔNG TIN NHÂN SỰ
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
