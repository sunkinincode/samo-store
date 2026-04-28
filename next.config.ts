import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* กำหนดให้ใช้ Edge Runtime ในจุดที่จำเป็น และลดข้อผิดพลาดในการ Build ลง Cloudflare Pages */
  images: {
    unoptimized: true, // Cloudflare Pages มักจะมีปัญหากับ Image Optimization ของ Next.js
  },
  experimental: {
    // ฟีเจอร์ลดขนาด Client Router Cache ของ Next.js 16+
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;