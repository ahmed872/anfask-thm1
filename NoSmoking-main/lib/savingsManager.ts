import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  smoked: boolean;
  recorded: boolean; // هل تم تسجيل هذا اليوم؟
  timestamp: string; // متى تم التسجيل
}

export interface SavingsData {
  totalDaysWithoutSmoking: number; // إجمالي الأيام بدون تدخين (تراكمي)
  consecutiveDaysWithoutSmoking: number; // الأيام المتتالية الحالية
  totalCigarettesAvoided: number; // إجمالي السجائر المتجنبة
  totalMoneySaved: number; // إجمالي المال الموفر
  lastRecordedDate: string; // آخر يوم تم تسجيله
  dailyRecords: { [date: string]: DailyRecord }; // سجل الأيام
}

// حساب الأيام بين تاريخين
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// الحصول على تاريخ اليوم
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// حساب المدخرات بناءً على البيانات المسجلة
export function calculateSavings(
  dailyRecords: { [date: string]: DailyRecord },
  dailyCigarettes: number,
  cigarettePrice: number
): SavingsData {
  let totalDaysWithoutSmoking = 0;
  let consecutiveDaysWithoutSmoking = 0;
  let totalCigarettesAvoided = 0;
  let lastRecordedDate = '';
  
  // ترتيب التواريخ
  const sortedDates = Object.keys(dailyRecords).sort();
  
  // حساب التراكمي والمتتالي
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const date = sortedDates[i];
    const record = dailyRecords[date];
    
    if (record.recorded) {
      if (lastRecordedDate === '') {
        lastRecordedDate = date;
      }
      
      if (!record.smoked) {
        totalDaysWithoutSmoking++;
        totalCigarettesAvoided += dailyCigarettes;
        
        // حساب الأيام المتتالية (من آخر يوم مسجل)
        if (i === sortedDates.length - 1) {
          consecutiveDaysWithoutSmoking++;
        } else {
          const nextDate = sortedDates[i + 1];
          const nextRecord = dailyRecords[nextDate];
          if (nextRecord && !nextRecord.smoked) {
            consecutiveDaysWithoutSmoking++;
          } else {
            break; // انكسار السلسلة
          }
        }
      } else {
        // إذا دخن في يوم، تنكسر السلسلة المتتالية
        break;
      }
    } else {
      // اليوم غير مسجل = يعتبر بدون تدخين
      totalDaysWithoutSmoking++;
      totalCigarettesAvoided += dailyCigarettes;
      consecutiveDaysWithoutSmoking++;
    }
  }
  
  const totalMoneySaved = totalCigarettesAvoided * cigarettePrice;
  
  return {
    totalDaysWithoutSmoking,
    consecutiveDaysWithoutSmoking,
    totalCigarettesAvoided,
    totalMoneySaved,
    lastRecordedDate,
    dailyRecords
  };
}

// الحصول على الأيام المفقودة
export function getMissingDays(
  registrationDate: string,
  lastRecordedDate: string,
  dailyRecords: { [date: string]: DailyRecord }
): string[] {
  const today = getTodayDate();
  const startDate = lastRecordedDate || registrationDate;
  
  // الحصول على جميع التواريخ من آخر يوم مسجل حتى اليوم
  const allDates = getDatesBetween(startDate, today);
  
  // فلترة الأيام غير المسجلة
  const missingDays = allDates.filter(date => {
    const record = dailyRecords[date];
    return !record || !record.recorded;
  });
  
  // إزالة اليوم الحالي إذا كان في القائمة (سيتم تسجيله عبر السؤال اليومي)
  return missingDays.filter(date => date !== today);
}

// تحديث سجل يوم معين
export async function updateDailyRecord(
  username: string,
  date: string,
  smoked: boolean
): Promise<void> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const dailyRecords = userData.dailyRecords || {};
    
    // تحديث السجل
    dailyRecords[date] = {
      date,
      smoked,
      recorded: true,
      timestamp: new Date().toISOString()
    };
    
    // حساب المدخرات الجديدة
    const savingsData = calculateSavings(
      dailyRecords,
      userData.dailyCigarettes || 20,
      userData.cigarettePrice || 1.5
    );
    
    // تحديث البيانات في Firebase
    await updateDoc(userRef, {
      dailyRecords,
      daysWithoutSmoking: savingsData.consecutiveDaysWithoutSmoking,
      totalDaysWithoutSmoking: savingsData.totalDaysWithoutSmoking,
      totalCigarettesAvoided: savingsData.totalCigarettesAvoided,
      totalMoneySaved: savingsData.totalMoneySaved,
      lastRecordedDate: date,
      todaySmoking: date === getTodayDate() ? smoked : userData.todaySmoking,
      lastCheckDate: getTodayDate()
    });
  } catch (error) {
    console.error('Error updating daily record:', error);
    throw error;
  }
}

// تحديث عدة أيام مرة واحدة
export async function updateMultipleDays(
  username: string,
  records: { date: string; smoked: boolean }[]
): Promise<void> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const dailyRecords = userData.dailyRecords || {};
    const timestamp = new Date().toISOString();
    
    // تحديث جميع السجلات
    records.forEach(record => {
      dailyRecords[record.date] = {
        date: record.date,
        smoked: record.smoked,
        recorded: true,
        timestamp
      };
    });
    
    // حساب المدخرات الجديدة
    const savingsData = calculateSavings(
      dailyRecords,
      userData.dailyCigarettes || 20,
      userData.cigarettePrice || 1.5
    );
    
    // آخر يوم تم تسجيله
    const lastRecordedDate = records.length > 0 
      ? records.sort((a, b) => a.date.localeCompare(b.date))[records.length - 1].date
      : userData.lastRecordedDate;
    
    // تحديث البيانات في Firebase
    await updateDoc(userRef, {
      dailyRecords,
      daysWithoutSmoking: savingsData.consecutiveDaysWithoutSmoking,
      totalDaysWithoutSmoking: savingsData.totalDaysWithoutSmoking,
      totalCigarettesAvoided: savingsData.totalCigarettesAvoided,
      totalMoneySaved: savingsData.totalMoneySaved,
      lastRecordedDate,
      lastCheckDate: getTodayDate()
    });
  } catch (error) {
    console.error('Error updating multiple days:', error);
    throw error;
  }
}

// الحصول على بيانات المدخرات للمستخدم
export async function getUserSavingsData(username: string): Promise<SavingsData | null> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const userData = userSnap.data();
    const dailyRecords = userData.dailyRecords || {};
    
    const savingsData = calculateSavings(
      dailyRecords,
      userData.dailyCigarettes || 20,
      userData.cigarettePrice || 1.5
    );
    
    return savingsData;
  } catch (error) {
    console.error('Error getting user savings data:', error);
    return null;
  }
}

// إعادة حساب المدخرات للمستخدم (للصيانة)
export async function recalculateUserSavings(username: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const dailyRecords = userData.dailyRecords || {};
    
    const savingsData = calculateSavings(
      dailyRecords,
      userData.dailyCigarettes || 20,
      userData.cigarettePrice || 1.5
    );
    
    await updateDoc(userRef, {
      daysWithoutSmoking: savingsData.consecutiveDaysWithoutSmoking,
      totalDaysWithoutSmoking: savingsData.totalDaysWithoutSmoking,
      totalCigarettesAvoided: savingsData.totalCigarettesAvoided,
      totalMoneySaved: savingsData.totalMoneySaved,
      lastRecordedDate: savingsData.lastRecordedDate
    });
  } catch (error) {
    console.error('Error recalculating user savings:', error);
    throw error;
  }
}