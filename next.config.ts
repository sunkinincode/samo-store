import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* กำหนดให้ใช้ Edge Runtime ในจุดที่จำเป็น และลดข้อผิดพลาดในการ Build ลง Cloudflare Pages */
  images: {
    unoptimized: true,
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
import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
