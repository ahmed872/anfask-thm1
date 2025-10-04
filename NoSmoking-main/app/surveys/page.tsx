"use client";
import React, { useState, useEffect } from 'react';
import { checkSurveyStatus, getUserId, markSurveyAsCompleted } from '../../lib/surveyManager';
import UserIdDisplay from '../components/UserIdDisplay';
import SurveyPopup from '../components/SurveyPopup';

const SurveyManagementPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [surveyStatus, setSurveyStatus] = useState({
    day14: { shouldShow: false, status: 'not_ready' as 'not_ready' | 'ready' | 'postponed' | 'mandatory' | 'completed' },
    day30: { shouldShow: false, status: 'not_ready' as 'not_ready' | 'ready' | 'postponed' | 'mandatory' | 'completed' }
  });
  const [activePopup, setActivePopup] = useState<'day14' | 'day30' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب اسم المستخدم من localStorage
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('anfask-username') || '';
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    const loadSurveyStatus = async () => {
      if (!username) return;
      
      try {
        const status = await checkSurveyStatus(username);
        setSurveyStatus(status);
      } catch (error) {
        console.error('Error loading survey status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSurveyStatus();
  }, [username]);

  const handleOpenSurvey = (surveyType: 'day14' | 'day30') => {
    setActivePopup(surveyType);
  };

  const handleMarkAsCompleted = async (surveyType: 'day14' | 'day30') => {
    try {
      await markSurveyAsCompleted(username, surveyType);
      // إعادة تحميل الحالة
      const status = await checkSurveyStatus(username);
      setSurveyStatus(status);
      alert('تم تسجيل إكمال الاستبيان بنجاح!');
    } catch (error) {
      console.error('Error marking survey as completed:', error);
      alert('حدث خطأ في تسجيل إكمال الاستبيان');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p>جارٍ تحميل حالة الاستبيانات...</p>
      </div>
    );
  }

  if (!username) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>يرجى تسجيل الدخول أولاً</h2>
        <a href="/login" style={{ color: '#007bff' }}>تسجيل الدخول</a>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
        إدارة الاستبيانات
      </h1>

      {/* عرض المعرف الفريد */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <UserIdDisplay username={username} showInModal={false} />
      </div>

      {/* استبيان 14 يوم */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>
          📝 استبيان الأسبوعين (14 يوم)
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>الحالة: </strong>
          <span style={{ 
            color: getStatusColor(surveyStatus.day14.status),
            fontWeight: 'bold'
          }}>
            {getStatusText(surveyStatus.day14.status)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenSurvey('day14')}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            فتح الاستبيان
          </button>
          
          {surveyStatus.day14.status !== 'completed' && (
            <button
              onClick={() => handleMarkAsCompleted('day14')}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              تسجيل كمكتمل
            </button>
          )}
        </div>
      </div>

      {/* استبيان 30 يوم */}
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>
          📊 استبيان الشهر (30 يوم)
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>الحالة: </strong>
          <span style={{ 
            color: getStatusColor(surveyStatus.day30.status),
            fontWeight: 'bold'
          }}>
            {getStatusText(surveyStatus.day30.status)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenSurvey('day30')}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            فتح الاستبيان
          </button>
          
          {surveyStatus.day30.status !== 'completed' && (
            <button
              onClick={() => handleMarkAsCompleted('day30')}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              تسجيل كمكتمل
            </button>
          )}
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      {activePopup && (
        <SurveyPopup
          isOpen={true}
          onClose={() => setActivePopup(null)}
          surveyType={activePopup}
          username={username}
          isMandatory={false}
        />
      )}

      {/* العودة للوحة التحكم */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a 
          href="/dashboard" 
          style={{ 
            color: '#007bff', 
            textDecoration: 'none',
            fontSize: '1.1rem'
          }}
        >
          ← العودة للوحة التحكم
        </a>
      </div>

      <style jsx>{`
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 600px) {
          div[style*="max-width: 800px"] {
            padding: 15px !important;
          }
          
          div[style*="display: flex"] {
            flex-direction: column;
          }
          
          button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// دوال مساعدة
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#28a745';
    case 'ready': return '#007bff';
    case 'mandatory': return '#dc3545';
    case 'postponed': return '#ffc107';
    default: return '#6c757d';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'not_ready': return 'غير مستحق بعد';
    case 'ready': return 'جاهز للإجابة';
    case 'postponed': return 'مؤجل';
    case 'mandatory': return 'مطلوب إجباري';
    case 'completed': return 'مكتمل';
    default: return 'غير معروف';
  }
}

export default SurveyManagementPage;