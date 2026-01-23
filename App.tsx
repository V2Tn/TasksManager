
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTaskLogic } from './hooks/useTaskLogic';
import { EisenhowerMatrix } from './components/views/dashboard/EisenhowerMatrix';
import { TaskListView } from './components/views/dashboard/TaskListView';
import { TaskForm } from './components/views/tasks/TaskForm';
import { StatCard } from './components/ui/StatCard';
import { Header } from './components/ui/Header';
import { ReportView } from './components/views/reports/ReportView';
import { TeamOverview } from './components/views/team/TeamOverview';
import { CelebrationOverlay } from './components/ui/CelebrationOverlay';
import { LoginView } from './components/views/auth/LoginView';
import { StaffListView } from './components/views/admin/StaffListView';
import { DepartmentListView } from './components/views/admin/DepartmentListView';
import { SettingsView } from './components/views/admin/SettingsView';
import { Task, TaskStatus, User, UserRole, Quadrant, StaffMember, Department } from './types';
import { SOUND_CONFIG, HARDCODED_DEPARTMENTS } from './constants';
import { API_CONFIG } from './config/apiConfig';
import { isFromToday, formatSmartDate, isTimePassed } from './actions/taskTimeUtils';
import { AlertTriangle, XCircle, RefreshCw, CheckCircle, X, AlertCircle } from 'lucide-react';
import { addLog } from './actions/logger';

