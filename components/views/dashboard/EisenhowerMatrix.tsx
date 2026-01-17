
import React, { useState } from 'react';
import { Task, Quadrant, TaskStatus } from '../../../types';
import { QUADRANT_CONFIG } from '../../../constants';
import { TaskCard } from '../tasks/TaskCard';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateQuadrant: (id: string, quadrant: Quadrant) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ 
  tasks, 
  onUpdateStatus, 
  onUpdateTitle,
  onUpdateQuadrant 
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
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateQuadrant(taskId, targetQuadrant);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full content-start">
      {quadrants.map((q) => {
        const config = QUADRANT_CONFIG[q];
        const quadrantTasks = tasks.filter((t) => t.quadrant === q);
        const isHovered = dragOverQuadrant === q;

        return (
          <div 
            key={q} 
            onDragOver={(e) => handleDragOver(e, q)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, q)}
            className={`flex flex-col rounded-xl border transition-all duration-300 ${
              isHovered 
                ? `ring-4 ring-offset-2 ${config.borderColor.replace('border-', 'ring-')} scale-[1.01] shadow-xl z-20` 
                : `${config.borderColor} ${config.bgColor} shadow-sm`
            } overflow-hidden min-h-[320px] relative`}
          >
            {/* Drop Indicator Overlay */}
            {isHovered && (
              <div className={`absolute inset-0 pointer-events-none border-4 border-dashed rounded-xl z-10 animate-pulse ${config.borderColor}`} />
            )}

            <div className={`px-5 py-3.5 flex items-center justify-between bg-gradient-to-r ${config.headerBg} to-white border-b border-gray-50 z-10`}>
              <div>
                <h3 className={`font-bold text-[13px] tracking-wider uppercase ${config.headerColor}`}>{config.title}</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{config.description}</p>
              </div>
              <div className={`w-6 h-6 flex items-center justify-center rounded-lg font-bold text-xs ${config.badgeColor} shadow-sm border border-white`}>
                {quadrantTasks.length}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto max-h-[450px] scrollbar-hide z-10">
              {quadrantTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <span className="text-gray-200 font-bold text-xs">0</span>
                  </div>
                  <span className="text-xs font-medium text-gray-300 uppercase tracking-widest">Trống</span>
                </div>
              ) : (
                quadrantTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdateStatus={onUpdateStatus}
                    onUpdateTitle={onUpdateTitle}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
