"use client";
import React, { useState, useEffect } from 'react';
import { getMissingDays, updateMultipleDays, DailyRecord } from '../../lib/savingsManager';

interface MissingDaysFormProps {
  username: string;
  registrationDate: string;
  lastRecordedDate: string;
  dailyRecords: { [date: string]: DailyRecord };
  onComplete: () => void;
  onCancel: () => void;
}

const MissingDaysForm: React.FC<MissingDaysFormProps> = ({
  username,
  registrationDate,
  lastRecordedDate,
  dailyRecords,
  onComplete,
  onCancel
}) => {
  const [missingDays, setMissingDays] = useState<string[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [responses, setResponses] = useState<{ [date: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // تحديد الأيام المفقودة
    const missing = getMissingDays(registrationDate, lastRecordedDate, dailyRecords);
    setMissingDays(missing);
    setIsLoading(false);
  }, [registrationDate, lastRecordedDate, dailyRecords]);

  const handleResponse = (smoked: boolean) => {
    const currentDate = missingDays[currentDayIndex];
    setResponses(prev => ({ ...prev, [currentDate]: smoked }));
    
    if (currentDayIndex < missingDays.length - 1) {
      setCurrentDayIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const records = missingDays.map(date => ({
        date,
        smoked: responses[date] || false
      }));
      
      await updateMultipleDays(username, records);
      onComplete();
    } catch (error) {
      console.error('Error submitting missing days:', error);
      alert('حدث خطأ في حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (): number => {
    if (missingDays.length === 0) return 100;
    return ((currentDayIndex + 1) / missingDays.length) * 100;
  };

  const isComplete = currentDayIndex >= missingDays.length - 1 && 
                   missingDays.every(date => responses.hasOwnProperty(date));

  if (isLoading) {
    return (
      <div className="missing-days-overlay">
        <div className="missing-days-modal">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>جارٍ تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (missingDays.length === 0) {
    // لا توجد أيام مفقودة
    onComplete();
    return null;
  }

  const currentDate = missingDays[currentDayIndex];

  return (
    <div className="missing-days-overlay">
      <div className="missing-days-modal">
        <div className="modal-header">
          <h2>استكمال السجل اليومي</h2>
          <p>لديك {missingDays.length} أيام غير مسجلة. يرجى تسجيل كل يوم على حدة.</p>
        </div>

        {/* شريط التقدم */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {currentDayIndex + 1} من {missingDays.length}
          </div>
        </div>

        {/* السؤال الحالي */}
        <div className="question-container">
          <div className="date-display">
            <div className="date-icon">📅</div>
            <div className="date-text">
              <h3>{formatDate(currentDate)}</h3>
              <p className="date-subtitle">{currentDate}</p>
            </div>
          </div>

          <div className="question">
            <h4>هل دخنت في هذا اليوم؟</h4>
          </div>

          <div className="answer-buttons">
            <button
              className={`answer-btn yes-btn ${responses[currentDate] === true ? 'selected' : ''}`}
              onClick={() => handleResponse(true)}
            >
              <span className="btn-icon">🚬</span>
              نعم، دخنت
            </button>
            <button
              className={`answer-btn no-btn ${responses[currentDate] === false ? 'selected' : ''}`}
              onClick={() => handleResponse(false)}
            >
              <span className="btn-icon">✅</span>
              لا، لم أدخن
            </button>
          </div>
        </div>

        {/* أزرار التنقل */}
        <div className="navigation-buttons">
          <button
            className="nav-btn prev-btn"
            onClick={handlePrevious}
            disabled={currentDayIndex === 0}
          >
            السابق
          </button>

          {isComplete ? (
            <button
              className="nav-btn submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner small"></div>
                  جارٍ الحفظ...
                </>
              ) : (
                'حفظ جميع البيانات'
              )}
            </button>
          ) : (
            <button
              className="nav-btn next-btn"
              onClick={() => setCurrentDayIndex(prev => prev + 1)}
              disabled={!responses.hasOwnProperty(currentDate)}
            >
              التالي
            </button>
          )}
        </div>

        {/* زر الإلغاء */}
        <div className="cancel-container">
          <button className="cancel-btn" onClick={onCancel}>
            تسجيل لاحقاً
          </button>
        </div>
      </div>

      <style jsx>{`
        .missing-days-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(5px);
        }

        .missing-days-modal {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 16px 16px 0 0;
          text-align: center;
        }

        .modal-header h2 {
          margin: 0 0 10px 0;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .modal-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
        }

        .progress-container {
          padding: 20px 25px 10px;
        }

        .progress-bar {
          background: #e9ecef;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          background: linear-gradient(90deg, #28a745, #20c997);
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .progress-text {
          text-align: center;
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .question-container {
          padding: 15px 25px 25px;
        }

        .date-display {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 4px solid #007bff;
        }

        .date-icon {
          font-size: 2rem;
        }

        .date-text h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 1.2rem;
        }

        .date-subtitle {
          margin: 0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .question {
          text-align: center;
          margin-bottom: 20px;
        }

        .question h4 {
          margin: 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .answer-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .answer-btn {
          flex: 1;
          padding: 15px 20px;
          border: 2px solid #dee2e6;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: bold;
        }

        .answer-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .yes-btn {
          color: #dc3545;
          border-color: #dc3545;
        }

        .yes-btn.selected {
          background: #dc3545;
          color: white;
        }

        .no-btn {
          color: #28a745;
          border-color: #28a745;
        }

        .no-btn.selected {
          background: #28a745;
          color: white;
        }

        .btn-icon {
          font-size: 1.5rem;
        }

        .navigation-buttons {
          padding: 0 25px 20px;
          display: flex;
          gap: 15px;
        }

        .nav-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .prev-btn {
          background: #6c757d;
          color: white;
        }

        .next-btn {
          background: #007bff;
          color: white;
        }

        .submit-btn {
          background: #28a745;
          color: white;
        }

        .nav-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .nav-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .cancel-container {
          padding: 0 25px 25px;
          text-align: center;
        }

        .cancel-btn {
          background: none;
          border: none;
          color: #6c757d;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
        }

        .cancel-btn:hover {
          color: #495057;
        }

        .loading-container {
          padding: 40px;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .loading-spinner.small {
          width: 20px;
          height: 20px;
          border-width: 2px;
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .missing-days-modal {
            margin: 10px;
            max-width: none;
            width: calc(100% - 20px);
          }

          .answer-buttons {
            flex-direction: column;
          }

          .navigation-buttons {
            flex-direction: column;
          }

          .modal-header {
            padding: 20px;
          }

          .modal-header h2 {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MissingDaysForm;