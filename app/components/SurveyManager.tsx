"use client";
import React, { useState, useEffect } from 'react';
import SurveyPopup from './SurveyPopup';
import SurveySidebarIcon from './SurveySidebarIcon';
import { checkSurveyStatus, markSurveyAsSent } from '../../lib/surveyManager';

interface SurveyManagerProps {
  username: string;
}

const SurveyManager: React.FC<SurveyManagerProps> = ({ username }) => {
  const [surveyStatus, setSurveyStatus] = useState({
    day14: { shouldShow: false, status: 'not_ready' as 'not_ready' | 'ready' | 'postponed' | 'mandatory' | 'completed' },
    day30: { shouldShow: false, status: 'not_ready' as 'not_ready' | 'ready' | 'postponed' | 'mandatory' | 'completed' }
  });
  
  const [activePopup, setActivePopup] = useState<'day14' | 'day30' | null>(null);
  const [showSidebarIcon, setShowSidebarIcon] = useState<'day14' | 'day30' | null>(null);

  // فحص حالة الاستبيانات كل دقيقة
  useEffect(() => {
    const checkSurveys = async () => {
      if (!username) return;
      
      try {
        const status = await checkSurveyStatus(username);
        setSurveyStatus(status);

        // تحديد أي استبيان يجب عرضه
        if (status.day14.shouldShow && status.day14.status !== 'postponed') {
          if (status.day14.status === 'ready' || status.day14.status === 'mandatory') {
            setActivePopup('day14');
            setShowSidebarIcon(null);
            // تسجيل أن الاستبيان تم إرساله
            await markSurveyAsSent(username, 'day14');
          }
        } else if (status.day30.shouldShow && status.day30.status !== 'postponed') {
          if (status.day30.status === 'ready' || status.day30.status === 'mandatory') {
            setActivePopup('day30');
            setShowSidebarIcon(null);
            // تسجيل أن الاستبيان تم إرساله
            await markSurveyAsSent(username, 'day30');
          }
        } else {
          // فحص الأيقونات الجانبية
          if (status.day14.shouldShow && status.day14.status === 'postponed') {
            setShowSidebarIcon('day14');
          } else if (status.day30.shouldShow && status.day30.status === 'postponed') {
            setShowSidebarIcon('day30');
          } else {
            setShowSidebarIcon(null);
          }
        }
      } catch (error) {
        console.error('Error checking survey status:', error);
      }
    };

    // فحص فوري
    checkSurveys();

    // فحص كل دقيقة
    const interval = setInterval(checkSurveys, 60000);

    return () => clearInterval(interval);
  }, [username]);

  const handlePopupClose = () => {
    setActivePopup(null);
  };

  const handleSidebarIconClick = () => {
    if (showSidebarIcon) {
      setActivePopup(showSidebarIcon);
      setShowSidebarIcon(null);
    }
  };

  return (
    <>
      {/* النوافذ المنبثقة */}
      {activePopup && (
        <SurveyPopup
          isOpen={true}
          onClose={handlePopupClose}
          surveyType={activePopup}
          username={username}
          isMandatory={surveyStatus[activePopup].status === 'mandatory'}
        />
      )}

      {/* الأيقونة الجانبية */}
      {showSidebarIcon && (
        <SurveySidebarIcon
          isVisible={true}
          onClick={handleSidebarIconClick}
          surveyType={showSidebarIcon}
        />
      )}
    </>
  );
};

export default SurveyManager;