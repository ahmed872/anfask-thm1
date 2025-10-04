import { db } from './firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

export interface SurveyData {
  sent: boolean;
  sentDate?: string;
  completed: boolean;
  completedDate?: string;
  completedBy?: string;
  reminderPostponed: boolean;
  postponedDate?: string;
  showingSidebarIcon: boolean;
  sidebarIconDate?: string;
  uniqueUserId: string;
}

export interface SurveyConfig {
  day14: SurveyData;
  day30: SurveyData;
}

// روابط الاستبيانات
export const SURVEY_LINKS = {
  day14: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=_LuGLASN_0GoOpQvB14PYMUUimJ4VXdDtL6JkBrJgQRUMTkzUlZGRDlIS1k3SzE2SFBUMkkxTTJWMy4u',
  day30: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=_LuGLASN_0GoOpQvB14PYMUUimJ4VXdDtL6JkBrJgQRUM1VHOVcwVjM3RUNJWlcyTVlIWDlWMkJLTC4u'
};

// إنشاء معرف فريد جديد بصيغة بسيطة
export async function generateNewUserId(): Promise<string> {
  try {
    // البحث عن أعلى رقم معرف موجود
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let maxId = 2000; // البداية من 2001
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.uniqueUserId && typeof userData.uniqueUserId === 'string') {
        const numericId = parseInt(userData.uniqueUserId);
        if (!isNaN(numericId) && numericId > maxId) {
          maxId = numericId;
        }
      }
    });
    
    return (maxId + 1).toString();
  } catch (error) {
    console.error('Error generating user ID:', error);
    // في حالة الخطأ، نرجع رقم عشوائي بدءًا من 2001
    return (2001 + Math.floor(Math.random() * 1000)).toString();
  }
}

// تحديث معرف المستخدم القديم إلى النظام الجديد
export async function updateUserIdToNewSystem(username: string): Promise<string> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    
    // التحقق من وجود معرف بسيط أم لا
    if (userData.uniqueUserId && /^\d+$/.test(userData.uniqueUserId)) {
      // المعرف بسيط بالفعل
      return userData.uniqueUserId;
    }
    
    // إنشاء معرف جديد
    const newUserId = await generateNewUserId();
    
    // تحديث بيانات المستخدم
    await updateDoc(userRef, {
      uniqueUserId: newUserId
    });
    
    // إذا كان لديه استبيانات، تحديث المعرف فيها أيضاً
    if (userData.surveys) {
      const surveys = userData.surveys;
      if (surveys.day14) {
        surveys.day14.uniqueUserId = newUserId;
      }
      if (surveys.day30) {
        surveys.day30.uniqueUserId = newUserId;
      }
      
      await updateDoc(userRef, {
        surveys: surveys
      });
    }
    
    return newUserId;
  } catch (error) {
    console.error('Error updating user ID:', error);
    throw error;
  }
}

// حساب الأيام منذ التسجيل
export function getDaysSinceRegistration(registrationDate: string): number {
  const regDate = new Date(registrationDate);
  const today = new Date();
  const diffTime = today.getTime() - regDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// التحقق من حالة الاستبيان
export async function checkSurveyStatus(username: string): Promise<{
  day14: { shouldShow: boolean; status: 'not_ready' | 'ready' | 'postponed' | 'mandatory' | 'completed' };
  day30: { shouldShow: boolean; status: 'not_ready' | 'ready' | 'postponed' | 'mandatory' | 'completed' };
}> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return {
        day14: { shouldShow: false, status: 'not_ready' },
        day30: { shouldShow: false, status: 'not_ready' }
      };
    }
    
    const userData = userSnap.data();
    const registrationDate = userData.registrationDate || userData.createdAt;
    const daysSinceReg = getDaysSinceRegistration(registrationDate);
    
    const surveys = userData.surveys || {};
    
    // فحص استبيان 14 يوم
    const day14Status = checkIndividualSurveyStatus(surveys.day14, daysSinceReg, 14);
    const day30Status = checkIndividualSurveyStatus(surveys.day30, daysSinceReg, 30);
    
    return {
      day14: day14Status,
      day30: day30Status
    };
  } catch (error) {
    console.error('Error checking survey status:', error);
    return {
      day14: { shouldShow: false, status: 'not_ready' },
      day30: { shouldShow: false, status: 'not_ready' }
    };
  }
}

