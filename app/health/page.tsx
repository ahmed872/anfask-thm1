// app/health/page.tsx
// تأكد من إضافة 'use client'; في أول سطر
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

/**
 * Animates a number counting up to a target value.
 * @param elementId The ID of the HTML element to update.
 * @param targetValue The final value to reach.
 * @param suffix A string suffix to append to the number (e.g., ' ر.س').
 */
const animateNumber = (elementId: string, targetValue: number, suffix: string = '') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: DOMHighResTimeStamp) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        
        element.textContent = Math.floor(currentValue).toLocaleString() + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
};

const HealthPage: React.FC = () => {
    const [daysWithoutSmoking, setDaysWithoutSmoking] = useState<number>(0); // سيتم جلبها من localStorage
    const [lungImageSrc, setLungImageSrc] = useState<string>('/1.png'); // المسار الافتراضي لصورة الرئة
    const [lungStatusText, setLungStatusText] = useState<string>('رئتاك تتعافى بشكل ممتاز! استمر في هذا الإنجاز الرائع.');

    const healthMilestones: Milestone[] = [
        { days: 1, icon: '🌟', title: 'بداية التعافي', description: 'انخفاض مستوى أول أكسيد الكربون في الدم', cssClass: '' },
        { days: 3, icon: '💨', title: 'تحسن التنفس', description: 'تحسن وظائف الرئة وسهولة التنفس', cssClass: '' },
        { days: 7, icon: '👃', title: 'عودة الحواس', description: 'تحسن حاستي الشم والتذوق', cssClass: '' },
        { days: 30, icon: '🫁', title: 'تنظيف الرئتين', description: 'بداية تنظيف الرئتين من السموم', cssClass: '' },
        { days: 90, icon: '💪', title: 'تحسن الدورة الدموية', description: 'تحسن كبير في الدورة الدموية ووظائف الرئة', cssClass: '' },
        { days: 365, icon: '❤️', title: 'صحة القلب', description: 'انخفاض خطر الإصابة بأمراض القلب بنسبة 50%', cssClass: '' },
    ];

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

    // جلب daysWithoutSmoking من localStorage/userData
    useEffect(() => {
        let username = '';
        if (typeof window !== 'undefined') {
            username = localStorage.getItem('anfask-username') || '';
        }
        if (!username) return;
        if (typeof window !== 'undefined') {
            // استخدام الأيام الصافية للصحة (الأيام بدون تدخين - أيام التدخين)
            const netDaysStr = localStorage.getItem('anfask-netDaysWithoutSmoking');
            if (netDaysStr) {
                const netDays = parseInt(netDaysStr);
                setDaysWithoutSmoking(netDays);
                return;
            }
            
            // إذا لم تكن متوفرة، استخدم البيانات التقليدية
            const userDataStr = localStorage.getItem('anfask-userData-' + username);
            if (userDataStr) {
                const data = JSON.parse(userDataStr);
                setDaysWithoutSmoking(data.daysWithoutSmoking || 0);
            }
        }
    }, []);

    return (
        <div className="health-container">
            {/* Health Header */}
            <div className="health-header">
                <h1 className="health-title">تصور التقدم الصحي</h1>
                <p className="health-subtitle">شاهد كيف تتعافى رئتاك مع كل يوم خالٍ من التدخين</p>
            </div>

            {/* Health Grid */}
            <div className="health-grid">
                {/* Lung Visualization Card */}
                <div className="lung-card">
                    <div className="lung-visual-container">
                        <img id="lungImage" src={lungImageSrc} alt="صورة الرئة" style={{ width: '90%', height: '80%', objectFit: 'contain', objectPosition: 'center center', display: 'block', margin: 'auto', transition: 'all 1s' }} />
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
