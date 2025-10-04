"use client";
import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import '../register/styles.css'; // استخدام نفس تصميم التسجيل

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: اسم المستخدم، 2: السؤال الأمني، 3: كلمة مرور جديدة
  const [username, setUsername] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userFavoriteColor, setUserFavoriteColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError('اسم المستخدم غير موجود');
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      if (!userData.securityQuestion || userData.securityQuestion.trim() === '') {
        setError('لا يوجد سؤال أمني محفوظ لهذا الحساب. يرجى التواصل مع الدعم الفني.');
        setLoading(false);
        return;
      }

      setUserFavoriteColor(userData.securityQuestion);
      setStep(2);
      setLoading(false);
    } catch (error) {
      setError('حدث خطأ أثناء البحث عن الحساب');
      setLoading(false);
    }
  };

  const handleSecurityAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer.trim()) {
      setError('يرجى إدخال إجابة السؤال الأمني');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // التحقق من إجابة السؤال الأمني (مقارنة بسيطة، يمكن تحسينها)
      if (securityAnswer.toLowerCase().trim() !== userFavoriteColor.toLowerCase().trim()) {
        setError('إجابة السؤال الأمني غير صحيحة');
        setLoading(false);
        return;
      }

      setStep(3);
      setLoading(false);
    } catch (error) {
      setError('حدث خطأ أثناء التحقق من الإجابة');
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف أو أكثر');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'users', username);
      await updateDoc(userRef, {
        password: newPassword,
        lastPasswordReset: new Date().toISOString()
      });

      setSuccess(true);
      setLoading(false);

      // إعادة توجيه للصفحة الرئيسية بعد 3 ثوانٍ
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      setError('حدث خطأ أثناء إعادة تعيين كلمة المرور');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="main-layout-container">
        <div className="left-section">
          <div className="registration-container">
            <div className="form-header">
              <h1 className="main-title">تم بنجاح!</h1>
              <p className="subtitle">تم إعادة تعيين كلمة المرور بنجاح</p>
            </div>
            <div className="success-message">
              <div className="success-icon">✅</div>
              <p>سيتم توجيهك لصفحة تسجيل الدخول خلال 3 ثوانٍ...</p>
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
            <h1 className="main-title">استرداد كلمة المرور</h1>
            <p className="subtitle">
              {step === 1 && "أدخل اسم المستخدم الخاص بك"}
              {step === 2 && "أجب على السؤال الأمني"}
              {step === 3 && "أدخل كلمة مرور جديدة"}
            </p>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          {error && (
            <div className="error-message" style={{ color: '#dc3545', marginBottom: '10px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* الخطوة 1: اسم المستخدم */}
          {step === 1 && (
            <form onSubmit={handleUsernameSubmit} className="registration-form">
              <div className="form-step active">
                <div className="form-group">
                  <label htmlFor="username">اسم المستخدم</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <div className="field-icon">👤</div>
                </div>
                <button type="submit" className={`next-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? 'جارٍ البحث...' : 'التالي'}
                </button>
              </div>
            </form>
          )}

          {/* الخطوة 2: السؤال الأمني */}
          {step === 2 && (
            <form onSubmit={handleSecurityAnswerSubmit} className="registration-form">
              <div className="form-step active">
                {/* تنبيه */}
                <div style={{
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px',
                  color: '#0c5460',
                  textAlign: 'center',
                  fontSize: '0.95rem'
                }}>
                  💡 أدخل الإجابة بنفس الطريقة التي كتبتها عند التسجيل
                </div>
                
                <div className="form-group">
                  <label>ما هو لونك المفضل؟ (السؤال الأمني)</label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="أدخل إجابتك بالضبط كما كتبتها عند التسجيل"
                    required
                    disabled={loading}
                  />
                  <div className="field-icon">🎨</div>
                </div>
                <div className="step-buttons">
                  <button type="button" className="prev-btn" onClick={() => setStep(1)}>
                    السابق
                  </button>
                  <button type="submit" className={`next-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                    {loading ? 'جارٍ التحقق...' : 'التالي'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* الخطوة 3: كلمة مرور جديدة */}
          {step === 3 && (
            <form onSubmit={handlePasswordReset} className="registration-form">
              <div className="form-step active">
                <div className="form-group">
                  <label htmlFor="newPassword">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    required
                    disabled={loading}
                  />
                  <div className="field-icon">🔒</div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                    disabled={loading}
                  />
                  <div className="field-icon">🔒</div>
                </div>
                <div className="step-buttons">
                  <button type="button" className="prev-btn" onClick={() => setStep(2)}>
                    السابق
                  </button>
                  <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                    {loading ? 'جارٍ الحفظ...' : 'إعادة تعيين كلمة المرور'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="login-link" style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>
              تذكرت كلمة المرور؟{' '}
              <a href="/login" style={{ color: '#4A90E2', textDecoration: 'none' }}>
                سجل الدخول
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;