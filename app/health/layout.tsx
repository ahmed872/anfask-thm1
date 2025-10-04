// app/health/layout.tsx

import React from "react";
import Navbar from '../navbar';
import PreloaderHandler from '../PreloaderHandler';

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PreloaderHandler />
      <Navbar />
      {children}
    </div>
  );
}
