
import React, { useEffect, useState } from 'react';
import { PartyPopper, CheckCircle2 } from 'lucide-react';

interface CelebrationOverlayProps {
  isVisible: boolean;
  onFinished: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ isVisible, onFinished }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onFinished();
      }, 2500); // Hiển thị trong 2.5 giây
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onFinished]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      {/* Background Dim */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
      
      {/* Content Card */}
      <div className="relative bg-white rounded-[40px] p-10 shadow-2xl border border-indigo-50 flex flex-col items-center gap-6 animate-in zoom-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
          <div className="relative w-28 h-28 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <CheckCircle2 size={64} strokeWidth={2.5} className="animate-bounce" />
          </div>
          <div className="absolute -top-4 -right-4 text-amber-400 animate-pulse">
            <PartyPopper size={40} />
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Tuyệt vời!</h2>
          <p className="text-gray-500 font-bold mt-1">Chúc mừng bạn đã hoàn thành!</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-amber-200/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-200/20 rounded-full blur-xl"></div>
      </div>
    </div>
  );
};
