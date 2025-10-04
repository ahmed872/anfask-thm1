"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { recoverAccount, checkUserExists } from '../../lib/accountRecovery';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../login/login.css';

const AccountRecoveryPage: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState<string>('');
  const [securityAnswer, setSecurityAnswer] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recoveredPassword, setRecoveredPassword] = useState<string>('');

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userExists = await checkUserExists(username);
      if (userExists) {
        setStep(2);
      } else {
        setError('اسم المستخدم غير موجود');
      }
    } catch (err) {
      console.error('خطأ:', err);
      setError('حدث خطأ أثناء التحقق من اسم المستخدم');
    }

    setIsLoading(false);
  };

  const handleSecurityAnswerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await recoverAccount(username, securityAnswer);
      if (result.success && result.password) {
        setRecoveredPassword(result.password);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('خطأ:', err);
      setError('حدث خطأ أثناء استرجاع الحساب');
    }

    setIsLoading(false);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(recoveredPassword);
    alert('تم نسخ كلمة المرور');
  };

  return (
    <div className="main-layout-container">
      {/* Logo في الزاوية */}
      <div className="form-logo">
        <Image src="/logo.png" alt="شعار أنفاسك تهم" width={50} height={50} />
      </div>

      {/* Left Section: Recovery Form */}
      <div className="left-section">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">استرجاع الحساب</h1>
            <p className="login-subtitle">
              {step === 1 
                ? 'أدخل اسم المستخدم الخاص بك' 
                : recoveredPassword 
                  ? 'تم استرجاع الحساب بنجاح'
                  : 'أجب على السؤال الأمني'
              }
            </p>
          </div>

        {recoveredPassword ? (
          // عرض كلمة المرور المسترجعة
          <div className="success-section">
            <div className="success-icon">✅</div>
            <h3>تم استرجاع كلمة المرور بنجاح!</h3>
            <div className="password-display">
              <label>كلمة المرور الخاصة بك:</label>
              <div className="password-box">
                <span>{recoveredPassword}</span>
                <button 
                  type="button" 
                  onClick={copyPassword}
                  className="copy-btn"
                  title="نسخ كلمة المرور"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="action-buttons">
              <button 
                onClick={() => router.push('/login')}
                className="primary-btn"
              >
                العودة لتسجيل الدخول
              </button>
              <button 
                onClick={() => {
                  setStep(1);
                  setUsername('');
                  setSecurityAnswer('');
                  setRecoveredPassword('');
                  setError('');
                }}
                className="secondary-btn"
              >
                استرجاع حساب آخر
              </button>
            </div>
          </div>
        ) : step === 1 ? (
          // خطوة إدخال اسم المستخدم
          <form onSubmit={handleUsernameSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                اسم المستخدم
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="أدخل اسم المستخدم"
                required
                autoComplete="username"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'جاري التحقق...' : 'التالي'}
            </button>

            <div className="form-footer">
              <button 
                type="button"
                onClick={() => router.push('/login')}
                className="link-btn"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          </form>
        ) : (
          // خطوة السؤال الأمني
          <form onSubmit={handleSecurityAnswerSubmit} className="login-form">
            <div className="security-question-section">
              <div className="question-box">
                <h3>السؤال الأمني:</h3>
                <p>ما هو لونك المفضل؟</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="securityAnswer" className="form-label">
                الإجابة
              </label>
              <input
                type="text"
                id="securityAnswer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="form-input"
                placeholder="أدخل إجابتك"
                required
                autoComplete="off"
              />
              <small className="form-hint">
                أدخل نفس الإجابة التي قدمتها عند التسجيل
              </small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'جاري الاسترجاع...' : 'استرجاع الحساب'}
            </button>

            <div className="form-footer">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="link-btn"
              >
                العودة للخطوة السابقة
              </button>
            </div>
          </form>
        )}
        </div>
      </div>

      {/* Right Section: Welcome Content */}
      <div className="right-section">
        <div className="header">
          <div className="lung-animation">
            <Image 
              src="/realistic-world-pneumonia-day-composition-with-isolated-illustration-healthy-human-lungs.png"
              alt="Lung"
              width={150}
              height={150}
              className="lung-image"
            />
          </div>
          <h1 className="main-title">أنفاسك تهم</h1>
          <p className="subtitle">استرجع حسابك وواصل رحلتك نحو حياة صحية</p>
        </div>

        <div className="quote-section">
          <p className="quote-text">
            استرجاع حسابك خطوة مهمة للعودة لرحلتك نحو الإقلاع عن التدخين. كل يوم جديد هو فرصة للبدء من جديد.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountRecoveryPage;