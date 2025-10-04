"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, UserPlus, LogIn, Heart, Users, Target, Award } from 'lucide-react';
import './home.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import '../globals.css';
import '../FooterWrapper';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  background: string;
  icon: React.ReactNode;
}

const App: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const router = useRouter();

  const slides: Slide[] = [
    {
      id: 1,
      title: 'أنفاسك تهم',
      subtitle: 'نحن طالبات من تخصص العلاج التنفسي في جامعة الإمام عبدالرحمن بن فيصل، نسعى لخدمة المجتمع من خلال دعم الراغبين في الإقلاع عن التدخين. نقدم برنامجًا تفاعليًا يتضمن تحديات جماعية ومشاركة الإنجازات مع أفراد يعانون من نفس المشكلة، بهدف صنع بيئة داعمة ومحفّزة للتغيير الإيجابي.',
      background: '/jLRMAK7R94TM.jpg',
      icon: <Heart className="w-16 h-16 text-white mb-4 floating-animation" />
    },
    {
      id: 2,
      title: 'أضرار التدخين',
      subtitle: 'التدخين يؤثر على جميع أجهزة الجسم ويسبب أمراضًا خطيرة مثل السرطان وأمراض القلب والجهاز التنفسي. كل سيجارة تدخنها تقلل من عمرك وتؤثر على صحة من حولك. الإقلاع عن التدخين هو أفضل قرار يمكنك اتخاذه لصحتك ولصحة أحبائك.',
      background: '/IjJXcrls1xpu.png',
      icon: <Target className="w-16 h-16 text-white mb-4 pulse-animation" />
    },
    {
      id: 3,
      title: 'خدماتنا',
      subtitle: 'موقعنا يقدم برنامجًا شاملاً للإقلاع عن التدخين يشمل: تتبع التقدم اليومي، حاسبة الأموال المدخرة، متتبع الحالة المزاجية، غرف دردشة جماعية مخصصة حسب الجنس، نظام شارات الإنجازات، وقسم فيديوهات ملهمة من أشخاص نجحوا في الإقلاع عن التدخين.',
      background: '/ei07ez4H0euC.jpg',
      icon: <Users className="w-16 h-16 text-white mb-4 floating-animation" />
    },
    {
      id: 4,
      title: 'ابدأ رحلتك اليوم',
      subtitle: 'انضم إلى مجتمعنا الداعم وابدأ رحلتك نحو حياة صحية خالية من التدخين. معًا نستطيع تحقيق هدفك والوصول إلى نمط حياة أفضل. كل يوم بدون تدخين هو انتصار يستحق الاحتفال.',
      background: '/unnamed.jpg',
      icon: <Award className="w-16 h-16 text-white mb-4 pulse-animation" />
    }
  ];

  const nextSlide = (): void => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = (): void => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number): void => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <nav className="navbar">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 space-x-reverse">
             <Image
  src="/logo.png"
  alt="شعار أنفاسك تهم"
   className="logo-image"  
    width={100}
  height={60}
/>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse fix-mobile-space">
              <button 
                type="button"
                className="flex items-center space-x-2 space-x-reverse btn-primary"
                onClick={() => router.push("/register")}
              >
                <UserPlus className="w-5 h-5" />
                <span>إنشاء حساب</span>
              </button>
              <button 
                type="button"
                className="flex items-center space-x-2 space-x-reverse btn-secondary"
                onClick={() => router.push("/login")}
              >
                <LogIn className="w-5 h-5" />
                <span>تسجيل الدخول</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="slide-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide ${index === currentSlide ? 'active' : ''} ${
              index < currentSlide ? 'prev' : ''
            }`}
          >
            <img
              src={slide.background}
              alt={slide.title}
              className="background-image"
            />
            <div className="overlay"></div>
            <div className="slide-content">
              <div className="max-w-4xl mx-auto text-center fade-in-up">
                {slide.icon}
                <h2 className="slide-title">{slide.title}</h2>
                <p className="slide-subtitle">{slide.subtitle}</p>
                {index === 0 && (
                  <div className="flex justify-center space-x-4 space-x-reverse mt-8">
                    <button 
                      type="button"
                      className="btn-primary btn-large"
                      onClick={() => router.push("/login")}
                    >
                      ابدأ الآن
                    </button>
                    <button 
                      type="button"
                      className="btn-secondary btn-large"
                      onClick={() => router.push("/register")}
                    >
                      تعرف أكثر
                    </button>
                  </div>
                )}
                {index === 3 && (
                  <div className="flex justify-center mt-8">
                    <button 
                      type="button"
                      className="btn-primary btn-large"
                      onClick={() => router.push("/register")}
                    >
                      انضم إلينا الآن
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={prevSlide}
          className="slide-navigation prev fixed-slide-nav"
          aria-label="الشريحة السابقة"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="slide-navigation next fixed-slide-nav"
          aria-label="الشريحة التالية"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              aria-label={`الذهاب إلى الشريحة ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">لماذا تختار أنفاسك تهم؟</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              نقدم حلولاً مبتكرة ومدعومة علمياً لمساعدتك في رحلة الإقلاع عن التدخين
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-800 mb-2">دعم جماعي</h4>
              <p className="text-gray-600">انضم إلى مجتمع داعم من الأشخاص الذين يشاركونك نفس الهدف</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-800 mb-2">تتبع التقدم</h4>
              <p className="text-gray-600">راقب تقدمك اليومي واحتفل بكل إنجاز تحققه في رحلتك</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-800 mb-2">نظام المكافآت</h4>
              <p className="text-gray-600">احصل على شارات وجوائز عند تحقيق أهدافك المختلفة</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
            <div className="footer-container">
              <div className="footer-text messi">
                <h4>أنفاسك تهم</h4>
                <p>نحن طالبات من تخصص العلاج التنفسي في جامعة الإمام عبدالرحمن بن فيصل، نسعى لخدمة المجتمع من خلال دعم الراغبين في الإقلاع عن التدخين.</p>
                <p className="ronaldo">نقدم برنامجًا تفاعليًا يتضمن تحديات جماعية ومشاركة الإنجازات مع أفراد يعانون من نفس المشكلة، بهدف صنع بيئة داعمة ومحفّزة للتغيير الإيجابي</p>
              </div>
              <div className="footer-image">
                <Image src="/cimage.png" alt="شعار الجامعة" width={80} height={80} priority />
              </div>
            </div>
          </footer>
    </div>
  );
};

export default App;


