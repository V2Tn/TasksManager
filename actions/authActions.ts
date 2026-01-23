
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Đồng bộ danh sách nhân sự từ server Make.com
 * Tiết kiệm credit bằng cách chỉ gọi khi cần thiết
 */
export const syncStaffDataFromServer = async (): Promise<StaffMember[]> => {
  // Ưu tiên lấy URL từ Settings (localStorage) trước, sau đó mới tới Environment Variables
  const url = localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
  
  if (!url || !url.startsWith('http')) {
    const errorMsg = "Hệ thống chưa có URL Webhook. Vui lòng cấu hình VITE_MAKE_STAFF_URL trong môi trường hoặc mục Cài đặt.";
    addLog({ type: 'LOCAL', status: 'ERROR', action: 'CHECK_URL', message: errorMsg });
    throw new Error(errorMsg);
  }

  addLog({ 
    type: 'REMOTE', 
    status: 'PENDING', 
    action: 'SYNC_STAFF_AUTO', 
    message: 'Đang kết nối tới máy chủ nhân sự...' 
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'SYNC_STAFF', 
        timestamp: new Date().toISOString(),
        client: 'EISENHOWER_APP'
      }),
      mode: 'cors'
    });
    
    if (!response.ok) throw new Error(`Lỗi máy chủ: ${response.status}`);

    const rawText = await response.text();
    let result;
    
    try {
      // Thử xử lý định dạng JSON lỗi phổ biến từ các hệ thống automation
      const fixedText = rawText.replace(/"data":\s*({[\s\S]*})\s*}/g, (match, p1) => {
        if (p1.includes('}, {') && !p1.trim().startsWith('[')) return `"data": [${p1}]}`;
        return match;
      });
      result = JSON.parse(fixedText);
    } catch (e) {
      result = JSON.parse(rawText);
    }
    
    let processedList: StaffMember[] = [];
    
    // Xử lý các cấu trúc dữ liệu khác nhau từ Make
    if (result.status === "success" || result.success === true) {
      const data = result.data || result.items || result.result;
      if (Array.isArray(data)) {
        processedList = data.map((item: any) => item.data?.member || item.member || item).filter(Boolean);
      } else if (data && typeof data === 'object') {
        // Nếu trả về 1 object đơn lẻ
        const singleMember = data.member || data;
        if (singleMember && (singleMember.username || singleMember.fullName)) {
          processedList = [singleMember];
        }
      }
    } else if (Array.isArray(result)) {
      processedList = result;
    }

    if (processedList.length > 0) {
      localStorage.setItem('app_staff_list_v1', JSON.stringify(processedList));
      addLog({ 
        type: 'REMOTE', 
        status: 'SUCCESS', 
        action: 'SYNC_STAFF_AUTO', 
        message: `Đã đồng bộ ${processedList.length} nhân sự.` 
      });
      return processedList;
    } else {
      throw new Error("Dữ liệu trả về không chứa danh sách nhân sự hợp lệ.");
    }
  } catch (error: any) {
    addLog({ 
      type: 'REMOTE', 
      status: 'ERROR', 
      action: 'SYNC_STAFF_AUTO', 
      message: error.message 
    });
    throw error;
  }
};