function checkIndividualSurveyStatus(surveyData: SurveyData | undefined, daysSinceReg: number, targetDay: number) {
  if (daysSinceReg < targetDay) {
    return { shouldShow: false, status: 'not_ready' as const };
  }
  
  if (!surveyData) {
    return { shouldShow: true, status: 'ready' as const };
  }
  
  if (surveyData.completed) {
    return { shouldShow: false, status: 'completed' as const };
  }
  
  if (surveyData.reminderPostponed && surveyData.postponedDate) {
    const postponedTime = new Date(surveyData.postponedDate).getTime();
    const now = new Date().getTime();
    const hoursSincePostponed = (now - postponedTime) / (1000 * 60 * 60);
    
    if (hoursSincePostponed >= 24) {
      return { shouldShow: true, status: 'mandatory' as const };
    } else {
      return { shouldShow: surveyData.showingSidebarIcon, status: 'postponed' as const };
    }
  }
  
  return { shouldShow: true, status: 'ready' as const };
}

// إرسال الاستبيان (تسجيل أنه تم إرساله)
export async function markSurveyAsSent(username: string, surveyType: 'day14' | 'day30'): Promise<void> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const surveys = userData.surveys || {};
    const userId = userData.uniqueUserId || await updateUserIdToNewSystem(username);
    
    if (!surveys[surveyType]) {
      surveys[surveyType] = {
        sent: false,
        completed: false,
        reminderPostponed: false,
        showingSidebarIcon: false,
        uniqueUserId: userId
      };
    }
    
    surveys[surveyType].sent = true;
    surveys[surveyType].sentDate = new Date().toISOString();
    surveys[surveyType].uniqueUserId = userId;
    
    await updateDoc(userRef, { surveys });
  } catch (error) {
    console.error('Error marking survey as sent:', error);
    throw error;
  }
}

// تأجيل الاستبيان
export async function postponeSurvey(username: string, surveyType: 'day14' | 'day30'): Promise<void> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const surveys = userData.surveys || {};
    const userId = userData.uniqueUserId || await updateUserIdToNewSystem(username);
    
    if (!surveys[surveyType]) {
      surveys[surveyType] = {
        sent: false,
        completed: false,
        reminderPostponed: false,
        showingSidebarIcon: false,
        uniqueUserId: userId
      };
    }
    
    surveys[surveyType].reminderPostponed = true;
    surveys[surveyType].postponedDate = new Date().toISOString();
    surveys[surveyType].showingSidebarIcon = true;
    surveys[surveyType].sidebarIconDate = new Date().toISOString();
    
    await updateDoc(userRef, { surveys });
  } catch (error) {
    console.error('Error postponing survey:', error);
    throw error;
  }
}

// تسجيل إكمال الاستبيان
export async function markSurveyAsCompleted(username: string, surveyType: 'day14' | 'day30'): Promise<void> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const surveys = userData.surveys || {};
    
    if (!surveys[surveyType]) {
      surveys[surveyType] = {
        sent: false,
        completed: false,
        reminderPostponed: false,
        showingSidebarIcon: false,
        uniqueUserId: userData.uniqueUserId || await updateUserIdToNewSystem(username)
      };
    }
    
    surveys[surveyType].completed = true;
    surveys[surveyType].completedDate = new Date().toISOString();
    surveys[surveyType].completedBy = username;
    surveys[surveyType].showingSidebarIcon = false; // إخفاء الأيقونة الجانبية
    
    await updateDoc(userRef, { surveys });
  } catch (error) {
    console.error('Error marking survey as completed:', error);
    throw error;
  }
}

// الحصول على معرف المستخدم
export async function getUserId(username: string): Promise<string> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    
    if (userData.uniqueUserId && /^\d+$/.test(userData.uniqueUserId)) {
      return userData.uniqueUserId;
    }
    
    // إنشاء معرف جديد إذا لم يكن موجود أو قديم
    return await updateUserIdToNewSystem(username);
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
}