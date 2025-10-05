// app/health/page.tsx
// تأكد من إضافة 'use client'; في أول سطر
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
// المسار الصحيح لملف الـ CSS الرئيسي (globals.css) من داخل app/health/
import '../globals.css'; 
import './health.css'

// --- تعريفات الأنواع (Interfaces) ---
interface Milestone {
    days: number;
    icon: string;
    title: string;
    description: string;
    cssClass: string;
}

// --- دوال مساعدة (Helper Functions) ---
// هذه الدوال تم نسخها من App.tsx لضمان أنها متاحة هنا. 
// في مشروع حقيقي، قد تفضل وضعها في ملف 'utils' مشترك.

// (تمت إزالة دالة animateNumber غير المستخدمة في هذه الصفحة)

const HealthPage: React.FC = () => {
    const [daysWithoutSmoking, setDaysWithoutSmoking] = useState<number>(0); // سيتم جلبها من localStorage
    const [lungImageSrc, setLungImageSrc] = useState<string>('/1.png'); // المسار الافتراضي لصورة الرئة
    const [lungStatusText, setLungStatusText] = useState<string>('رئتاك تتعافى بشكل ممتاز! استمر في هذا الإنجاز الرائع.');
    const [penaltyToday, setPenaltyToday] = useState<boolean>(false);
    const [penaltyDate, setPenaltyDate] = useState<string | null>(null);
    const [hidePenaltyBanner, setHidePenaltyBanner] = useState<boolean>(false);

    const healthMilestones: Milestone[] = useMemo(() => ([
        { days: 1, icon: '🌟', title: 'بداية التعافي', description: 'انخفاض مستوى أول أكسيد الكربون في الدم', cssClass: '' },
        { days: 3, icon: '💨', title: 'تحسن التنفس', description: 'تحسن وظائف الرئة وسهولة التنفس', cssClass: '' },
        { days: 7, icon: '👃', title: 'عودة الحواس', description: 'تحسن حاستي الشم والتذوق', cssClass: '' },
        { days: 30, icon: '🫁', title: 'تنظيف الرئتين', description: 'بداية تنظيف الرئتين من السموم', cssClass: '' },
        { days: 90, icon: '💪', title: 'تحسن الدورة الدموية', description: 'تحسن كبير في الدورة الدموية ووظائف الرئة', cssClass: '' },
        { days: 365, icon: '❤️', title: 'صحة القلب', description: 'انخفاض خطر الإصابة بأمراض القلب بنسبة 50%', cssClass: '' },
    ]), []);

    const updateLungVisualization = useCallback((days: number) => {
        let image = '/1.png'; // Default image
        let status = 'رئتاك تتعافى بشكل ممتاز! استمر في هذا الإنجاز الرائع.';

        if (days >= 365) {
            image = '/4.png';
            status = 'رئتاك بصحة ممتازة! عام كامل من الحرية والصحة.';
        } else if (days >= 90) {
            image = '/4.png';
            status = 'تحسن كبير في صحة رئتيك! استمر في التقدم.';
        } else if (days >= 60) {
            image = '/4.png';
            status = 'رئتاك تواصل التعافي بشكل ملحوظ. أنت على الطريق الصحيح!';
        } else if (days >= 30) {
            image = '/3.png';
            status = 'رئتاك بدأت في تنظيف نفسها. شهر من الإنجاز!';
        } else if (days >= 7) {
            image = '/2.png';
            status = 'رئتاك تتحسن بشكل جيد. استمر في هذا الإنجاز!';
        } else {
            image = '/1.png';
            status = 'أنت في بداية رحلة التعافي. كل يوم يمر هو خطوة نحو صحة أفضل.';
        }

        setLungImageSrc(image);
        setLungStatusText(status);

        // Update milestone classes
        healthMilestones.forEach(milestone => {
            const element = document.querySelector(`.milestone[data-days="${milestone.days}"]`);
            if (element) {
                if (days >= milestone.days) {
                    element.classList.add('achieved');
                } else {
                    element.classList.remove('achieved');
                }
            }
        });

    }, [healthMilestones]);

    useEffect(() => {
        updateLungVisualization(daysWithoutSmoking);
    }, [daysWithoutSmoking, updateLungVisualization]);

    // جلب daysWithoutSmoking من localStorage/userData (مع علاج للحسابات القديمة)
    useEffect(() => {
        let username = '';
        if (typeof window !== 'undefined') {
            username = localStorage.getItem('anfask-username') || '';
        }
        if (!username) return;
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().slice(0,10);
            const pDate = localStorage.getItem('anfask-penaltyDate');
            if (pDate) {
                setPenaltyDate(pDate);
                setPenaltyToday(pDate === today);
                if (sessionStorage.getItem(`anfask-dismiss-penalty-${pDate}`) === '1') {
                    setHidePenaltyBanner(true);
                }
            }
            // استخدام الأيام الصافية للصحة (الأيام بدون تدخين - أيام التدخين)
            const netDaysStr = localStorage.getItem('anfask-netDaysWithoutSmoking');
            const totalDaysStr = localStorage.getItem('anfask-totalDaysWithoutSmoking');
            if (netDaysStr) {
                const netDays = parseInt(netDaysStr);
                if (Number.isFinite(netDays) && netDays > 0) {
                    setDaysWithoutSmoking(netDays);
                    return;
                }
                // لو صفر/غير صالح، جرّب الإجمالي كحل مؤقت للحسابات القديمة
                if (totalDaysStr) {
                    const totalDays = parseInt(totalDaysStr);
                    if (Number.isFinite(totalDays) && totalDays > 0) {
                        setDaysWithoutSmoking(totalDays);
                        // صحّح القيمة في localStorage للمستقبل
                        localStorage.setItem('anfask-netDaysWithoutSmoking', String(totalDays));
                        return;
                    }
                }
            }
            
            // إذا لم تكن متوفرة، استخدم البيانات التقليدية
            const userDataStr = localStorage.getItem('anfask-userData-' + username);
            if (userDataStr) {
                const data = JSON.parse(userDataStr);
                const fallbackDays = Number.isFinite(data?.daysWithoutSmoking) ? (data.daysWithoutSmoking || 0) : 0;
                setDaysWithoutSmoking(fallbackDays);
            }
        }
    }, []);

    return (
        <div className="health-container">
            {penaltyToday && !hidePenaltyBanner && (
                <div className="glass-box" style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    margin: '0 0 16px 0',
                    color: '#333'
                }} aria-live="polite">
                    <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            تم خصم يوم واحد من التقدم الصحي بسبب تسجيل يوم تدخين بتاريخ{' '}
                            <strong>{penaltyDate ? new Date(penaltyDate + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('ar-EG')}</strong>.
                            {' '}تهانينا على الاستمرار، العودة أقوى دائمًا 💙
                        </div>
                        <button
                            onClick={() => {
                                if (!penaltyDate) return;
                                try { sessionStorage.setItem(`anfask-dismiss-penalty-${penaltyDate}`, '1'); } catch {}
                                setHidePenaltyBanner(true);
                            }}
                            aria-label="إخفاء هذا التنبيه لليوم"
                            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16, padding: 4 }}
                        >✕</button>
                    </div>
                </div>
            )}
            {/* Health Header */}
            <div className="health-header">
                <h1 className="health-title">تصور التقدم الصحي</h1>
                <p className="health-subtitle">شاهد كيف تتعافى رئتاك مع كل يوم خالٍ من التدخين</p>
            </div>

            {/* Health Grid */}
            <div className="health-grid">
                {/* Lung Visualization Card */}
                <div className="lung-card">
                    <div className="lung-visual-container" style={{ position: 'relative', width: '100%', height: '260px' }}>
                        <Image id="lungImage" src={lungImageSrc} alt="صورة الرئة" fill style={{ objectFit: 'contain', objectPosition: 'center center' }} />
                    </div>
                    
                    <div className="health-controls">
                        <div className="days-input-container">
                            <label htmlFor="daysInput">عدد الأيام بدون تدخين:</label>
                    <input 
                        type="number" 
                        id="daysInput" 
                        className="days-input" 
                        min="0" 
                        max="365" 
                        value={daysWithoutSmoking}
                        readOnly
                    />
                        </div>
                    </div>
                    
                    <div id="lungStatus" className="lung-status">
                        {lungStatusText}
                    </div>
                </div>

                {/* Health Progress Card */}
                <div className="progress-card">
                    <h2 className="progress-title">مراحل التعافي</h2>
                    <div className="health-milestones">
                        {healthMilestones.map((milestone, index) => (
                            <div key={index} className={`milestone ${daysWithoutSmoking >= milestone.days ? 'achieved' : ''}`} data-days={milestone.days}>
                                <div className="milestone-icon">{milestone.icon}</div>
                                <div className="milestone-content">
                                    <div className="milestone-title">{milestone.title}</div>
                                    <div className="milestone-description">{milestone.description}</div>
                                </div>
                                <div className="milestone-days">{milestone.days === 1 ? 'يوم 1' : milestone.days === 3 ? 'يوم 3' : milestone.days === 7 ? 'أسبوع 1' : milestone.days === 30 ? 'شهر 1' : milestone.days === 90 ? '3 أشهر' : milestone.days === 365 ? 'سنة 1' : `${milestone.days} يوم`}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Health Benefits Section */}
            <div className="benefits-section">
                <h2 className="benefits-title">الفوائد الصحية للإقلاع عن التدخين</h2>
                <div className="benefits-grid">
                    <div className="benefit-item">
                        <div className="benefit-icon">🫁</div>
                        <div className="benefit-title">تحسن وظائف الرئة</div>
                        <div className="benefit-description">زيادة السعة الرئوية وتحسن التنفس</div>
                    </div>
                    
                    <div className="benefit-item">
                        <div className="benefit-icon">❤️</div>
                        <div className="benefit-title">صحة القلب</div>
                        <div className="benefit-description">انخفاض ضغط الدم وتحسن الدورة الدموية</div>
                    </div>
                    
                    <div className="benefit-item">
                        <div className="benefit-icon">🦷</div>
                        <div className="benefit-title">صحة الفم</div>
                        <div className="benefit-description">أسنان أبيض ونفس منعش</div>
                    </div>
                    
                    <div className="benefit-item">
                        <div className="benefit-icon">💰</div>
                        <div className="benefit-title">توفير المال</div>
                        <div className="benefit-description">توفير آلاف الريالات سنوياً</div>
                    </div>
                    
                    <div className="benefit-item">
                        <div className="benefit-icon">⚡</div>
                        <div className="benefit-title">زيادة الطاقة</div>
                        <div className="benefit-description">زيادة مستويات الطاقة والنشاط</div>
                    </div>
                    
                    <div className="benefit-item">
                        <div className="benefit-icon">🧠</div>
                        <div className="benefit-title">تحسن التركيز</div>
                        <div className="benefit-description">تحسن الوظائف الإدراكية والتركيز</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthPage;
