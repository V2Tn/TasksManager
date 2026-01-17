
import { Quadrant } from './types';

export const QUADRANT_CONFIG = {
  [Quadrant.Q1]: {
    id: Quadrant.Q1,
    title: 'LÀM NGAY',
    description: 'Quan trọng & Khẩn cấp',
    borderColor: 'border-red-100',
    bgColor: 'bg-white',
    headerBg: 'bg-red-50/50',
    headerColor: 'text-red-600',
    accentColor: 'bg-red-500',
    badgeColor: 'bg-red-100 text-red-600',
  },
  [Quadrant.Q2]: {
    id: Quadrant.Q2,
    title: 'LÊN LỊCH',
    description: 'Quan trọng & Không khẩn cấp',
    borderColor: 'border-blue-100',
    bgColor: 'bg-white',
    headerBg: 'bg-blue-50/50',
    headerColor: 'text-blue-600',
    accentColor: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-600',
  },
  [Quadrant.Q3]: {
    id: Quadrant.Q3,
    title: 'GIAO VIỆC',
    description: 'Không quan trọng & Khẩn cấp',
    borderColor: 'border-amber-100',
    bgColor: 'bg-white',
    headerBg: 'bg-amber-50/50',
    headerColor: 'text-amber-600',
    accentColor: 'bg-amber-500',
    badgeColor: 'bg-amber-100 text-amber-600',
  },
  [Quadrant.Q4]: {
    id: Quadrant.Q4,
    title: 'LOẠI BỎ',
    description: 'Không quan trọng & Không khẩn cấp',
    borderColor: 'border-gray-100',
    bgColor: 'bg-white',
    headerBg: 'bg-gray-50/50',
    headerColor: 'text-gray-600',
    accentColor: 'bg-gray-500',
    badgeColor: 'bg-gray-100 text-gray-600',
  },
};

export const AVAILABLE_SOUNDS = [
  { id: 'achievement', name: 'Thành tựu', url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' },
  { id: 'notification', name: 'Thông báo', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'happy', name: 'Vui vẻ', url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
  { id: 'level-up', name: 'Lên cấp', url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' },
];

// CẤU HÌNH ÂM THANH MẶC ĐỊNH
export const SOUND_CONFIG = {
  TASK_DONE: AVAILABLE_SOUNDS[0].url,
  VOLUME: 0.5
};
