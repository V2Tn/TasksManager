
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Hàm phân giải JSON cực kỳ an toàn
 * Xử lý trường hợp Make.com trả về chuỗi malformed: "data": {...}, {...} 
 * thay vì "data": [{...}, {...}]
 */
export const safeJsonParse = (text: string): any => {
  if (!text) return null;
  let cleaned = text.trim();
  
  // 1. Dọn dẹp sơ bộ
  cleaned = cleaned.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');

  // 2. Xử lý lỗi đặc thù của Make.com: "data": {obj1}, {obj2} -> thiếu []
  // Chúng ta tìm vị trí của '"data":' và kiểm tra phần nội dung sau đó
  const dataMarker = '"data"';
  const dataPos = cleaned.indexOf(dataMarker);
  
  if (dataPos !== -1) {
    const colonPos = cleaned.indexOf(':', dataPos);
    if (colonPos !== -1) {
      const prefix = cleaned.substring(0, colonPos + 1).trim();
      let rest = cleaned.substring(colonPos + 1).trim();
      
      // Nếu rest không bắt đầu bằng [ và có cấu trúc }, { (nhiều object)
      if (!rest.startsWith('[') && rest.includes('}, {')) {
        // Tìm vị trí đóng ngoặc cuối cùng của toàn bộ JSON (giả định là dấu } cuối cùng)
        const lastBraceIdx = rest.lastIndexOf('}');
        if (lastBraceIdx !== -1) {
          const payload = rest.substring(0, lastBraceIdx).trim();
          const suffix = rest.substring(lastBraceIdx);
          // Gói payload vào trong []
          cleaned = `${prefix} [${payload}] ${suffix}`;
        }
      }
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Lỗi Parse JSON sau khi xử lý:", e);
    // Fallback cuối cùng: Thử bao bọc toàn bộ chuỗi nếu nó trông giống mảng object
    if (cleaned.includes('}, {') && !cleaned.startsWith('[') && !cleaned.includes('"status"')) {
      try {
        return JSON.parse(`[${cleaned}]`);
      } catch (e2) {
        return null;
      }
    }
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
        const joinDate = typeof obj.joinDate === 'number' 
          ? new Date(obj.joinDate * 1000).toISOString().split('T')[0] 
          : obj.joinDate;

        foundMembers.push({
          ...obj,
          joinDate
        } as StaffMember);
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
        timestamp: Math.floor(Date.now() / 1000) 
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
