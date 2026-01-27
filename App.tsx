
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, Quadrant, User, UserRole, StaffMember, Department } from './types';
import { useTaskLogic } from './hooks/useTaskLogic';
import { useTeamDashboard } from './hooks/useTeamDashboard';
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
import { SOUND_CONFIG, HARDCODED_DEPARTMENTS } from './constants';
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

  const { masterTasks, fetchMasterTasks, isFetching: isFetchingTeam } = useTeamDashboard();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const loadData = () => {
      const savedStaff = localStorage.getItem('app_staff_list_v1');
      if (savedStaff) setStaff(JSON.parse(savedStaff));
      
      const savedDepts = localStorage.getItem('app_department_list_v2');
      if (savedDepts) {
        setDepartments(JSON.parse(savedDepts));
      } else {
        // Luôn nạp dữ liệu cứng nếu chưa có cấu hình local để đảm bảo hiển thị đủ phòng ban
        setDepartments(HARDCODED_DEPARTMENTS.map(d => ({ ...d, createdAt: new Date().toISOString() })));
      }
    };

    loadData();
    window.addEventListener('app_data_updated', loadData);
    return () => window.removeEventListener('app_data_updated', loadData);
  }, []);

  const sendWebhook = useCallback((action: string, task: Task) => {
    const url = getTaskWebhookUrl();
    if (!url || !url.startsWith('http')) return;

    const taskDataForMake = {
      ...task,
      createdAt: (task.createdAt && typeof task.createdAt === 'string') 
        ? Math.floor(new Date(task.createdAt).getTime() / 1000) 
        : task.createdAt,
      updatedAt: (task.updatedAt && typeof task.updatedAt === 'string') 
        ? Math.floor(new Date(task.updatedAt).getTime() / 1000) 
        : task.updatedAt
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

  const handleFetchTasksById = useCallback(async () => {
    if (!user) return;
    const url = getTaskWebhookUrl();
    if (!url || !url.startsWith('http')) return;
    
    try {
      // Truyền thêm user.id để lọc chỉ lấy task user tham gia (tạo hoặc giao) và chưa hoàn thành/hủy
      await syncTasksFromServer(url, user.username, 'get_list_id_task', user.id);
    } catch (e: any) {
      console.error("Lỗi khi lấy danh sách công việc tự động:", e.message);
    }
  }, [user, syncTasksFromServer]);

  const handleTabChange = (newTab: typeof activeTab) => {
    if (newTab === 'tasks' && activeTab !== 'tasks') {
      handleFetchTasksById();
    }
    
    if (newTab === 'team' && user) {
      const url = getTaskWebhookUrl();
      fetchMasterTasks(url, user.username);
    }

    setActiveTab(newTab);
  };

  const handleSyncTasks = async () => {
    if (!user) return;
    const url = getTaskWebhookUrl();
    if (!url || !url.startsWith('http')) {
      showToast("Vui lòng cấu hình URL Webhook trong tab Cấu hình", "error");
      return;
    }
    
    setIsSyncingTasks(true);
    try {
      // Truyền user.id để lọc phía client sau khi sync
      const synced = await syncTasksFromServer(url, user.username, 'get_list_id_task', user.id);
      if (synced && synced.length > 0) {
        showToast(`Đã đồng bộ ${synced.length} công việc đang thực hiện.`);
      } else {
        showToast("Không có công việc mới hoặc các công việc đã hoàn thành/hủy.");
      }
    } catch (e: any) {
      showToast("Lỗi đồng bộ: " + e.message, "error");
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const handleAddTask = (taskData: any) => {
    const newTask = addTask(taskData);
    sendWebhook('CREATE_TASK', newTask);
    showToast("Đã thêm công việc thành công");
  };

  const handleUpdateStatus = (id: number, status: TaskStatus) => {
    updateTaskStatus(id, status, user?.fullName || 'User');
    const task = tasks.find(t => t.id === id);
    if (task) {
      sendWebhook('UPDATE_TASK_STATUS', { ...task, status });
      if (status === TaskStatus.DONE) {
        setShowCelebration(true);
        const audio = new Audio(currentSoundUrl);
        audio.volume = volume;
        audio.play().catch(() => {});
      }
    }
  };

  const handleUpdateTitle = (id: number, title: string) => {
    updateTaskTitle(id, title, user?.fullName || 'User');
    const task = tasks.find(t => t.id === id);
    if (task) sendWebhook('UPDATE_TASK_TITLE', { ...task, title });
  };

  const handleUpdateQuadrant = (id: number, quadrant: Quadrant) => {
    updateTaskQuadrant(id, quadrant, user?.fullName || 'User');
    const task = tasks.find(t => t.id === id);
    if (task) sendWebhook('UPDATE_TASK_QUADRANT', { ...task, quadrant });
  };

  const handleDeleteTask = (id: number) => {
    const deleted = deleteTask(id);
    if (deleted) sendWebhook('DELETE_TASK', deleted);
    showToast("Đã xóa công việc");
  };

  if (!user) {
    return <LoginView onLogin={(u) => {
      setUser(u);
      localStorage.setItem('current_session_user', JSON.stringify(u));
      const recent = JSON.parse(localStorage.getItem('app_recent_accounts_v1') || '[]');
      const filtered = recent.filter((a: any) => a.username !== u.username);
      const updated = [{ id: u.id, username: u.username, fullName: u.fullName, role: u.role, isManager: u.isManager, departmentId: u.departmentId }, ...filtered].slice(0, 4);
      localStorage.setItem('app_recent_accounts_v1', JSON.stringify(updated));
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Lexend'] pb-20">
      {showCelebration && <CelebrationOverlay isVisible={showCelebration} onFinished={() => setShowCelebration(false)} />}
      
      {toast && (
        <div className={`fixed top-6 right-6 z-[3000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
          <p className="text-xs font-black uppercase tracking-wider">{toast.message}</p>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 pt-8 md:pt-12">
        <Header 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          volume={volume}
          onVolumeChange={setVolume}
          currentSoundUrl={currentSoundUrl}
          onSoundChange={setCurrentSoundUrl}
          currentUser={user}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem('current_session_user');
          }}
          onSwitchUser={(u) => {
            setUser(u);
            localStorage.setItem('current_session_user', JSON.stringify(u));
            handleFetchTasksById();
          }}
        />

        {activeTab === 'tasks' && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
              <TaskForm onAdd={handleAddTask} currentUser={user} />
              <StatCard {...progress} />
              <div className="flex items-center justify-between px-2">
                 <button 
                  onClick={handleSyncTasks}
                  disabled={isSyncingTasks}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.2em] transition-all"
                >
                   <RefreshCw size={14} className={isSyncingTasks ? 'animate-spin' : ''} />
                   {isSyncingTasks ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}
                 </button>
              </div>
              <TipsCard />
            </div>
            <div className="w-full lg:w-2/3">
              {viewMode === 'matrix' ? (
                <EisenhowerMatrix 
                  tasks={tasks} 
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateTitle={handleUpdateTitle}
                  onUpdateQuadrant={handleUpdateQuadrant}
                  onDeleteTask={handleDeleteTask}
                  currentUser={user}
                />
              ) : (
                <TaskListView 
                  tasks={tasks}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateTitle={handleUpdateTitle}
                  onDeleteTask={handleDeleteTask}
                  currentUser={user}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportView 
            tasks={tasks} 
            onUpdateStatus={handleUpdateStatus}
            onUpdateTitle={handleUpdateTitle}
            currentUser={user}
          />
        )}

        {activeTab === 'team' && (
          <div className="relative">
            {isFetchingTeam && (
              <div className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] animate-pulse z-50">
                 <RefreshCw size={12} className="animate-spin" />
                 ĐANG TẢI DỮ LIỆU ĐỘI NHÓM...
              </div>
            )}
            <TeamOverview 
              tasks={masterTasks}
              staff={staff} 
              departments={departments} 
              currentUser={user}
              onUpdateStatus={handleUpdateStatus}
              onUpdateTitle={handleUpdateTitle}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeTab === 'staff' && <StaffListView />}
        {activeTab === 'departments' && <DepartmentListView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>
    </div>
  );
};

export default App;
