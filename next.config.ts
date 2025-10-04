import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // نعرض الصور المحلية من public مباشرة بدون تحويل أثناء التصحيح
    unoptimized: true,
    // لو احتجنا رفع صور من دومينات خارجية لاحقاً يمكن إضافتها هنا
    domains: [],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
