// app/achievements/page.tsx
// تأكد من إضافة 'use client'; في أول سطر
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// المسار الصحيح لملف الـ CSS الرئيسي (globals.css) من داخل app/achievements/
import '../globals.css'; 
import './achievements.css'
import Image from 'next/image';

// --- تعريفات الأنواع (Interfaces) ---
interface UserData {
    createdAt: string;
    dailyCigarettes: number;
    cigarettePrice?: number;
    name: string;
    daysWithoutSmoking: number;
    lastCheckDate?: string;
}

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

const AchievementsPage: React.FC = () => {
    const [userData, setUserData] = useState<UserData|null>(null);
    const [daysSinceQuit, setDaysSinceQuit] = useState<number>(0);
    const [badges, setBadges] = useState<Badge[]>([
        { id: 1, name: 'بداية', description: 'أول خطوة في رحلة الإقلاع عن التدخين. كل رحلة ألف ميل تبدأ بخطوة واحدة.', requirement: 'يوم واحد خالٍ من التدخين', days: 1, icon: '🌟', earned: false, earnedDate: null, cssClass: 'badge-1-day' },
        { id: 2, name: 'مثابرة', description: 'أسبوع كامل من القوة والعزيمة. لقد تجاوزت أصعب المراحل الأولى.', requirement: '7 أيام خالية من التدخين', days: 7, icon: '💪', earned: false, earnedDate: null, cssClass: 'badge-7-days' },
        { id: 3, name: 'قوة', description: 'أسبوعان من الصمود والإرادة القوية. جسمك يبدأ في التعافي.', requirement: '15 يوماً خالياً من التدخين', days: 15, icon: '🔥', earned: false, earnedDate: null, cssClass: 'badge-15-days' },
        { id: 4, name: 'عزيمة', description: 'شهر كامل من النجاح! لقد أثبت أن لديك العزيمة لتحقيق أهدافك.', requirement: '30 يوماً خالياً من التدخين', days: 30, icon: '🏆', earned: false, earnedDate: null, cssClass: 'badge-30-days' },
        { id: 5, name: 'تحول', description: 'شهران من التغيير الإيجابي. جسمك وعقلك يشعران بالفرق الكبير.', requirement: '60 يوماً خالياً من التدخين', days: 60, icon: '🦋', earned: false, earnedDate: null, cssClass: 'badge-60-days' },
        { id: 6, name: 'استقرار', description: 'ثلاثة أشهر من الثبات والاستقرار. لقد أصبحت مثالاً يُحتذى به.', requirement: '90 يوماً خالياً من التدخين', days: 90, icon: '💎', earned: false, earnedDate: null, cssClass: 'badge-90-days' }
    ]);

    // جلب daysWithoutSmoking من localStorage/userData
    useEffect(() => {
        let username = '';
        if (typeof window !== 'undefined') {
            username = localStorage.getItem('anfask-username') || '';
        }
        if (!username) return;
        // جلب بيانات المستخدم من localStorage (نفس منطق الداشبورد)
        if (typeof window !== 'undefined') {
            // استخدام الأيام الصافية للأوسمة (الأيام بدون تدخين - أيام التدخين)
            const netDaysStr = localStorage.getItem('anfask-netDaysWithoutSmoking');
            if (netDaysStr) {
                const netDays = parseInt(netDaysStr);
                setDaysSinceQuit(netDays);
                return;
            }
            
            // إذا لم تكن متوفرة، استخدم البيانات التقليدية
            const userDataStr = localStorage.getItem('anfask-userData-' + username);
            if (userDataStr) {
                const data = JSON.parse(userDataStr);
                setUserData(data);
                setDaysSinceQuit(data.daysWithoutSmoking || 0);
            }
        }
    }, []);

    // تحديث الأوسمة بناءً على daysSinceQuit
    useEffect(() => {
        setBadges(prevBadges => prevBadges.map(badge => {
            if (daysSinceQuit >= badge.days && !badge.earned) {
                return { ...badge, earned: true, earnedDate: new Date().toISOString().split('T')[0] };
            } else if (daysSinceQuit < badge.days && badge.earned) {
                return { ...badge, earned: false, earnedDate: null };
            }
            return badge;
        }));
    }, [daysSinceQuit]);



    useEffect(() => {
        animateNumber('daysCounter', daysSinceQuit, '');
        const earnedCount = badges.filter(b => b.earned).length;
        const totalCount = badges.length;
        const completionRate = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

        animateNumber('totalBadges', totalCount, '');
        animateNumber('earnedBadges', earnedCount, '');
        animateNumber('completionRate', completionRate, '%');
        animateNumber('longestStreak', daysSinceQuit, '');

        // Update progress bar width
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const maxDaysForProgressBar = badges[badges.length - 1]?.days || 1;
            const progressWidth = Math.min(100, (daysSinceQuit / maxDaysForProgressBar) * 100);
            progressBar.style.width = `${progressWidth}%`;
        }

        // Update next milestone message
        const nextMilestoneElement = document.getElementById('nextMilestone');
        if (nextMilestoneElement) {
            const nextUnearnedBadge = badges.find(badge => !badge.earned);
            if (nextUnearnedBadge) {
                const remainingDays = nextUnearnedBadge.days - daysSinceQuit;
                nextMilestoneElement.textContent = `الوسام التالي: ${nextUnearnedBadge.name} (${remainingDays} أيام متبقية)`;
            } else {
                nextMilestoneElement.textContent = 'تهانينا! لقد حققت جميع الأوسمة المتاحة 🎉';
            }
        }
    }, [daysSinceQuit, badges]);

    return (
        <div className="achievements-container">
            {/* Achievements Header */}
            <div className="achievements-header">
                <h1 className="achievements-title">أوسمة الإنجاز</h1>
                <p className="achievements-subtitle">احتفل بكل خطوة في رحلتك نحو حياة خالية من التدخين</p>
            </div>

            {/* Progress Overview */}
            <div className="progress-overview">
                <div className="days-counter" id="daysCounter">{daysSinceQuit}</div>
                <div className="days-label">يوماً خالياً من التدخين</div>
                
                <div className="progress-bar-container">
                    <div className="progress-bar" id="progressBar" style={{ width: '0%' }}></div>
                </div>
                
                <div className="next-milestone" id="nextMilestone">
                    جاري حساب الوسام التالي...
                </div>
            </div>

            {/* Badges Grid */}
            <div className="badges-grid">
                {badges.map(badge => (
                    <div key={badge.id} className={`badge-card ${badge.cssClass} ${badge.earned ? 'earned' : 'locked'}`}>
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
                    <div className="stat-item">
                        <div className="stat-value" id="totalBadges">0</div>
                        <div className="stat-label">إجمالي الأوسمة</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value" id="earnedBadges">0</div>
                        <div className="stat-label">الأوسمة المحققة</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value" id="completionRate">0%</div>
                        <div className="stat-label">نسبة الإنجاز</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value" id="longestStreak">0</div>
                        <div className="stat-label">أطول فترة متواصلة</div>
                    </div>
                </div>
            </div>
            
        </div>
        
        
    );
    
};

export default AchievementsPage;
