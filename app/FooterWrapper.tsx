'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function FooterWrapper() {
  const pathname = usePathname();

  if (pathname === '/home' || pathname === '/login' || pathname === '/register') return null;

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-text">
          <h4>أنفاسك تهم</h4>
          <p>نحن طالبات من تخصص العلاج التنفسي في جامعة الإمام عبدالرحمن بن فيصل، نسعى لخدمة المجتمع من خلال دعم الراغبين في الإقلاع عن التدخين.</p>
          <p>نقدم برنامجًا تفاعليًا يتضمن تحديات جماعية ومشاركة الإنجازات مع أفراد يعانون من نفس المشكلة، بهدف صنع بيئة داعمة ومحفّزة للتغيير الإيجابي</p>
        </div>
        <div className="footer-image">
          <Image src="/cimage.png" alt="شعار الجامعة" width={80} height={80} priority />
        </div>
      </div>
    </footer>
  );
}
