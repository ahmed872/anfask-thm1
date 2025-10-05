'use client';

import React, { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string } ; reset: () => void }) {
  useEffect(() => {
    // حاول تسجيل الخطأ في الكونسول للمساعدة في التشخيص على الإنتاج
    // ملاحظة: يمكن وصل خدمة تتبع لاحقًا هنا
    console.error('Global app error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2193b0, #6dd5ed)'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 20, borderRadius: 12, maxWidth: 600, textAlign: 'center', boxShadow: '0 10px 30px #0002' }}>
          <h2 style={{ marginTop: 0 }}>حدث خطأ غير متوقع</h2>
          <p>حدث خلل أثناء تحميل الصفحة. جرّب تحديث الصفحة أو العودة للصفحة الرئيسية.</p>
          {error?.digest && <p style={{ direction: 'ltr', fontSize: 12, color: '#666' }}>Error digest: {error.digest}</p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
            <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>إعادة المحاولة</button>
            <a href="/login" style={{ padding: '8px 16px', borderRadius: 8, background: '#e2e8f0', color: '#333', textDecoration: 'none' }}>الذهاب لتسجيل الدخول</a>
          </div>
        </div>
      </body>
    </html>
  );
}
