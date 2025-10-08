'use client';

// ✅ [Copilot Review] تم ضمان تسجيل الخروج الكامل بمسح الكوكيز والتخزين المحلي قبل التوجيه.
// السبب: كان الزر يوجّه فقط بدون مسح Cookie المصادق عليه مما يبقي الـ middleware يعتبر المستخدم مسجّل الدخول.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // ✅

  useEffect(() => {
    setIsMounted(true); // ✅ بعد ما الصفحة تحمل بالكامل
  }, []);

  if (!isMounted) return null; // ✅ امنع الـ hydration mismatch

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="dashboard-navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <Link
            href="/home"
            aria-label="الذهاب إلى الصفحة الرئيسية"
            className="navbar-logo-link"
            onClick={() => setIsMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="شعار أنفاسك تهم"
              width={44}
              height={44}
              style={{ borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
              priority
            />
          </Link>
        </div>
        <span className="navbar-title">أنفاسك تهم</span>
      </div>

      {/* زر الهامبرجر */}
      <div className="hamburger-menu" onClick={toggleMenu}>
        {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
      </div>

      {/* روابط التنقل */}
      <div className={`navbar-links ${isMenuOpen ? 'show-menu' : 'hide-menu'}`}>
        <Link href="/dashboard" className={`nav-btn ${pathname === '/dashboard' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>الرئيسية</Link>
        <Link href="/achievements" className={`nav-btn ${pathname === '/achievements' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>الأوسمة</Link>
        <Link href="/chat" className={`nav-btn ${pathname === '/chat' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>الدردشة</Link>
        <Link href="/health" className={`nav-btn ${pathname === '/health' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>الصحة</Link>
        <Link href="/videos" className={`nav-btn ${pathname === '/videos' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>الفيديوهات</Link>
        <button
          className="logout-btn"
          onClick={() => {
            setIsMenuOpen(false);
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('anfask-username');
                // expire auth cookie immediately
                document.cookie = 'anfask-username=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              }
            } catch {}
            window.location.href = '/home';
          }}
          aria-label="تسجيل الخروج"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="logout-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
          </svg>
          <span className="logout-text">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
