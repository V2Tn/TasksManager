
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Đồng bộ danh sách nhân sự từ server Make.com
 */
export const syncStaffDataFromServer = async (): Promise<StaffMember[]> => {
  // Ưu tiên lấy URL từ Settings (localStorage) -> Environment Variables
  const url = localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
  
  if (!url || !url.startsWith('http')) {
    const errorMsg = "Chưa tìm thấy Webhook URL. Vui lòng kiểm tra lại cấu hình VITE_MAKE_STAFF_URL.";
    addLog({ type: 'LOCAL', status: 'ERROR', action: 'AUTH_SYNC', message: errorMsg });
    throw new Error(errorMsg);
  }

  addLog({ 
    type: 'REMOTE', 
    status: 'PENDING', 
    action: 'AUTH_SYNC', 
    message: `Đang gọi Webhook: ${url.substring(0, 30)}...` 
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'SYNC_STAFF', 
        timestamp: new Date().toISOString()
      }),
      mode: 'cors'
    });
    
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

    const rawText = await response.text();
    
    // Lưu log dữ liệu thô để debug trong mục Cấu hình -> Nhật ký kết nối
    addLog({ 
      type: 'REMOTE', 
      status: 'SUCCESS', 
      action: 'SERVER_RESPONSE', 
      message: `Dữ liệu nhận được: ${rawText.substring(0, 200)}${rawText.length > 200 ? '...' : ''}` 
    });

    let result;
    try {
      // Fix lỗi JSON phổ biến của Make.com (thiếu dấu ngoặc vuông khi chỉ có 1 row)
      const fixedText = rawText.replace(/"data":\s*({[^{}]*member[^{}]*})\s*}/g, (match, p1) => {
        return `"data": [${p1}]}`;
      });
      result = JSON.parse(fixedText);
    } catch (e) {
      result = JSON.parse(rawText);
    }
    
    let processedList: StaffMember[] = [];
    
    // 1. Nếu trả về cấu trúc bọc trong "data"
    const dataNode = result.data || result.items || result.result;
    if (dataNode) {
      if (Array.isArray(dataNode)) {
        processedList = dataNode.map((item: any) => item.member || item).filter(Boolean);
      } else if (typeof dataNode === 'object') {
        // Tự động chuyển object đơn thành mảng 1 phần tử
        processedList = [dataNode.member || dataNode];
      }
    } 
    // 2. Nếu trả về mảng trực tiếp
    else if (Array.isArray(result)) {
      processedList = result;
    }
    // 3. Nếu trả về object trực tiếp (Single user)
    else if (result && typeof result === 'object' && (result.username || result.fullName)) {
      processedList = [result];
    }

    if (processedList.length > 0) {
      localStorage.setItem('app_staff_list_v1', JSON.stringify(processedList));
      addLog({ 
        type: 'REMOTE', 
        status: 'SUCCESS', 
        action: 'AUTH_SYNC', 
        message: `Đã cập nhật ${processedList.length} nhân sự vào bộ nhớ.` 
      });
      return processedList;
    } else {
      throw new Error("Server trả về thành công nhưng không tìm thấy danh sách nhân sự.");
    }
  } catch (error: any) {
    addLog({ 
      type: 'REMOTE', 
      status: 'ERROR', 
      action: 'AUTH_SYNC', 
      message: error.message 
    });
    throw error;
  }
};