const App: React.FC = () => {
  const { tasks, setTasks, addTask, updateTaskStatus, updateTaskTitle, updateTaskQuadrant, deleteTask, progress } = useTaskLogic();
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'tasks' | 'reports' | 'team' | 'staff' | 'departments' | 'settings'>('tasks');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('app_volume');
    return saved !== null ? parseFloat(saved) : SOUND_CONFIG.VOLUME;
  });

  const [soundUrl, setSoundUrl] = useState<string>(() => {
    const saved = localStorage.getItem('app_sound_url');
    return saved !== null ? saved : SOUND_CONFIG.TASK_DONE;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('app_staff_list_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('app_department_list_v2');
    return saved ? JSON.parse(saved) : HARDCODED_DEPARTMENTS.map(d => ({ ...d, createdAt: '2023-01-01' }));
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('current_session_user', JSON.stringify(user));
      const savedRecent = localStorage.getItem('app_recent_accounts_v1');
      let recentList = savedRecent ? JSON.parse(savedRecent) : [];
      const accountToAdd = { id: user.id, username: user.username, fullName: user.fullName, role: user.role, isManager: user.isManager };
      recentList = [accountToAdd, ...recentList.filter((a: any) => a.username !== user.username)].slice(0, 4);
      localStorage.setItem('app_recent_accounts_v1', JSON.stringify(recentList));
    } else {
      localStorage.removeItem('current_session_user');
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedStaff = localStorage.getItem('app_staff_list_v1');
      const savedDepts = localStorage.getItem('app_department_list_v2');
      if (savedStaff) setStaffMembers(JSON.parse(savedStaff));
      if (savedDepts) setDepartments(JSON.parse(savedDepts));
    };
    window.addEventListener('app_data_updated', handleStorageChange);
    return () => window.removeEventListener('app_data_updated', handleStorageChange);
  }, []);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const visibleTasks = useMemo(() => {
    if (!user) return [];
    const filtered = tasks.filter(task => {
      if (isAdmin) return true;
      return task.assigneeId === user.id || task.createdById === user.id;
    });
    return filtered.filter(task => {
      const isToday = isFromToday(task.createdAt);
      const isUnfinished = task.status === TaskStatus.PENDING || task.status === TaskStatus.DOING;
      return isToday || isUnfinished;
    });
  }, [tasks, user, isAdmin]);

  const filteredProgress = useMemo(() => {
    if (!user) return { done: 0, doing: 0, pending: 0, cancelled: 0, backlog: 0, total: 0 };
    const myActiveTasks = visibleTasks.filter(t => t.assigneeId === user.id);
    return {
      done: myActiveTasks.filter(t => t.status === TaskStatus.DONE).length,
      doing: myActiveTasks.filter(t => t.status === TaskStatus.DOING).length,
      pending: myActiveTasks.filter(t => t.status === TaskStatus.PENDING).length,
      cancelled: myActiveTasks.filter(t => t.status === TaskStatus.CANCELLED).length,
      backlog: myActiveTasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length,
      total: myActiveTasks.length
    };
  }, [visibleTasks, user]);

  useEffect(() => {
    localStorage.setItem('app_volume', volume.toString());
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('app_sound_url', soundUrl);
    audioRef.current = new Audio(soundUrl);
  }, [soundUrl]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getTaskWebhookUrl = () => {
    const customTaskUrl = localStorage.getItem('system_task_webhook_url');
    if (customTaskUrl && customTaskUrl.trim() !== '') return customTaskUrl;
    return API_CONFIG.TASK_WEBHOOK_URL;
  };

  const robustParseJSON = (rawText: string) => {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('"data":') && !cleaned.startsWith('{')) {
      cleaned = '{' + cleaned + '}';
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // Tìm khối JSON đầu tiên nếu có rác
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        } catch (inner) {}
      }
      throw e;
    }
  };

  const handleSyncTasks = async () => {
    const url = getTaskWebhookUrl();
    if (!url || !url.startsWith('http')) {
      showToast("Chưa cấu hình Task Webhook", "error");
      return;
    }
    setIsSyncingTasks(true);
    addLog({ type: 'REMOTE', status: 'PENDING', action: 'SYNC_TASKS', message: 'Đang tải danh sách công việc...' });
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_TASKS', timestamp: new Date().toISOString() }),
        mode: 'cors'
      });
      const rawText = await response.text();
      const result = robustParseJSON(rawText);
      let processedList: Task[] = [];
      if (result.status === "success" && Array.isArray(result.data)) {
        processedList = result.data.map((item: any) => item.data?.task || item.task || item).filter(Boolean);
      } else if (Array.isArray(result)) {
        processedList = result;
      } else if (result.data) {
        // Xử lý đệ quy tìm mảng task
        const findTasks = (obj: any): any[] => {
          if (Array.isArray(obj)) return obj;
          for (const k in obj) { if (typeof obj[k] === 'object') { const res = findTasks(obj[k]); if (res.length > 0) return res; } }
          return [];
        };
        processedList = findTasks(result);
      }
      if (processedList.length > 0) {
        setTasks(processedList);
        showToast(`Đồng bộ thành công ${processedList.length} công việc`);
        addLog({ type: 'REMOTE', status: 'SUCCESS', action: 'SYNC_TASKS', message: `Đã cập nhật ${processedList.length} task.` });
      } else {
        showToast("Không tìm thấy dữ liệu task hợp lệ", "error");
      }
    } catch (e: any) {
      showToast("Lỗi đồng bộ: " + e.message, "error");
      addLog({ type: 'REMOTE', status: 'ERROR', action: 'SYNC_TASKS', message: 'Lỗi: ' + e.message });
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const sendWebhook = (action: string, task: Task) => {
    const url = getTaskWebhookUrl();
    if (!url || !url.startsWith('http')) return;
    const payload = { action, user: user?.username, task, timestamp: new Date().toISOString() };
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'cors' }).catch(() => {});
  };

  const handleAddTask = (taskData: any) => {
    const newTask = addTask(taskData);
    sendWebhook('CREATE_TASK', newTask);
  };

  const handleUpdateStatus = (id: number, newStatus: TaskStatus) => {
    updateTaskStatus(id, newStatus, user?.fullName || 'User');
    const currentTask = tasks.find(t => t.id === id);
    if (currentTask) sendWebhook('STATUS_UPDATE', { ...currentTask, status: newStatus });
    if (newStatus === TaskStatus.DONE) {
      setShowCelebration(true);
      if (audioRef.current) { audioRef.current.volume = volume; audioRef.current.play().catch(() => {}); }
    }
  };

  const handleUpdateTitle = (id: number, newTitle: string) => {
    updateTaskTitle(id, newTitle, user?.fullName || 'User');
    const currentTask = tasks.find(t => t.id === id);
    if (currentTask) sendWebhook('TITLE_UPDATE', { ...currentTask, title: newTitle });
  };

  const handleUpdateQuadrant = (id: number, newQuadrant: Quadrant) => {
    updateTaskQuadrant(id, newQuadrant, user?.fullName || 'User');
    const currentTask = tasks.find(t => t.id === id);
    if (currentTask) sendWebhook('QUADRANT_UPDATE', { ...currentTask, quadrant: newQuadrant });
  };

  const handleDeleteTask = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      const deletedTask = deleteTask(id);
      if (deletedTask) sendWebhook('DELETE_TASK', deletedTask);
    }
  };

  const handleLogout = () => { setUser(null); setActiveTab('tasks'); };

  if (!user) return <LoginView onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8 lg:p-10 overflow-x-hidden selection:bg-indigo-100 antialiased font-['Lexend']">
      <div className="max-w-[1440px] mx-auto">
        <Header activeTab={activeTab} onTabChange={setActiveTab} viewMode={viewMode} onViewModeChange={setViewMode} volume={volume} onVolumeChange={setVolume} currentSoundUrl={soundUrl} onSoundChange={setSoundUrl} currentUser={user} onLogout={handleLogout} onSwitchUser={setUser} />
        
        {toast && (
          <div className="fixed top-24 right-8 z-[2000] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className={`px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-4 border min-w-[320px] backdrop-blur-md ${
              toast.type === 'success' ? 'bg-slate-900/95 border-white/10 text-white' : 'bg-rose-600 border-rose-500 text-white'
            }`}>
              <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-indigo-500' : 'bg-white/20'}`}>
                {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-wider">{toast.type === 'success' ? 'THÀNH CÔNG' : 'LỖI HỆ THỐNG'}</p>
                <p className="text-[10px] font-bold opacity-80 mt-1">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16} /></button>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8">
              <StatCard {...filteredProgress} />
              <TaskForm onAdd={handleAddTask} currentUser={user} />
            </aside>
            <main className="lg:col-span-8 w-full flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Danh sách công việc</h2>
                   <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Quản lý hiệu suất cá nhân</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={handleSyncTasks} 
                    disabled={isSyncingTasks}
                    className="flex items-center gap-2.5 bg-white border border-slate-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95 group"
                  >
                    <RefreshCw size={14} strokeWidth={3} className={`${isSyncingTasks ? 'animate-spin text-indigo-500' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                    {isSyncingTasks ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ TASK'}
                  </button>
                )}
              </div>

              {filteredProgress.backlog >= 1 && (
                <div className="bg-red-50 border border-red-100 rounded-[32px] p-5 flex items-center gap-4 shadow-xl shadow-red-100/50 animate-in slide-in-from-top-4 fade-in duration-500 ring-2 ring-red-50/50">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-black text-red-700 leading-tight">Thông báo tồn đọng</h3>
                    <p className="text-[12px] font-bold text-red-600/70 mt-0.5 uppercase tracking-tight">
                      Có <span className="text-red-800 font-black px-1.5 py-0.5 bg-red-100 rounded-lg mx-0.5">{filteredProgress.backlog}</span> task cần hoàn thành gấp.
                    </p>
                  </div>
                  <XCircle size={20} className="text-red-200" />
                </div>
              )}
              {viewMode === 'matrix' ? (
                <EisenhowerMatrix tasks={visibleTasks} onUpdateStatus={handleUpdateStatus} onUpdateTitle={handleUpdateTitle} onUpdateQuadrant={handleUpdateQuadrant} onDeleteTask={handleDeleteTask} currentUser={user} />
              ) : (
                <TaskListView tasks={visibleTasks} onUpdateStatus={handleUpdateStatus} onUpdateTitle={handleUpdateTitle} onDeleteTask={handleDeleteTask} currentUser={user} />
              )}
            </main>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReportView tasks={visibleTasks} onUpdateStatus={handleUpdateStatus} onUpdateTitle={handleUpdateTitle} currentUser={user} />
          </div>
        )}

        {activeTab === 'team' && (
          <TeamOverview 
            tasks={tasks} 
            staff={staffMembers} 
            departments={departments} 
            currentUser={user} 
            onUpdateStatus={handleUpdateStatus}
            onUpdateTitle={handleUpdateTitle}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'staff' && isAdmin && <StaffListView />}
        {activeTab === 'departments' && isAdmin && <DepartmentListView />}
        {activeTab === 'settings' && isAdmin && <SettingsView />}
      </div>
      <CelebrationOverlay isVisible={showCelebration} onFinished={() => setShowCelebration(false)} />
    </div>
  );
};

export default App;
