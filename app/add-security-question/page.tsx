"use client";
// ✅ [Copilot Review] تم منع الوصول لهذه الصفحة إن كانت إجابة السؤال الأمني محفوظة مسبقًا وإعادة التوجيه للوحة التحكم.
// السبب: لتجنّب تكرار الخطوة بعد نقل السؤال الأمني لمرحلة التسجيل النهائية.
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import '../register/styles.css'; // استخدام نفس تصميم التسجيل

const AddSecurityQuestionPage: React.FC = () => {
  const router = useRouter();
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // التحقق من وجود المستخدم في localStorage
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('anfask-username');
      if (!storedUsername) {
        router.push('/login');
        return;
      }
      setUsername(storedUsername);

      // إذا كان لديه سؤال أمني بالفعل، لا داعي لهذه الصفحة
      (async () => {
        try {
          const userRef = doc(db, 'users', storedUsername);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.securityQuestion && String(data.securityQuestion).trim() !== '') {
              router.push('/dashboard');
            }
          }
        } catch {}
      })();
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityQuestion.trim()) {
      setError('يرجى إدخال إجابة السؤال الأمني');
      return;
    }

    if (securityQuestion.trim().length < 2) {
      setError('إجابة السؤال الأمني يجب أن تكون حرفين أو أكثر');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // التحقق من وجود المستخدم
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError('المستخدم غير موجود');
        setLoading(false);
        return;
      }

      // تحديث السؤال الأمني
      await updateDoc(userRef, {
        securityQuestion: securityQuestion.trim(),
        securityQuestionAddedAt: new Date().toISOString()
      });

      setSuccess(true);
      setLoading(false);

      // إعادة توجيه للوحة التحكم بعد 3 ثوانٍ
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch {
      setError('حدث خطأ أثناء حفظ السؤال الأمني');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // السماح بالتخطي مع تحذير
    if (confirm('هل أنت متأكد من تخطي إضافة السؤال الأمني؟ لن تتمكن من استرداد كلمة المرور في حالة نسيانها.')) {
      router.push('/dashboard');
    }
  };

  if (success) {
    return (
      <div className="main-layout-container">
        <div className="left-section">
          <div className="registration-container">
            <div className="form-header">
              <h1 className="main-title">تم بنجاح! ✅</h1>
              <p className="subtitle">تم حفظ السؤال الأمني بنجاح</p>
            </div>
            <div className="success-message">
              <div className="success-icon">🔒</div>
              <p>الآن يمكنك استرداد كلمة المرور إذا نسيتها</p>
              <p>سيتم توجيهك للوحة التحكم خلال 3 ثوانٍ...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout-container">
      <div className="left-section">
        <div className="registration-container">
          <div className="form-header">
            <h1 className="main-title">أضف السؤال الأمني 🔒</h1>
            <p className="subtitle">لحماية حسابك واسترداد كلمة المرور عند الحاجة</p>
          </div>

          {/* تنبيه أهمية السؤال الأمني */}
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#856404',
            textAlign: 'center'
          }}>
            <strong>⚠️ مهم:</strong> السؤال الأمني مطلوب لاسترداد كلمة المرور في حالة نسيانها
          </div>

          {error && (
            <div className="error-message" style={{ color: '#dc3545', marginBottom: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-step active">
              <div className="form-group">
                <label htmlFor="securityQuestion">ما هو لونك المفضل؟</label>
                <input
                  type="text"
                  id="securityQuestion"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  placeholder="مثال: أزرق، أحمر، أخضر..."
                  required
                  disabled={loading}
                  style={{ direction: 'rtl' }}
                />
                <div className="field-icon">🎨</div>
              </div>

              {/* نصائح */}
              <div style={{
                backgroundColor: '#d1ecf1',
                border: '1px solid #bee5eb',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '15px',
                color: '#0c5460',
                fontSize: '0.9rem'
              }}>
                <strong>💡 نصائح:</strong>
                <ul style={{ margin: '5px 0', paddingRight: '20px' }}>
                  <li>اكتب الإجابة بوضوح</li>
                  <li>تذكر الإجابة جيداً لاستخدامها لاحقاً</li>
                  <li>يمكنك استخدام الأحرف العربية أو الإنجليزية</li>
                </ul>
              </div>

              <div className="step-buttons">
                <button 
                  type="button" 
                  className="prev-btn" 
                  onClick={handleSkip}
                  disabled={loading}
                >
                  تخطي (غير مستحسن)
                </button>
                <button 
                  type="submit" 
                  className={`submit-btn ${loading ? 'loading' : ''}`} 
                  disabled={loading}
                >
                  {loading ? 'جارٍ الحفظ...' : 'حفظ السؤال الأمني'}
                </button>
              </div>
            </div>
          </form>

          <div className="login-link" style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              المستخدم: <strong>{username}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSecurityQuestionPage;