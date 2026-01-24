
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
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) return;

    setIsLoading(true);
    setError(null);
    setSyncStatus(null);

    try {
      if (cleanUsername === 'admin' && cleanPassword === 'admin') {
        onLogin({ id: 1, username: 'admin', fullName: 'Quản trị viên', role: UserRole.ADMIN, isManager: true });
        return;
      }

      setSyncStatus("Đang đồng bộ dữ liệu...");
      let staffList: StaffMember[] = [];
      try {
        staffList = await syncStaffDataFromServer();
      } catch (syncErr: any) {
        const savedStaff = localStorage.getItem('app_staff_list_v1');
        staffList = savedStaff ? JSON.parse(savedStaff) : [];
      }

      const foundUser = staffList.find(u => 
        u.username.toLowerCase() === cleanUsername && 
        String(u.password) === cleanPassword
      );

      if (foundUser) {
        if (!foundUser.active) {
          setError("Tài khoản đang bị tạm khóa.");
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
        setError("Tài khoản hoặc mật khẩu không đúng.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi xác thực hệ thống.");
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 selection:bg-indigo-100 font-['Lexend']">
      <div className="w-full max-w-[500px] animate-in fade-in zoom-in duration-700 flex flex-col items-center">
        
        {/* Logo Section - Cân đối lại */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full scale-150"></div>
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#5b61f1] to-[#7c3aed] rounded-[32px] text-white shadow-2xl border border-white/20 transform hover:rotate-3 transition-transform duration-500">
            <ShieldCheck size={48} strokeWidth={2} />
          </div>
        </div>

        {/* Brand Title - Tinh tế hơn */}
        <h1 className="text-4xl md:text-5xl font-[900] text-[#0f172a] tracking-tighter mb-12 uppercase">Kim Tâm Cát</h1>

        {/* Quick Access Panel - Gọn gàng hơn */}
        {recentAccounts.length > 0 && (
          <div className="w-full mb-10 animate-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-3 mb-4 px-2">
                <Zap size={16} className="text-amber-500 fill-amber-500" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Truy cập nhanh</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recentAccounts.map((account) => (
                <div 
                  key={account.username}
                  onClick={() => handleQuickLogin(account)}
                  className="group relative bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer flex items-center gap-4 active:scale-95"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {account.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900 truncate leading-none uppercase tracking-tight">{account.fullName}</p>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1.5 tracking-wider">{account.role.replace('_', ' ')}</p>
                  </div>
                  <button 
                    onClick={(e) => removeRecent(e, account.username)}
                    className="absolute top-2 right-2 p-1.5 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Login Form Container - Đưa về kích thước chuẩn */}
        <div className="w-full bg-white rounded-[48px] p-10 md:p-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] border border-slate-50 relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {syncStatus && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" strokeWidth={3} />
                <p className="text-[11px] font-black text-indigo-700 uppercase tracking-tight">{syncStatus}</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 animate-in shake duration-300">
                <AlertCircle size={20} className="text-rose-500 shrink-0" strokeWidth={3} />
                <p className="text-[11px] font-black text-rose-700 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 block">Tài khoản</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5b61f1] transition-colors">
                  <UserIcon size={20} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-[#5b61f1] focus:bg-white transition-all font-bold text-slate-800 text-sm placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 block">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5b61f1] transition-colors">
                  <Lock size={20} strokeWidth={2.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-[#5b61f1] focus:bg-white transition-all font-bold text-slate-800 text-sm placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#5b61f1] transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#5b61f1] hover:bg-[#4a4ec4] disabled:bg-slate-200 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" strokeWidth={3} />
              ) : (
                <span className="text-sm uppercase tracking-[0.2em]">Đăng nhập hệ thống</span>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-12 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] opacity-40">
          KIM TÂM CÁT • v2.5.0
        </p>
      </div>
      
      <style>{`
        input::placeholder { font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-size: 11px; opacity: 0.4; }
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
