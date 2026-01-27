
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Quadrant, TaskLogicResult } from '../types';
import { formatSmartDate, isTimePassed } from '../actions/taskTimeUtils';
import { addLog } from '../actions/logger';
import { safeJsonParse } from '../actions/authActions';

const STORAGE_KEY = 'eisenhower_tasks_v2'; 

const resolveServerDate = (dateVal: any): string => {
  if (!dateVal) return new Date().toISOString();
  const num = Number(dateVal);
  if (!isNaN(num) && String(dateVal).length >= 10 && String(dateVal).length <= 13) {
    const timestamp = num < 10000000000 ? num * 1000 : num;
    return new Date(timestamp).toISOString();
  }
  return typeof dateVal === 'string' ? dateVal : new Date().toISOString();
};

/**
 * Hàm trích xuất và lọc Task dựa trên yêu cầu:
 * 1. Loại bỏ DONE và CANCELLED.
 * 2. Chỉ lấy task mà user là người tạo hoặc người thực hiện.
 */
const extractTasksFromResponse = (result: any, currentUserId?: number): Task[] => {
  if (!result) return [];
  const foundTasks: Task[] = [];
  const seenIds = new Set<number>();

  const findTasksRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    // Nhận diện Task object
    const isTask = (obj.title && (obj.status || obj.quadrant)) || (obj.id && obj.title && (obj.assigneeId || obj.assigneeLabel));
    
    if (isTask) {
      const id = Number(obj.id);
      if (!isNaN(id) && !seenIds.has(id)) {
        const rawStatus = String(obj.status || '').toUpperCase();
        
        // 1. Lọc bỏ trạng thái Hoàn thành và Hủy
        const isDoneOrCancel = rawStatus === 'DONE' || rawStatus === 'CANCELLED' || rawStatus === 'CANCEL';
        
        if (!isDoneOrCancel) {
          // 2. Kiểm tra vai trò: là người được giao (assigneeId) hoặc người tạo (createdById)
          const matchesUser = !currentUserId || 
                             Number(obj.assigneeId) === currentUserId || 
                             Number(obj.createdById) === currentUserId;

          if (matchesUser) {
            const dateSource = obj.createdAT || obj.createdAt;
            const createdAt = resolveServerDate(dateSource);
            const updatedAt = resolveServerDate(obj.updatedAt || dateSource);

            let status = TaskStatus.PENDING;
            if (rawStatus === 'IN_PROGRESS' || rawStatus === 'DOING') status = TaskStatus.DOING;
            else if (rawStatus === 'PENDING') status = TaskStatus.PENDING;

            foundTasks.push({
              ...obj,
              id,
              createdAt,
              updatedAt,
              createdAtDisplay: formatSmartDate(createdAt),
              status
            } as Task);
            seenIds.add(id);
          }
        }
      }
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => findTasksRecursive(item));
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object') findTasksRecursive(obj[key]);
      }
    }
  };

  findTasksRecursive(result);
  // Sắp xếp ưu tiên: Mới -> Đang làm -> Tồn đọng (thực hiện qua UI sorting)
  return foundTasks.sort((a, b) => b.id - a.id);
};

export const useTaskLogic = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleRefresh = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch (e) {
          console.error("Lỗi parse dữ liệu cập nhật:", e);
        }
      }
    };
    window.addEventListener('app_data_updated', handleRefresh);
    return () => window.removeEventListener('app_data_updated', handleRefresh);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((taskData: any): Task => {
    const maxId = tasks.reduce((max, task) => (task.id > max ? task.id : max), 0);
    const nowISO = new Date().toISOString();
    const timeDisplay = formatSmartDate(nowISO);
    
    const newTask: Task = {
      ...taskData,
      id: maxId + 1,
      initialQuadrant: taskData.quadrant, 
      createdAt: nowISO,
      createdAtDisplay: timeDisplay,
      updatedAt: nowISO,
      logs: [`${timeDisplay} ${taskData.createdByLabel} đã giao việc cho ${taskData.assigneeLabel}`]
    };
    
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, [tasks]);

  const updateTaskStatus = useCallback((id: number, newStatus: TaskStatus, userName: string) => {
    const timeDisplay = formatSmartDate();
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const newLogs = [...task.logs, `${timeDisplay} ${userName} đã cập nhật trạng thái ${newStatus}`];
        return { ...task, status: newStatus, updatedAt: new Date().toISOString(), logs: newLogs };
      }
      return task;
    }));
  }, []);

  const updateTaskTitle = useCallback((id: number, newTitle: string, userName: string) => {
    const timeDisplay = formatSmartDate();
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, title: newTitle, updatedAt: new Date().toISOString(), logs: [...task.logs, `${timeDisplay} ${userName} đã đổi tên thành "${newTitle}"`] } 
        : task
    ));
  }, []);

  const updateTaskQuadrant = useCallback((id: number, newQuadrant: Quadrant, userName: string) => {
    const timeDisplay = formatSmartDate();
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, quadrant: newQuadrant, updatedAt: new Date().toISOString(), logs: [...task.logs, `${timeDisplay} ${userName} đã chuyển sang ô ${newQuadrant}`] } 
        : task
    ));
  }, []);

  const deleteTask = useCallback((id: number): Task | undefined => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) setTasks(prev => prev.filter(t => t.id !== id));
    return taskToDelete;
  }, [tasks]);

  const progress = useMemo(() => {
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const doing = tasks.filter(t => t.status === TaskStatus.DOING).length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const backlog = tasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length;
    return { done, doing, pending, cancelled, backlog, total: tasks.length };
  }, [tasks]);

  const syncTasksFromServer = useCallback(async (url: string, user: string, actionOverride?: string, currentUserId?: number) => {
    if (!url || !url.startsWith('http')) throw new Error("URL Webhook Task không hợp lệ");
    
    const action = actionOverride || 'SYNC_TASKS';
    addLog({ type: 'REMOTE', status: 'PENDING', action, message: 'Đang tải danh sách công việc...' });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          user, 
          timestamp: Math.floor(Date.now() / 1000) 
        }),
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
      
      const rawText = await response.text();
      const result = safeJsonParse(rawText);
      const remoteTasks = extractTasksFromResponse(result, currentUserId);

      if (remoteTasks.length > 0) {
        setTasks(remoteTasks);
        addLog({ type: 'REMOTE', status: 'SUCCESS', action, message: `Đã đồng bộ ${remoteTasks.length} công việc.` });
        return remoteTasks;
      }
      // Nếu không có task mới thỏa điều kiện, ta xóa task cũ hoặc giữ nguyên tùy logic app. 
      // Ở đây ta ghi đè danh sách để phản ánh đúng filter "chỉ lấy task đang làm/mới/tồn đọng"
      setTasks(remoteTasks);
      return remoteTasks;
    } catch (e: any) {
      addLog({ type: 'REMOTE', status: 'ERROR', action, message: e.message });
      throw e;
    }
  }, []);

  return { tasks, setTasks, addTask, updateTaskStatus, updateTaskTitle, updateTaskQuadrant, deleteTask, progress, syncTasksFromServer };
};
