'use client';

import React from 'react';

interface QuickActionsProps {
  onAction?: (action: 'create' | 'import' | 'refresh') => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 className="text-lg font-semibold text-admin-text">اقدامات سریع</h3>
      </div>
      <div className="admin-card-body flex gap-3">
        <button className="btn-admin-primary" onClick={() => onAction?.('create')}>ایجاد</button>
        <button className="btn-admin-secondary" onClick={() => onAction?.('import')}>ورود</button>
        <button className="btn-admin-outline" onClick={() => onAction?.('refresh')}>به‌روزرسانی</button>
      </div>
    </div>
  );
}
