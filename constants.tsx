
import { Quadrant } from './types';

export const HARDCODED_DEPARTMENTS = [
  { id: 1, name: 'Kinh doanh', code: 'KD', description: 'Phòng kinh doanh & phát triển thị trường' },
  { id: 2, name: 'Kế toán', code: 'KT', description: 'Phòng tài chính kế toán' },
  { id: 3, name: 'Nhân sự', code: 'NS', description: 'Phòng hành chính nhân sự' },
  { id: 4, name: 'CSKH', code: 'CS', description: 'Bộ phận chăm sóc khách hàng' },
  { id: 5, name: 'Media', code: 'MD', description: 'Bộ phận truyền thông & hình ảnh' },
  { id: 6, name: 'Thủ kho', code: 'TK', description: 'Bộ phận quản lý kho bãi' },
  { id: 7, name: 'Mật cách', code: 'MC', description: 'Bộ phận mật cách' },
  { id: 8, name: 'Tele sale', code: 'TS', description: 'Bộ phận bán hàng qua điện thoại' },
  { id: 9, name: 'Vận hành', code: 'VH', description: 'Bộ phận vận hành hệ thống' },
  { id: 10, name: 'Nhập liệu', code: 'NL', description: 'Bộ phận nhập dữ liệu' },
];

export const QUADRANT_CONFIG = {
  [Quadrant.Q1]: {
    id: Quadrant.Q1,
    title: 'LÀM NGAY',
    description: 'Quan trọng & Khẩn cấp',
    borderColor: 'border-rose-100',
    bgColor: 'bg-[#fffafa]',
    headerBg: 'bg-rose-50',
    headerColor: 'text-rose-700',
    accentColor: 'bg-rose-500',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
  [Quadrant.Q2]: {
    id: Quadrant.Q2,
    title: 'LÊN LỊCH',
    description: 'Quan trọng & Không khẩn cấp',
    borderColor: 'border-sky-100',
    bgColor: 'bg-[#fcfdff]',
    headerBg: 'bg-sky-50',
    headerColor: 'text-sky-700',
    accentColor: 'bg-sky-500',
    badgeColor: 'bg-sky-100 text-sky-700',
  },
  [Quadrant.Q3]: {
    id: Quadrant.Q3,
    title: 'GIAO VIỆC',
    description: 'Không quan trọng & Khẩn cấp',
    borderColor: 'border-indigo-100',
    bgColor: 'bg-[#fafafe]',
    headerBg: 'bg-indigo-50',
    headerColor: 'text-indigo-700',
    accentColor: 'bg-indigo-500',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  [Quadrant.Q4]: {
    id: Quadrant.Q4,
    title: 'LOẠI BỎ',
    description: 'Không quan trọng & Không khẩn cấp',
    borderColor: 'border-slate-200',
    bgColor: 'bg-[#f9fafb]',
    headerBg: 'bg-slate-100',
    headerColor: 'text-slate-700',
    accentColor: 'bg-slate-500',
    badgeColor: 'bg-slate-200 text-slate-700',
  },
};

export const AVAILABLE_SOUNDS = [
  { id: 'achievement', name: 'Thành tựu', url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' },
  { id: 'notification', name: 'Thông báo', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'happy', name: 'Vui vẻ', url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
  { id: 'level-up', name: 'Lên cấp', url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' },
];

export const SYSTEM_DEFAULTS = {
  MAKE_WEBHOOK_URL: 'https://hook.make.com/your-default-system-id',
  TASK_WEBHOOK_URL: 'https://hook.make.com/your-default-task-id',
};

export const SOUND_CONFIG = {
  TASK_DONE: AVAILABLE_SOUNDS[0].url,
  VOLUME: 0.5
};
