'use client';

import React, { useEffect, useState } from 'react';
import { listPrinters, connectQz } from '../../../../../utils/qz';

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrinter?: string | null;
  alwaysSilent?: boolean;
  onSave: (settings: { defaultPrinter: string | null; alwaysSilent: boolean }) => void;
}

export default function PrinterSettingsModal({ isOpen, onClose, defaultPrinter = null, alwaysSilent = false, onSave }: PrinterSettingsModalProps) {
  const [printers, setPrinters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(defaultPrinter || null);
  const [silent, setSilent] = useState<boolean>(!!alwaysSilent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(defaultPrinter || null);
    setSilent(!!alwaysSilent);
  }, [defaultPrinter, alwaysSilent]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ok = await connectQz();
        if (!ok) {
          setError('QZ Tray not connected. Please install/open QZ Tray.');
          setPrinters([]);
        } else {
          const list = await listPrinters();
          setPrinters(list);
          if (!selected && list.length > 0) setSelected(list[0]);
        }
      } catch {
        setError('Failed to list printers.');
      } finally {
        setLoading(false);
      }
    })();
    // We intentionally don't depend on 'selected' to avoid re-opening side effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تنظیمات چاپگر</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
        </div>

        {loading && (
          <div className="text-sm text-gray-600 dark:text-gray-300">در حال جستجوی چاپگرها...</div>
        )}

        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">انتخاب چاپگر پیش‌فرض</label>
          <select
            className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            value={selected || ''}
            onChange={(e) => setSelected(e.target.value || null)}
          >
            <option value="">— بدون انتخاب —</option>
            {printers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <label className="inline-flex items-center space-x-2 space-x-reverse">
            <input type="checkbox" className="rounded border-gray-300" checked={silent} onChange={(e) => setSilent(e.target.checked)} />
            <span className="text-sm text-gray-700 dark:text-gray-300">همیشه بی‌صدا چاپ شود (در صورت در دسترس بودن QZ)</span>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end space-x-2 space-x-reverse">
          <button onClick={onClose} className="px-3 py-2 rounded-md border dark:border-gray-700 text-gray-700 dark:text-gray-300">انصراف</button>
          <button
            onClick={() => onSave({ defaultPrinter: selected || null, alwaysSilent: silent })}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}


