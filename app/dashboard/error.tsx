'use client';

import React, { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      border: '1px solid rgba(0,0,0,0.05)',
      borderRadius: 12,
      padding: '12px 16px',
      margin: '16px auto',
      maxWidth: 900,
      color: '#333'
    }}>
      <h3 style={{ marginTop: 0 }}>تعذر تحميل لوحة التحكم</h3>
      <p>حدث خطأ أثناء تحميل الداشبورد. يمكنك إعادة المحاولة.</p>
      {error?.message && <pre style={{ whiteSpace: 'pre-wrap', direction: 'ltr', background: '#f8fafc', padding: 8, borderRadius: 8 }}>{String(error.message)}</pre>}
      <button onClick={reset} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>إعادة المحاولة</button>
    </div>
  );
}
