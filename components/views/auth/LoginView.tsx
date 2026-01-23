
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
        onLogin({
          id: 1,
          username: 'admin',
          fullName: 'Quản trị viên',
          role: UserRole.ADMIN,
          isManager: true
        });
        return;
      }

      let savedStaff = localStorage.getItem('app_staff_list_v1');
      let staffList: StaffMember[] = savedStaff ? JSON.parse(savedStaff) : [];

      let foundUser = staffList.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        String(u.password) === String(password)
      );

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
      <div className="w-full max-w-[720px] animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-44 h-44 bg-gradient-to-br from-[#5551ff] to-[#7c3aed] rounded-[56px] text-white shadow-2xl shadow-indigo-100 mb-12 transform hover:rotate-3 transition-transform duration-500">
            <ShieldCheck size={88} strokeWidth={2} />
          </div>
          <h1 className="text-6xl md:text-7xl font-[900] text-[#0f172a] tracking-tight mb-2 uppercase">Kim Tâm Cát</h1>
        </div>

        {recentAccounts.length > 0 && (
          <div className="mb-14 animate-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-4 mb-8 px-4">
                <Zap size={20} className="text-amber-500 fill-amber-500" />
                <h2 className="text-[14px] font-[900] text-slate-400 uppercase tracking-[0.3em]">Truy cập nhanh</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {recentAccounts.map((account) => (
                <div 
                  key={account.username}
                  onClick={() => handleQuickLogin(account)}
                  className="group relative bg-white border border-slate-100 p-9 rounded-[40px] shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer overflow-hidden flex items-center gap-6 active:scale-95"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {account.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-black text-slate-900 truncate leading-none uppercase tracking-tight">{account.fullName}</p>
                    <p className="text-[12px] font-black text-indigo-400 uppercase mt-2.5 tracking-[0.15em]">{account.role}</p>
                  </div>
                  <button 
                    onClick={(e) => removeRecent(e, account.username)}
                    className="absolute top-4 right-4 p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={16} strokeWidth={4} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[80px] p-20 md:p-24 shadow-[0_60px_120px_-30px_rgba(79,70,229,0.2)] border border-slate-50 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
            {syncStatus && (
              <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[32px] flex items-center gap-5 animate-pulse">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-[14px] font-black text-indigo-700 uppercase tracking-tight">{syncStatus}</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] flex items-center gap-5 animate-in shake duration-300">
                <AlertCircle size={24} className="text-rose-500 shrink-0" strokeWidth={3} />
                <p className="text-[14px] font-black text-rose-700 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <label className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Tài khoản</label>
              <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5551ff] transition-colors">
                  <UserIcon size={32} />
                </div>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-24 pr-10 py-8 bg-slate-50 border-2 border-transparent rounded-[40px] outline-none focus:border-[#5551ff] focus:bg-white transition-all font-black text-slate-800 text-xl placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-5">
              <label className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5551ff] transition-colors">
                  <Lock size={32} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-24 pr-24 py-8 bg-slate-50 border-2 border-transparent rounded-[40px] outline-none focus:border-[#5551ff] focus:bg-white transition-all font-black text-slate-800 text-xl placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#5551ff] transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={32} /> : <Eye size={32} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#5551ff] to-[#7c3aed] hover:from-[#4a47e6] hover:to-[#6d31cc] disabled:from-[#a5a3ff] disabled:to-[#c4b5fd] text-white font-black py-9 rounded-[40px] shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-6 transform active:scale-[0.98] mt-8 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span className="text-2xl uppercase tracking-[0.3em]">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl uppercase tracking-[0.3em]">Đăng nhập ngay</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-20 text-slate-400 font-black text-[12px] uppercase tracking-[0.3em] opacity-40">
          Version 2.5.0 • Powered by Kim Tâm Cát Pro
        </p>
      </div>
      
      <style>{`
        input::placeholder { font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; font-size: 16px; opacity: 0.5; }
      `}</style>
    </div>
  );
};
