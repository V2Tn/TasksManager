
import React, { useState } from 'react';
import { Task, Quadrant, TaskStatus, User } from '../../../types';
import { QUADRANT_CONFIG } from '../../../constants';
import { TaskCard } from '../tasks/TaskCard';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onUpdateStatus: (id: number, status: TaskStatus) => void;
  onUpdateTitle: (id: number, title: string) => void;
  onUpdateQuadrant: (id: number, quadrant: Quadrant) => void;
  onDeleteTask?: (id: number) => void;
  currentUser?: User | null;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ 
  tasks, 
  onUpdateStatus, 
  onUpdateTitle,
  onUpdateQuadrant,
  onDeleteTask,
  currentUser
}) => {
  const quadrants = Object.values(Quadrant) as Quadrant[];
  const [dragOverQuadrant, setDragOverQuadrant] = useState<Quadrant | null>(null);

  const handleDragOver = (e: React.DragEvent, q: Quadrant) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverQuadrant !== q) {
      setDragOverQuadrant(q);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverQuadrant(null);
  };

  const handleDrop = (e: React.DragEvent, targetQuadrant: Quadrant) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    const taskIdStr = e.dataTransfer.getData('taskId');
    if (taskIdStr) {
      onUpdateQuadrant(Number(taskIdStr), targetQuadrant);
    }
  };

  const statusWeight = {
    [TaskStatus.PENDING]: 0,
    [TaskStatus.DOING]: 0,
    [TaskStatus.CANCELLED]: 1,
    [TaskStatus.DONE]: 2
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full h-full content-start">
      {quadrants.map((q) => {
        const config = QUADRANT_CONFIG[q];
        const quadrantTasks = tasks
          .filter((t) => t.quadrant === q)
          .sort((a, b) => {
            const weightA = statusWeight[a.status];
            const weightB = statusWeight[b.status];
            if (weightA !== weightB) return weightA - weightB;
            return b.startTime.localeCompare(a.startTime);
          });

        const isHovered = dragOverQuadrant === q;

        return (
          <div 
            key={q} 
            onDragOver={(e) => handleDragOver(e, q)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, q)}
            className={`flex flex-col rounded-[24px] border transition-all duration-300 ${
              isHovered 
                ? `ring-4 ring-offset-2 ${config.borderColor.replace('border-', 'ring-')} scale-[1.005] shadow-lg z-20` 
                : `${config.borderColor} ${config.bgColor} shadow-sm`
            } overflow-hidden relative`}
          >
            {isHovered && (
              <div className={`absolute inset-0 pointer-events-none border-2 border-dashed rounded-[24px] z-20 animate-pulse ${config.borderColor.replace('border-', 'border-indigo-')}`} />
            )}

            <div className={`px-5 py-4 flex items-center justify-between ${config.headerBg} border-b border-white/50 z-10`}>
              <div>
                <h3 className={`font-black text-[12px] tracking-widest uppercase ${config.headerColor}`}>{config.title}</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-80">{config.description}</p>
              </div>
              <div className={`w-7 h-7 flex items-center justify-center rounded-xl font-black text-xs ${config.badgeColor} shadow-sm border border-white/40`}>
                {quadrantTasks.length}
              </div>
            </div>

            <div className="p-3.5 flex flex-col gap-3 flex-1 overflow-y-auto min-h-[400px] max-h-[520px] scrollbar-custom z-10">
              {quadrantTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 opacity-30">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <span className="text-slate-300 font-black text-[10px]">0</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Danh sách trống</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                   {quadrantTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onUpdateStatus={onUpdateStatus}
                      onUpdateTitle={onUpdateTitle}
                      onDelete={onDeleteTask}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <style>{`
              .scrollbar-custom::-webkit-scrollbar {
                width: 4px;
              }
              .scrollbar-custom::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollbar-custom::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 10px;
              }
              .scrollbar-custom:hover::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.1);
              }
            `}</style>
          </div>
        );
      })}
    </div>
  );
};
