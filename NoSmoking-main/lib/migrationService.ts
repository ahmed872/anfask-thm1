import { db } from './firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { calculateSavings, getTodayDate, getDatesBetween, DailyRecord } from './savingsManager';

// ترحيل بيانات مستخدم واحد من النظام القديم إلى الجديد
export async function migrateUserToNewSystem(username: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log(`User ${username} not found`);
      return false;
    }
    
    const userData = userSnap.data();
    
    // التحقق من وجود البيانات الجديدة بالفعل
    if (userData.dailyRecords && Object.keys(userData.dailyRecords).length > 0) {
      console.log(`User ${username} already migrated`);
      return true;
    }
    
    // بيانات النظام القديم
    const registrationDate = userData.registrationDate || userData.createdAt;
    const daysWithoutSmoking = userData.daysWithoutSmoking || 0;
    const dailyCigarettes = userData.dailyCigarettes || 20;
    const cigarettePrice = userData.cigarettePrice || 1.5;
    const todayDate = getTodayDate();
    
    if (!registrationDate) {
      console.log(`User ${username} has no registration date`);
      return false;
    }
    
    // إنشاء سجلات يومية بناءً على البيانات القديمة
    const dailyRecords: { [date: string]: DailyRecord } = {};
    
    // إنشاء سجل للأيام من التسجيل حتى اليوم
    const allDates = getDatesBetween(registrationDate.split('T')[0], todayDate);
    
    // إذا كان لديه أيام بدون تدخين، نفترض أنها الأيام الأخيرة
    if (daysWithoutSmoking > 0) {
      const recentDates = allDates.slice(-daysWithoutSmoking);
      
      // الأيام الأخيرة = بدون تدخين
      recentDates.forEach(date => {
        dailyRecords[date] = {
          date,
          smoked: false,
          recorded: true,
          timestamp: new Date().toISOString()
        };
      });
      
      // باقي الأيام = غير مسجلة (سيعتبرها النظام بدون تدخين)
      const earlierDates = allDates.slice(0, -daysWithoutSmoking);
      earlierDates.forEach(date => {
        dailyRecords[date] = {
          date,
          smoked: false,
          recorded: false,
          timestamp: new Date().toISOString()
        };
      });
    } else {
      // لا يوجد أيام بدون تدخين، كل الأيام غير مسجلة
      allDates.forEach(date => {
        dailyRecords[date] = {
          date,
          smoked: false,
          recorded: false,
          timestamp: new Date().toISOString()
        };
      });
    }
    
    // حساب المدخرات الجديدة
    const savingsData = calculateSavings(dailyRecords, dailyCigarettes, cigarettePrice);
    
    // تحديث البيانات في Firebase
    await updateDoc(userRef, {
      dailyRecords,
      daysWithoutSmoking: savingsData.consecutiveDaysWithoutSmoking,
      totalDaysWithoutSmoking: savingsData.totalDaysWithoutSmoking,
      totalCigarettesAvoided: savingsData.totalCigarettesAvoided,
      totalMoneySaved: savingsData.totalMoneySaved,
      lastRecordedDate: savingsData.lastRecordedDate,
      migrated: true,
      migrationDate: new Date().toISOString()
    });
    
    console.log(`User ${username} migrated successfully`);
    console.log(`Total days without smoking: ${savingsData.totalDaysWithoutSmoking}`);
    console.log(`Consecutive days: ${savingsData.consecutiveDaysWithoutSmoking}`);
    console.log(`Total money saved: ${savingsData.totalMoneySaved}`);
    
    return true;
  } catch (error) {
    console.error(`Error migrating user ${username}:`, error);
    return false;
  }
}

// ترحيل جميع المستخدمين
export async function migrateAllUsers(): Promise<void> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const username = docSnap.id;
      const success = await migrateUserToNewSystem(username);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // انتظار قصير لتجنب إرهاق الخادم
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Migration completed: ${successCount} successful, ${failCount} failed`);
  } catch (error) {
    console.error('Error migrating all users:', error);
  }
}

// التحقق من حاجة المستخدم للترحيل
export async function needsMigration(username: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }
    
    const userData = userSnap.data();
    
    // إذا لم يتم الترحيل من قبل ولا يوجد سجلات يومية
    return !userData.migrated && (!userData.dailyRecords || Object.keys(userData.dailyRecords).length === 0);
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

// إضافة سؤال أمني للمستخدمين القدامى
export async function needsSecurityQuestion(username: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', username);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }
    
    const userData = userSnap.data();
    
    // التحقق من وجود السؤال الأمني
    return !userData.favoriteColor && !userData.securityQuestion;
  } catch (error) {
    console.error('Error checking security question status:', error);
    return false;
  }
}

// حفظ السؤال الأمني للمستخدم
export async function saveSecurityQuestion(username: string, favoriteColor: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', username);
    await updateDoc(userRef, {
      favoriteColor,
      securityQuestion: favoriteColor, // للتوافق مع النظام القديم
      securityQuestionDate: new Date().toISOString()
    });
    
    console.log(`Security question saved for user ${username}`);
  } catch (error) {
    console.error('Error saving security question:', error);
    throw error;
  }
}