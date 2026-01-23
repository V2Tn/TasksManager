

export const API_CONFIG = {
  // Use process.env to resolve TypeScript errors regarding ImportMeta and follow project standards
  MAKE_STAFF_URL: process.env.VITE_MAKE_STAFF_URL || '',
  TASK_WEBHOOK_URL: process.env.VITE_TASK_WEBHOOK_URL || '',
};
