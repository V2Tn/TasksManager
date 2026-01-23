
import React, { useState, useEffect } from 'react';
import { Trash2, Terminal } from 'lucide-react';
import { LogEntry, getLogs, clearLogs } from '../../../actions/logger';

export const ConnectionLogView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refreshLogs = () => {
    setLogs(getLogs());
  };

  useEffect(() => {
    refreshLogs();
    window.addEventListener('app_logs_updated', refreshLogs);
    return () => window.removeEventListener('app_logs_updated', refreshLogs);
  }, []);

  return (
    <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <Terminal size={20} className="text-slate-800" />
          <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Nhật ký kết nối</h3>
        </div>
        <button 
          onClick={clearLogs}
          className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
        >
          Xóa lịch sử
        </button>
      </div>

      <div className="bg-[#0f172a] rounded-[40px] p-6 md:p-8 shadow-2xl shadow-slate-900/20 min-h-[400px] max-h-[600px] overflow-y-auto scrollbar-hide">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
            <Terminal size={48} className="text-white mb-4" />
            <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Hệ thống đang sẵn sàng...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-6 group">
                {/* Vertical Connector Line */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-800 group-last:bg-transparent"></div>
                
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-[#64748b] font-mono text-sm font-bold">{log.timestamp}</span>
                  
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    log.type === 'LOCAL' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-900/40 text-indigo-400'
                  }`}>
                    {log.type}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    log.status === 'SUCCESS' ? 'bg-green-900/40 text-green-400' : 
                    log.status === 'ERROR' ? 'bg-red-900/40 text-red-400' : 'bg-amber-900/40 text-amber-400'
                  }`}>
                    {log.status}
                  </span>
                </div>

                <div className="mb-2">
                  <p className="text-white text-xs font-black uppercase tracking-widest">{log.action}</p>
                </div>

                <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl p-4 mr-2">
                  <p className="text-[#94a3b8] text-[13px] font-bold leading-relaxed">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
