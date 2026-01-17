
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, List, Layout, BarChart2, Volume2, VolumeX, Volume1, Music, Check } from 'lucide-react';
import { AVAILABLE_SOUNDS } from '../../constants';

interface HeaderProps {
  activeTab: 'tasks' | 'reports';
  onTabChange: (tab: 'tasks' | 'reports') => void;
  viewMode: 'matrix' | 'list';
  onViewModeChange: (mode: 'matrix' | 'list') => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  currentSoundUrl: string;
  onSoundChange: (url: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onTabChange, 
  viewMode, 
  onViewModeChange,
  volume,
  onVolumeChange,
  currentSoundUrl,
  onSoundChange
}) => {
  const [now, setNow] = useState(new Date());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const soundPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (soundPickerRef.current && !soundPickerRef.current.contains(event.target as Node)) {
        setShowSoundPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} THÁNG ${month}, ${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const toggleViewMode = () => {
    onViewModeChange(viewMode === 'matrix' ? 'list' : 'matrix');
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handleSoundSelect = (url: string) => {
    onSoundChange(url);
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {});
  };

  return (
    <header className="flex flex-col gap-4 mb-8 md:mb-12 px-1">
      {/* Combined Row: Brand on left, All Controls on right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
        {/* Brand and Time Group */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-3xl md:text-4xl font-black text-indigo-600 tracking-tight leading-none">Tasks</h1>
          <div className="flex items-center gap-3 text-gray-400 text-[10px] md:text-[11px] font-bold uppercase tracking-wider mt-1.5">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Calendar size={12} strokeWidth={2.5} className="text-gray-300" />
              <span>{formatDate(now)}</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock size={12} strokeWidth={2.5} className="text-gray-300" />
              <span>{formatTime(now)}</span>
            </div>
          </div>
        </div>

        {/* Tab & Action Controls Group - Integrated together */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-full sm:w-auto flex-nowrap">
            <button 
              onClick={() => onTabChange('tasks')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Layout size={16} strokeWidth={2.5} />
              CÔNG VIỆC
            </button>
            <button 
              onClick={() => onTabChange('reports')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${
                activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <BarChart2 size={16} strokeWidth={2.5} />
              BÁO CÁO
            </button>
          </div>

          {/* Icon Controls (Sound, Volume, View) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            {/* Sound Picker */}
            <div className="relative" ref={soundPickerRef}>
              <button 
                onClick={() => setShowSoundPicker(!showSoundPicker)}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-sm active:scale-95 ${showSoundPicker ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-gray-400 border-gray-100 hover:text-indigo-500'}`}
              >
                <Music size={18} strokeWidth={2.5} />
              </button>
              {showSoundPicker && (
                <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                    Âm thanh hoàn thành
                  </div>
                  {AVAILABLE_SOUNDS.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundSelect(sound.url)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                        currentSoundUrl === sound.url 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {sound.name}
                      {currentSoundUrl === sound.url && <Check size={14} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Slider */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <div className={`flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-2 py-2 shadow-sm transition-all duration-300 ${showVolumeSlider ? 'w-32' : 'w-11 overflow-hidden'}`}>
                <button 
                  onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)}
                  className={`shrink-0 p-0.5 transition-colors ${volume === 0 ? 'text-red-400' : 'text-gray-400 hover:text-indigo-600'}`}
                >
                  <VolumeIcon size={18} />
                </button>
                {showVolumeSlider && (
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* View Mode Toggle - Only shown in tasks tab */}
            {activeTab === 'tasks' && (
              <button 
                onClick={toggleViewMode}
                className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 bg-white rounded-xl border border-gray-100 shadow-sm transition-all active:scale-95 flex items-center justify-center"
                title={viewMode === 'matrix' ? "Chuyển sang danh sách" : "Chuyển sang ma trận"}
              >
                {viewMode === 'matrix' ? <List size={20} /> : <Layout size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
