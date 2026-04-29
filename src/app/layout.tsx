import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'] })

// ✅ แก้ไขตรงนี้: เพิ่มการตั้งค่า icons ให้ชี้ไปที่โลโก้ในโฟลเดอร์ public
export const metadata: Metadata = {
  title: 'Samo Store',
  description: 'ระบบสั่งซื้อสินค้าของสโมสรนักศึกษา',
  icons: {
    icon: '/logo.svg', // หรือถ้าเป็น png ก็ใช้ '/logo.png' 
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}