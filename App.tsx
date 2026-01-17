
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTaskLogic } from './hooks/useTaskLogic';
import { EisenhowerMatrix } from './components/views/dashboard/EisenhowerMatrix';
import { TaskListView } from './components/views/dashboard/TaskListView';
import { TaskForm } from './components/views/tasks/TaskForm';
import { StatCard } from './components/ui/StatCard';
import { Header } from './components/ui/Header';
import { ReportView } from './components/views/reports/ReportView';
import { CelebrationOverlay } from './components/ui/CelebrationOverlay';
import { TaskStatus } from './types';
import { SOUND_CONFIG } from './constants';
import { isFromToday } from './actions/taskTimeUtils';
import { AlertTriangle, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const { tasks, addTask, updateTaskStatus, updateTaskTitle, updateTaskQuadrant, progress } = useTaskLogic();
  const [activeTab, setActiveTab] = useState<'tasks' | 'reports'>('tasks');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Volume state persisted in localStorage
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('app_volume');
    return saved !== null ? parseFloat(saved) : SOUND_CONFIG.VOLUME;
  });

  // Sound selection persisted in localStorage
  const [soundUrl, setSoundUrl] = useState<string>(() => {
    const saved = localStorage.getItem('app_sound_url');
    return saved !== null ? saved : SOUND_CONFIG.TASK_DONE;
  });

  // Logic to filter tasks for the active work view
  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      const isToday = isFromToday(task.createdAt);
      const isUnfinished = task.status === TaskStatus.PENDING || task.status === TaskStatus.DOING;
      
      // Keep if it was created today OR if it's an ongoing/new task from previous days
      return isToday || isUnfinished;
    });
  }, [tasks]);

  // Persist volume changes
  useEffect(() => {
    localStorage.setItem('app_volume', volume.toString());
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Persist sound selection changes
  useEffect(() => {
    localStorage.setItem('app_sound_url', soundUrl);
    // Refresh audio object when sound URL changes
    audioRef.current = new Audio(soundUrl);
  }, [soundUrl]);

  // Audio ref for easy sound management
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    // Play sound and show celebration ONLY when task is marked as DONE
    if (newStatus === TaskStatus.DONE) {
      setShowCelebration(true);
      
      // Play sound
      try {
        if (!audioRef.current || audioRef.current.src !== soundUrl) {
          audioRef.current = new Audio(soundUrl);
        }
        
        audioRef.current.volume = volume;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.warn("Audio play blocked by browser:", e));
      } catch (err) {
        console.error("Error playing sound:", err);
      }
    }
    
    // Call existing logic
    updateTaskStatus(id, newStatus);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8 lg:p-10 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-[1440px] mx-auto">
        <Header 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          volume={volume}
          onVolumeChange={setVolume}
          currentSoundUrl={soundUrl}
          onSoundChange={setSoundUrl}
        />
        
        {activeTab === 'tasks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Sidebar */}
            <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8">
              <StatCard 
                done={progress.done} 
                doing={progress.doing} 
                pending={progress.pending} 
                cancelled={progress.cancelled}
                backlog={progress.backlog}
                total={progress.total} 
              />
              
              <TaskForm onAdd={addTask} />
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-8 w-full flex flex-col gap-6">
              {/* Overdue Alert Notification - Triggers at 1 or more backlog tasks */}
              {progress.backlog >= 1 && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-5 flex items-center gap-4 shadow-xl shadow-red-100/50 animate-in slide-in-from-top-4 fade-in duration-500 ring-2 ring-red-50/50">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-200">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-black text-red-700 leading-tight">Cảnh báo: Công việc tồn đọng!</h3>
                    <p className="text-[12px] font-bold text-red-600/70 mt-0.5 uppercase tracking-tight">
                      Bạn đang có <span className="text-red-800 font-black px-1.5 py-0.5 bg-red-100 rounded-lg mx-0.5">{progress.backlog}</span> công việc đã quá hạn. Hãy ưu tiên xử lý ngay!
                    </p>
                  </div>
                  <XCircle size={20} className="text-red-200 hover:text-red-400 cursor-help transition-colors" />
                </div>
              )}

              {viewMode === 'matrix' ? (
                <EisenhowerMatrix 
                  tasks={visibleTasks} 
                  onUpdateStatus={handleUpdateStatus} 
                  onUpdateTitle={updateTaskTitle}
                  onUpdateQuadrant={updateTaskQuadrant}
                />
              ) : (
                <TaskListView 
                  tasks={visibleTasks} 
                  onUpdateStatus={handleUpdateStatus} 
                  onUpdateTitle={updateTaskTitle}
                />
              )}
            </main>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReportView 
              tasks={tasks} 
              onUpdateStatus={handleUpdateStatus} 
              onUpdateTitle={updateTaskTitle}
            />
          </div>
        )}
      </div>

      <CelebrationOverlay 
        isVisible={showCelebration} 
        onFinished={() => setShowCelebration(false)} 
      />
    </div>
  );
};

export default App;
