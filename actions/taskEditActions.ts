
import { Task } from '../types';
import { getCurrentTimeFormatted } from './taskTimeUtils';

export const updateTaskTitleInList = (tasks: Task[], id: string, title: string): Task[] => {
  return tasks.map(task => 
    task.id === id 
      ? { ...task, title, updatedAt: getCurrentTimeFormatted() } 
      : task
  );
};

export const updateTaskStatusInList = (tasks: Task[], id: string, status: any): Task[] => {
  return tasks.map(task => 
    task.id === id 
      ? { ...task, status, updatedAt: getCurrentTimeFormatted() } 
      : task
  );
};
