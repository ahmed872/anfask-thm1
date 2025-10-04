"use client";
import React, { useState } from 'react';

interface MissingDaysFormProps {
  missingDays: string[];
  onSave: (records: Record<string, boolean>) => void;
  onClose: () => void;
  username: string;
}

const MissingDaysForm: React.FC<MissingDaysFormProps> = ({
  missingDays,
  onSave,
  onClose,
  username
}) => {
  const [selectedRecords, setSelectedRecords] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const daysPerPage = 10;
  const totalPages = Math.ceil(missingDays.length / daysPerPage);
  const currentDays = missingDays.slice(currentPage * daysPerPage, (currentPage + 1) * daysPerPage);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDaySelection = (date: string, smoked: boolean) => {
    setSelectedRecords(prev => ({
      ...prev,
      [date]: smoked
    }));
  };

  const handleBulkSelection = (smoked: boolean) => {
    const newRecords: Record<string, boolean> = {};
    currentDays.forEach(date => {
      newRecords[date] = smoked;
    });
    setSelectedRecords(prev => ({
      ...prev,
      ...newRecords
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(selectedRecords);
      onClose();
    } catch (error) {
      console.error('Error saving records:', error);
      alert('حدث خطأ في حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const completedDays = Object.keys(selectedRecords).length;
  const progressPercentage = (completedDays / missingDays.length) * 100;

  return (
    <div className="missing-days-overlay">
      <div className="missing-days-modal">
        <div className="modal-header">
          <h2>🗓️ استكمال السجل اليومي</h2>
          <p>مرحباً {username}! يبدو أن لديك {missingDays.length} يوم لم يتم تسجيل حالة التدخين فيها</p>
          
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="progress-text">
            تم ملء {completedDays} من {missingDays.length} يوم ({Math.round(progressPercentage)}%)
          </p>
        </div>

        <div className="modal-content">
          <div className="bulk-actions">
            <h3>إجراءات سريعة للصفحة الحالية:</h3>
            <div className="bulk-buttons">
              <button 
                onClick={() => handleBulkSelection(false)}
                className="bulk-btn no-smoke"
              >
                ✅ لم أدخن في كل هذه الأيام
              </button>
              <button 
                onClick={() => handleBulkSelection(true)}
                className="bulk-btn smoked"
              >
                🚬 دخنت في كل هذه الأيام
              </button>
            </div>
          </div>

          <div className="days-list">
            <h3>
              الصفحة {currentPage + 1} من {totalPages} 
              ({currentDays.length} أيام)
            </h3>
            
            {currentDays.map(date => (
              <div key={date} className="day-item">
                <div className="day-info">
                  <div className="day-date">{formatDate(date)}</div>
                  <div className="day-date-short">{date}</div>
                </div>
                
                <div className="day-actions">
                  <button
                    onClick={() => handleDaySelection(date, false)}
                    className={`action-btn no-smoke ${selectedRecords[date] === false ? 'selected' : ''}`}
                  >
                    ✅ لم أدخن
                  </button>
                  <button
                    onClick={() => handleDaySelection(date, true)}
                    className={`action-btn smoked ${selectedRecords[date] === true ? 'selected' : ''}`}
                  >
                    🚬 دخنت
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="nav-btn"
            >
              ← السابق
            </button>
            
            <span className="page-info">
              {currentPage + 1} / {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="nav-btn"
            >
              التالي →
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            إلغاء
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading || completedDays === 0}
            className="save-btn"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                💾 حفظ {completedDays} يوم
              </>
            )}
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
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(5px);
        }

        .missing-days-modal {
          background: white;
          border-radius: 20px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          text-align: center;
        }

        .modal-header h2 {
          margin: 0 0 10px 0;
          font-size: 1.8rem;
        }

        .modal-header p {
          margin: 0 0 20px 0;
          opacity: 0.9;
          line-height: 1.5;
        }

        .progress-bar {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          height: 8px;
          margin: 15px 0 10px 0;
          overflow: hidden;
        }

        .progress-fill {
          background: #4CAF50;
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .progress-text {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .modal-content {
          flex: 1;
          padding: 25px;
          overflow-y: auto;
        }

        .bulk-actions {
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .bulk-actions h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .bulk-buttons {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .bulk-btn {
          flex: 1;
          min-width: 200px;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .bulk-btn.no-smoke {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
        }

        .bulk-btn.smoked {
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
          color: white;
        }

        .bulk-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .days-list h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.1rem;
          text-align: center;
        }

        .day-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          margin-bottom: 10px;
          transition: all 0.3s ease;
        }

        .day-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #ccc;
        }

        .day-info {
          flex: 1;
        }

        .day-date {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }

        .day-date-short {
          color: #666;
          font-size: 0.9rem;
        }

        .day-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          padding: 8px 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .action-btn.no-smoke.selected {
          background: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }

        .action-btn.smoked.selected {
          background: #f44336;
          color: white;
          border-color: #f44336;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .nav-btn {
          padding: 10px 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-btn:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #ccc;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-weight: bold;
          color: #333;
        }

        .modal-footer {
          padding: 20px 25px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 15px;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 12px 24px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cancel-btn:hover {
          background: #f5f5f5;
        }

        .save-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: bold;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .missing-days-modal {
            margin: 10px;
            max-width: none;
            width: calc(100% - 20px);
          }

          .modal-header {
            padding: 20px;
          }

          .modal-header h2 {
            font-size: 1.5rem;
          }

          .modal-content {
            padding: 20px;
          }

          .bulk-buttons {
            flex-direction: column;
          }

          .bulk-btn {
            min-width: unset;
          }

          .day-item {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .day-actions {
            width: 100%;
            justify-content: center;
          }

          .modal-footer {
            flex-direction: column;
          }

          .cancel-btn,
          .save-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default MissingDaysForm;