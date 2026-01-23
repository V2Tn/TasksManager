
export type LogType = 'LOCAL' | 'REMOTE';
export type LogStatus = 'SUCCESS' | 'ERROR' | 'PENDING';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  status: LogStatus;
  action: string;
  message: string;
}

const LOG_STORAGE_KEY = 'app_connection_logs_v1';
const MAX_LOGS = 50;

export const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-GB', { hour12: false });
  const newEntry: LogEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 9),
    timestamp
  };

  const savedLogs = localStorage.getItem(LOG_STORAGE_KEY);
  let logs: LogEntry[] = savedLogs ? JSON.parse(savedLogs) : [];
  
  // Thêm vào đầu danh sách
  logs = [newEntry, ...logs].slice(0, MAX_LOGS);
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  
  // Phát sự kiện để UI cập nhật realtime
  window.dispatchEvent(new Event('app_logs_updated'));
};

export const getLogs = (): LogEntry[] => {
  const savedLogs = localStorage.getItem(LOG_STORAGE_KEY);
  return savedLogs ? JSON.parse(savedLogs) : [];
};

export const clearLogs = () => {
  localStorage.removeItem(LOG_STORAGE_KEY);
  window.dispatchEvent(new Event('app_logs_updated'));
};
