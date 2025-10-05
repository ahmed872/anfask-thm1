'use client';

// src/App.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './dashboard.css'; // استيراد ملف CSS
import '../globals.css'
import SurveyManager from '../components/SurveyManager';
import MoodCalendar from '../components/MoodCalendar';
import DailyQuestion from '../components/DailyQuestion';
import { getTodayLocalDate, getCurrentTimestamp } from '../../lib/dateUtils';

// --- تعريفات الأنواع (Interfaces) ---
interface UserData {
    createdAt: string; // استخدام createdAt بدلاً من quitDate
    dailyCigarettes: number;
    cigarettePrice?: number; // اختياري، سيتم إضافته من الداش بورد
    name: string;
    daysWithoutSmoking: number;
    lastCheckDate?: string; // تاريخ آخر فحص يومي
}

// بيانات المستخدم في Firestore قد تحتوي على حقول إضافية
interface DailyRecord { smoked?: boolean }
interface FireUserData extends UserData {
    dailyRecords?: Record<string, DailyRecord>;
    netDaysWithoutSmoking?: number;
    totalDaysWithoutSmoking?: number;
}

type MoodType = 'happy' | 'motivated' | 'tired' | 'stressed';

interface MoodEntry {
    id: number;
    date: string; // YYYY-MM-DD
    mood: MoodType;
    moodLabel: string;
    cravingLevel: number;
    comment: string;
    timestamp: string; // ISO string
}

type NotificationType = 'info' | 'warning' | 'error' | 'success';

// --- دوال مساعدة (Helper Functions) ---

/**
 * Animates a number counting up to a target value.
 * @param elementId The ID of the HTML element to update.
 * @param targetValue The final value to reach.
 * @param suffix A string suffix to append to the number (e.g., ' ر.س').
 */
// تحسين: جعل الأنيميشن اختياريًا (لتقليل الحمل)
const animateNumber = (elementId: string, targetValue: number, suffix: string = '', animate = false) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    if (!animate) {
        element.textContent = Math.floor(targetValue).toLocaleString() + suffix;
        return;
    }
    const startValue = 0;
    const duration = 1200;
    const startTime = performance.now();
    const animateFn = (currentTime: DOMHighResTimeStamp) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        element.textContent = Math.floor(currentValue).toLocaleString() + suffix;
        if (progress < 1) {
            requestAnimationFrame(animateFn);
        }
    };
    requestAnimationFrame(animateFn);
};

/**
 * Creates a ripple effect on a given HTML element.
 * @param element The HTML element to apply the ripple effect to.
 */
const createRippleEffect = (element: HTMLElement) => {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 152, 0, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.width = '100px';
    ripple.style.height = '100px';
    ripple.style.marginLeft = '-50px';
    ripple.style.marginTop = '-50px';
    ripple.style.pointerEvents = 'none';

    element.style.position = 'relative';
    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
};

/**
 * Displays a notification message.
 * @param text The message to display.
 * @param type The type of notification (info, warning, error, success).
 */
