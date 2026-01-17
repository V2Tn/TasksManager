
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Quadrant, TaskLogicResult } from '../types';
import { getCurrentTimeFormatted, isTimePassed } from '../actions/taskTimeUtils';
import { updateTaskTitleInList, updateTaskStatusInList } from '../actions/taskEditActions';

const STORAGE_KEY = 'eisenhower_tasks_v1';

export const useTaskLogic = (): TaskLogicResult => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: getCurrentTimeFormatted(),
      updatedAt: getCurrentTimeFormatted(),
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const updateTaskStatus = useCallback((id: string, newStatus: TaskStatus) => {
    setTasks(prev => updateTaskStatusInList(prev, id, newStatus));
  }, []);

  const updateTaskTitle = useCallback((id: string, newTitle: string) => {
    setTasks(prev => updateTaskTitleInList(prev, id, newTitle));
  }, []);

  const updateTaskQuadrant = useCallback((id: string, newQuadrant: Quadrant) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id 
          ? { ...task, quadrant: newQuadrant, updatedAt: getCurrentTimeFormatted() } 
          : task
      )
    );
  }, []);

  const progress = useMemo(() => {
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const doing = tasks.filter(t => t.status === TaskStatus.DOING).length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const backlog = tasks.filter(t => t.status !== TaskStatus.DONE && isTimePassed(t.endTime)).length;
    
    return {
      done,
      doing,
      pending,
      cancelled,
      backlog,
      total: tasks.length
    };
  }, [tasks]);

  return { tasks, addTask, updateTaskStatus, updateTaskTitle, updateTaskQuadrant, progress };
};
