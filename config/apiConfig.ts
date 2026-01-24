export const API_CONFIG = {
  // Ưu tiên lấy từ biến môi trường của hệ thống (Vite hoặc Process)
  MAKE_STAFF_URL: (import.meta as any).env?.VITE_MAKE_STAFF_URL || (process as any).env?.VITE_MAKE_STAFF_URL || '',
  TASK_WEBHOOK_URL: (import.meta as any).env?.VITE_TASK_WEBHOOK_URL || (process as any).env?.VITE_TASK_WEBHOOK_URL || '',
};