"use client";
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { isUsernameAvailable, registerUser } from '../../lib/userService';
import { generateNewUserId } from '../../lib/surveyManager';
import './styles.css'; // تأكد من أن مسار ملف CSS صحيح
import Image from 'next/image';
import { useRouter } from 'next/navigation';


interface FormData {
  preferredName: string;
  ageGroup: string;
  gender: string;
  weight: number | "";
  height: number | "";
  chronicIllnesses: string[];
  otherIllness: string;
  smokingStart: number | "";
  password: string; // ✅ أضف الباسورد هنا
  dailyCigarettes: number | "";
  quitAttempts: string; // كم مرة حاولت الإقلاع
  favoriteColor: string; // اللون المفضل
  dataConsent: boolean;
  communityRules: boolean;
}

const RegistrationPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    preferredName: '',
    ageGroup: '',
    gender: '',
    weight: '',
    height: '',
    chronicIllnesses: [],
    otherIllness: '',
    smokingStart: '',
    dailyCigarettes: '',
    password: '',
    quitAttempts: '',
    favoriteColor: '',
    dataConsent: false,
    communityRules: false,
  });
  const [usernameError, setUsernameError] = useState('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const totalSteps = 4;

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
      document.head.removeChild(style);
    };
  }, []);

  // Update progress bar whenever currentStep changes
  useEffect(() => {
    const progressFill = document.querySelector<HTMLElement>('.progress-fill');
    if (progressFill) {
      const progressPercentage = (currentStep / totalSteps) * 100;
      progressFill.style.width = `${progressPercentage}%`;
    }
  }, [currentStep]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
const checked = (e.target as HTMLInputElement).checked;


    if (type === 'checkbox') {
      if (name === 'chronicIllnesses') {
        const updatedIllnesses = checked
          ? [...formData.chronicIllnesses, value]
          : formData.chronicIllnesses.filter((illness) => illness !== value);

        // Special handling for 'none' checkbox
        if (value === 'none' && checked) {
          setFormData((prev) => ({ ...prev, chronicIllnesses: ['none'] }));
        } else if (value !== 'none' && checked) {
          setFormData((prev) => ({ ...prev, chronicIllnesses: updatedIllnesses.filter(item => item !== 'none') }));
        } else {
          setFormData((prev) => ({ ...prev, chronicIllnesses: updatedIllnesses }));
        }
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      }
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateCurrentStep = (): boolean => {
    let isValid = true;
    const currentStepElement = document.querySelector<HTMLElement>(`.form-step[data-step="${currentStep}"]`);

    if (!currentStepElement) return false;

    const requiredInputs = currentStepElement.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[required]');

    requiredInputs.forEach((input) => {
      const formGroup = input.closest<HTMLElement>('.form-group') || input.closest<HTMLElement>('.consent-item');
      if (!formGroup) return;

      if (input.type === 'radio') {
        const radioGroup = currentStepElement.querySelectorAll<HTMLInputElement>(`input[name="${input.name}"]`);
        const isRadioGroupValid = Array.from(radioGroup).some((radio) => radio.checked);
        if (!isRadioGroupValid) {
          isValid = false;
          highlightError(formGroup);
        } else {
          removeError(formGroup);
        }
      } else if (input.type === 'checkbox') {
        if (!input.checked) {
          isValid = false;
          highlightError(formGroup);
        } else {
          removeError(formGroup);
        }
      } else if (!input.value.trim()) {
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

  const nextStep = async () => {
    // تحقق من الاسم المفضل والباسورد إذا كنا في الخطوة الأولى
    if (currentStep === 1) {
      if (!formData.preferredName) {
        setUsernameError('يرجى إدخال الاسم المفضل (اسم المستخدم)');
        return;
      }
      if (!formData.password || formData.password.length < 8) {
        setUsernameError('كلمة المرور يجب أن تكون 8 أحرف أو أكثر');
        return;
      }
      setUsernameError('');
      const available = await isUsernameAvailable(formData.preferredName);
      if (!available) {
        setUsernameError('هذا الاسم مستخدم بالفعل من فضلك اختر اسم آخر أو سجل الدخول');
        return;
      }
    }
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.preferredName) {
      setUsernameError('يرجى إدخال الاسم المفضل (اسم المستخدم)');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setUsernameError('كلمة المرور يجب أن تكون 8 أحرف أو أكثر');
      return;
    }
    setUsernameError('');
    if (validateCurrentStep()) {
      setIsSubmitting(true);
      // تحقق من توفر اسم المستخدم (الاسم المفضل)
      const available = await isUsernameAvailable(formData.preferredName);
      if (!available) {
        setUsernameError('هذا الاسم مستخدم بالفعل من فضلك اختر اسم آخر أو سجل الدخول');
        setIsSubmitting(false);
        return;
      }
      // إنشاء معرف فريد للمستخدم الجديد
      const newUserId = await generateNewUserId();
      
      // حفظ بيانات المستخدم في فايربيز
      await registerUser(formData.preferredName, {
        ...formData,
        uniqueUserId: newUserId, // المعرف الفريد الجديد
        securityQuestion: formData.favoriteColor, // للتوافق مع البيانات الموجودة
        registrationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        daysWithoutSmoking: 0,
        todaySmoking: false,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('anfask-username', formData.preferredName);
      }
      setShowSuccess(true);
      createConfetti();
      setIsSubmitting(false);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
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
              <h2>مرحباً بك في أنفاسك تهم!</h2>
              <p>تم إنشاء حسابك بنجاح. ابدأ رحلتك نحو حياة صحية خالية من التدخين.</p>
              <div className="confetti"></div>
            </div>
          </div>
        )}
      {/* Background Animation - Now positioned behind the right section */}
      <div className="background-animation">
        <div className="floating-particles"></div>
        <div className="wave-animation"></div>
      </div>
      {/* Left Section: Registration Form */}
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
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>

          <form id="registrationForm" className="registration-form" onSubmit={handleSubmit}>
            {/* عرض رسالة الخطأ الخاصة بالاسم */}
            {usernameError && (
              <div className="error-message" style={{ color: '#dc3545', marginBottom: '10px', textAlign: 'center' }}>{usernameError}</div>
            )}
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="form-step active" data-step="1">
                <h2 className="step-title">المعلومات الشخصية</h2>
                <div className="form-group">
                  <label htmlFor="preferredName">الاسم المفضل</label>
                  <input
                    type="text"
                    id="preferredName"
                    name="preferredName"
                    value={formData.preferredName}
                    onChange={handleChange}
                    required
                  />
                  <div className="field-icon">👤</div>
                </div>
<div className="form-group">
  <label htmlFor="password">كلمة المرور</label>
  <input
    type="password"
    id="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    required
  />
  <div className="field-icon">🔒</div>
</div>

                <div className="form-group">
                  <label htmlFor="ageGroup">الفئة العمرية</label>
                  <select
                    id="ageGroup"
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleChange}
                    required
                  >
                    <option value="">اختر فئتك العمرية</option>
                    <option value="18-24">18-24 سنة</option>
                    <option value="25-34">25-34 سنة</option>
                    <option value="35-44">35-44 سنة</option>
                    <option value="45-54">45-54 سنة</option>
                    <option value="55-64">55-64 سنة</option>
                    <option value="65+">65+ سنة</option>
                  </select>
                  <div className="field-icon">📅</div>
                </div>

                <div className="form-group">
                  <label>الجنس</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={handleChange}
                        required
                      />
                      <span className="radio-custom"></span>
                      ذكر
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={handleChange}
                        required
                      />
                      <span className="radio-custom"></span>
                      أنثى
                    </label>
                  </div>
                </div>

                <button type="button" className="next-btn" onClick={nextStep}>
                  التالي
                </button>
              </div>
            )}

            {/* Step 2: Health Information */}
            {currentStep === 2 && (
              <div className="form-step active" data-step="2">
                <h2 className="step-title">المعلومات الصحية</h2>
                <div className="form-group">
                  <label htmlFor="weight">الوزن (كيلوجرام)</label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    min={30}
                    max={300}
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  />
                  <div className="field-icon">⚖️</div>
                </div>

                <div className="form-group">
                  <label htmlFor="height">الطول (سنتيمتر)</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    min={100}
                    max={250}
                    value={formData.height}
                    onChange={handleChange}
                    required
                  />
                  <div className="field-icon">📏</div>
                </div>

                <div className="form-group">
                  <label htmlFor="chronicIllnesses">الأمراض المزمنة</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="chronicIllnesses"
                        value="diabetes"
                        checked={formData.chronicIllnesses.includes('diabetes')}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom"></span>
                      السكري
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="chronicIllnesses"
                        value="hypertension"
                        checked={formData.chronicIllnesses.includes('hypertension')}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom"></span>
                      ضغط الدم
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="chronicIllnesses"
                        value="heart"
                        checked={formData.chronicIllnesses.includes('heart')}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom"></span>
                      أمراض القلب
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="chronicIllnesses"
                        value="respiratory"
                        checked={formData.chronicIllnesses.includes('respiratory')}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom"></span>
                      أمراض الجهاز التنفسي
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="chronicIllnesses"
                        value="none"
                        checked={formData.chronicIllnesses.includes('none')}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom"></span>
                      لا يوجد
                    </label>
                  </div>
                  <input
                    type="text"
                    id="otherIllness"
                    name="otherIllness"
                    placeholder="أمراض أخرى (اختياري)"
                    value={formData.otherIllness}
                    onChange={handleChange}
                  />
                </div>

                <div className="step-buttons">
                  <button type="button" className="prev-btn" onClick={prevStep}>
                    السابق
                  </button>
                  <button type="button" className="next-btn" onClick={nextStep}>
                    التالي
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Smoking Information */}
            {currentStep === 3 && (
              <div className="form-step active" data-step="3">
                <h2 className="step-title">معلومات التدخين</h2>
                <div className="form-group">
                  <label htmlFor="smokingStart">منذ متى تدخن؟ (بالسنوات)</label>
                  <input
                    type="number"
                    id="smokingStart"
                    name="smokingStart"
                    min={1}
                    max={80}
                    value={formData.smokingStart}
                    onChange={handleChange}
                    required
                  />
                  <div className="field-icon">🚬</div>
                </div>

                <div className="form-group">
                  <label htmlFor="dailyCigarettes">عدد السجائر اليومي</label>
                  <input
                    type="number"
                    id="dailyCigarettes"
                    name="dailyCigarettes"
                    min={1}
                    max={100}
                    value={formData.dailyCigarettes}
                    onChange={handleChange}
                    required
                  />
                  <div className="field-icon">📊</div>
                </div>

                <div className="form-group">
                  <label htmlFor="quitAttempts">كم مرة حاولت الإقلاع عن التدخين سابقاً؟</label>
                  <select
                    id="quitAttempts"
                    name="quitAttempts"
                    value={formData.quitAttempts}
                    onChange={handleChange}
                    required
                  >
                    <option value="">اختر عدد المحاولات</option>
                    <option value="صفر">صفر</option>
                    <option value="مرة">مرة</option>
                    <option value="مرتين">مرتين</option>
                    <option value="أكثر">أكثر</option>
                  </select>
                  <div className="field-icon">🔄</div>
                </div>

                <div className="step-buttons">
                  <button type="button" className="prev-btn" onClick={prevStep}>
                    السابق
                  </button>
                  <button type="button" className="next-btn" onClick={nextStep}>
                    التالي
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Security Question & Consent */}
            {currentStep === 4 && (
              <div className="form-step active" data-step="4">
                <h2 className="step-title">السؤال الأمني والموافقات</h2>
                
                {/* تنويه مهم */}
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                  <div style={{ 
                    color: '#856404', 
                    fontWeight: 'bold', 
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}>
                    <strong>تنبيه مهم:</strong> السؤال الأمني ضروري لاسترجاع حسابك في حالة نسيان كلمة المرور.
                    <br />
                    يرجى تذكر إجابتك جيداً!
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="favoriteColor">ما هو لونك المفضل؟ (سؤال أمني)</label>
                  <input
                    type="text"
                    id="favoriteColor"
                    name="favoriteColor"
                    value={formData.favoriteColor}
                    onChange={handleChange}
                    placeholder="مثال: أزرق، أحمر، أخضر... (اكتب أي لون تحبه وتذكره جيداً)"
                    required
                  />
                  <div className="field-icon">🎨</div>
                </div>

                <div className="consent-section">
                  <label className="checkbox-label consent-item">
                    <input
                      type="checkbox"
                      name="dataConsent"
                      checked={formData.dataConsent}
                      onChange={handleChange}
                      required
                    />
                    <span className="checkbox-custom"></span>
                    <span className="consent-text">
                      أوافق على استخدام بياناتي المجهولة لأغراض البحث العلمي
                    </span>
                  </label>

                  <label className="checkbox-label consent-item">
                    <input
                      type="checkbox"
                      name="communityRules"
                      checked={formData.communityRules}
                      onChange={handleChange}
                      required
                    />
                    <span className="checkbox-custom"></span>
                    <span className="consent-text">
                      أقبل قواعد المجتمع (عدم استخدام لغة مسيئة، عدم مشاركة معلومات شخصية)
                    </span>
                  </label>
                </div>

                <div className="step-buttons">
                  <button type="button" className="prev-btn" onClick={prevStep}>
                    السابق
                  </button>
                  <button
                    type="submit"
                    className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
                    id="submitBtn"
                    disabled={isSubmitting}
                  >
                    <span className="btn-text">إنشاء الحساب</span>
                    <div className="loading-spinner"></div>
                  </button>
                </div>
              </div>
            )}
          </form>
          {/* رابط تسجيل الدخول أسفل الصفحة */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '1rem',color: '#2C3E50' }}>
            لديك حساب بالفعل؟{' '}
            <a href="/login" style={{ color: '#1746a2', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}>
              تسجيل الدخول
            </a>
          </div>
        </div>

       
      </div>

      {/* Right Section: Image, Title, Quote */}
      <div className="right-section">
        <header className="header">
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
          <p className="subtitle">ابدأ رحلتك نحو حياة صحية خالية من التدخين</p>
        </header>
        <div className="quote-section">
          <p className="quote-text">
            "ابدأ رحلتك اليوم، وقد تكون قصتك هي الإلهام لشخص آخر غداً"
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

