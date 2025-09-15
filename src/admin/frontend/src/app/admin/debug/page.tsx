'use client';

import React, { useEffect, useState } from 'react';

interface DebugEntry {
  label: string;
  value: unknown;
}

export default function DebugPage() {
  const [entries, setEntries] = useState<DebugEntry[]>([]);

  useEffect(() => {
    const data: DebugEntry[] = [
      { label: 'env', value: process.env.NODE_ENV },
      { label: 'time', value: new Date().toISOString() },
    ];
    setEntries(data);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Debug</h1>
      <pre className="text-sm bg-gray-100 p-4 rounded">
        {entries.map((e) => `${e.label}: ${safeStringify(e.value)}\n`)}
      </pre>
    </div>
  );
}

function safeStringify(value: unknown): string {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
