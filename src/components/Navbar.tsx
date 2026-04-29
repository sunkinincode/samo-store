'use client'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ShoppingBag, LogOut, Receipt, Package } from 'lucide-react' // ✅ นำ Package กลับมา
import { logout } from '@/app/actions/auth'
import { useEffect, useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const { cart } = useCart()

  const totalItems = useMemo(() => 
    cart.reduce((total, item) => total + item.quantity, 0), 
  [cart])

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setUser(session?.user ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogoutClick = async (e: React.FormEvent) => {
    e.preventDefault()
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      await logout()
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ✅ นำไอคอนกล่อง (Package) กลับมาใส่แทนที่ logo.svg */}
          <Link href="/" className="flex items-center gap-2">
            <Package className="w-6 h-6 text-gray-900" />
            <span className="font-bold text-xl tracking-tight text-gray-900">Samo Store</span>
          </Link>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center">
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link 
                    href="/orders" 
                    prefetch={false}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
                    title="ประวัติการสั่งซื้อ"
                  >
                    <Receipt className="w-5 h-5" />
                  </Link>
                  
                  <Link 
                    href="/cart" 
                    prefetch={false}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
                    title="ตะกร้าสินค้า"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </Link>
                </div>

                <div className="flex items-center ml-3 pl-3 sm:ml-4 sm:pl-4 border-l-2 border-gray-100">
                  <form onSubmit={handleLogoutClick}>
                    <button 
                      type="submit" 
                      className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors group"
                      title="ออกจากระบบ"
                    >
                      <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                  </form>
                </div>

              </div>
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