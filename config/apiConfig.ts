
export const API_CONFIG = {
  // Hỗ trợ đa nền tảng: Thử lấy từ import.meta.env (Vite) trước, sau đó là process.env (Vercel/Node)
  MAKE_STAFF_URL: (import.meta as any).env?.VITE_MAKE_STAFF_URL || process.env.VITE_MAKE_STAFF_URL || '',
  TASK_WEBHOOK_URL: (import.meta as any).env?.VITE_TASK_WEBHOOK_URL || process.env.VITE_TASK_WEBHOOK_URL || '',
};
