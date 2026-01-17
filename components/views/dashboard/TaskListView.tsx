
import React from 'react';
import { Task, TaskStatus } from '../../../types';
import { TaskCard } from '../tasks/TaskCard';

interface TaskListViewProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onUpdateStatus, onUpdateTitle }) => {
  // Sort tasks by creation time descending (most recent first)
  const sortedTasks = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-right-4 duration-300">
      {sortedTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <span className="text-gray-200 font-bold text-xl">0</span>
          </div>
          <h3 className="text-gray-800 font-bold text-lg mb-1">Chưa có công việc nào</h3>
          <p className="text-gray-400 text-sm max-w-xs">Bắt đầu bằng cách thêm một công việc mới ở thanh bên trái.</p>
        </div>
      ) : (
        sortedTasks.map((task) => (
          <div key={task.id} className="w-full">
            <TaskCard 
              task={task} 
              onUpdateStatus={onUpdateStatus}
              onUpdateTitle={onUpdateTitle}
            />
          </div>
        ))
      )}
    </div>
  );
};
