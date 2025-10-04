"use client";
import React, { useState } from 'react';
import UserIdDisplay from './UserIdDisplay';
import { SURVEY_LINKS, postponeSurvey, markSurveyAsCompleted } from '../../lib/surveyManager';

interface SurveyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  surveyType: 'day14' | 'day30';
  username: string;
  isMandatory?: boolean; // إجباري أم لا
}

const SurveyPopup: React.FC<SurveyPopupProps> = ({
  isOpen,
  onClose,
  surveyType,
  username,
  isMandatory = false
}) => {
  const [loading, setLoading] = useState(false);

  const surveyTitle = surveyType === 'day14' ? 'استبيان الأسبوعين' : 'استبيان الشهر';
  const surveyLink = SURVEY_LINKS[surveyType];

  const handlePostpone = async () => {
    if (isMandatory) return; // لا يمكن التأجيل في الوضع الإجباري
    
    setLoading(true);
    try {
      await postponeSurvey(username, surveyType);
      onClose();
    } catch (error) {
      console.error('Error postponing survey:', error);
      alert('حدث خطأ في تأجيل الاستبيان');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSurvey = () => {
    // فتح الاستبيان في نافذة جديدة
    window.open(surveyLink, '_blank');
    
    // تسجيل أن المستخدم فتح الاستبيان
    markSurveyAsCompleted(username, surveyType).catch(console.error);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="survey-popup-overlay">
      <div className="survey-popup">
        <div className="survey-popup-header">
          <h2>{surveyTitle}</h2>
          {!isMandatory && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <div className="survey-popup-content">
          {isMandatory && (
            <div className="mandatory-notice">
              <span className="warning-icon">⚠️</span>
              <p><strong>هذا الاستبيان مطلوب الآن!</strong></p>
              <p>لقد تم تأجيله لأكثر من 24 ساعة، يرجى إكماله الآن.</p>
            </div>
          )}

          <div className="survey-description">
            <p>
              {surveyType === 'day14' 
                ? 'لقد مر أسبوعان على انضمامك لبرنامج الإقلاع عن التدخين. نود معرفة تقدمك!' 
                : 'تهانينا! لقد مر شهر كامل على انضمامك. شاركنا تجربتك وتقدمك.'
              }
            </p>
          </div>

          <UserIdDisplay 
            username={username} 
            showInModal={true}
            title="معرفك الفريد للاستبيان"
          />

          <div className="survey-instructions">
            <div className="instruction-box">
              <h4>التعليمات:</h4>
              <ol>
                <li>انسخ معرفك الفريد أعلاه</li>
                <li>اضغط على "فتح الاستبيان"</li>
                <li>ضع المعرف في أول سؤال بالاستبيان</li>
                <li>أكمل جميع الأسئلة</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="survey-popup-footer">
          <button 
            className="primary-button"
            onClick={handleOpenSurvey}
          >
            <span className="button-icon">📝</span>
            فتح الاستبيان
          </button>

          {!isMandatory && (
            <button 
              className="secondary-button"
              onClick={handlePostpone}
              disabled={loading}
            >
              {loading ? 'جارٍ التأجيل...' : 'ذكرني لاحقاً'}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .survey-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(5px);
        }

        .survey-popup {
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

        .survey-popup-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 16px 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .survey-popup-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.3s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .survey-popup-content {
          padding: 25px;
        }

        .mandatory-notice {
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
        }

        .mandatory-notice .warning-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 10px;
        }

        .mandatory-notice p {
          margin: 5px 0;
          color: #856404;
        }

        .survey-description {
          text-align: center;
          margin-bottom: 20px;
          color: #495057;
          line-height: 1.6;
        }

        .survey-instructions {
          margin: 20px 0;
        }

        .instruction-box {
          background: #f8f9fa;
          border-left: 4px solid #28a745;
          padding: 15px;
          border-radius: 0 8px 8px 0;
        }

        .instruction-box h4 {
          margin: 0 0 10px 0;
          color: #28a745;
          font-size: 1.1rem;
        }

        .instruction-box ol {
          margin: 0;
          padding-right: 20px;
          color: #495057;
        }

        .instruction-box li {
          margin-bottom: 5px;
          line-height: 1.5;
        }

        .survey-popup-footer {
          padding: 20px 25px;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        .primary-button {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          padding: 15px 25px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        .secondary-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .secondary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-icon {
          font-size: 1.2rem;
        }

        @media (max-width: 480px) {
          .survey-popup {
            margin: 10px;
            max-width: none;
            width: calc(100% - 20px);
          }

          .survey-popup-header {
            padding: 15px;
          }

          .survey-popup-header h2 {
            font-size: 1.3rem;
          }

          .survey-popup-content {
            padding: 20px;
          }

          .survey-popup-footer {
            padding: 15px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default SurveyPopup;