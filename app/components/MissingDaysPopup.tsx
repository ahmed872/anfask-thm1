"use client";
// ✅ [Copilot Review] تم توحيد منطق التواريخ محليًا وتحديث الحقول المشتقة (total/net) مع حفظ السجل دفعة واحدة.
// السبب: كان حساب الأيام المفقودة يشمل اليوم الحالي وقد يختلف بالمنطقة الزمنية؛ وتمت إضافة تحديث إجمالي/صافي الأيام لمنع عدم اتساق البيانات في الصفحات الأخرى.
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getTodayLocalDate, getCurrentTimestamp } from '../../lib/dateUtils';

interface DailyRecord {
  date: string; // YYYY-MM-DD
  smoked: boolean;
  recordedAt: string; // timestamp when recorded
  recordedManually?: boolean; // true if filled later, false if recorded on the day
}

interface MissingDaysPopupProps {
  username: string;
  userCreatedAt: string;
  onClose: () => void;
  onComplete: () => void;
}

const MissingDaysPopup: React.FC<MissingDaysPopupProps> = ({ 
  username, 
  userCreatedAt, 
  onClose, 
  onComplete 
}) => {
  const [missingDays, setMissingDays] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>({});

  useEffect(() => {
    loadDataAndFindMissingDays();
  }, [username, userCreatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDataAndFindMissingDays = async () => {
    try {
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const records = userData.dailyRecords || {};
        setDailyRecords(records);
        
        // العثور على الأيام المفقودة
        const missing = findMissingDays(records);
        setMissingDays(missing);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const findMissingDays = (records: Record<string, DailyRecord>) => {
    const startDate = new Date(userCreatedAt);
    // ط NORMALIZE startDate to local midnight
    startDate.setHours(0, 0, 0, 0);
    const todayStr = getTodayLocalDate();
    const today = new Date(todayStr);
    const missing: string[] = [];

    const currentDate = new Date(startDate);
    while (currentDate < today) { // تخطي يوم اليوم الحالي - سيُسأل عنه من الداشبورد
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (!records[dateStr]) {
        missing.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return missing;
  };

  const handleResponse = (smoked: boolean) => {
    const currentDay = missingDays[currentStep];
    setResponses(prev => ({
      ...prev,
      [currentDay]: smoked
    }));

    if (currentStep < missingDays.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // انتهى من جميع الأيام
      saveAllResponses();
    }
  };

  const saveAllResponses = async () => {
    setSaving(true);
    try {
      const newRecords = { ...dailyRecords };
      
      // حفظ جميع الردود
      for (const [date, smoked] of Object.entries(responses)) {
        const newRecord: DailyRecord = {
          date,
          smoked,
          recordedAt: getCurrentTimestamp(),
          recordedManually: true
        };
        newRecords[date] = newRecord;
      }

      // تحديث قاعدة البيانات
      const userRef = doc(db, 'users', username);
      // حساب إجمالي/صافي الأيام قبل الحفظ
      let totalDaysWithoutSmoking = 0;
      let totalDaysSmoked = 0;
      Object.values(newRecords).forEach(r => {
        if (!r.smoked) totalDaysWithoutSmoking++; else totalDaysSmoked++;
      });
      const netDaysWithoutSmoking = Math.max(0, totalDaysWithoutSmoking - totalDaysSmoked);

      await updateDoc(userRef, {
        dailyRecords: newRecords,
        totalDaysWithoutSmoking,
        netDaysWithoutSmoking,
        totalDaysSmoked,
        lastCheckDate: getTodayLocalDate()
      });

      // تحديث الأيام المتتالية بدون تدخين
      await updateConsecutiveDays(newRecords);
      
      // تحديث المدخرات
      await updateSavings(newRecords);

      if (typeof window !== 'undefined') {
        localStorage.setItem('anfask-totalDaysWithoutSmoking', String(totalDaysWithoutSmoking));
        localStorage.setItem('anfask-netDaysWithoutSmoking', String(netDaysWithoutSmoking));
      }

      onComplete();
    } catch (error) {
      console.error('Error saving responses:', error);
      alert('حدث خطأ في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const updateConsecutiveDays = async (records: Record<string, DailyRecord>) => {
    // حساب الأيام المتتالية بدون تدخين من النهاية
  const today = new Date(getTodayLocalDate());
    let consecutiveDays = 0;
    
    const currentDate = new Date(today);
    while (currentDate >= new Date(userCreatedAt)) {
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
      const record = records[dateStr];
      
      if (record && !record.smoked) {
        consecutiveDays++;
      } else if (record && record.smoked) {
        break;
      } else {
        // يوم غير مسجل - توقف العد
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // تحديث قاعدة البيانات
    const userRef = doc(db, 'users', username);
    await updateDoc(userRef, {
      daysWithoutSmoking: consecutiveDays,
      lastCheckDate: today.toISOString().split('T')[0]
    });
  };

  const updateSavings = async (records: Record<string, DailyRecord>) => {
    try {
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const dailyCigarettes = userData.dailyCigarettes || 20;
        const cigarettePrice = userData.cigarettePrice || 1; // السعر لكل سيجارة

        // حساب إجمالي الأيام بدون تدخين (للداشبورد)
        let totalDaysWithoutSmoking = 0;
        let totalDaysSmoked = 0;
        
        Object.values(records).forEach(record => {
          if (!record.smoked) {
            totalDaysWithoutSmoking++;
          } else {
            totalDaysSmoked++;
          }
        });

        // حساب الأيام الصافية للأوسمة والصحة (الأيام بدون تدخين - أيام التدخين)
        const netDaysWithoutSmoking = Math.max(0, totalDaysWithoutSmoking - totalDaysSmoked);

        // حساب المدخرات
        const totalSavings = totalDaysWithoutSmoking * dailyCigarettes * cigarettePrice;

        await updateDoc(userRef, {
          totalDaysWithoutSmoking, // للداشبورد
          netDaysWithoutSmoking,   // للأوسمة والصحة
          totalDaysSmoked,
          totalSavings
        });

        // حفظ في localStorage للأوسمة والصحة
        if (typeof window !== 'undefined') {
          localStorage.setItem('anfask-netDaysWithoutSmoking', netDaysWithoutSmoking.toString());
          localStorage.setItem('anfask-totalDaysWithoutSmoking', totalDaysWithoutSmoking.toString());
        }
      }
    } catch (error) {
      console.error('Error updating savings:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('ar-EG', options);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipRemaining = async () => {
    if (confirm('هل أنت متأكد من تخطي الأيام المتبقية؟ سيتم اعتبارها كأيام بدون تدخين.')) {
      // ملء الأيام المتبقية كأيام بدون تدخين
      const remainingDays = missingDays.slice(currentStep);
      const newResponses = { ...responses };
      remainingDays.forEach(day => {
        newResponses[day] = false; // لم يدخن
      });
      setResponses(newResponses);
      
      // حفظ البيانات
      setSaving(true);
      try {
        const newRecords = { ...dailyRecords };
        
        for (const [date, smoked] of Object.entries(newResponses)) {
          const newRecord: DailyRecord = {
            date,
            smoked,
            recordedAt: new Date().toISOString(),
            recordedManually: true
          };
          newRecords[date] = newRecord;
        }

        const userRef = doc(db, 'users', username);
        await updateDoc(userRef, {
          dailyRecords: newRecords
        });

        await updateConsecutiveDays(newRecords);
        await updateSavings(newRecords);

        onComplete();
      } catch (error) {
        console.error('Error saving responses:', error);
        alert('حدث خطأ في حفظ البيانات');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="missing-days-overlay">
        <div className="missing-days-popup">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>جارٍ تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (missingDays.length === 0) {
    return null;
  }

  const currentDay = missingDays[currentStep];
  const progress = ((currentStep + 1) / missingDays.length) * 100;

  return (
    <div className="missing-days-overlay">
      <div className="missing-days-popup">
        <div className="popup-header">
          <h3>استكمال سجل التدخين</h3>
          <p>لديك {missingDays.length} يوم غير مسجل منذ إنشاء الحساب</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">{currentStep + 1} من {missingDays.length}</span>
        </div>

        <div className="popup-body">
          <div className="day-question">
            <h4>يوم {formatDate(currentDay)}</h4>
            <p className="question">هل دخنت في هذا اليوم؟</p>
            
            <div className="response-buttons">
              <button 
                className="response-btn no-smoke"
                onClick={() => handleResponse(false)}
                disabled={saving}
              >
                <span className="btn-icon">✅</span>
                لم أدخن
              </button>
              
              <button 
                className="response-btn smoked"
                onClick={() => handleResponse(true)}
                disabled={saving}
              >
                <span className="btn-icon">🚬</span>
                دخنت
              </button>
            </div>
          </div>
        </div>

        <div className="popup-footer">
          {currentStep > 0 && (
            <button 
              className="back-btn"
              onClick={goBack}
              disabled={saving}
            >
              رجوع
            </button>
          )}
          
          <button 
            className="skip-btn"
            onClick={skipRemaining}
            disabled={saving}
          >
            تخطي الباقي (اعتبار الكل بدون تدخين)
          </button>
          
          <button 
            className="close-btn"
            onClick={onClose}
            disabled={saving}
          >
            إغلاق
          </button>
        </div>

        {saving && (
          <div className="saving-overlay">
            <div className="loading-spinner"></div>
            <p>جارٍ حفظ البيانات...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .missing-days-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          backdrop-filter: blur(5px);
        }

        .missing-days-popup {
          background: white;
          border-radius: 20px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .popup-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .popup-header h3 {
          color: #333;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .popup-header p {
          color: #666;
          margin-bottom: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(45deg, #4CAF50, #8BC34A);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.9rem;
          color: #666;
        }

        .popup-body {
          margin-bottom: 30px;
        }

        .day-question {
          text-align: center;
        }

        .day-question h4 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1.3rem;
        }

        .question {
          font-size: 1.1rem;
          color: #555;
          margin-bottom: 25px;
        }

        .response-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .response-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 30px;
          border: none;
          border-radius: 15px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .response-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .response-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .no-smoke {
          background: linear-gradient(45deg, #4CAF50, #8BC34A);
          color: white;
        }

        .smoked {
          background: linear-gradient(45deg, #f44336, #e57373);
          color: white;
        }

        .btn-icon {
          font-size: 1.5rem;
        }

        .popup-footer {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .back-btn, .skip-btn, .close-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .back-btn {
          background: #f0f0f0;
          color: #333;
        }

        .skip-btn {
          background: #ff9800;
          color: white;
        }

        .close-btn {
          background: #666;
          color: white;
        }

        .back-btn:hover, .skip-btn:hover, .close-btn:hover {
          opacity: 0.8;
        }

        .loading-content, .saving-overlay {
          text-align: center;
          padding: 40px;
        }

        .saving-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .missing-days-popup {
            padding: 20px;
            width: 95%;
          }

          .response-buttons {
            flex-direction: column;
          }

          .response-btn {
            min-width: auto;
            width: 100%;
          }

          .popup-footer {
            flex-direction: column;
          }

          .back-btn, .skip-btn, .close-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default MissingDaysPopup;