
import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Clock, RotateCcw, Pencil, Calendar, AlertCircle, GripVertical } from 'lucide-react';
import { Task, TaskStatus } from '../../../types';
import { getAvailableActions } from '../../../actions/taskStatusActions';
import { isTimePassed } from '../../../actions/taskTimeUtils';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateStatus, onUpdateTitle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleTitleSubmit = () => {
    if (editValue.trim() && editValue !== task.title) {
      onUpdateTitle(task.id, editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') handleCancel();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const actions = getAvailableActions(task.status);
  const isDone = task.status === TaskStatus.DONE;
  const isOverdue = isTimePassed(task.endTime) && !isDone;

  return (
    <div 
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative border rounded-xl p-4 transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isEditing 
          ? 'bg-white border-indigo-500 ring-2 ring-indigo-50 z-10 shadow-lg' 
          : isDone 
            ? 'bg-slate-50/50 border-slate-100 shadow-none' 
            : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex flex-col gap-3">
        {isEditing ? (
          <div className="space-y-3 animate-in fade-in duration-200">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-[14px] font-bold text-gray-900 bg-white border border-indigo-500 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleTitleSubmit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] text-[#16a34a] rounded-md text-[12px] font-bold hover:bg-[#dcfce7] transition-colors border border-green-100 shadow-sm"
              >
                <Check size={14} strokeWidth={3} /> Lưu
              </button>
              <button 
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f9fafb] text-[#4b5563] rounded-md text-[12px] font-bold hover:bg-[#f3f4f6] transition-colors border border-gray-100 shadow-sm"
              >
                <X size={14} strokeWidth={3} /> Hủy
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h4 className={`text-[14px] leading-snug transition-colors ${
                  isDone 
                    ? 'line-through text-slate-400 font-bold' 
                    : 'text-slate-900 font-black group-hover:text-indigo-600'
                }`}>
                  {task.title}
                </h4>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {!isDone && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Pencil size={12} />
                  </button>
                )}
                <div className="p-1.5 text-gray-300 cursor-grab active:cursor-grabbing">
                  <GripVertical size={14} />
                </div>
              </div>
            </div>

            <div className={`flex flex-wrap items-center text-[9px] gap-x-2 gap-y-1 transition-opacity ${isDone ? 'text-slate-400' : 'text-slate-700'}`}>
              <div className={`flex items-center shrink-0 ${!isDone ? 'font-black' : 'font-bold'}`}>
                <Clock size={10} className={`mr-1 ${isDone ? 'opacity-40' : 'opacity-90 text-slate-900'}`} />
                <span>Tạo: {task.startTime}</span>
              </div>
              <span className="opacity-20 hidden sm:inline text-slate-300">|</span>
              <div className={`flex items-center shrink-0 ${!isDone ? 'font-black' : 'font-bold'}`}>
                <RotateCcw size={10} className={`mr-1 ${isDone ? 'opacity-40 text-indigo-300' : 'opacity-90 text-indigo-600'}`} />
                <span>Cập nhật: {task.updatedAt}</span>
              </div>
              <span className="opacity-20 hidden sm:inline text-slate-300">|</span>
              <div className={`flex items-center shrink-0 ${!isDone ? 'font-black' : 'font-bold'}`}>
                <Calendar size={10} className={`mr-1 ${isDone ? 'opacity-40 text-red-300' : 'opacity-90 text-red-600'}`} />
                <span className={`${isDone ? '' : 'text-red-700'}`}>Hạn: {task.endTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                  {isOverdue && (
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-black border border-red-100 flex items-center gap-1 shadow-sm">
                        <AlertCircle size={10} /> Tồn đọng
                      </span>
                  )}
                  {task.status === TaskStatus.DOING && (
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-black border border-indigo-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span> Đang làm
                      </span>
                  )}
                  {task.status === TaskStatus.PENDING && (
                       <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md text-[10px] font-black border border-blue-100 flex items-center gap-1"> Mới </span>
                  )}
                  {task.status === TaskStatus.CANCELLED && (
                       <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[10px] font-black border border-gray-200"> Đã hủy </span>
                  )}
                  {task.status === TaskStatus.DONE && (
                       <span className="bg-[#f0fdf4] text-[#16a34a] px-2 py-0.5 rounded-md text-[10px] font-black border border-[#dcfce7] shadow-sm"> Hoàn thành </span>
                  )}
              </div>

              <div className={`flex gap-1 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                {actions.map(action => {
                  if (action === 'DONE') return (
                    <button key={action} onClick={() => onUpdateStatus(task.id, TaskStatus.DONE)} className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"><Check size={14} /></button>
                  );
                  if (action === 'START') return (
                    <button key={action} onClick={() => onUpdateStatus(task.id, TaskStatus.DOING)} className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Clock size={14} /></button>
                  );
                  if (action === 'CANCEL') return (
                    <button key={action} onClick={() => onUpdateStatus(task.id, TaskStatus.CANCELLED)} className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"><X size={14} /></button>
                  );
                  if (action === 'REDO') return (
                    <button key={action} onClick={() => onUpdateStatus(task.id, TaskStatus.PENDING)} className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"><RotateCcw size={14} /></button>
                  );
                  return null;
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
