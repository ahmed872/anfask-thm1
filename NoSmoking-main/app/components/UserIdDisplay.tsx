"use client";
import React, { useState, useEffect } from 'react';
import { getUserId } from '../../lib/surveyManager';

interface UserIdDisplayProps {
  username: string;
  showInModal?: boolean;
  title?: string;
}

const UserIdDisplay: React.FC<UserIdDisplayProps> = ({ 
  username, 
  showInModal = false, 
  title = "معرفك الفريد" 
}) => {
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        if (username) {
          const id = await getUserId(username);
          setUserId(id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        setUserId('غير متاح');
      } finally {
        setLoading(false);
      }
    };

    fetchUserId();
  }, [username]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // إعادة تعيين الحالة بعد ثانيتين
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback للمتصفحات القديمة
      const textArea = document.createElement('textarea');
      textArea.value = userId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="user-id-display loading">
        <div className="loading-spinner"></div>
        <span>جارٍ تحميل المعرف...</span>
      </div>
    );
  }

  return (
    <div className={`user-id-display ${showInModal ? 'modal-style' : 'inline-style'}`}>
      <div className="user-id-header">
        <h3>{title}</h3>
        {showInModal && (
          <p className="instruction-text">
            انسخ هذا الرقم وضعه في أول سؤال بالاستبيان
          </p>
        )}
      </div>
      
      <div className="user-id-container">
        <div className="user-id-box">
          <span className="user-id-number">{userId}</span>
        </div>
        <button 
          onClick={copyToClipboard}
          className={`copy-button ${copied ? 'copied' : ''}`}
          disabled={userId === 'غير متاح'}
        >
          {copied ? (
            <>
              <span className="checkmark">✓</span>
              تم النسخ
            </>
          ) : (
            <>
              <span className="copy-icon">📋</span>
              نسخ
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .user-id-display {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .user-id-display.modal-style {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          margin: 15px 0;
        }
        
        .user-id-display.inline-style {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        
        .user-id-header h3 {
          margin: 0 0 8px 0;
          color: #2c3e50;
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .instruction-text {
          margin: 0 0 15px 0;
          color: #6c757d;
          font-size: 0.9rem;
          background: #e3f2fd;
          padding: 10px;
          border-radius: 6px;
          border-left: 4px solid #2196f3;
        }
        
        .user-id-container {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
        }
        
        .user-id-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 1.5rem;
          font-weight: bold;
          letter-spacing: 1px;
          min-width: 100px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .copy-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }
        
        .copy-button:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }
        
        .copy-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .copy-button.copied {
          background: #17a2b8;
          animation: pulse 0.6s ease-in-out;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .copy-icon, .checkmark {
          font-size: 1rem;
        }
        
        .loading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px;
          color: #6c757d;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
          .user-id-container {
            flex-direction: column;
            gap: 8px;
          }
          
          .user-id-box {
            font-size: 1.3rem;
            padding: 10px 16px;
          }
          
          .copy-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default UserIdDisplay;