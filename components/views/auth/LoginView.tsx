
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
    // Giả lập delay mượt mà
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
      
      // 1. Kiểm tra admin cứng
      if (isTryingAdmin && password === 'admin') {
        onLogin({
          id: 1,
          username: 'admin',
          fullName: 'Quản trị viên',
          role: UserRole.ADMIN,
          isManager: true
        });
        return;
      }

      // 2. Kiểm tra bộ nhớ cục bộ trước
      let savedStaff = localStorage.getItem('app_staff_list_v1');
      let staffList: StaffMember[] = savedStaff ? JSON.parse(savedStaff) : [];

      let foundUser = staffList.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        String(u.password) === String(password)
      );

      // 3. Nếu không thấy hoặc sai pass, thử đồng bộ từ server để cập nhật mới nhất
      if (!foundUser) {
        setSyncStatus("Đang kiểm tra thông tin trên hệ thống...");
        try {
          const freshStaff = await syncStaffDataFromServer();
          foundUser = freshStaff.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            String(u.password) === String(password)
          );
        } catch (syncErr: any) {
          console.error("Sync error during login:", syncErr);
        }
      }

      if (foundUser) {
        if (!foundUser.active) {
          setError("Tài khoản này đã bị khóa trên hệ thống.");
          setIsLoading(false);
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
        setError("Tài khoản hoặc mật khẩu không đúng.");
      }
    } catch (err) {
      setError("Gặp sự cố khi xác thực. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 selection:bg-indigo-100 font-['Lexend']">
      <div className="w-full max-w-[650px] animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-36 h-36 bg-gradient-to-br from-[#5551ff] to-[#7c3aed] rounded-[48px] text-white shadow-2xl shadow-indigo-100 mb-10 transform hover:rotate-3 transition-transform duration-500">
            <ShieldCheck size={72} strokeWidth={2} />
          </div>
          <h1 className="text-5xl md:text-6xl font-[900] text-[#0f172a] tracking-tight mb-2 uppercase">Kim Tâm Cát</h1>
        </div>

        {recentAccounts.length > 0 && (
          <div className="mb-12 animate-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-3 mb-6 px-2">
                <Zap size={16} className="text-amber-500 fill-amber-500" />
                <h2 className="text-[12px] font-[900] text-slate-400 uppercase tracking-[0.25em]">Truy cập nhanh</h2>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {recentAccounts.map((account) => (
                <div 
                  key={account.username}
                  onClick={() => handleQuickLogin(account)}
                  className="group relative bg-white border border-slate-100 p-7 rounded-[32px] shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer overflow-hidden flex items-center gap-5 active:scale-95"
                >
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {account.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-black text-slate-900 truncate leading-none uppercase tracking-tight">{account.fullName}</p>
                    <p className="text-[10px] font-black text-indigo-400 uppercase mt-2 tracking-widest">{account.role}</p>
                  </div>
                  <button 
                    onClick={(e) => removeRecent(e, account.username)}
                    className="absolute top-3 right-3 p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} strokeWidth={4} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[64px] p-16 md:p-20 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.18)] border border-slate-50 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            {syncStatus && (
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[24px] flex items-center gap-4 animate-pulse">
                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                <p className="text-[12px] font-black text-indigo-700 uppercase tracking-tight">{syncStatus}</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-6 rounded-[24px] flex items-center gap-4 animate-in shake duration-300">
                <AlertCircle size={20} className="text-rose-500 shrink-0" strokeWidth={3} />
                <p className="text-[12px] font-black text-rose-700 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-[0.25em] ml-3">Tài khoản</label>
              <div className="relative group">
                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5551ff] transition-colors">
                  <UserIcon size={28} />
                </div>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-20 pr-8 py-6.5 bg-slate-50 border-2 border-transparent rounded-[32px] outline-none focus:border-[#5551ff] focus:bg-white transition-all font-bold text-slate-800 text-lg placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-[0.25em] ml-3">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5551ff] transition-colors">
                  <Lock size={28} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-20 pr-20 py-6.5 bg-slate-50 border-2 border-transparent rounded-[32px] outline-none focus:border-[#5551ff] focus:bg-white transition-all font-bold text-slate-800 text-lg placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#5551ff] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={28} /> : <Eye size={28} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#5551ff] to-[#7c3aed] hover:from-[#4a47e6] hover:to-[#6d31cc] disabled:from-[#a5a3ff] disabled:to-[#c4b5fd] text-white font-black py-7 rounded-[32px] shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-5 transform active:scale-[0.98] mt-6 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-lg uppercase tracking-[0.25em]">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="text-lg uppercase tracking-[0.25em]">Đăng nhập ngay</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-16 text-slate-400 font-bold text-[11px] uppercase tracking-widest opacity-50">
          Version 2.5.0 • Powered by Kim Tâm Cát Pro
        </p>
      </div>
      
      <style>{`
        input::placeholder { font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-size: 15px; }
        .py-6\\.5 { padding-top: 1.625rem; padding-bottom: 1.625rem; }
      `}</style>
    </div>
  );
};
