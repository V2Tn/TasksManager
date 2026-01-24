
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Quadrant, TaskLogicResult } from '../types';
import { formatSmartDate, isTimePassed } from '../actions/taskTimeUtils';
import { addLog } from '../actions/logger';
import { safeJsonParse } from '../actions/authActions';

const STORAGE_KEY = 'eisenhower_tasks_v2'; 

/**
 * Hàm trích xuất Task đệ quy để xử lý cấu trúc lồng nhau từ Make
 * VD: item.data.task hoặc item.task
 */
const extractTasksFromResponse = (result: any): Task[] => {
  if (!result) return [];
  const foundTasks: Task[] = [];
  const seenIds = new Set<number>();

  const findTasksRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    // Kiểm tra nếu là một đối tượng Task (có title và status/quadrant)
    const isTask = (obj.title && obj.status && obj.quadrant) || (obj.id && obj.title);
    
    if (isTask) {
      const id = Number(obj.id);
      if (!isNaN(id) && !seenIds.has(id)) {
        // Đảm bảo các trường dữ liệu được chuẩn hóa
        foundTasks.push({
          ...obj,
          id,
          // Nếu Make trả về 'IN_PROGRESS' thay vì 'DOING'
          status: obj.status === 'IN_PROGRESS' ? TaskStatus.DOING : obj.status
        } as Task);
        seenIds.add(id);
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
  return foundTasks.sort((a, b) => b.id - a.id);
};

export const useTaskLogic = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

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
    const statusLabels: Record<string, string> = {
      [TaskStatus.PENDING]: 'Mới',
      [TaskStatus.DOING]: 'Đang làm',
      [TaskStatus.DONE]: 'Hoàn thành',
      [TaskStatus.CANCELLED]: 'Hủy bỏ'
    };

    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const newLogs = [...task.logs, `${timeDisplay} ${userName} đã cập nhật trạng thái ${statusLabels[newStatus]}`];
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

  const syncTasksFromServer = useCallback(async (url: string, user: string) => {
    if (!url || !url.startsWith('http')) throw new Error("URL Webhook Task không hợp lệ");
    
    addLog({ type: 'REMOTE', status: 'PENDING', action: 'SYNC_TASKS', message: 'Đang tải danh sách công việc...' });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'SYNC_TASKS', 
          user, 
          timestamp: Math.floor(Date.now() / 1000) // Chuyển sang Unix Epoch
        }),
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);
      
      const rawText = await response.text();
      const result = safeJsonParse(rawText);
      const remoteTasks = extractTasksFromResponse(result);

      if (remoteTasks.length > 0) {
        setTasks(remoteTasks);
        addLog({ type: 'REMOTE', status: 'SUCCESS', action: 'SYNC_TASKS', message: `Đã đồng bộ ${remoteTasks.length} công việc.` });
        return remoteTasks;
      }
      return [];
    } catch (e: any) {
      addLog({ type: 'REMOTE', status: 'ERROR', action: 'SYNC_TASKS', message: e.message });
      throw e;
    }
  }, []);

  return { tasks, setTasks, addTask, updateTaskStatus, updateTaskTitle, updateTaskQuadrant, deleteTask, progress, syncTasksFromServer };
};
