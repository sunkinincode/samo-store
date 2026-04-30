import type { Metadata } from 'next'
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
// ✅ Import createClient สำหรับฝั่ง Server
import { createClient } from '@/utils/supabase/server'; 
// ✅ Import Navbar
import Navbar from '@/components/Navbar'; 

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Samo Store',
  description: 'ระบบสั่งซื้อสินค้าของสโมสรนักศึกษา',
  icons: {
    icon: '/logo.svg', 
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ ดึงข้อมูล Supabase client ฝั่ง Server
  const supabase = await createClient();
  
  // ✅ ดึงข้อมูล User จาก Server
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="th">
      <body className={notoSansThai.variable}>
        <CartProvider>
          {/* ✅ เรียกใช้ Navbar และส่ง user ไปเป็น prop initialUser */}
          <Navbar initialUser={user} />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}