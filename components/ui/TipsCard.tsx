
import React from 'react';

export const TipsCard: React.FC = () => {
  return (
    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
      <h4 className="text-sm font-bold text-blue-800 mb-3">Mẹo Eisenhower:</h4>
      <ul className="text-xs text-blue-700/80 space-y-2 leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="mt-1 block w-1 h-1 rounded-full bg-blue-400 shrink-0"></span>
          Ưu tiên ô <b>Làm ngay</b> (Q1).
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 block w-1 h-1 rounded-full bg-blue-400 shrink-0"></span>
          Tập trung vào <b>Lên lịch</b> (Q2) để phát triển.
        </li>
      </ul>
    </div>
  );
};
