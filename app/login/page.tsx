"use client";
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import './login.css';
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

import Image from 'next/image';

interface LoginFormData {
  preferredName: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    preferredName: '',
    password: '',
    rememberMe: false,
  });
  const [loginError, setLoginError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Effect for initial animations and cleanup
  useEffect(() => {
    createFloatingParticles();
    // Add shake animation style dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup if necessary
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setLoginError('');
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const formElement = document.querySelector('.login-form');
    if (!formElement) return false;
    const requiredInputs = formElement.querySelectorAll<HTMLInputElement>('[required]');
    requiredInputs.forEach((input) => {
      const formGroup = input.closest<HTMLElement>('.form-group');
      if (!formGroup) return;
      if (!input.value.trim()) {
        isValid = false;
        highlightError(formGroup);
      } else {
        removeError(formGroup);
      }
    });
    return isValid;
  };

  const highlightError = (element: HTMLElement) => {
    element.style.borderColor = '#dc3545';
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      element.style.animation = '';
    }, 500);
  };

  const removeError = (element: HTMLElement) => {
    element.style.borderColor = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const userRef = doc(db, 'users', formData.preferredName);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setIsSubmitting(false);
          setLoginError('اسم المستخدم غير موجود.');
          return;
        }
        const userData = userSnap.data();
        if (userData.password !== formData.password) {
          setIsSubmitting(false);
          setLoginError('كلمة المرور غير صحيحة.');
          return;
        }

        // التحقق من وجود السؤال الأمني
        const hasSecurityQuestion = userData.securityQuestion && userData.securityQuestion.trim() !== '';
        
        // حفظ اسم المستخدم في localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('anfask-username', formData.preferredName);
          // حفظ اسم المستخدم في الكوكيز لمدة 7 أيام
          document.cookie = `anfask-username=${formData.preferredName}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }

        setShowSuccess(true);
        createConfetti();
        setIsSubmitting(false);
        
        setTimeout(() => {
          setShowSuccess(false);
          // إذا لم يكن لديه سؤال أمني، توجيهه لإضافة واحد
          if (!hasSecurityQuestion) {
            router.push('/add-security-question');
          } else {
            router.push('/dashboard');
          }
        }, 2000);
      } catch {
        setIsSubmitting(false);
        setLoginError('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
      }
    }
  };

  const createFloatingParticles = () => {
    const particlesContainer = document.querySelector<HTMLElement>('.floating-particles');
    if (particlesContainer) {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
          animation-delay: ${Math.random() * 2}s;
        `;
        particlesContainer.appendChild(particle);
      }
    }
  };

  const createConfetti = () => {
    const confettiContainer = document.querySelector<HTMLElement>('.confetti');
    if (confettiContainer) {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
      for (let i = 0; i < 50; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.style.cssText = `
          position: absolute;
          width: 8px;
          height: 8px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}%;
          top: -10px;
          animation: confettiFall ${2 + Math.random() * 3}s ease-out forwards;
          animation-delay: ${Math.random() * 2}s;
        `;
        confettiContainer.appendChild(confettiPiece);
      }
      setTimeout(() => {
        confettiContainer.innerHTML = '';
      }, 5000);
    }
  };

  return (
    <div className="main-layout-container">
      {/* Success Message */}
      {showSuccess && (
        <div className="success-message" id="successMessage" style={{ display: 'flex' }}>
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>مرحباً بك مرة أخرى!</h2>
            <p>تم تسجيل الدخول بنجاح. نحن سعداء لرؤيتك مرة أخرى في رحلتك نحو حياة صحية.</p>
            <div className="confetti"></div>
          </div>
        </div>
      )}

      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-particles"></div>
        <div className="wave-animation"></div>
      </div>

      {/* Left Section: Login Form */}
      <div className="left-section">
        <div className="form-container">
          {/* Logo */}
          <div className="form-logo" style={{cursor:'pointer'}} onClick={()=>router.push('/home')} tabIndex={0} aria-label="الذهاب إلى الصفحة الرئيسية">
            <Image 
              src="/logo.png"
              alt="Logo"
              width={60}
              height={60}
            />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-step">
              <h2 className="step-title">تسجيل الدخول</h2>
              <p className="welcome-text">مرحباً بك مرة أخرى! سجل دخولك للمتابعة</p>

              <div className="form-group">
                <label htmlFor="preferredName">الاسم المفضل (اسم المستخدم)</label>
                <input
                  type="text"
                  id="preferredName"
                  name="preferredName"
                  value={formData.preferredName}
                  onChange={handleChange}
                  placeholder="أدخل اسم المستخدم"
                  required
                />
                <div className="field-icon">�</div>
              </div>
              {loginError && <div style={{ color: 'red', margin: '10px 0' }}>{loginError}</div>}

              <div className="form-group">
                <label htmlFor="password">كلمة المرور</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom"></span>
                  تذكرني
                </label>
                <a href="/forgot-password" className="forgot-password">نسيت كلمة المرور؟</a>
              </div>

              <button 
                type="submit" 
                className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                <span className="btn-text">
                  {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </span>
                <div className="loading-spinner"></div>
              </button>

              <div className="signup-link">
                <p>ليس لديك حساب؟ <a href="/register">إنشاء حساب جديد</a></p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section: Welcome Content */}
      <div className="right-section">
        <div className="header">
          <div className="lung-animation">
                     {/* Using a placeholder image for now. Replace with your actual lung image path. */}
                     <Image 
                       src="/realistic-world-pneumonia-day-composition-with-isolated-illustration-healthy-human-lungs.png"
                       alt="Lung"
                       width={150}
                       height={150}
                       className="lung-image"
                     />
                   </div>
          <h1 className="main-title">أنفاسك تهم</h1>
          <p className="subtitle">رحلتك نحو حياة صحية خالية من التدخين</p>
        </div>

        <div className="quote-section">
          <p className="quote-text">
            &ldquo;كل نفس تتنفسه بدون دخان هو خطوة نحو مستقبل أكثر صحة وسعادة. ابدأ رحلتك اليوم واجعل كل يوم يمر أفضل من الذي قبله.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

