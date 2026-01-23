
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Đồng bộ danh sách nhân sự từ server Make.com
 * Tiết kiệm credit bằng cách chỉ gọi khi cần thiết
 */
export const syncStaffDataFromServer = async (): Promise<StaffMember[]> => {
  const url = API_CONFIG.MAKE_STAFF_URL;
  
  if (!url || !url.startsWith('http')) {
    throw new Error("Cấu hình hệ thống (Webhook URL) chưa hợp lệ.");
  }

  addLog({ 
    type: 'REMOTE', 
    status: 'PENDING', 
    action: 'SYNC_STAFF_ON_DEMAND', 
    message: 'Đang tải dữ liệu nhân sự lần đầu từ máy chủ...' 
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_STAFF', timestamp: new Date().toISOString() }),
      mode: 'cors'
    });
    
    if (!response.ok) throw new Error("Không thể kết nối với máy chủ xác thực.");

    const rawText = await response.text();
    let result;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      // Sửa lỗi JSON nếu Make trả về cấu hình không chuẩn
      const fixedText = rawText.replace(/"data":\s*({[\s\S]*})\s*}/g, (match, p1) => {
        if (p1.includes('}, {')) return `"data": [${p1}]}`;
        return match;
      });
      result = JSON.parse(fixedText);
    }
    
    let processedList: StaffMember[] = [];
    if (result.status === "success" && Array.isArray(result.data)) {
      processedList = result.data.map((item: any) => item.data?.member || item.member || item).filter(Boolean);
    } else if (Array.isArray(result)) {
      processedList = result;
    }

    if (processedList.length > 0) {
      localStorage.setItem('app_staff_list_v1', JSON.stringify(processedList));
      addLog({ 
        type: 'REMOTE', 
        status: 'SUCCESS', 
        action: 'SYNC_STAFF_ON_DEMAND', 
        message: `Đã đồng bộ thành công ${processedList.length} nhân sự.` 
      });
      return processedList;
    } else {
      throw new Error("Dữ liệu nhân sự trả về trống.");
    }
  } catch (error: any) {
    addLog({ 
      type: 'REMOTE', 
      status: 'ERROR', 
      action: 'SYNC_STAFF_ON_DEMAND', 
      message: error.message 
    });
    throw error;
  }
};
