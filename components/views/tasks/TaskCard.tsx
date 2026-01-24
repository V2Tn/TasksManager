
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, X, Clock, RotateCcw, Pencil, Calendar, AlertCircle, GripVertical, User, ArrowRight, RefreshCw } from 'lucide-react';
import { Task, TaskStatus, User as UserType } from '../../../types';
import { getAvailableActions } from '../../../actions/taskStatusActions';
import { isTimePassed, formatSmartDate } from '../../../actions/taskTimeUtils';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (id: number, status: TaskStatus) => void;
  onUpdateTitle: (id: number, title: string) => void;
  onDelete?: (id: number) => void;
  currentUser?: UserType | null;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateStatus, onUpdateTitle, onDelete, currentUser }) => {
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
    e.dataTransfer.setData('taskId', String(task.id));
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

  const stopProp = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  // Hàm hỗ trợ lấy tên rút gọn (2 từ cuối)
  const getShortName = (fullName: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 2) {
      return parts.slice(-2).join(' ');
    }
    return fullName;
  };

  const creatorDisplay = useMemo(() => {
    if (!task.createdById) return 'Hệ thống';
    if (task.createdById === currentUser?.id) return 'TÔI';
    return getShortName(task.createdByLabel).toUpperCase();
  }, [task, currentUser]);

  const assigneeDisplay = useMemo(() => {
    if (!task.assigneeId) return 'TÔI';
    if (task.assigneeId === currentUser?.id) return 'TÔI';
    return getShortName(task.assigneeLabel).toUpperCase();
  }, [task, currentUser]);

  const canUpdateStatus = useMemo(() => {
    if (!currentUser) return false;
    return task.assigneeId === currentUser.id;
  }, [task, currentUser]);

  const canEditTitle = useMemo(() => {
    if (!currentUser) return false;
    return task.createdById === currentUser.id && task.assigneeId === currentUser.id;
  }, [task, currentUser]);

  return (
    <div 
      draggable={!isEditing && canUpdateStatus}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative border rounded-[32px] p-5 transition-all duration-300 ${!isEditing && canUpdateStatus ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} overflow-hidden shrink-0 ${
        isEditing 
          ? 'bg-white border-indigo-400 ring-8 ring-indigo-50 z-20 shadow-2xl' 
          : isDone 
            ? 'bg-slate-50 border-slate-100 shadow-none opacity-80' 
            : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200'
      }`}
    >
      <div className="flex flex-col gap-3">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPointerDown={stopProp}
              className="w-full text-base font-[800] text-slate-800 bg-white border-2 border-indigo-500 rounded-2xl px-5 py-3 focus:outline-none shadow-sm"
            />
            <div className="flex items-center gap-3">
              <button onClick={handleTitleSubmit} onPointerDown={stopProp} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[12px] font-[900] uppercase tracking-wider">Lưu thay đổi</button>
              <button onClick={handleCancel} onPointerDown={stopProp} className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[12px] font-[900] uppercase tracking-wider">Hủy</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start gap-4">
              <h4 className={`text-[16px] leading-tight flex-1 font-[900] ${isDone ? 'line-through text-slate-300' : 'text-slate-800'}`}>
                {task.title}
              </h4>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!isDone && canEditTitle && (
                  <button onClick={() => setIsEditing(true)} onPointerDown={stopProp} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors">
                    <Pencil size={16} />
                  </button>
                )}
                {canUpdateStatus && <div className="p-2 text-slate-300 cursor-grab"><GripVertical size={18} /></div>}
              </div>
            </div>

            {/* Khung thời gian: Không wrap (flex-nowrap) và cuộn ngang nếu cần */}
            <div className={`flex flex-nowrap items-center gap-x-4 p-2 border-2 border-[#5b61f1] rounded-xl text-[9px] font-[800] uppercase tracking-wider overflow-x-auto scrollbar-hide ${isDone ? 'text-slate-300 border-slate-200' : 'text-slate-700'}`}>
              <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Clock size={11} className="text-slate-400" />
                <span>TẠO: <span className="text-slate-900">{task.createdAtDisplay}</span></span>
              </div>
              <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                <RefreshCw size={11} className="text-slate-400" />
                <span>CẬP NHẬT: <span className="text-slate-900">{formatSmartDate(task.updatedAt)}</span></span>
              </div>
              <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Calendar size={11} className={isDone ? "text-slate-300" : "text-rose-500"} />
                <span className={isDone ? "" : "text-rose-600 font-[900]"}>HẠN: {task.endTime}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-[900] border uppercase tracking-widest shadow-sm shrink-0 ${
                  task.status === TaskStatus.DOING ? 'bg-indigo-600 text-white border-indigo-600' :
                  task.status === TaskStatus.DONE ? 'bg-emerald-500 text-white border-emerald-500' :
                  task.status === TaskStatus.PENDING ? 'bg-[#5b61f1] text-white border-[#5b61f1]' :
                  'bg-slate-400 text-white border-slate-400'
                }`}>
                  {task.status === TaskStatus.DOING ? 'Đang làm' : task.status === TaskStatus.DONE ? 'Hoàn thành' : task.status === TaskStatus.PENDING ? 'Mới' : 'Hủy'}
                </span>

                <div className="flex items-center gap-2 bg-[#f8fafc] rounded-xl px-2.5 py-1 border border-slate-100 overflow-hidden">
                  <div className="flex items-center gap-1 text-[9px] font-[900] text-slate-500">
                    <span className="whitespace-nowrap">{creatorDisplay}</span>
                  </div>
                  <ArrowRight size={10} className="text-slate-300 shrink-0" strokeWidth={3} />
                  <div className={`flex items-center gap-1 text-[9px] font-[900] ${task.assigneeId === currentUser?.id ? 'text-indigo-600' : 'text-slate-500'}`}>
                    <span className="whitespace-nowrap">{assigneeDisplay}</span>
                  </div>
                </div>

                {isOverdue && (
                  <span className="flex items-center gap-1 bg-rose-500 text-white px-2 py-1 rounded-lg text-[8px] font-[900] uppercase tracking-tighter shadow-lg shadow-rose-100 shrink-0">
                    TRỄ HẠN
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canUpdateStatus ? (
                  <div className="flex items-center gap-1.5">
                    {actions.map(action => {
                      const handleAction = (e: React.MouseEvent) => {
                        e.preventDefault(); e.stopPropagation();
                        const nextStatus = action === 'DONE' ? TaskStatus.DONE : action === 'START' ? TaskStatus.DOING : action === 'CANCEL' ? TaskStatus.CANCELLED : TaskStatus.PENDING;
                        onUpdateStatus(task.id, nextStatus);
                      };

                      const isRedoAction = action === 'REDO';
                      const btnBaseClass = "w-8 h-8 flex items-center justify-center rounded-xl border transition-all active:scale-90 shadow-sm";
                      const btnColorClass = isRedoAction 
                        ? "bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100" 
                        : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600";

                      if (action === 'DONE') return <button key={action} onPointerDown={stopProp} onClick={handleAction} className={`${btnBaseClass} ${btnColorClass} hover:text-emerald-500`} title="Hoàn thành"><Check size={16} strokeWidth={4} /></button>;
                      if (action === 'START') return <button key={action} onPointerDown={stopProp} onClick={handleAction} className={`${btnBaseClass} ${btnColorClass}`} title="Bắt đầu"><Clock size={16} strokeWidth={4} /></button>;
                      if (action === 'CANCEL') return <button key={action} onPointerDown={stopProp} onClick={handleAction} className={`${btnBaseClass} ${btnColorClass} hover:text-rose-500`} title="Hủy bỏ"><X size={16} strokeWidth={4} /></button>;
                      if (action === 'REDO') return <button key={action} onPointerDown={stopProp} onClick={handleAction} className={`${btnBaseClass} ${btnColorClass} bg-white`} title="Làm lại"><RotateCcw size={16} strokeWidth={4} /></button>;
                      return null;
                    })}
                  </div>
                ) : (
                  <span className="text-[8px] font-[900] text-slate-400 uppercase italic tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">Theo dõi</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
