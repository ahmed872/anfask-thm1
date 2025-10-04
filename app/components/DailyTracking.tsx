"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import MissingDaysForm from './MissingDaysForm';

interface DailyRecord {
  date: string; // YYYY-MM-DD
  smoked: boolean;
  recordedAt: string; // timestamp when recorded
  recordedManually?: boolean; // true if filled later, false if recorded on the day
}

interface DailyTrackingProps {
  username: string;
  userCreatedAt: string; // تاريخ إنشاء الحساب
}

const DailyTracking: React.FC<DailyTrackingProps> = ({ username, userCreatedAt }) => {
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMissingDaysForm, setShowMissingDaysForm] = useState(false);
  const [missingDays, setMissingDays] = useState<string[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [showMissingDaysAlert, setShowMissingDaysAlert] = useState(false);

  useEffect(() => {
    loadDailyRecords();
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Object.keys(dailyRecords).length > 0) {
      findMissingDays();
    }
  }, [dailyRecords, userCreatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDailyRecords = async () => {
    try {
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const records = userData.dailyRecords || {};
        setDailyRecords(records);
      }
    } catch (error) {
      console.error('Error loading daily records:', error);
    } finally {
      setLoading(false);
    }
  };

  const findMissingDays = () => {
    const startDate = new Date(userCreatedAt);
    const today = new Date();
    const missing: string[] = [];

    // التحقق من كل يوم منذ إنشاء الحساب
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!dailyRecords[dateStr]) {
        missing.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setMissingDays(missing);
    
    // إظهار تنبيه إذا كان هناك أيام مفقودة كثيرة (أكثر من 7 أيام)
    if (missing.length > 7 && !showMissingDaysAlert) {
      setShowMissingDaysAlert(true);
      setTimeout(() => {
        setShowMissingDaysForm(true);
      }, 1000);
    }
  };

  const saveDailyRecord = async (date: string, smoked: boolean, isManual = false) => {
    try {
      const newRecord: DailyRecord = {
        date,
        smoked,
        recordedAt: new Date().toISOString(),
        recordedManually: isManual
      };

      const updatedRecords = {
        ...dailyRecords,
        [date]: newRecord
      };

      const userRef = doc(db, 'users', username);
      await updateDoc(userRef, {
        dailyRecords: updatedRecords
      });

      setDailyRecords(updatedRecords);
      
      // تحديث daysWithoutSmoking إذا كان هذا هو اليوم الحالي
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        await updateConsecutiveDays(updatedRecords);
      }

    } catch (error) {
      console.error('Error saving daily record:', error);
      alert('حدث خطأ في حفظ البيانات');
    }
  };

  const updateConsecutiveDays = async (records: Record<string, DailyRecord>) => {
    // حساب الأيام المتتالية بدون تدخين من النهاية
    const today = new Date();
    let consecutiveDays = 0;
    
    const currentDate = new Date(today);
    while (currentDate >= new Date(userCreatedAt)) {
      const dateStr = currentDate.toISOString().split('T')[0];
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

  const handleBulkSave = async (selectedDates: string[], smoked: boolean) => {
    for (const date of selectedDates) {
      await saveDailyRecord(date, smoked, true);
    }
    setSelectedDays(new Set());
    setBulkEditMode(false);
    findMissingDays();
  };

  const handleMissingDaysFormSave = async (records: Record<string, boolean>) => {
    for (const [date, smoked] of Object.entries(records)) {
      await saveDailyRecord(date, smoked, true);
    }
    findMissingDays();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    
    // العثور على بداية الأسبوع (السبت = 0 في النظام العربي)
    // تحويل: الأحد = 0 في JS إلى السبت = 0 في النظام العربي
    const dayOfWeek = firstDay.getDay(); // 0 = أحد، 1 = اثنين، ..., 6 = سبت
    const daysFromSaturday = dayOfWeek === 0 ? 1 : dayOfWeek + 1; // كم يوم من السبت
    startDate.setDate(firstDay.getDate() - daysFromSaturday);
    
    const days = [];
    for (let i = 0; i < 42; i++) { // 6 أسابيع × 7 أيام
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isInRange = (date: Date) => {
    const startDate = new Date(userCreatedAt);
    const today = new Date();
    return date >= startDate && date <= today;
  };

  const days = getDaysInMonth(selectedMonth);
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  if (loading) {
    return (
      <div className="daily-tracking-loading">
        <div className="loading-spinner"></div>
        <p>جارٍ تحميل السجل اليومي...</p>
      </div>
    );
  }

  return (
    <div className="daily-tracking">
      {/* تنبيه الأيام المفقودة */}
      {missingDays.length > 0 && (
        <div className="missing-days-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h4>يوجد {missingDays.length} يوم مفقود من سجلك!</h4>
            <p>لديك أيام لم يتم تسجيل حالة التدخين فيها منذ إنشاء حسابك</p>
            <button 
              className="alert-action-btn"
              onClick={() => setShowMissingDaysForm(true)}
            >
              املأ البيانات المفقودة الآن
            </button>
          </div>
        </div>
      )}

      <div className="tracking-header">
        <h3>سجل التدخين اليومي</h3>
        <div className="header-actions">
          {missingDays.length > 0 && (
            <button 
              className="missing-days-btn"
              onClick={() => setShowMissingDaysForm(true)}
            >
              استكمال الأيام المفقودة ({missingDays.length})
            </button>
          )}
          <button 
            className={`bulk-edit-btn ${bulkEditMode ? 'active' : ''}`}
            onClick={() => {
              setBulkEditMode(!bulkEditMode);
              setSelectedDays(new Set());
            }}
          >
            {bulkEditMode ? 'إلغاء التحديد المتعدد' : 'تحديد متعدد'}
          </button>
        </div>
      </div>

      <div className="month-navigation">
        <button onClick={() => setSelectedMonth(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(newDate.getMonth() - 1);
          return newDate;
        })}>
          ‹
        </button>
        <h4>{monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}</h4>
        <button onClick={() => setSelectedMonth(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(newDate.getMonth() + 1);
          return newDate;
        })}>
          ›
        </button>
      </div>

      <div className="weekdays">
        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          const dateStr = formatDate(day);
          const record = dailyRecords[dateStr];
          const isInDateRange = isInRange(day);
          const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
          const isToday = formatDate(day) === formatDate(new Date());
          const isMissing = missingDays.includes(dateStr);
          const isSelected = selectedDays.has(dateStr);

          return (
            <div
              key={index}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${!isInDateRange ? 'out-of-range' : ''} ${isToday ? 'today' : ''} ${isMissing ? 'missing' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                if (!isInDateRange) return;
                
                if (bulkEditMode) {
                  const newSelected = new Set(selectedDays);
                  if (newSelected.has(dateStr)) {
                    newSelected.delete(dateStr);
                  } else {
                    newSelected.add(dateStr);
                  }
                  setSelectedDays(newSelected);
                } else if (!record && isCurrentMonth) {
                  // السماح بالتسجيل للأيام المفقودة فقط
                  const smoked = confirm(`هل دخنت في يوم ${day.getDate()}؟`);
                  saveDailyRecord(dateStr, smoked, true);
                }
              }}
            >
              <div className="day-number">{day.getDate()}</div>
              {record && (
                <div className={`smoking-status ${record.smoked ? 'smoked' : 'no-smoke'}`}>
                  {record.smoked ? '🚬' : '✅'}
                  {record.recordedManually && <span className="manual-icon">📝</span>}
                </div>
              )}
              {isMissing && isCurrentMonth && (
                <div className="missing-indicator">؟</div>
              )}
            </div>
          );
        })}
      </div>

      {bulkEditMode && selectedDays.size > 0 && (
        <div className="bulk-actions">
          <p>تم تحديد {selectedDays.size} يوم</p>
          <div className="bulk-buttons">
            <button 
              className="bulk-no-smoke"
              onClick={() => handleBulkSave(Array.from(selectedDays), false)}
            >
              لم أدخن في هذه الأيام ✅
            </button>
            <button 
              className="bulk-smoked"
              onClick={() => handleBulkSave(Array.from(selectedDays), true)}
            >
              دخنت في هذه الأيام 🚬
            </button>
          </div>
        </div>
      )}

      {/* نموذج الأيام المفقودة */}
      {showMissingDaysForm && (
        <div className="modal-overlay" onClick={() => setShowMissingDaysForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>استكمال الأيام المفقودة</h4>
              <button onClick={() => setShowMissingDaysForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>لديك {missingDays.length} يوم غير مسجل منذ إنشاء الحساب.</p>
              <p>هذا سيؤثر على دقة حساب الأيام المتتالية بدون تدخين.</p>
              <div className="missing-days-actions">
                <button 
                  onClick={() => {
                    setBulkEditMode(true);
                    setSelectedDays(new Set(missingDays));
                    setShowMissingDaysForm(false);
                  }}
                  className="select-all-missing"
                >
                  تحديد جميع الأيام المفقودة
                </button>
                <button 
                  onClick={() => {
                    if (confirm('هل أنت متأكد من أنك لم تدخن في جميع الأيام المفقودة؟')) {
                      handleBulkSave(missingDays, false);
                      setShowMissingDaysForm(false);
                    }
                  }}
                  className="mark-all-no-smoke"
                >
                  لم أدخن في أي يوم من هذه الأيام
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .daily-tracking {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-top: 20px;
        }

        .tracking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tracking-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .missing-days-btn {
          background: #ff9800;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.3s ease;
        }

        .missing-days-btn:hover {
          background: #f57c00;
        }

        .bulk-edit-btn {
          background: #2196f3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.3s ease;
        }

        .bulk-edit-btn:hover {
          background: #1976d2;
        }

        .bulk-edit-btn.active {
          background: #1976d2;
        }

        .month-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .month-navigation button {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .month-navigation h4 {
          margin: 0;
          color: #333;
          font-size: 1.3rem;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 10px;
        }

        .weekday {
          padding: 8px;
          text-align: center;
          font-weight: bold;
          color: #666;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .calendar-day {
          aspect-ratio: 1;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          min-height: 60px;
        }

        .calendar-day:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .calendar-day.other-month {
          opacity: 0.3;
        }

        .calendar-day.out-of-range {
          opacity: 0.1;
          cursor: not-allowed;
        }

        .calendar-day.today {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .calendar-day.missing {
          border-color: #ff9800;
          background: #fff3e0;
        }

        .calendar-day.selected {
          border-color: #2196f3;
          background: #e3f2fd;
        }

        .day-number {
          font-weight: bold;
          color: #333;
          font-size: 0.9rem;
        }

        .smoking-status {
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .smoking-status.smoked {
          color: #f44336;
        }

        .smoking-status.no-smoke {
          color: #4caf50;
        }

        .manual-icon {
          font-size: 0.7rem;
          opacity: 0.7;
        }

        .missing-indicator {
          font-size: 1.5rem;
          color: #ff9800;
          font-weight: bold;
        }

        .bulk-actions {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
        }

        .bulk-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .bulk-no-smoke {
          background: #4caf50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }

        .bulk-smoked {
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 25px;
          max-width: 500px;
          width: 90%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h4 {
          margin: 0;
          color: #333;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-body p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 15px;
        }

        .missing-days-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .select-all-missing, .mark-all-no-smoke {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.3s ease;
        }

        .select-all-missing {
          background: #2196f3;
          color: white;
        }

        .mark-all-no-smoke {
          background: #4caf50;
          color: white;
        }

        .daily-tracking-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          padding: 40px;
          color: #666;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .daily-tracking {
          padding: 0;
        }

        .missing-days-alert {
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
          color: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .alert-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .alert-content {
          flex: 1;
        }

        .alert-content h4 {
          margin: 0 0 8px 0;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .alert-content p {
          margin: 0 0 15px 0;
          opacity: 0.9;
          line-height: 1.4;
        }

        .alert-action-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }

        .alert-action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .calendar-day {
            min-height: 50px;
            padding: 4px;
          }

          .day-number {
            font-size: 0.8rem;
          }

          .smoking-status {
            font-size: 1rem;
          }

          .bulk-buttons {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
            justify-content: center;
          }

          .missing-days-alert {
            padding: 15px;
            flex-direction: column;
            text-align: center;
          }

          .alert-icon {
            font-size: 1.5rem;
          }

          .alert-content h4 {
            font-size: 1.1rem;
          }
        }
      `}</style>

      {/* نموذج استكمال الأيام المفقودة */}
      {showMissingDaysForm && missingDays.length > 0 && (
        <MissingDaysForm
          missingDays={missingDays}
          username={username}
          onSave={handleMissingDaysFormSave}
          onClose={() => setShowMissingDaysForm(false)}
        />
      )}
    </div>
  );
};

export default DailyTracking;