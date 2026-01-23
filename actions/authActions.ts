
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Hàm phân giải JSON an toàn, xử lý các trường hợp Webhook trả về dữ liệu không chuẩn
 */
const safeJsonParse = (text: string): any => {
  let cleaned = text.trim();
  
  // Xử lý trường hợp Make.com trả về chuỗi bắt đầu trực tiếp bằng "data": ... mà thiếu dấu ngoặc nhọn bao quanh
  if (cleaned.startsWith('"data":') && !cleaned.startsWith('{')) {
    cleaned = '{' + cleaned + '}';
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Nếu vẫn lỗi, thử lọc bỏ các ký tự rác ở đầu/cuối chuỗi
    try {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      }
    } catch (innerError) {}
    throw e;
  }
};

/**
 * Hàm trích xuất nhân viên linh hoạt: tìm kiếm đệ quy trong các đối tượng lồng nhau.
 */
const extractStaffFromResponse = (result: any): StaffMember[] => {
  if (!result) return [];

  const foundMembers: StaffMember[] = [];
  const seenIds = new Set<string | number>();

  const findMembersRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    // Kiểm tra xem đối tượng hiện tại có phải là thông tin nhân viên không
    if ((obj.username || obj.fullName) && (obj.role || obj.password)) {
      const id = obj.id || obj.username;
      if (!seenIds.has(id)) {
        foundMembers.push(obj as StaffMember);
        seenIds.add(id);
      }
    }

    // Duyệt qua các thuộc tính của đối tượng hoặc mảng
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
 * Hàm đồng bộ dữ liệu nhân viên dùng chung
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
        message: `Đã đồng bộ ${processedList.length} nhân sự.` 
      });
      return processedList;
    } else {
      throw new Error("Không tìm thấy dữ liệu nhân sự.");
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
