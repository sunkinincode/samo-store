import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Samo Store | ระบบสั่งซื้อสินค้า",
  description: "เว็บไซต์สำหรับสั่งซื้อสินค้า เสื้อ กระเป๋า สมุด",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable}`}>
      <body className="min-h-screen bg-white text-gray-900 selection:bg-gray-200">
        <CartProvider>
          <main className="flex flex-col min-h-screen">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}