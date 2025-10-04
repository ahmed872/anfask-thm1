import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // الصفحات المسموح بها بدون تسجيل دخول
  const publicPaths = ['/', '/home', '/login', '/register', '/favicon.ico'];
  const { pathname } = request.nextUrl;

  // السماح لكل الملفات اللي فيها امتداد (مثل الصور، CSS، JS، إلخ)
  if (pathname.match(/\.[^\/]+$/)) {
    return NextResponse.next();
  }

  // التوكن من الكوكيز
  const token = request.cookies.get('anfask-username');

  // تحقق إذا الصفحة من الصفحات العامة
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api).*)'], // نطبق الميدل وير على كل المسارات ما عدا _next و api
};
