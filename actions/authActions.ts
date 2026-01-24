
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Hàm phân giải JSON cực kỳ an toàn, giải quyết lỗi 'Expected double-quoted property name'
 * bằng cách tự động bọc các đối tượng anh em vào mảng []
 */
export const safeJsonParse = (text: string): any => {
  let cleaned = text.trim();
  
  // 1. Loại bỏ các ký tự rác ở đầu/cuối nếu có
  cleaned = cleaned.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

  // 2. Xử lý lỗi trọng tâm: "data": {obj1}, {obj2} -> "data": [{obj1}, {obj2}]
  // Tìm vị trí sau "data": và bọc toàn bộ nội dung sau đó (đến trước dấu đóng } cuối cùng) vào []
  if (cleaned.includes('"data":') && cleaned.includes('}, {')) {
    try {
      const dataKey = '"data":';
      const dataStartIdx = cleaned.indexOf(dataKey) + dataKey.length;
      const lastBraceIdx = cleaned.lastIndexOf('}'); // Dấu đóng ngoặc của root object
      
      if (dataStartIdx !== -1 && lastBraceIdx > dataStartIdx) {
        const prefix = cleaned.substring(0, dataStartIdx).trim();
        const content = cleaned.substring(dataStartIdx, lastBraceIdx).trim();
        const suffix = cleaned.substring(lastBraceIdx);
        
        // Chỉ bọc nếu chưa có ngoặc mảng
        if (!content.startsWith('[')) {
          cleaned = `${prefix} [${content}] ${suffix}`;
        }
      }
    } catch (e) {
      console.error("Lỗi khi cố gắng sửa cấu trúc JSON:", e);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Không thể parse JSON mặc dù đã cố gắng sửa:", cleaned);
    // Nếu vẫn lỗi, trả về null hoặc mảng rỗng tùy logic
    return null;
  }
};

/**
 * Hàm trích xuất nhân viên đệ quy
 */
const extractStaffFromResponse = (result: any): StaffMember[] => {
  if (!result) return [];
  const foundMembers: StaffMember[] = [];
  const seenIds = new Set<string | number>();

  const findMembersRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    const isMember = obj.username && (obj.role || obj.fullName);
    if (isMember) {
      const id = obj.id || obj.username;
      if (!seenIds.has(id)) {
        foundMembers.push(obj as StaffMember);
        seenIds.add(id);
      }
    }
    if (Array.isArray(obj)) {
      obj.forEach(item => findMembersRecursive(item));
    } else {
      for (const key in obj) {
        if (typeof obj[key] === 'object') findMembersRecursive(obj[key]);
      }
    }
  };

  findMembersRecursive(result);
  return foundMembers;
};

export const syncStaffDataFromServer = async (): Promise<StaffMember[]> => {
  const url = localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
  if (!url || !url.startsWith('http')) throw new Error("Webhook URL không hợp lệ.");

  addLog({ type: 'REMOTE', status: 'PENDING', action: 'SYNC_STAFF', message: 'Đang kết nối tới server...' });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'SYNC_STAFF', 
        timestamp: Math.floor(Date.now() / 1000) // Chuyển sang Unix Epoch
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
      addLog({ type: 'REMOTE', status: 'SUCCESS', action: 'SYNC_STAFF', message: `Đã đồng bộ ${processedList.length} tài khoản.` });
      return processedList;
    }
    throw new Error("Dữ liệu nhân sự không hợp lệ.");
  } catch (error: any) {
    addLog({ type: 'REMOTE', status: 'ERROR', action: 'SYNC_STAFF', message: error.message });
    throw error;
  }
};
