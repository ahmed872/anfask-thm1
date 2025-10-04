// app/PreloaderHandler.tsx
// تأكد من إضافة 'use client'; في أول سطر
'use client';

import React, { useState, useEffect } from 'react';

const PreloaderHandler: React.FC = () => {
    // حالة للتحكم في ما إذا كان الـ preloader مرئيًا (لإضافة/إزالة فئة 'hide')
    const [isVisible, setIsVisible] = useState(true);
    // حالة للتحكم في ما إذا كان الـ preloader قد تمت إزالته بالكامل من الـ DOM
    const [isRemoved, setIsRemoved] = useState(false);

    useEffect(() => {
        // إخفاء الـ preloader بعد 1 ثانية (مطابقة لانتقال CSS)
        const hideTimer = setTimeout(() => {
            setIsVisible(false); // هذا سيضيف فئة 'hide' للعنصر
        }, 1000); // يجب أن يتطابق هذا مع مدة الانتقال في CSS لـ '.preloader.hide'

        // إزالة الـ preloader من الـ DOM بعد اكتمال انتقال الإخفاء (بعد 1 ثانية إضافية)
        const removeTimer = setTimeout(() => {
            setIsRemoved(true); // هذا سيجعل المكون لا يقدم أي شيء
        }, 2000); // إجمالي الوقت: وقت الإخفاء + مدة انتقال CSS

        // تنظيف المؤقتات عند إلغاء تحميل المكون (unmount)
        return () => {
            clearTimeout(hideTimer);
            clearTimeout(removeTimer);
        };
    }, []); // مصفوفة التبعية الفارغة تعني أن هذا التأثير يعمل مرة واحدة عند تحميل المكون

    // إذا كانت الحالة 'isRemoved' صحيحة، لا تقدم أي شيء (يزيل العنصر من الـ DOM)
    if (isRemoved) {
        return null;
    }

    return (
        <div className={`preloader ${isVisible ? '' : 'hide'}`}> {/* إضافة/إزالة فئة 'hide' */}
            <div className="loader"></div>
        </div>
    );
};

export default PreloaderHandler;
