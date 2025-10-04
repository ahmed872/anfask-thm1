"use client";
import React from 'react';

interface DailyQuestionProps {
  onAnswer: (didSmoke: boolean) => void;
  isLoading: boolean;
  isMandatory?: boolean;
}

const DailyQuestion: React.FC<DailyQuestionProps> = ({ 
  onAnswer, 
  isLoading, 
  isMandatory = false 
}) => {
  return (
    <div className="daily-question-overlay">
      <div className="daily-question-modal">
        <div className="question-header">
          <div className="question-icon">📅</div>
          <h2>سؤال اليوم</h2>
          {isMandatory && (
            <div className="mandatory-badge">مطلوب</div>
          )}
        </div>

        <div className="question-content">
          <p className="question-text">
            هل دخنت اليوم؟
          </p>
          <p className="question-subtitle">
            هذا السؤال مهم لتتبع تقدمك الحقيقي في رحلة الإقلاع عن التدخين
          </p>
        </div>

        <div className="question-actions">
          <button
            onClick={() => onAnswer(false)}
            disabled={isLoading}
            className="answer-btn no-smoke"
          >
            <span className="btn-icon">✅</span>
            <span className="btn-text">لا، لم أدخن</span>
            {isLoading && <div className="btn-loading"></div>}
          </button>

          <button
            onClick={() => onAnswer(true)}
            disabled={isLoading}
            className="answer-btn smoked"
          >
            <span className="btn-icon">🚬</span>
            <span className="btn-text">نعم، دخنت</span>
            {isLoading && <div className="btn-loading"></div>}
          </button>
        </div>

        <div className="question-footer">
          <p>💡 كن صادقاً مع نفسك - هذا يساعدك على التحسن</p>
        </div>
      </div>

      <style jsx>{`
        .daily-question-overlay {
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

        .daily-question-modal {
          background: white;
          border-radius: 20px;
          max-width: 450px;
          width: 100%;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .question-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          text-align: center;
          position: relative;
        }

        .question-icon {
          font-size: 3rem;
          margin-bottom: 10px;
          display: block;
        }

        .question-header h2 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: bold;
        }

        .mandatory-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          background: #ff4444;
          color: white;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .question-content {
          padding: 30px 25px;
          text-align: center;
        }

        .question-text {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          margin: 0 0 10px 0;
        }

        .question-subtitle {
          color: #666;
          margin: 0;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .question-actions {
          padding: 0 25px 25px;
          display: flex;
          gap: 15px;
        }

        .answer-btn {
          flex: 1;
          border: none;
          border-radius: 12px;
          padding: 18px 20px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }

        .answer-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .no-smoke {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .no-smoke:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }

        .smoked {
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        }

        .smoked:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
        }

        .btn-icon {
          font-size: 1.5rem;
        }

        .btn-text {
          font-size: 1rem;
        }

        .btn-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .question-footer {
          background: #f8f9fa;
          padding: 15px 25px;
          text-align: center;
          border-top: 1px solid #e9ecef;
        }

        .question-footer p {
          margin: 0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        @media (max-width: 480px) {
          .daily-question-modal {
            margin: 10px;
            max-width: none;
            width: calc(100% - 20px);
          }

          .question-header {
            padding: 20px;
          }

          .question-icon {
            font-size: 2.5rem;
          }

          .question-header h2 {
            font-size: 1.5rem;
          }

          .question-content {
            padding: 25px 20px;
          }

          .question-text {
            font-size: 1.3rem;
          }

          .question-actions {
            padding: 0 20px 20px;
            flex-direction: column;
          }

          .answer-btn {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyQuestion;