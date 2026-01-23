
import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, ShieldCheck, AlertCircle, Eye, EyeOff, X, Zap, Loader2 } from 'lucide-react';
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
      const loggedUser: User = {
        id: account.id,
        username: account.username,
        fullName: account.fullName,
        role: account.role,
        isManager: account.isManager
      };
      onLogin(loggedUser);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let savedStaff = localStorage.getItem('app_staff_list_v1');
      let staffList: StaffMember[] = savedStaff ? JSON.parse(savedStaff) : [];

      if (staffList.length === 0 && username.toLowerCase() !== 'admin') {
        try {
          staffList = await syncStaffDataFromServer();
        } catch (syncErr: any) {
          setError("Hệ thống chưa sẵn sàng, vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.");
          setIsLoading(false);
          return;
        }
      }

      let loggedUser: User | null = null;

      if (username.toLowerCase() === 'admin' && password === 'admin') {
        loggedUser = {
          id: 1,
          username: 'admin',
          fullName: 'Quản trị viên',
          role: UserRole.ADMIN,
          isManager: true
        };
      } else {
        const foundUser = staffList.find(u => 
          u.username.toLowerCase() === username.toLowerCase() && 
          u.password === password
        );

        if (foundUser) {
          if (!foundUser.active) {
            setError("Tài khoản của bạn hiện đang bị khóa.");
            setIsLoading(false);
            return;
          }

          loggedUser = {
            id: Number(foundUser.id),
            username: foundUser.username,
            fullName: foundUser.fullName,
            role: foundUser.role,
            isManager: foundUser.isManager
          };
        }
      }

      if (loggedUser) {
        onLogin(loggedUser);
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
      <div className="w-full max-w-[520px] animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          {/* Logo - Increased size as requested */}
          <div className="inline-flex items-center justify-center w-36 h-36 bg-[#5551ff] rounded-[48px] text-white shadow-2xl shadow-indigo-200 mb-8 transform hover:scale-105 transition-transform duration-500">
            <ShieldCheck size={72} strokeWidth={2} />
          </div>
          <h1 className="text-5xl font-[900] text-[#0f172a] tracking-tight mb-2 uppercase">Đăng nhập</h1>
          <div className="w-16 h-1.5 bg-[#5551ff] mx-auto rounded-full mt-4"></div>
        </div>

        {recentAccounts.length > 0 && (
          <div className="mb-10 animate-in slide-in-from-top-6 duration-700">
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex items-center gap-2.5">
                <Zap size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
                <h2 className="text-[12px] font-[900] text-slate-400 uppercase tracking-[0.2em]">Đăng nhập nhanh</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recentAccounts.map((account) => (
                <div 
                  key={account.username}
                  onClick={() => handleQuickLogin(account)}
                  className="group relative bg-white border border-slate-100 p-5 rounded-[28px] shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer overflow-hidden flex items-center gap-4 active:scale-95 border-b-4 border-b-slate-100 hover:border-b-indigo-500"
                >
                  <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-[900] text-base group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    {account.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-[900] text-slate-900 truncate leading-none uppercase">{account.fullName}</p>
                    <p className="text-[8px] font-[900] text-indigo-500 uppercase mt-2 tracking-widest">{account.role.replace('_', ' ')}</p>
                  </div>
                  <button 
                    onClick={(e) => removeRecent(e, account.username)}
                    className="absolute top-3 right-3 p-1.5 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm"
                  >
                    <X size={12} strokeWidth={4} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Login Form Container - Added subtle blue border/ring as in image */}
        <div className="bg-white rounded-[56px] p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.12)] border-[3px] border-[#cedcfd] relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="flex items-center gap-2 mb-2 px-1">
               <h2 className="text-[12px] font-[900] text-slate-400 uppercase tracking-[0.25em]">Thông tin đăng nhập</h2>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-[28px] flex items-center gap-4 animate-in shake duration-300">
                <div className="p-2 bg-rose-500 rounded-xl text-white">
                  <AlertCircle size={18} strokeWidth={3} />
                </div>
                <p className="text-xs font-[900] text-rose-700 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[12px] font-[900] text-slate-400 uppercase tracking-[0.2em] ml-2">Tài khoản quản trị / Nhân viên</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5551ff] transition-colors">
                  <UserIcon size={24} />
                </div>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-[#f1f5f9] border-2 border-transparent rounded-[24px] outline-none focus:ring-0 focus:border-[#5551ff] focus:bg-white transition-all font-[800] text-slate-800 placeholder:text-slate-400 shadow-inner text-sm disabled:opacity-50"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-[900] text-slate-400 uppercase tracking-[0.2em] ml-2">Mật khẩu truy cập</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#5551ff] transition-colors">
                  <Lock size={24} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-16 py-5 bg-[#f1f5f9] border-2 border-transparent rounded-[24px] outline-none focus:ring-0 focus:border-[#5551ff] focus:bg-white transition-all font-[800] text-slate-800 placeholder:text-slate-400 shadow-inner text-sm disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#5551ff] transition-colors"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#5551ff] hover:bg-[#4a47e6] disabled:bg-[#a5a3ff] text-white font-[900] py-6 rounded-[28px] shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-lg uppercase tracking-[0.2em]">Đang xác thực...</span>
                </>
              ) : (
                <span className="text-lg uppercase tracking-[0.2em]">Đăng nhập hệ thống</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
