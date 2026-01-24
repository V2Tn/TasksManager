
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, Quadrant, User, UserRole, StaffMember, Department } from './types';
import { useTaskLogic } from './hooks/useTaskLogic';
import { Header } from './components/ui/Header';
import { TaskForm } from './components/views/tasks/TaskForm';
import { EisenhowerMatrix } from './components/views/dashboard/EisenhowerMatrix';
import { StatCard } from './components/ui/StatCard';
import { TipsCard } from './components/ui/TipsCard';
import { ReportView } from './components/views/reports/ReportView';
import { TaskListView } from './components/views/dashboard/TaskListView';
import { CelebrationOverlay } from './components/ui/CelebrationOverlay';
import { LoginView } from './components/views/auth/LoginView';
import { StaffListView } from './components/views/admin/StaffListView';
import { DepartmentListView } from './components/views/admin/DepartmentListView';
import { SettingsView } from './components/views/admin/SettingsView';
import { TeamOverview } from './components/views/team/TeamOverview';
import { API_CONFIG } from './config/apiConfig';
import { SOUND_CONFIG } from './constants';
import { RefreshCw, CheckCircle, X } from 'lucide-react';

const getTaskWebhookUrl = () => {
  return localStorage.getItem('system_task_webhook_url') || API_CONFIG.TASK_WEBHOOK_URL;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'tasks' | 'reports' | 'team' | 'staff' | 'departments' | 'settings'>('tasks');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [volume, setVolume] = useState(SOUND_CONFIG.VOLUME);
  const [currentSoundUrl, setCurrentSoundUrl] = useState(SOUND_CONFIG.TASK_DONE);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { 
    tasks, 
    addTask, 
    updateTaskStatus, 
    updateTaskTitle, 
    updateTaskQuadrant, 
    deleteTask, 
    progress,
    syncTasksFromServer
  } = useTaskLogic();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const loadData = () => {
      const savedStaff = localStorage.getItem('app_staff_list_v1');
      if (savedStaff) setStaff(JSON.parse(savedStaff));
      
      const savedDepts = localStorage.getItem('app_department_list_v2');
      if (savedDepts) setDepartments(JSON.parse(savedDepts));
    };

    loadData();
    window.addEventListener('app_data_updated', loadData);
    return () => window.removeEventListener('app_data_updated', loadData);
  }, []);

  const sendWebhook = useCallback((action: string, task: Task) => {
    const url = getTaskWebhookUrl();
    if (!url || !url.startsWith('http')) return;

    // Chuyển đổi các trường thời gian sang Unix Epoch (giây) cho Webhook
    const taskDataForMake = {
      ...task,
      createdAt: task.createdAt ? Math.floor(new Date(task.createdAt).getTime() / 1000) : null,
      updatedAt: task.updatedAt ? Math.floor(new Date(task.updatedAt).getTime() / 1000) : null
    };

    const payload = { 
      action, 
      user: user?.username, 
      data: taskDataForMake,
      timestamp: Math.floor(Date.now() / 1000) 
    };

    fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload), 
      mode: 'cors' 
    }).catch(() => {});
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSyncTasks = async () => {
    if (!user) return;
    setIsSyncingTasks(true);
    try {
      const url = getTaskWebhookUrl();
      const synced = await syncTasksFromServer(url, user.username);
      showToast(`Đã đồng bộ ${synced.length} công việc mới.`);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('current_session_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('current_session_user');
  };

  const onUpdateStatus = (id: number, status: TaskStatus) => {
    updateTaskStatus(id, status, user?.fullName || 'Hệ thống');
    const updatedTask = tasks.find(t => t.id === id);
    if (updatedTask) {
      sendWebhook('UPDATE_STATUS', { ...updatedTask, status });
      if (status === TaskStatus.DONE) {
        setShowCelebration(true);
        const audio = new Audio(currentSoundUrl);
        audio.volume = volume;
        audio.play().catch(() => {});
      }
    }
  };

  const onUpdateTitle = (id: number, title: string) => {
    updateTaskTitle(id, title, user?.fullName || 'Hệ thống');
    const updatedTask = tasks.find(t => t.id === id);
    if (updatedTask) {
      sendWebhook('UPDATE_TITLE', { ...updatedTask, title });
    }
  };

  const onUpdateQuadrant = (id: number, quadrant: Quadrant) => {
    updateTaskQuadrant(id, quadrant, user?.fullName || 'Hệ thống');
    const updatedTask = tasks.find(t => t.id === id);
    if (updatedTask) {
      sendWebhook('UPDATE_QUADRANT', { ...updatedTask, quadrant });
    }
  };

  const onAddTask = (taskData: any) => {
    const newTask = addTask(taskData);
    sendWebhook('CREATE_TASK', newTask);
  };

  const onDeleteTask = (id: number) => {
    const deleted = deleteTask(id);
    if (deleted) {
      sendWebhook('DELETE_TASK', deleted);
    }
  };

  const handleSwitchUser = (selectedUser: User) => {
    setUser(selectedUser);
    localStorage.setItem('current_session_user', JSON.stringify(selectedUser));
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Lexend'] pb-20">
      {toast && (
        <div className="fixed top-24 right-8 z-[2000] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border min-w-[300px] backdrop-blur-md ${
            toast.type === 'success' ? 'bg-slate-900/95 border-white/10 text-white' : 'bg-rose-600 border-rose-500 text-white'
          }`}>
            <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-indigo-500' : 'bg-white/20'}`}>
              <CheckCircle size={18} strokeWidth={3} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider">{toast.type === 'success' ? 'THÀNH CÔNG' : 'LỖI'}</p>
              <p className="text-[10px] font-bold opacity-80 mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-8">
        <Header 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          volume={volume}
          onVolumeChange={setVolume}
          currentSoundUrl={currentSoundUrl}
          onSoundChange={setCurrentSoundUrl}
          currentUser={user}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
        />

        <main className="animate-in fade-in duration-700">
          {activeTab === 'tasks' && (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <aside className="w-full lg:w-[400px] flex flex-col gap-6 sticky top-8">
                <StatCard {...progress} />
                <div className="flex items-center gap-3">
                   <button 
                    onClick={handleSyncTasks} 
                    disabled={isSyncingTasks}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-white border border-slate-100 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95 group"
                   >
                     <RefreshCw size={16} strokeWidth={3} className={isSyncingTasks ? 'animate-spin text-indigo-500' : 'text-slate-300 group-hover:text-indigo-500'} />
                     {isSyncingTasks ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ TASK'}
                   </button>
                </div>
                <TaskForm onAdd={onAddTask} currentUser={user} />
                <TipsCard />
              </aside>
              
              <div className="flex-1 w-full">
                {viewMode === 'matrix' ? (
                  <EisenhowerMatrix 
                    tasks={tasks}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateTitle={onUpdateTitle}
                    onUpdateQuadrant={onUpdateQuadrant}
                    onDeleteTask={onDeleteTask}
                    currentUser={user}
                  />
                ) : (
                  <TaskListView 
                    tasks={tasks}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateTitle={onUpdateTitle}
                    onDeleteTask={onDeleteTask}
                    currentUser={user}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportView 
              tasks={tasks} 
              onUpdateStatus={onUpdateStatus}
              onUpdateTitle={onUpdateTitle}
              currentUser={user}
            />
          )}

          {activeTab === 'team' && (
            <TeamOverview 
              tasks={tasks}
              staff={staff}
              departments={departments}
              currentUser={user}
              onUpdateStatus={onUpdateStatus}
              onUpdateTitle={onUpdateTitle}
              onDeleteTask={onDeleteTask}
            />
          )}

          {activeTab === 'staff' && <StaffListView />}
          {activeTab === 'departments' && <DepartmentListView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      <CelebrationOverlay 
        isVisible={showCelebration} 
        onFinished={() => setShowCelebration(false)} 
      />
    </div>
  );
};

export default App;
