// app/achievements/page.tsx
// تأكد من إضافة 'use client'; في أول سطر
'use client';

import React, { useState, useEffect, useRef } from 'react';
// المسار الصحيح لملف الـ CSS الرئيسي (globals.css) من داخل app/achievements/
import '../globals.css'; 
import './achievements.css'

// --- تعريفات الأنواع (Interfaces) ---

interface Badge {
    id: number;
    name: string;
    description: string;
    requirement: string;
    days: number;
    icon: string;
    earned: boolean;
    earnedDate: string | null; // ISO string or null
    cssClass: string; // لربط الأنماط الخاصة بالوسام
}

// --- دوال مساعدة (Helper Functions) ---
/**
 * Animates a number counting up to a target value.
 * @param element HTMLElement reference to update.
 * @param targetValue The final value to reach.
 * @param suffix A string suffix to append to the number (e.g., ' ر.س').
 */
const animateNumber = (element: HTMLElement | null, targetValue: number, suffix: string = '') => {
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

// تعريف ثابت لتعريف الأوسمة (ثابت لا يتغير بين الرندرات)
const INITIAL_BADGES: Badge[] = [
    { id: 1, name: 'بداية', description: 'أول خطوة في رحلة الإقلاع عن التدخين. كل رحلة ألف ميل تبدأ بخطوة واحدة.', requirement: 'يوم واحد خالٍ من التدخين', days: 1, icon: '🌟', earned: false, earnedDate: null, cssClass: 'badge-1-day' },
    { id: 2, name: 'مثابرة', description: 'أسبوع كامل من القوة والعزيمة. لقد تجاوزت أصعب المراحل الأولى.', requirement: '7 أيام خالية من التدخين', days: 7, icon: '💪', earned: false, earnedDate: null, cssClass: 'badge-7-days' },
    { id: 3, name: 'قوة', description: 'أسبوعان من الصمود والإرادة القوية. جسمك يبدأ في التعافي.', requirement: '15 يوماً خالياً من التدخين', days: 15, icon: '🔥', earned: false, earnedDate: null, cssClass: 'badge-15-days' },
    { id: 4, name: 'عزيمة', description: 'شهر كامل من النجاح! لقد أثبت أن لديك العزيمة لتحقيق أهدافك.', requirement: '30 يوماً خالياً من التدخين', days: 30, icon: '🏆', earned: false, earnedDate: null, cssClass: 'badge-30-days' },
    { id: 5, name: 'تحول', description: 'شهران من التغيير الإيجابي. جسمك وعقلك يشعران بالفرق الكبير.', requirement: '60 يوماً خالياً من التدخين', days: 60, icon: '🦋', earned: false, earnedDate: null, cssClass: 'badge-60-days' },
    { id: 6, name: 'استقرار', description: 'ثلاثة أشهر من الثبات والاستقرار. لقد أصبحت مثالاً يُحتذى به.', requirement: '90 يوماً خالياً من التدخين', days: 90, icon: '💎', earned: false, earnedDate: null, cssClass: 'badge-90-days' }
];

const AchievementsPage: React.FC = () => {
    const [daysSinceQuit, setDaysSinceQuit] = useState<number>(0);
    const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
    const [penaltyToday, setPenaltyToday] = useState<boolean>(false);
    const [penaltyDate, setPenaltyDate] = useState<string | null>(null);
    const [hidePenaltyBanner, setHidePenaltyBanner] = useState<boolean>(false);

    // Refs for DOM elements
    const daysCounterRef = useRef<HTMLDivElement>(null);
    const totalBadgesRef = useRef<HTMLDivElement>(null);
    const earnedBadgesRef = useRef<HTMLDivElement>(null);
    const completionRateRef = useRef<HTMLDivElement>(null);
    const longestStreakRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const nextMilestoneRef = useRef<HTMLDivElement>(null);

    // جلب daysWithoutSmoking من localStorage/userData (مع علاج للحسابات القديمة)
    useEffect(() => {
        let username = '';
        if (typeof window !== 'undefined') {
            username = localStorage.getItem('anfask-username') || '';
        }
        if (!username) return;
        // جلب بيانات المستخدم من localStorage (نفس منطق الداشبورد)
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().slice(0,10);
            const pDate = localStorage.getItem('anfask-penaltyDate');
            if (pDate) {
                setPenaltyDate(pDate);
                setPenaltyToday(pDate === today);
                // check session dismissal per day
                if (sessionStorage.getItem(`anfask-dismiss-penalty-${pDate}`) === '1') {
                    setHidePenaltyBanner(true);
                }
            }
            // استخدام الأيام الصافية للأوسمة (الأيام بدون تدخين - أيام التدخين)
            const netDaysStr = localStorage.getItem('anfask-netDaysWithoutSmoking');
            const totalDaysStr = localStorage.getItem('anfask-totalDaysWithoutSmoking');
            if (netDaysStr) {
                const netDays = parseInt(netDaysStr);
                if (Number.isFinite(netDays) && netDays > 0) {
                    setDaysSinceQuit(netDays);
                    return;
                }
                if (totalDaysStr) {
                    const totalDays = parseInt(totalDaysStr);
                    if (Number.isFinite(totalDays) && totalDays > 0) {
                        setDaysSinceQuit(totalDays);
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
                setDaysSinceQuit(fallbackDays);
            }
        }
    }, []);

    // تحديث الأوسمة بناءً على daysSinceQuit
    useEffect(() => {
        setBadges(prevBadges => prevBadges.map(badge => {
            if (daysSinceQuit >= badge.days && !badge.earned) {
                return { ...badge, earned: true, earnedDate: new Date().toLocaleDateString('ar-EG') };
            } else if (daysSinceQuit < badge.days && badge.earned) {
                return { ...badge, earned: false, earnedDate: null };
            }
            return badge;
        }));
    }, [daysSinceQuit]);

    // تأثير لتحديث الإحصائيات والرسوم المتحركة باستخدام المراجع فقط
    useEffect(() => {
        // Counters
        animateNumber(daysCounterRef.current, daysSinceQuit, '');

        const earnedCount = INITIAL_BADGES.filter(b => daysSinceQuit >= b.days).length;
        const totalCount = INITIAL_BADGES.length;
        const completionRate = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

        animateNumber(totalBadgesRef.current, totalCount, '');
        animateNumber(earnedBadgesRef.current, earnedCount, '');
        animateNumber(completionRateRef.current, completionRate, '%');
        animateNumber(longestStreakRef.current, daysSinceQuit, '');

        // Progress bar
        const maxDaysForProgressBar = INITIAL_BADGES[INITIAL_BADGES.length - 1]?.days || 1;
        const progressWidth = Math.min(100, (daysSinceQuit / maxDaysForProgressBar) * 100);
        if (progressBarRef.current) {
            progressBarRef.current.style.width = `${progressWidth}%`;
        }

        // Next milestone
        const nextUnearned = INITIAL_BADGES.find(b => daysSinceQuit < b.days);
        if (nextMilestoneRef.current) {
            if (nextUnearned) {
                const remainingDays = nextUnearned.days - daysSinceQuit;
                nextMilestoneRef.current.textContent = `الوسام التالي: ${nextUnearned.name} (${remainingDays} أيام متبقية)`;
            } else {
                nextMilestoneRef.current.textContent = 'تهانينا! لقد حققت جميع الأوسمة المتاحة 🎉';
            }
        }
    }, [daysSinceQuit]); // ✅ بدون badges

    return (
        <div className="achievements-container">
            {/* Achievements Header */}
            <div className="achievements-header">
                <h1 className="achievements-title">أوسمة الإنجاز</h1>
                <p className="achievements-subtitle">احتفل بكل خطوة في رحلتك نحو حياة خالية من التدخين</p>
            </div>

            {/* Penalty notice */}
            {penaltyToday && !hidePenaltyBanner && (
                <div className="glass-box" style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    marginBottom: 16,
                    color: '#333'
                }} aria-live="polite">
                    <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            لقد تم خصم يوم واحد من الأوسمة والصحة بسبب تسجيل يوم تدخين بتاريخ{' '}
                            <strong>{penaltyDate ? new Date(penaltyDate + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('ar-EG')}</strong>.
                            {' '}استمر—العودة للطريق الصحيح تبدأ الآن 💪
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

            {/* Progress Overview */}
            <div className="progress-overview">
                <div className="days-counter" id="daysCounter" ref={daysCounterRef}>{daysSinceQuit}</div>
                <div className="days-label">يوماً خالياً من التدخين</div>
                
                <div className="progress-bar-container" aria-label="شريط التقدم نحو الوسام التالي">
                    <div className="progress-bar" id="progressBar" ref={progressBarRef} style={{ width: '0%' }}></div>
                </div>
                
                <div className="next-milestone" id="nextMilestone" ref={nextMilestoneRef}>
                    جاري حساب الوسام التالي...
                </div>
            </div>

            {/* Badges Grid */}
            <div className="badges-grid">
                {badges.map(badge => (
                    <div
                        key={badge.id}
                        className={`badge-card ${badge.cssClass} ${badge.earned ? 'earned' : 'locked'}`}
                        aria-label={`وسام ${badge.name}`}
                    >
                        <div className="badge-icon">{badge.icon}</div>
                        <h3 className="badge-title">{badge.name}</h3>
                        <p className="badge-description">{badge.description}</p>
                        <div className="badge-requirement">{badge.requirement}</div>
                        {badge.earnedDate && <div className="badge-date">تم الحصول عليه في: {badge.earnedDate}</div>}
                        {!badge.earned && (
                            <div className="locked-overlay">
                                <span className="lock-icon">🔒</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Statistics Section */}
            <div className="stats-section">
                <h2 className="stats-title">إحصائيات الإنجاز</h2>
                <div className="stats-grid">
                    <div className="stat-item" aria-label="إجمالي الأوسمة">
                        <div className="stat-value" id="totalBadges" ref={totalBadgesRef}>0</div>
                        <div className="stat-label">إجمالي الأوسمة</div>
                    </div>
                    <div className="stat-item" aria-label="الأوسمة المحققة">
                        <div className="stat-value" id="earnedBadges" ref={earnedBadgesRef}>0</div>
                        <div className="stat-label">الأوسمة المحققة</div>
                    </div>
                    <div className="stat-item" aria-label="نسبة الإنجاز">
                        <div className="stat-value" id="completionRate" ref={completionRateRef}>0%</div>
                        <div className="stat-label">نسبة الإنجاز</div>
                    </div>
                    <div className="stat-item" aria-label="أطول فترة متواصلة">
                        <div className="stat-value" id="longestStreak" ref={longestStreakRef}>0</div>
                        <div className="stat-label">أطول فترة متواصلة</div>
                    </div>
                </div>
            </div>
            
        </div>
        
        
    );
    
};

export default React.memo(AchievementsPage);
