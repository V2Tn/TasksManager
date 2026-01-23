
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Clock, List, Layout, BarChart2, Volume2, VolumeX, Volume1, Music, Check, Settings, Users, LogOut, User as UserIcon, Briefcase, ChevronDown, UserPlus, Users2 } from 'lucide-react';
import { AVAILABLE_SOUNDS } from '../../constants';
import { User, UserRole, StaffMember } from '../../types';

interface HeaderProps {
  activeTab: 'tasks' | 'reports' | 'team' | 'staff' | 'departments' | 'settings';
  onTabChange: (tab: 'tasks' | 'reports' | 'team' | 'staff' | 'departments' | 'settings') => void;
  viewMode: 'matrix' | 'list';
  onViewModeChange: (mode: 'matrix' | 'list') => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  currentSoundUrl: string;
  onSoundChange: (url: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser?: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onTabChange, 
  viewMode, 
  onViewModeChange,
  volume,
  onVolumeChange,
  currentSoundUrl,
  onSoundChange,
  currentUser,
  onLogout,
  onSwitchUser
}) => {
  const [now, setNow] = useState(new Date());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  
  const soundPickerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  const isHighRole = useMemo(() => {
    if (!currentUser) return false;
    // Fix: Removed non-existent UserRole.DEPARTMENT_HEAD
    const highRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    return highRoles.includes(currentUser.role);
  }, [currentUser]);

  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;

  const staffList = useMemo((): StaffMember[] => {
    const saved = localStorage.getItem('app_staff_list_v1');
    return saved ? JSON.parse(saved) : [];
  }, [showSwitcher]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (soundPickerRef.current && !soundPickerRef.current.contains(event.target as Node)) {
        setShowSoundPicker(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setShowSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} THÁNG ${month}, ${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const toggleViewMode = () => {
    onViewModeChange(viewMode === 'matrix' ? 'list' : 'matrix');
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handleSoundSelect = (url: string) => {
    onSoundChange(url);
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {});
  };

  return (
    <header className="flex flex-col gap-6 mb-8 md:mb-12 px-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            Xin chào <span className="text-indigo-600">{currentUser?.fullName}</span>
          </h1>
          <div className="flex items-center gap-3 text-slate-400 text-[10px] md:text-[11px] font-bold uppercase tracking-wider mt-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Calendar size={12} strokeWidth={2.5} className="text-slate-300" />
              <span>{formatDate(now)}</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock size={12} strokeWidth={2.5} className="text-slate-300" />
              <span>{formatTime(now)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
               <span className="text-[9px] font-black">{currentUser?.role.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth">
            <button 
              onClick={() => onTabChange('tasks')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Layout size={16} strokeWidth={2.5} />
              CÔNG VIỆC
            </button>
            <button 
              onClick={() => onTabChange('reports')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <BarChart2 size={16} strokeWidth={2.5} />
              BÁO CÁO
            </button>
            
            {isHighRole && (
              <button 
                onClick={() => onTabChange('team')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                  activeTab === 'team' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Users2 size={16} strokeWidth={2.5} />
                ĐỘI NHÓM
              </button>
            )}

            {isAdmin && (
              <>
                <button 
                  onClick={() => onTabChange('staff')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                    activeTab === 'staff' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Users size={16} strokeWidth={2.5} />
                  NHÂN VIÊN
                </button>
                <button 
                  onClick={() => onTabChange('departments')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                    activeTab === 'departments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase size={16} strokeWidth={2.5} />
                  PHÒNG BAN
                </button>
                <button 
                  onClick={() => onTabChange('settings')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                    activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Settings size={16} strokeWidth={2.5} />
                  CẤU HÌNH
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <div className="relative" ref={soundPickerRef}>
              <button 
                onClick={() => setShowSoundPicker(!showSoundPicker)}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-sm active:scale-95 ${showSoundPicker ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-500'}`}
              >
                <Music size={18} strokeWidth={2.5} />
              </button>
              {showSoundPicker && (
                <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-50 p-2 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                    Âm thanh hoàn thành
                  </div>
                  {AVAILABLE_SOUNDS.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundSelect(sound.url)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                        currentSoundUrl === sound.url 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sound.name}
                      {currentSoundUrl === sound.url && <Check size={14} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <div className={`flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-2 py-2 shadow-sm transition-all duration-300 ${showVolumeSlider ? 'w-32' : 'w-11 overflow-hidden'}`}>
                <button 
                  onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)}
                  className={`shrink-0 p-0.5 transition-colors ${volume === 0 ? 'text-red-400' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <VolumeIcon size={18} />
                </button>
                {showVolumeSlider && (
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                )}
              </div>
            </div>

            {activeTab === 'tasks' && (
              <button 
                onClick={toggleViewMode}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 bg-white rounded-xl border border-slate-100 shadow-sm transition-all active:scale-95 flex items-center justify-center"
                title={viewMode === 'matrix' ? 'Xem dạng danh sách' : 'Xem dạng ma trận'}
              >
                {viewMode === 'matrix' ? <List size={20} strokeWidth={2.5} /> : <Layout size={20} strokeWidth={2.5} />}
              </button>
            )}

            <div className="relative" ref={userMenuRef}>
               <button 
                onClick={() => {
                   if (isHighRole) {
                     setShowSwitcher(!showSwitcher);
                   } else {
                     setShowUserMenu(!showUserMenu);
                   }
                }}
                className={`p-2.5 transition-all rounded-xl border shadow-sm active:scale-95 ${showUserMenu || showSwitcher ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-600 hover:bg-slate-50'}`}
               >
                  <UserIcon size={20} strokeWidth={2.5} />
                  {isHighRole && <ChevronDown size={10} className="absolute -bottom-1 left-1/2 -translate-x-1/2" />}
               </button>

               {/* Standard User Menu for Staff */}
               {showUserMenu && !isHighRole && (
                 <div className="absolute top-full right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-50 p-2 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</p>
                       <p className="text-[11px] font-black text-slate-800 truncate mt-0.5">{currentUser?.fullName}</p>
                       <p className="text-[8px] font-black text-indigo-500 uppercase mt-1 px-1.5 py-0.5 bg-indigo-50 w-fit rounded-md">{currentUser?.role}</p>
                    </div>
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black text-red-500 hover:bg-red-50 transition-all"
                    >
                      <LogOut size={16} strokeWidth={3} /> ĐĂNG XUẤT
                    </button>
                 </div>
               )}

               {/* Advanced Switcher Menu for Admin/Manager */}
               {showSwitcher && isHighRole && (
                 <div ref={switcherRef} className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-[100] animate-in fade-in zoom-in duration-300 origin-top-right">
                    <div className="px-5 py-4 border-b border-slate-50 mb-2">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                           {currentUser?.fullName.charAt(0)}
                         </div>
                         <div className="min-w-0">
                           <p className="text-[11px] font-black text-slate-900 truncate leading-none">{currentUser?.fullName}</p>
                           <p className="text-[8px] font-black text-indigo-500 uppercase mt-1.5 tracking-widest">{currentUser?.role.replace('_', ' ')}</p>
                         </div>
                       </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto px-1 space-y-1 scrollbar-hide">
                       <p className="px-4 py-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Chuyển tài khoản nhanh</p>
                       {staffList.filter(s => s.id !== currentUser?.id && s.active).map(staff => (
                         <button
                           key={staff.id}
                           onClick={() => {
                             if (onSwitchUser) {
                               onSwitchUser({
                                 id: staff.id,
                                 username: staff.username,
                                 fullName: staff.fullName,
                                 role: staff.role,
                                 departmentId: staff.department
                               });
                               setShowSwitcher(false);
                             }
                           }}
                           className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-slate-50 transition-all group"
                         >
                           <div className="w-8 h-8 bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px] transition-colors">
                             {staff.fullName.charAt(0)}
                           </div>
                           <div className="text-left flex-1 min-w-0">
                             <p className="text-[10px] font-black text-slate-700 truncate group-hover:text-indigo-600">{staff.fullName}</p>
                             <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">{staff.role}</p>
                           </div>
                           <UserPlus size={12} className="text-slate-200 group-hover:text-indigo-400" />
                         </button>
                       ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-50">
                       <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black text-red-500 hover:bg-red-50 transition-all"
                       >
                        <LogOut size={16} strokeWidth={3} /> ĐĂNG XUẤT HỆ THỐNG
                       </button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
