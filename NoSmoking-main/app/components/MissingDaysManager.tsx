"use client";
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getMissingDays } from '../../lib/savingsManager';
import MissingDaysForm from './MissingDaysForm';

interface MissingDaysManagerProps {
  username: string;
  onComplete?: () => void;
}

const MissingDaysManager: React.FC<MissingDaysManagerProps> = ({
  username,
  onComplete
}) => {
  const [showForm, setShowForm] = useState(false);
  const [userData, setUserData] = useState<{
    registrationDate?: string;
    createdAt?: string;
    lastRecordedDate?: string;
    dailyRecords?: { [date: string]: any };
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkForMissingDays = async () => {
      if (!username) return;

      try {
        const userRef = doc(db, 'users', username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setIsChecking(false);
          return;
        }

        const data = userSnap.data();
        setUserData(data);

        // تحديد الأيام المفقودة
        const registrationDate = data.registrationDate || data.createdAt;
        const lastRecordedDate = data.lastRecordedDate || '';
        const dailyRecords = data.dailyRecords || {};

        const missingDays = getMissingDays(registrationDate, lastRecordedDate, dailyRecords);

        // إذا كان هناك أيام مفقودة، عرض النموذج
        if (missingDays.length > 0) {
          setShowForm(true);
        }
      } catch (error) {
        console.error('Error checking for missing days:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkForMissingDays();
  }, [username]);

  const handleFormComplete = () => {
    setShowForm(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    // يمكن إضافة منطق لتأجيل التسجيل هنا
  };

  if (isChecking || !userData) {
    return null; // لا نعرض شيئاً أثناء التحقق
  }

  if (!showForm) {
    return null; // لا توجد أيام مفقودة
  }

  const registrationDate = userData.registrationDate || userData.createdAt;
  const lastRecordedDate = userData.lastRecordedDate || '';
  const dailyRecords = userData.dailyRecords || {};

  return (
    <MissingDaysForm
      username={username}
      registrationDate={registrationDate}
      lastRecordedDate={lastRecordedDate}
      dailyRecords={dailyRecords}
      onComplete={handleFormComplete}
      onCancel={handleFormCancel}
    />
  );
};

export default MissingDaysManager;