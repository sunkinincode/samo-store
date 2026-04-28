'use client'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ShoppingBag, LogOut, Package, Receipt } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useCart } from '@/context/CartContext' // ดึงข้อมูลตะกร้า

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  
  // เรียกใช้ cart และคำนวณจำนวนชิ้นทั้งหมด
  const { cart } = useCart()
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Package className="w-6 h-6 text-gray-900" />
            <span className="font-bold text-xl tracking-tight text-gray-900">Samo Store</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Link href="/orders" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors" title="ประวัติการสั่งซื้อ">
                  <Receipt className="w-5 h-5" />
                </Link>
                
                {/* ปุ่มตะกร้า + ตัวเลขแจ้งเตือน */}
                <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors" title="ตะกร้าสินค้า">
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute 0 top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>
                
                <form action={logout}>
                  <button type="submit" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 p-2 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">ออกจากระบบ</span>
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}