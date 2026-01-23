
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Quadrant, TaskLogicResult } from '../types';
import { formatSmartDate, isTimePassed } from '../actions/taskTimeUtils';

const STORAGE_KEY = 'eisenhower_tasks_v2'; 

export const useTaskLogic = (): TaskLogicResult => {
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
    
    const logEntry = `${timeDisplay} ${taskData.createdByLabel} đã giao việc cho ${taskData.assigneeLabel}`;
    
    const newTask: Task = {
      ...taskData,
      id: maxId + 1,
      initialQuadrant: taskData.quadrant, 
      createdAt: nowISO,
      createdAtDisplay: timeDisplay,
      updatedAt: nowISO,
      logs: [logEntry]
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
        const statusLog = `${timeDisplay} ${userName} đã cập nhật trạng thái ${statusLabels[newStatus]}`;
        const newLogs = [...task.logs, statusLog];

        if (isTimePassed(task.endTime) && newStatus !== TaskStatus.DONE) {
          newLogs.push(`${timeDisplay} Task đã đến hạn cần xử lí gấp`);
        }

        return { 
          ...task, 
          status: newStatus, 
          updatedAt: new Date().toISOString(),
          logs: newLogs
        };
      }
      return task;
    }));
  }, []);

  const updateTaskTitle = useCallback((id: number, newTitle: string, userName: string) => {
    const timeDisplay = formatSmartDate();
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { 
            ...task, 
            title: newTitle, 
            updatedAt: new Date().toISOString(),
            logs: [...task.logs, `${timeDisplay} ${userName} đã đổi tên thành "${newTitle}"`]
          } 
        : task
    ));
  }, []);

  const updateTaskQuadrant = useCallback((id: number, newQuadrant: Quadrant, userName: string) => {
    const timeDisplay = formatSmartDate();
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { 
            ...task, 
            quadrant: newQuadrant, 
            updatedAt: new Date().toISOString(),
            logs: [...task.logs, `${timeDisplay} ${userName} đã chuyển sang ô ${newQuadrant}`]
          } 
        : task
    ));
  }, []);

  const deleteTask = useCallback((id: number): Task | undefined => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
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

  return { tasks, setTasks, addTask, updateTaskStatus, updateTaskTitle, updateTaskQuadrant, deleteTask, progress };
};
