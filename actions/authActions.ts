
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Hàm trích xuất nhân viên linh hoạt: tìm kiếm đệ quy trong các đối tượng lồng nhau.
 * Phù hợp với cấu trúc của Make.com như { data: { data: { member: ... } } }
 */
const extractStaffFromResponse = (result: any): StaffMember[] => {
  if (!result) return [];

  const foundMembers: StaffMember[] = [];
  const seenIds = new Set<string | number>();

  const findMembersRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    // Kiểm tra xem đối tượng hiện tại có phải là thông tin nhân viên không
    // Phải có ít nhất username hoặc fullName và role để coi là hợp lệ
    if ((obj.username || obj.fullName) && obj.role) {
      const id = obj.id || obj.username;
      if (!seenIds.has(id)) {
        foundMembers.push(obj as StaffMember);
        seenIds.add(id);
      }
    }

    // Nếu là mảng, duyệt qua từng phần tử
    if (Array.isArray(obj)) {
      obj.forEach(item => findMembersRecursive(item));
    } else {
      // Nếu là đối tượng, tìm kiếm trong tất cả các thuộc tính
      // Ưu tiên các từ khóa phổ biến của Make/Webhook để tăng tốc độ
      const priorityKeys = ['member', 'data', 'items', 'result', 'members'];
      
      for (const key of priorityKeys) {
        if (obj[key]) findMembersRecursive(obj[key]);
      }

      // Sau đó tìm trong các khóa còn lại nếu chưa thấy
      for (const key in obj) {
        if (!priorityKeys.includes(key) && typeof obj[key] === 'object') {
          findMembersRecursive(obj[key]);
        }
      }
    }
  };

  findMembersRecursive(result);
  return foundMembers;
};

/**
 * Hàm đồng bộ dữ liệu nhân viên dùng chung cho màn hình Đăng nhập và Admin
 */
export const syncStaffDataFromServer = async (): Promise<StaffMember[]> => {
  const url = localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
  
  if (!url || !url.startsWith('http')) {
    throw new Error("Webhook URL is missing or invalid. Please check configuration.");
  }

  addLog({ 
    type: 'REMOTE', 
    status: 'PENDING', 
    action: 'SYNC_STAFF', 
    message: 'Connecting to Make.com...' 
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
    
    if (!response.ok) throw new Error(`Server Error: ${response.status}`);

    const rawText = await response.text();
    
    addLog({ 
      type: 'REMOTE', 
      status: 'SUCCESS', 
      action: 'RAW_RESPONSE', 
      message: rawText.substring(0, 500)
    });

    const result = JSON.parse(rawText);
    const processedList = extractStaffFromResponse(result);

    if (processedList.length > 0) {
      localStorage.setItem('app_staff_list_v1', JSON.stringify(processedList));
      // Thông báo cho toàn ứng dụng dữ liệu đã thay đổi
      window.dispatchEvent(new Event('app_data_updated'));
      
      addLog({ 
        type: 'REMOTE', 
        status: 'SUCCESS', 
        action: 'SYNC_STAFF', 
        message: `Successfully synchronized ${processedList.length} staff members.` 
      });
      return processedList;
    } else {
      throw new Error("Không tìm thấy dữ liệu nhân sự hợp lệ trong phản hồi từ server.");
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