const showNotification = (text: string, type: NotificationType = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = text;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 12px;
        color: white;
        z-index: 1001;
        transform: translateX(400px);
        transition: all 0.3s ease;
        font-family: 'Cairo', sans-serif;
    `;
    
    switch(type) {
        case 'warning':
            notification.style.background = 'linear-gradient(45deg, #ff9800, #f57c00)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
            break;
        case 'success':
            notification.style.background = 'linear-gradient(45deg, #4CAF50, #8BC34A)';
            break;
        default:
            notification.style.background = 'linear-gradient(45deg, #2196f3, #1976d2)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

/**
 * Creates a confetti effect on the screen.
 */
const createConfetti = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * window.innerWidth}px;
                z-index: 1000;
                border-radius: 50%;
                pointer-events: none;
                animation: confetti-fall 3s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 50);
    }
};

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const App: React.FC = () => {
    // --- حالة التطبيق (State) ---
    const [username, setUsername] = useState<string>('');
    const [userData, setUserData] = useState<UserData | null>(null);
    // تم حذف متغيرات غير مستخدمة لتقليل الحمل
    const [cigarettePrice, setCigarettePrice] = useState<number>(1); // قيمة افتراضية
    const [showDailyQuestion, setShowDailyQuestion] = useState(false);
    const [isUpdatingFirebase, setIsUpdatingFirebase] = useState(false);
    const [actualDaysWithoutSmoking, setActualDaysWithoutSmoking] = useState<number | null>(null);

    // حساب الأيام الفعلية بدون تدخين من السجل اليومي
    const calculateActualDaysWithoutSmoking = useCallback(async (username: string, userData: UserData) => {
        if (!username || !userData) return userData.daysWithoutSmoking || 0;
        
        try {
            // جلب البيانات المحدثة من قاعدة البيانات
            const userDocRef = doc(db, 'users', username);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userDataWithRecords = userDoc.data();
                
                // استخدام totalDaysWithoutSmoking للداشبورد (إجمالي الأيام بدون تدخين)
                if (userDataWithRecords.totalDaysWithoutSmoking !== undefined) {
                    return userDataWithRecords.totalDaysWithoutSmoking;
                }
                
                // حساب احتياطي إذا لم تكن البيانات الجديدة متوفرة
                const dailyRecords = userDataWithRecords.dailyRecords || {};
                let actualDaysWithoutSmoking = 0;
                
                for (const record of Object.values(dailyRecords)) {
                    if (record && typeof record === 'object' && 'smoked' in record && !(record as { smoked: boolean }).smoked) {
                        actualDaysWithoutSmoking++;
                    }
                }
                
                return actualDaysWithoutSmoking;
            }
            
            return userData.daysWithoutSmoking || 0;
        } catch (error) {
            console.error('Error calculating actual days without smoking:', error);
            return userData.daysWithoutSmoking || 0;
        }
    }, []);

    useEffect(() => {
        // جلب اسم المستخدم من localStorage إذا كان موجودًا
        let storedUsername = '';
        if (typeof window !== 'undefined') {
            storedUsername = localStorage.getItem('anfask-username') || '';
        }
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const updateNetDaysForAchievementsAndHealth = async (username: string) => {
        try {
            const userDocRef = doc(db, 'users', username);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data() as FireUserData;
                let netDays: number | undefined = data.netDaysWithoutSmoking;
                let totalDays: number | undefined = data.totalDaysWithoutSmoking;

                // إذا القيم غير موجودة (حساب للحسابات القديمة)
                if (netDays === undefined || totalDays === undefined) {
                    const dailyRecords = data.dailyRecords || {};
                    let smokedDays = 0;
                    let nonSmokedDays = 0;
                    for (const rec of Object.values(dailyRecords)) {
                        if (!rec || typeof rec !== 'object') continue;
                        if (rec.smoked === true) smokedDays++;
                        else if (rec.smoked === false) nonSmokedDays++;
                    }
                    const derivedTotal = nonSmokedDays; // إجمالي الأيام بدون تدخين (للداشبورد)
                    const derivedNet = Math.max(0, nonSmokedDays - smokedDays); // صافي الأيام (للأوسمة/الصحة)

                    if (totalDays === undefined) totalDays = derivedTotal;
                    if (netDays === undefined) netDays = derivedNet;

                    // محاولة حفظ القيم المحسوبة في Firestore (اختياري)
                    try {
                        const updatePayload: Partial<Pick<FireUserData, 'totalDaysWithoutSmoking' | 'netDaysWithoutSmoking'>> = {};
                        if (data.totalDaysWithoutSmoking === undefined) updatePayload.totalDaysWithoutSmoking = totalDays;
                        if (data.netDaysWithoutSmoking === undefined) updatePayload.netDaysWithoutSmoking = netDays;
                        if (Object.keys(updatePayload).length > 0) {
                            await updateDoc(userDocRef, updatePayload);
                        }
                    } catch (e) {
                        console.warn('Could not persist derived days to Firestore:', e);
                    }
                }

                // تأكد من عدم undefined
                const safeNet = Number.isFinite(netDays as number) ? (netDays as number) : 0;
                const safeTotal = Number.isFinite(totalDays as number) ? (totalDays as number) : 0;
                
                // حفظ في localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('anfask-netDaysWithoutSmoking', safeNet.toString());
                    localStorage.setItem('anfask-totalDaysWithoutSmoking', safeTotal.toString());
                }
            }
        } catch (error) {
            console.error('Error updating net days:', error);
        }
    };

    useEffect(() => {
        if (!username) return;
        // ...existing code...
        const fetchUser = async () => {
            try {
                const userRef = doc(db, 'users', username);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data() as UserData;
                    setUserData(data);

                    // تعيين سعر السيجارة إذا كان موجودًا
                    if (data.cigarettePrice) {
                        setCigarettePrice(data.cigarettePrice);
                    }

                    // حفظ daysWithoutSmoking في localStorage ليستخدم في باقي الصفحات
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('anfask-userData-' + username, JSON.stringify(data));
                    }

                    // التحقق من ضرورة عرض السؤال اليومي
                    checkDailyQuestion(data);
                } else {
                    setUserData(null);
                }
            } catch {
                setUserData(null);
            }
        };
        fetchUser();
    }, [username]);

    // حساب الأيام الفعلية بدون تدخين من السجل اليومي
    useEffect(() => {
        if (!username || !userData) return;
        
        const calculateAndSetActualDays = async () => {
            console.log('Calculating actual days for:', username, userData);
            const actualDays = await calculateActualDaysWithoutSmoking(username, userData);
            console.log('Calculated actual days:', actualDays);
            setActualDaysWithoutSmoking(actualDays);
            
            // حفظ الأيام الفعلية في localStorage لاستخدامها في صفحات أخرى
            if (typeof window !== 'undefined') {
                localStorage.setItem('anfask-actualDaysWithoutSmoking', actualDays.toString());
                // حفظ البيانات الجديدة للأوسمة والصحة
                updateNetDaysForAchievementsAndHealth(username);
                console.log('Saved actual days to localStorage:', actualDays);
            }
        };
        
        calculateAndSetActualDays();
    }, [username, userData, calculateActualDaysWithoutSmoking]);

    // التحقق من ضرورة عرض السؤال اليومي
    const checkDailyQuestion = (data: UserData) => {
        const today = getTodayLocalDate(); // YYYY-MM-DD
        const lastCheckDate = data.lastCheckDate;
        
        // إذا لم يتم السؤال اليوم، اعرض السؤال
        if (!lastCheckDate || lastCheckDate !== today) {
            setShowDailyQuestion(true);
        }
    };

    // التعامل مع إجابة السؤال اليومي
    const handleDailyQuestionAnswer = async (didSmoke: boolean) => {
        if (!userData || !username) return;
        
        setIsUpdatingFirebase(true);
        const today = getTodayLocalDate();
        
        try {
            const userRef = doc(db, 'users', username);
            
            if (didSmoke) {
                // إذا دخن، أعد تعيين العدادات
                await updateDoc(userRef, {
                    daysWithoutSmoking: 0,
                    lastCheckDate: today
                });
                
                setUserData(prev => {
                    const updated = prev ? {
                        ...prev,
                        daysWithoutSmoking: 0,
                        lastCheckDate: today
                    } : null;
                    if (updated && typeof window !== 'undefined') {
                        localStorage.setItem('anfask-userData-' + username, JSON.stringify(updated));
                    }
                    return updated;
                });
                
                showNotification('تم إعادة تعيين العدادات. لا تقلق، يمكنك البدء من جديد!', 'warning');
            } else {
                // إذا لم يدخن، زد عدد الأيام
                const newDays = userData.daysWithoutSmoking + 1;
                await updateDoc(userRef, {
                    daysWithoutSmoking: newDays,
                    lastCheckDate: today
                });
                
                setUserData(prev => {
                    const updated = prev ? {
                        ...prev,
                        daysWithoutSmoking: newDays,
                        lastCheckDate: today
                    } : null;
                    if (updated && typeof window !== 'undefined') {
                        localStorage.setItem('anfask-userData-' + username, JSON.stringify(updated));
                    }
                    return updated;
                });
                
                showNotification(`ممتاز! لقد أكملت ${newDays} يوم بدون تدخين!`, 'success');
                createConfetti();
            }
            
            // إعادة حساب الأيام الفعلية بعد الإجابة
            const actualDays = await calculateActualDaysWithoutSmoking(username, userData);
            setActualDaysWithoutSmoking(actualDays);
            
            // حفظ الأيام الفعلية في localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('anfask-actualDaysWithoutSmoking', actualDays.toString());
            }
            
        } catch {
            showNotification('حدث خطأ أثناء تحديث البيانات', 'error');
        }
        
        setIsUpdatingFirebase(false);
        setShowDailyQuestion(false);
    };

    // حفظ سعر السيجارة في Firebase
    const saveCigarettePrice = async () => {
        if (!userData || !username) return;
        
        try {
            const userRef = doc(db, 'users', username);
            await updateDoc(userRef, {
                cigarettePrice: cigarettePrice
            });
            
            setUserData(prev => {
                const updated = prev ? {
                    ...prev,
                    cigarettePrice: cigarettePrice
                } : null;
                if (updated && typeof window !== 'undefined') {
                    localStorage.setItem('anfask-userData-' + username, JSON.stringify(updated));
                }
                return updated;
            });
            
            showNotification('تم حفظ سعر السيجارة بنجاح!', 'success');
        } catch {
            showNotification('حدث خطأ أثناء حفظ سعر السيجارة', 'error');
        }
    };

    // تحسين: تحميل بيانات المزاج مرة واحدة فقط عند أول تحميل
    const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('moodHistory');
            if (saved) setMoodHistory(JSON.parse(saved));
        }
    }, []);

    const [welcomeMessage, setWelcomeMessage] = useState({
        title: '',
        subtitle: ''
    });

    const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
    const [selectedMoodLabel, setSelectedMoodLabel] = useState<string>('');
    const [cravingLevel, setCravingLevel] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // --- المراجع (Refs) للعناصر ---
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    // --- دوال المنطق الرئيسية ---

    // حساب المدخرات (بدون أنيميشن افتراضيًا)
    const savings = useMemo(() => {
        if (!userData) return null;
        const now = new Date();
        const quitDate = new Date(userData.createdAt);
        const daysSinceQuit = Math.max(0, Math.floor((now.getTime() - quitDate.getTime()) / (1000 * 60 * 60 * 24)));
        
        // استخدام الأيام الفعلية من السجل اليومي إذا كانت متوفرة، وإلا استخدام daysWithoutSmoking، وأخيراً daysSinceQuit
        const effectiveDays = actualDaysWithoutSmoking !== null 
            ? actualDaysWithoutSmoking 
            : (userData.daysWithoutSmoking !== undefined ? userData.daysWithoutSmoking : daysSinceQuit);
            
        console.log('Savings calculation:', {
            actualDaysWithoutSmoking,
            userDataDays: userData.daysWithoutSmoking,
            daysSinceQuit,
            effectiveDays
        });
            
        const dailyCost = userData.dailyCigarettes * cigarettePrice;
        return {
            totalSavings: effectiveDays * dailyCost,
            dailySavings: dailyCost,
            weeklySavings: dailyCost * 7,
            monthlySavings: dailyCost * 30,
            cigarettesAvoided: effectiveDays * userData.dailyCigarettes,
            daysWithoutSmoking: effectiveDays
        };
    }, [userData, cigarettePrice, actualDaysWithoutSmoking]);

    // تحديث القيم في DOM عند تغير المدخرات
    useEffect(() => {
        if (!savings) return;
        animateNumber('totalSavings', savings.totalSavings, ' ر.س');
        animateNumber('dailySavings', savings.dailySavings, ' ر.س');
        animateNumber('weeklySavings', savings.weeklySavings, ' ر.س');
        animateNumber('monthlySavings', savings.monthlySavings, ' ر.س');
        animateNumber('cigarettesAvoided', savings.cigarettesAvoided, '');
        animateNumber('daysWithoutSmoking', savings.daysWithoutSmoking, ' يوم');
    }, [savings]);

    // تحديث رسالة الترحيب
    const updateWelcomeMessage = useCallback(() => {
        if (!userData) return;
        const hour = new Date().getHours();
        let greeting: string, message: string;
        if (hour < 12) {
            greeting = 'صباح الخير';
            message = 'ابدأ يومك بطاقة إيجابية';
        } else if (hour < 18) {
            greeting = 'مساء الخير';
            message = 'استمر في رحلتك نحو حياة أفضل';
        } else {
            greeting = 'مساء الخير';
            message = 'اختتم يومك بتسجيل مشاعرك';
        }
        setWelcomeMessage({
            title: `${greeting}، ${userData.name}`,
            subtitle: message
        });
    }, [userData]);

    // التعامل مع اختيار المزاج
    const handleMoodSelect = (mood: MoodType, label: string) => {
        setSelectedMood(mood);
        setSelectedMoodLabel(label);
    };

    // التعامل مع حفظ بيانات المزاج
    const handleSaveMood = () => {
        if (!selectedMood) {
            showNotification('الرجاء اختيار حالتك المزاجية أولاً', 'warning');
            return;
        }

        if (saveButtonRef.current) {
            createRippleEffect(saveButtonRef.current);
        }

        setIsSaving(true);

        setTimeout(() => {
            const newEntry: MoodEntry = {
                id: Date.now(),
                date: getTodayLocalDate(), // YYYY-MM-DD
                mood: selectedMood,
                moodLabel: selectedMoodLabel,
                cravingLevel: cravingLevel,
                comment: comment,
                timestamp: getCurrentTimestamp()
            };

            const updatedHistory = [newEntry, ...moodHistory];
            setMoodHistory(updatedHistory);
            // تأكد أن الكود يعمل في المتصفح قبل الوصول إلى localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
            }

            showNotification('تم حفظ بياناتك بنجاح!', 'success');
            createConfetti();

            // Reset form
            setSelectedMood(null);
            setSelectedMoodLabel('');
            setCravingLevel(0);
            setComment('');
            setIsSaving(false);
        }, 1500);
    };

    // --- التأثيرات الجانبية (useEffect Hooks) ---
    // تحديث رسالة الترحيب عند تغير بيانات المستخدم فقط
    useEffect(() => {
        if (userData) updateWelcomeMessage();
    }, [userData, updateWelcomeMessage]);

    // --- JSX لتقديم واجهة المستخدم ---
    return (
        <>
            {/* نافذة السؤال اليومي الجديد */}
            {showDailyQuestion && (
                <DailyQuestion
                    onAnswer={handleDailyQuestionAnswer}
                    isLoading={isUpdatingFirebase}
                    isMandatory={true}
                />
            )}

            {/* تم حذف إدخال اسم المستخدم وزر تحميل البيانات */}

            {/* إعدادات سعر السيجارة */}
            {userData && (
                <div style={{
                    maxWidth: 400,
                    margin: '24px auto',
                    padding: '1.5rem',
                    border: 'none',
                    borderRadius: '16px',
                    background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)',
                    boxShadow: '0 2px 16px #0001',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <span style={{fontWeight: 600, color: '#444', fontSize: '1.1rem', letterSpacing: 1}}>سعر السيجارة:</span>
                    <input
                        id="cigarette-price"
                        type="number"
                        value={cigarettePrice}
                        onChange={e => setCigarettePrice(Number(e.target.value))}
                        style={{
                            width: 70,
                            padding: '0.5rem',
                            border: '1.5px solid #a5b4fc',
                            borderRadius: 8,
                            fontSize: '1.1rem',
                            background: '#fff',
                            color: '#333',
                            outline: 'none',
                            boxShadow: '0 1px 4px #a5b4fc22',
                            transition: 'border 0.2s'
                        }}
                        min="0"
                        step="0.1"
                    />
                    <span style={{color: '#6366f1', fontWeight: 700, fontSize: '1.1rem'}}>ر.س</span>
                    <button
                        onClick={saveCigarettePrice}
                        style={{
                            background: 'linear-gradient(90deg, #6366f1 60%, #818cf8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '0.5rem 1.2rem',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px #6366f122',
                            transition: 'background 0.2s'
                        }}
                    >حفظ</button>
                </div>
            )}

            {!userData ? <div style={{textAlign:'center'}}>يرجى إدخال اسم المستخدم لعرض البيانات</div> : null}
            
            {userData && (
                <>                  
                    {/* المحتوى الرئيسي */}
                    <div className="container">
                        <div className="welcome-section">
                            <h1 className="welcome-title">
                                {(() => {
                                    // استخراج اسم المستخدم من رسالة الترحيب أو من userData
                                    const name = userData?.name || '';
                                    let greeting = '';
                                    if (welcomeMessage.title.includes('مساء الخير')) {
                                        greeting = 'مساء الخير';
                                    } else if (welcomeMessage.title.includes('صباح الخير')) {
                                        greeting = 'صباح الخير';
                                    }
                                    return (
                                        <>
                                            {greeting}
                                            {name ? <span style={{color:'#6366f1', fontWeight:700}}>, {name}</span> : ''}
                                        </>
                                    );
                                })()}
                            </h1>
                            <p className="welcome-subtitle">{welcomeMessage.subtitle}</p>
                        </div>

                        <div className="dashboard-grid">
                            {/* بطاقة حاسبة المدخرات */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-icon savings-icon">💰</div>
                                    <h2 className="card-title">حاسبة المدخرات</h2>
                                </div>
                                <div className="savings-amount" id="totalSavings">0 ر.س</div>
                                <div className="savings-details">
                                    <div className="savings-item">
                                        <div className="savings-item-value" id="daysWithoutSmoking">0 يوم</div>
                                        <div className="savings-item-label">أيام بدون تدخين</div>
                                    </div>
                                    <div className="savings-item">
                                        <div className="savings-item-value" id="dailySavings">0 ر.س</div>
                                        <div className="savings-item-label">توفير يومي</div>
                                    </div>
                                    <div className="savings-item">
                                        <div className="savings-item-value" id="weeklySavings">0 ر.س</div>
                                        <div className="savings-item-label">توفير أسبوعي</div>
                                    </div>
                                    <div className="savings-item">
                                        <div className="savings-item-value" id="monthlySavings">0 ر.س</div>
                                        <div className="savings-item-label">توفير شهري</div>
                                    </div>
                                    <div className="savings-item">
                                        <div className="savings-item-value" id="cigarettesAvoided">0</div>
                                        <div className="savings-item-label">سجائر تم تجنبها</div>
                                    </div>
                                </div>
                            </div>

                            {/* بطاقة تتبع المزاج */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-icon mood-icon">😊</div>
                                    <h2 className="card-title">تتبع المزاج اليومي</h2>
                                </div>
                                <p className="mood-question">كيف تشعر اليوم بعدم التدخين؟</p>
                                <div className="mood-options">
                                    {[
                                        { mood: 'happy', emoji: '😄', label: 'سعيد' },
                                        { mood: 'motivated', emoji: '💪', label: 'متحمس' },
                                        { mood: 'tired', emoji: '😴', label: 'متعب' },
                                        { mood: 'stressed', emoji: '😫', label: 'متوتر' },
                                    ].map(({ mood, emoji, label }) => (
                                        <div 
                                            key={mood}
                                            className={`mood-option ${selectedMood === mood ? 'selected' : ''}`}
                                            onClick={() => handleMoodSelect(mood as MoodType, label)}
                                        >
                                            <div className="mood-emoji">{emoji}</div>
                                            <div className="mood-label">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="craving-section">
                                    <label htmlFor="craving-slider" className="craving-label">مستوى الرغبة في التدخين</label>
                                    <div className="slider-container">
                                        <input 
                                            type="range" 
                                            id="craving-slider" 
                                            className="craving-slider" 
                                            min="0" 
                                            max="10" 
                                            value={cravingLevel}
                                            onChange={(e) => setCravingLevel(Number(e.target.value))}
                                        />
                                        <div className="craving-value">{cravingLevel}</div>
                                    </div>
                                </div>

                                <div className="comment-section">
                                    <textarea 
                                        className="comment-textarea" 
                                        placeholder="أضف تعليقًا أو ملاحظة..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    ></textarea>
                                </div>

                                <button 
                                    ref={saveButtonRef}
                                    className="save-btn"
                                    onClick={handleSaveMood}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <div className="loading"></div> : 'حفظ'}
                                </button>
                            </div>
                        </div>

                        {/* بطاقة تقويم المزاج */}
                        <div className="card" style={{ gridColumn: '1 / -1' }}>
                            <div className="card-header">
                                <div className="card-icon mood-icon">📅</div>
                                <h2 className="card-title">تقويم المزاج الشهري</h2>
                            </div>
                            <MoodCalendar entries={moodHistory} />
                        </div>

                        {/* بطاقة السجل اليومي للتدخين */}
                    </div>
                </>
            )}

            {/* نظام الاستبيانات */}
            {username && <SurveyManager username={username} />}
        </>
    );
};

export default App;

