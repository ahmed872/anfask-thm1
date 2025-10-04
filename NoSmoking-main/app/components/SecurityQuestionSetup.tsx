"use client";
import React, { useState } from 'react';
import { saveSecurityQuestion } from '../../lib/migrationService';

interface SecurityQuestionSetupProps {
  username: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const SecurityQuestionSetup: React.FC<SecurityQuestionSetupProps> = ({
  username,
  onComplete,
  onSkip
}) => {
  const [favoriteColor, setFavoriteColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!favoriteColor.trim()) {
      setError('يرجى إدخال لونك المفضل');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await saveSecurityQuestion(username, favoriteColor.trim());
      onComplete();
    } catch (err) {
      console.error('Error saving security question:', err);
      setError('حدث خطأ في حفظ السؤال الأمني');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="security-setup-overlay">
      <div className="security-setup-modal">
        <div className="modal-header">
          <div className="security-icon">🔐</div>
          <h2>إعداد السؤال الأمني</h2>
          <p>لحماية حسابك وإمكانية استرجاع كلمة المرور</p>
        </div>

        <div className="modal-content">
          <div className="info-box">
            <div className="info-icon">💡</div>
            <div className="info-text">
              <h4>لماذا السؤال الأمني؟</h4>
              <p>سيساعدك في استرجاع حسابك إذا نسيت كلمة المرور</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="favoriteColor">ما هو لونك المفضل؟</label>
              <input
                type="text"
                id="favoriteColor"
                value={favoriteColor}
                onChange={(e) => setFavoriteColor(e.target.value)}
                placeholder="مثال: أزرق، أحمر، أخضر..."
                required
                disabled={isSubmitting}
              />
              <div className="field-icon">🎨</div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="warning-box">
              <div className="warning-icon">⚠️</div>
              <p><strong>مهم:</strong> تذكر إجابتك جيداً! ستحتاجها لاستعادة حسابك.</p>
            </div>

            <div className="button-group">
              <button
                type="submit"
                className="save-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    جارٍ الحفظ...
                  </>
                ) : (
                  'حفظ السؤال الأمني'
                )}
              </button>

              {onSkip && (
                <button
                  type="button"
                  className="skip-btn"
                  onClick={onSkip}
                  disabled={isSubmitting}
                >
                  تخطي الآن
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .security-setup-overlay {
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

        .security-setup-modal {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
          overflow: hidden;
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
          padding: 30px;
          text-align: center;
        }

        .security-icon {
          font-size: 3rem;
          margin-bottom: 15px;
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

        .modal-content {
          padding: 30px;
        }

        .info-box {
          display: flex;
          align-items: center;
          gap: 15px;
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #2196f3;
        }

        .info-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .info-text h4 {
          margin: 0 0 5px 0;
          color: #1976d2;
          font-size: 1rem;
        }

        .info-text p {
          margin: 0;
          color: #1565c0;
          font-size: 0.9rem;
        }

        .form-group {
          position: relative;
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #2c3e50;
          font-weight: bold;
          font-size: 1rem;
        }

        .form-group input {
          width: 100%;
          padding: 12px 45px 12px 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .field-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          color: #6c757d;
          margin-top: 14px;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 10px 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          border-left: 4px solid #f44336;
          font-size: 0.9rem;
        }

        .warning-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #ffc107;
        }

        .warning-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-box p {
          margin: 0;
          color: #856404;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .save-btn {
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

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
        }

        .skip-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .skip-btn:hover:not(:disabled) {
          background: #5a6268;
        }

        .skip-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .security-setup-modal {
            margin: 10px;
            max-width: none;
            width: calc(100% - 20px);
          }

          .modal-header, .modal-content {
            padding: 20px;
          }

          .security-icon {
            font-size: 2.5rem;
          }

          .modal-header h2 {
            font-size: 1.3rem;
          }

          .info-box {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default SecurityQuestionSetup;