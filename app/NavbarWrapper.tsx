
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './navbar';

const NavbarWrapper: React.FC = () => {
  const pathname = usePathname();

  const hiddenNavbarRoutes = ['/register', '/login', '/home'];

  const shouldShowNavbar = !hiddenNavbarRoutes.includes(pathname);

  if (!shouldShowNavbar) return null;

  return <Navbar />;
};

export default NavbarWrapper;

