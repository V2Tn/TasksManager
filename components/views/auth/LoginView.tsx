
import React, { useState } from 'react';
import { Lock, User as UserIcon, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { User, UserRole, StaffMember } from '../../../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const savedStaff = localStorage.getItem('app_staff_list_v1');
      const staffList: StaffMember[] = savedStaff ? JSON.parse(savedStaff) : [];

      if (username.toLowerCase() === 'admin' && password === 'admin') {
        onLogin({
          id: 1,
          username: 'admin',
          fullName: 'Quản trị viên',
          role: UserRole.ADMIN,
          isManager: true
        });
        return;
      }

      const foundUser = staffList.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      );

      if (foundUser) {
        if (!foundUser.active) {
          setError("Tài khoản của bạn hiện đang bị khóa.");
          return;
        }

        onLogin({
          id: Number(foundUser.id),
          username: foundUser.username,
          fullName: foundUser.fullName,
          role: foundUser.role,
          isManager: foundUser.isManager
        });
      } else {
        setError("Tài khoản hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 selection:bg-indigo-100 font-sans">
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[28px] text-white shadow-2xl shadow-indigo-200 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <ShieldCheck size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Đăng nhập</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Hệ thống quản lý Task</p>
        </div>

        <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl shadow-slate-200/60 border border-slate-50 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Tài khoản</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
                  placeholder="Nhập tài khoản"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black py-6 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-base uppercase tracking-widest">Đăng nhập</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
