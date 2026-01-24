import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Hàm phân giải JSON cực kỳ an toàn, giải quyết lỗi 'Expected double-quoted property name'
 */
const safeJsonParse = (text: string): any => {
  let cleaned = text.trim();
  
  // Xử lý các lỗi phổ biến từ Webhook/Google Sheets trả về qua Make
  // 1. Loại bỏ trailing commas (dấu phẩy thừa ở cuối danh sách/đối tượng)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  
  // 2. Nếu Make trả về fragment "data": {...} mà thiếu ngoặc nhọn bọc ngoài
  if (cleaned.startsWith('"data":') && !cleaned.startsWith('{')) {
    cleaned = '{' + cleaned + '}';
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 3. Cố gắng tìm khối JSON hợp lệ đầu tiên bằng Brute Force
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      // Fix: Declare 'extracted' outside the try block so it is accessible in the catch block
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extracted);
      } catch (innerErr) {
        console.error("Không thể sửa lỗi JSON:", extracted);
      }
    }
    throw e;
  }
};

/**
 * Hàm trích xuất nhân viên đệ quy: Tìm kiếm sâu trong mọi ngóc ngách của dữ liệu trả về
 */
const extractStaffFromResponse = (result: any): StaffMember[] => {
  if (!result) return [];

  const foundMembers: StaffMember[] = [];
  const seenIds = new Set<string | number>();

  const findMembersRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    // Kiểm tra cấu trúc có chứa thông tin đăng nhập tối thiểu
    if (obj.username && (obj.password !== undefined || obj.role)) {
      const id = obj.id || obj.username;
      if (!seenIds.has(id)) {
        foundMembers.push(obj as StaffMember);
        seenIds.add(id);
      }
    }

    // Duyệt sâu hơn
    if (Array.isArray(obj)) {
      obj.forEach(item => findMembersRecursive(item));
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          findMembersRecursive(obj[key]);
        }
      }
    }
  };

  findMembersRecursive(result);
  return foundMembers;
};

/**
 * Đồng bộ nhân sự từ Make.com
 */
export const syncStaffDataFromServer = async (): Promise<StaffMember[]> => {
  const url = localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
  
  if (!url || !url.startsWith('http')) {
    throw new Error("Webhook URL không hợp lệ.");
  }

  addLog({ 
    type: 'REMOTE', 
    status: 'PENDING', 
    action: 'SYNC_STAFF', 
    message: 'Đang kết nối tới server...' 
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
    
    if (!response.ok) throw new Error(`Lỗi server: ${response.status}`);

    const rawText = await response.text();
    const result = safeJsonParse(rawText);
    const processedList = extractStaffFromResponse(result);

    if (processedList.length > 0) {
      localStorage.setItem('app_staff_list_v1', JSON.stringify(processedList));
      window.dispatchEvent(new Event('app_data_updated'));
      
      addLog({ 
        type: 'REMOTE', 
        status: 'SUCCESS', 
        action: 'SYNC_STAFF', 
        message: `Đã đồng bộ ${processedList.length} tài khoản.` 
      });
      return processedList;
    } else {
      throw new Error("Dữ liệu nhân sự không hợp lệ.");
    }
  } catch (error: any) {
    addLog({ 
      type: 'REMOTE', 
      status: 'ERROR', 
      action: 'SYNC_STAFF', 
      message: error.message 
    });
    throw error;
  }
};