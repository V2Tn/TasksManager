
import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, ShieldCheck, AlertCircle, Eye, EyeOff, X, Zap, Loader2, RefreshCw } from 'lucide-react';
import { User, UserRole, StaffMember } from '../../../types';
import { syncStaffDataFromServer } from '../../../actions/authActions';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

interface RecentAccount {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  isManager?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('app_recent_accounts_v1');
    if (saved) {
      setRecentAccounts(JSON.parse(saved));
    }
  }, []);

  const removeRecent = (e: React.MouseEvent, usernameToRemove: string) => {
    e.stopPropagation();
    const updated = recentAccounts.filter(a => a.username !== usernameToRemove);
    setRecentAccounts(updated);
    localStorage.setItem('app_recent_accounts_v1', JSON.stringify(updated));
  };

  const handleQuickLogin = (account: RecentAccount) => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: account.id,
        username: account.username,
        fullName: account.fullName,
        role: account.role,
        isManager: account.isManager
      });
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);
    setSyncStatus(null);

    try {
      const isTryingAdmin = username.toLowerCase() === 'admin';
      
      if (isTryingAdmin && password === 'admin') {
        onLogin({ id: 1, username: 'admin', fullName: 'Quản trị viên', role: UserRole.ADMIN, isManager: true });
        return;
      }

      // Luôn đồng bộ dữ liệu mới nhất trước khi kiểm tra (Đặc biệt cho người dùng system vừa tạo)
      setSyncStatus("Đang xác thực thông tin tài khoản...");
      let staffList: StaffMember[] = [];
      try {
        staffList = await syncStaffDataFromServer();
      } catch (syncErr: any) {
        const savedStaff = localStorage.getItem('app_staff_list_v1');
        staffList = savedStaff ? JSON.parse(savedStaff) : [];
      }

      const foundUser = staffList.find(u => 
        u.username.toLowerCase() === username.trim().toLowerCase() && 
        String(u.password) === String(password).trim()
      );

      if (foundUser) {
        if (!foundUser.active) {
          setError("Tài khoản này hiện đang bị tạm khóa.");
          setIsLoading(false);
          return;
        }

        onLogin({
          id: Number(foundUser.id),
          username: foundUser.username,
          fullName: foundUser.fullName,
          role: foundUser.role,
          isManager: foundUser.isManager,
          departmentId: foundUser.department
        });
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      setError("Hệ thống gặp sự cố. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 selection:bg-indigo-100 font-['Lexend']">
      <div className="w-full max-w-[800px] animate-in fade-in zoom-in duration-700 flex flex-col items-center">
        
        {/* Logo Shield Section */}
        <div className="relative mb-10 group">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 group-hover:scale-[1.8] transition-transform duration-700"></div>
          <div className="relative inline-flex items-center justify-center w-48 h-48 bg-gradient-to-br from-[#5b61f1] to-[#7c3aed] rounded-[64px] text-white shadow-[0_35px_60px_-15px_rgba(79,70,229,0.3)] border border-white/20 transform hover:rotate-3 transition-transform duration-500">
            <ShieldCheck size={100} strokeWidth={2} />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-7xl md:text-8xl font-[900] text-[#0f172a] tracking-tight mb-16 uppercase">Kim Tâm Cát</h1>

        {/* Recent Accounts Panel (Optional - Slide-in) */}
        {recentAccounts.length > 0 && (
          <div className="w-full max-w-[650px] mb-12 animate-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-4 mb-6 px-4">
                <Zap size={22} className="text-amber-500 fill-amber-500" />
                <h2 className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em]">Truy cập nhanh</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {recentAccounts.map((account) => (
                <div 
                  key={account.username}
                  onClick={() => handleQuickLogin(account)}
                  className="group relative bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer flex items-center gap-6 active:scale-95"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {account.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-black text-slate-900 truncate leading-none uppercase tracking-tight">{account.fullName}</p>
                    <p className="text-[12px] font-black text-indigo-400 uppercase mt-2.5 tracking-[0.15em]">{account.role.replace('_', ' ')}</p>
                  </div>
                  <button 
                    onClick={(e) => removeRecent(e, account.username)}
                    className="absolute top-4 right-4 p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={18} strokeWidth={4} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Login Form Container */}
        <div className="w-full max-w-[650px] bg-white rounded-[80px] p-20 md:p-24 shadow-[0_80px_150px_-30px_rgba(79,70,229,0.25)] border-2 border-slate-50 relative overflow-hidden ring-1 ring-slate-100/50">
          
          <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
            {syncStatus && (
              <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[32px] flex items-center gap-6 animate-pulse">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" strokeWidth={3} />
                <p className="text-[14px] font-black text-indigo-700 uppercase tracking-tight">{syncStatus}</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] flex items-center gap-6 animate-in shake duration-300">
                <AlertCircle size={32} className="text-rose-500 shrink-0" strokeWidth={3} />
                <p className="text-[15px] font-black text-rose-700 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            {/* Input Account */}
            <div className="space-y-6">
              <label className="text-[16px] font-black text-slate-400 uppercase tracking-[0.35em] ml-6 block">Tài khoản</label>
              <div className="relative group">
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5b61f1] transition-colors">
                  <UserIcon size={36} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-28 pr-12 py-9 bg-slate-50 border-4 border-transparent rounded-[48px] outline-none focus:border-[#5b61f1] focus:bg-white transition-all font-black text-slate-800 text-2xl placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="Username"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-6">
              <label className="text-[16px] font-black text-slate-400 uppercase tracking-[0.35em] ml-6 block">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5b61f1] transition-colors">
                  <Lock size={36} strokeWidth={2.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-28 pr-28 py-9 bg-slate-50 border-4 border-transparent rounded-[48px] outline-none focus:border-[#5b61f1] focus:bg-white transition-all font-black text-slate-800 text-2xl placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#5b61f1] transition-colors p-3"
                >
                  {showPassword ? <EyeOff size={36} strokeWidth={2.5} /> : <Eye size={36} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#5b61f1] to-[#7c3aed] hover:from-[#4a4ec4] hover:to-[#6d32ce] disabled:from-[#a5a3ff] disabled:to-[#c4b5fd] text-white font-[900] py-10 rounded-[48px] shadow-[0_30px_60px_-15px_rgba(91,97,241,0.4)] transition-all flex items-center justify-center gap-6 transform active:scale-[0.97] mt-12 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin" strokeWidth={3} />
                  <span className="text-2xl uppercase tracking-[0.3em]">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl uppercase tracking-[0.35em]">Đăng nhập ngay</span>
                </>
              )}
            </button>
          </form>

          {/* Background Decorative Element */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl"></div>
        </div>
        
        {/* Footer Version Info */}
        <p className="text-center mt-24 text-slate-400 font-black text-[14px] uppercase tracking-[0.4em] opacity-40">
          VERSION 2.5.0 • POWERED BY KIM TÂM CÁT PRO
        </p>
      </div>
      
      <style>{`
        input::placeholder { font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; font-size: 18px; opacity: 0.3; }
        .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};
