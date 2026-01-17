
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Quadrant, TaskStatus } from '../../../types';
import { QUADRANT_CONFIG } from '../../../constants';
import { getCurrentTimeFormatted, getEndOfDayTimeFormatted } from '../../../actions/taskTimeUtils';

interface TaskFormProps {
  onAdd: (task: any) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<Quadrant>(Quadrant.Q1);
  const [startTime, setStartTime] = useState(getCurrentTimeFormatted());
  const [endTime, setEndTime] = useState(getEndOfDayTimeFormatted());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title,
      quadrant,
      status: TaskStatus.PENDING,
      startTime,
      endTime
    });

    setTitle('');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[15px] font-bold text-gray-800">Thêm công việc mới</h3>
        <Plus size={18} className="text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bạn cần làm gì hôm nay?"
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-[14px] font-medium text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.values(Quadrant) as Quadrant[]).map((q) => {
            const config = QUADRANT_CONFIG[q];
            const isSelected = quadrant === q;
            
            // Map selected border colors based on quadrant type
            const selectedBorder = q === Quadrant.Q1 ? 'border-red-500 ring-red-50' : 
                                 q === Quadrant.Q2 ? 'border-blue-500 ring-blue-50' :
                                 q === Quadrant.Q3 ? 'border-amber-500 ring-amber-50' :
                                 'border-gray-500 ring-gray-50';

            const dotColor = q === Quadrant.Q1 ? 'bg-red-500' : 
                            q === Quadrant.Q2 ? 'bg-blue-500' :
                            q === Quadrant.Q3 ? 'bg-amber-500' :
                            'bg-gray-500';

            return (
              <button
                key={q}
                type="button"
                onClick={() => setQuadrant(q)}
                className={`p-3 rounded-xl border text-left transition-all relative group h-20 flex flex-col justify-center ${
                  isSelected 
                    ? `${selectedBorder} ring-4 shadow-sm bg-white` 
                    : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200'
                }`}
              >
                <div className={`text-[12px] font-bold ${isSelected ? config.headerColor : 'text-gray-500'}`}>{config.title}</div>
                <div className="text-[9px] text-gray-400 leading-tight mt-1 font-medium">{config.description}</div>
                
                <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-500' : 'border-gray-200'}`}>
                    {isSelected && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Ngày bắt đầu</label>
            <input 
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] font-semibold text-gray-700 focus:outline-none focus:border-indigo-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Hạn kết thúc</label>
            <input 
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] font-semibold text-gray-700 focus:outline-none focus:border-indigo-300"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim()}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-200 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] mt-2"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="text-[15px]">Thêm</span>
        </button>
      </form>
    </div>
  );
};
