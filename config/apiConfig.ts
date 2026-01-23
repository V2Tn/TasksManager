
export const API_CONFIG = {
  // Ưu tiên biến môi trường từ Vite hoặc CRA, nếu không có sẽ dùng chuỗi rỗng
  MAKE_STAFF_URL: (import.meta as any).env?.VITE_MAKE_STAFF_URL || (process.env as any).REACT_APP_MAKE_STAFF_URL || '',
  TASK_WEBHOOK_URL: (import.meta as any).env?.VITE_TASK_WEBHOOK_URL || (process.env as any).REACT_APP_TASK_WEBHOOK_URL || '',
};
