import React, { useState, useMemo } from 'react';
import { Settings, Globe, Save, Info, CheckCircle, ExternalLink, RotateCcw, ListChecks, Cpu } from 'lucide-react';
import { API_CONFIG } from '../../../config/apiConfig';
import { ConnectionLogView } from './ConnectionLogView';
import { addLog } from '../../../actions/logger';

export const SettingsView: React.FC = () => {
  // Lấy giá trị từ LocalStorage, nếu không có thì lấy từ Biến môi trường
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('system_make_webhook_url') || '';
  });
  
  const [taskWebhookUrl, setTaskWebhookUrl] = useState(() => {
    return localStorage.getItem('system_task_webhook_url') || '';
  });

  const [isSaved, setIsSaved] = useState(false);

  // Kiểm tra xem có đang dùng biến môi trường không
  const isUsingEnvForStaff = !webhookUrl && !!API_CONFIG.MAKE_STAFF_URL;
  const isUsingEnvForTask = !taskWebhookUrl && !!API_CONFIG.TASK_WEBHOOK_URL;

  const handleSave = () => {
    // Lưu System Webhook
    if (webhookUrl.trim() === '') {
      localStorage.removeItem('system_make_webhook_url');
    } else {
      localStorage.setItem('system_make_webhook_url', webhookUrl);
    }

    // Lưu Task Webhook
    if (taskWebhookUrl.trim() === '') {
      localStorage.removeItem('system_task_webhook_url');
    } else {
      localStorage.setItem('system_task_webhook_url', taskWebhookUrl);
    }

    addLog({
      type: 'LOCAL',
      status: 'SUCCESS',
      action: 'SAVE CONFIG',
      message: 'Đã cập nhật cấu hình Webhook hệ thống và Webhook Task.'
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    // Phát tín hiệu để các component khác cập nhật
    window.dispatchEvent(new Event('app_data_updated'));
  };

  const handleReset = () => {
    if (window.confirm('Khôi phục cài đặt gốc? Tất cả các URL tùy chỉnh sẽ bị xóa và quay về sử dụng biến môi trường.')) {
      setWebhookUrl('');
      setTaskWebhookUrl('');
      localStorage.removeItem('system_make_webhook_url');
      localStorage.removeItem('system_task_webhook_url');
      
      addLog({
        type: 'LOCAL',
        status: 'SUCCESS',
        action: 'RESET CONFIG',
        message: 'Đã khôi phục cài đặt gốc cho tất cả Webhook.'
      });
      window.dispatchEvent(new Event('app_data_updated'));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[800px] mx-auto pb-20">
      <div className="mb-10 px-1">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Cấu hình hệ thống</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.15em] mt-1">Quản lý kết nối và API toàn cục</p>
      </div>

      <div className="bg-white rounded-[40px] p-8 md:p-10 border border-slate-50 shadow-2xl shadow-slate-100/50">
        <div className="space-y-10">
          {/* Section 1: System Webhook */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Globe size={20} />
                 </div>
                 <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Hệ thống Webhook URL</h3>
              </div>
              
              {isUsingEnvForStaff ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 animate-pulse">
                  <Cpu size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Environment</span>
                </div>
              ) : webhookUrl && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <CheckCircle size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Custom URL</span>
                </div>
              )}
            </div>
            
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl">
              Dùng cho việc đồng bộ <b>Nhân sự</b> và <b>Phòng ban</b>.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder={API_CONFIG.MAKE_STAFF_URL || 'Chưa cấu hình biến môi trường...'}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
              />
              {!webhookUrl && API_CONFIG.MAKE_STAFF_URL && (
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest ml-2 flex items-center gap-1.5 opacity-60">
                  <Info size={10} /> Hệ thống sẽ tự động dùng URL từ .env nếu ô này để trống
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Task Webhook */}
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ListChecks size={20} />
                 </div>
                 <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Task Webhook URL</h3>
              </div>

              {isUsingEnvForTask ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 animate-pulse">
                  <Cpu size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Environment</span>
                </div>
              ) : taskWebhookUrl && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <CheckCircle size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Custom URL</span>
                </div>
              )}
            </div>
            
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl">
              Dùng cho các hành động <b>Thêm, Xóa, Cập nhật trạng thái</b> của công việc.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={taskWebhookUrl}
                onChange={(e) => setTaskWebhookUrl(e.target.value)}
                placeholder={API_CONFIG.TASK_WEBHOOK_URL || 'Chưa cấu hình biến môi trường...'}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
              />
              {!taskWebhookUrl && API_CONFIG.TASK_WEBHOOK_URL && (
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-2 flex items-center gap-1.5 opacity-60">
                  <Info size={10} /> Hệ thống sẽ tự động dùng URL từ .env nếu ô này để trống
                </p>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-xl transition-colors"
            >
              <RotateCcw size={14} /> KHÔI PHỤC MẶC ĐỊNH
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 ${
                isSaved 
                ? 'bg-green-500 text-white shadow-green-100' 
                : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
              {isSaved ? 'ĐÃ LƯU THÀNH CÔNG' : 'LƯU CẤU HÌNH'}
            </button>
          </div>
        </div>
      </div>

      <ConnectionLogView />
    </div>
  );
};