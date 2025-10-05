import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PreloaderHandler from './PreloaderHandler';
import NavbarWrapper from './NavbarWrapper';
import FooterWrapper from './FooterWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "أنفاسك تهم - رحلتك نحو حياة صحية",
  description: "منصة شاملة لمساعدتك في الإقلاع عن التدخين وتتبع تقدمك",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" style={{ height: "100%" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          margin: 0,
          // Apply site-wide background gradient inline so it appears instantly on refresh
          background: "linear-gradient(135deg, #2193b0, #6dd5ed)",
        }}
      >
        <PreloaderHandler />
        <NavbarWrapper />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <FooterWrapper />
      </body>
    </html>
  );
}
