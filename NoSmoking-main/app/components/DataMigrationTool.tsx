"use client";
import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getTodayDate, getDatesBetween } from '../../lib/savingsManager';

const DataMigrationTool: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const migrateUserData = async () => {
    if (!username.trim()) {
      setResult('يرجى إدخال اسم المستخدم');
      return;
    }

    setIsLoading(true);
    setResult('جارٍ تحديث البيانات...');

    try {
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setResult('المستخدم غير موجود');
        setIsLoading(false);
        return;
      }

      const userData = userSnap.data();
      
      // التحقق من وجود البيانات القديمة
      const daysWithoutSmoking = userData.daysWithoutSmoking || 0;
      const registrationDate = userData.registrationDate || userData.createdAt;
      const dailyCigarettes = userData.dailyCigarettes || 20;
      const cigarettePrice = userData.cigarettePrice || 1.5;

      if (!registrationDate) {
        setResult('لا يمكن العثور على تاريخ التسجيل');
        setIsLoading(false);
        return;
      }

      // إنشاء سجل يومي افتراضي
      const today = getTodayDate();
      const startDate = registrationDate.split('T')[0]; // أخذ التاريخ فقط
      
      // حساب جميع الأيام من التسجيل حتى اليوم
      const allDates = getDatesBetween(startDate, today);
      
      // إنشاء dailyRecords جديد
      const dailyRecords: { [date: string]: any } = {};
      
      // افتراض أن آخر X يوم لم يدخن فيها (حسب daysWithoutSmoking)
      // والباقي دخن فيها
      const totalDays = allDates.length;
      const smokingDays = Math.max(0, totalDays - daysWithoutSmoking);
      
      allDates.forEach((date, index) => {
        const smoked = index < smokingDays; // الأيام الأولى = دخن، الأخيرة = لم يدخن
        
        dailyRecords[date] = {
          date,
          smoked,
          recorded: true,
          timestamp: new Date().toISOString()
        };
      });

      // حساب المدخرات
      const daysWithoutSmokingCount = allDates.filter((_, index) => index >= smokingDays).length;
      const totalCigarettesAvoided = daysWithoutSmokingCount * dailyCigarettes;
      const totalMoneySaved = totalCigarettesAvoided * cigarettePrice;

      // تحديث البيانات في Firebase
      await updateDoc(userRef, {
        dailyRecords,
        daysWithoutSmoking: daysWithoutSmoking, // الأيام المتتالية الحالية
        totalDaysWithoutSmoking: daysWithoutSmokingCount, // إجمالي الأيام
        totalCigarettesAvoided,
        totalMoneySaved,
        lastRecordedDate: today,
        lastCheckDate: today,
        // إضافة حقول مفقودة إذا لم تكن موجودة
        cigarettePrice: cigarettePrice,
        dailyCigarettes: dailyCigarettes
      });

      setResult(`
✅ تم تحديث البيانات بنجاح!

📊 النتائج:
• إجمالي الأيام: ${totalDays} يوم
• أيام بدون تدخين: ${daysWithoutSmokingCount} يوم  
• أيام مع تدخين: ${smokingDays} يوم
• سجائر متجنبة: ${totalCigarettesAvoided.toLocaleString()} سيجارة
• مبلغ موفر: ${totalMoneySaved.toLocaleString()} ر.س

🔄 يرجى تحديث الصفحة لرؤية النتائج
      `);

    } catch (error) {
      console.error('Migration error:', error);
      setResult(`حدث خطأ: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>
        🔧 أداة تحديث المدخرات
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
          هذه الأداة تحدث حسابك ليتوافق مع النظام الجديد للمدخرات. 
          ستقوم بتحويل البيانات القديمة وحساب المدخرات الصحيحة.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
          اسم المستخدم:
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="أدخل اسم المستخدم"
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={migrateUserData}
        disabled={isLoading || !username.trim()}
        style={{
          width: '100%',
          padding: '15px',
          background: isLoading ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'background 0.3s ease'
        }}
      >
        {isLoading ? '⏳ جارٍ التحديث...' : '🚀 تحديث المدخرات'}
      </button>

      {result && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: result.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          lineHeight: '1.5'
        }}>
          {result}
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <strong>⚠️ ملاحظة مهمة:</strong>
        <br />
        هذه الأداة تقوم بتقدير البيانات بناءً على عدد الأيام المسجلة حالياً. 
        قد تحتاج لتعديل بعض الأيام يدوياً إذا كانت التقديرات غير دقيقة.
      </div>
    </div>
  );
};

export default DataMigrationTool;