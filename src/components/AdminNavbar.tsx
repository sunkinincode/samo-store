import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { LayoutDashboard, Settings, PackageOpen, Search, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export default async function AdminNavbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-md">
                <PackageOpen className="w-5 h-5 text-gray-900" />
              </div>
              <span className="font-bold text-lg tracking-tight">Samo Admin</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                <LayoutDashboard className="w-4 h-4" /> ภาพรวม
              </Link>
              <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                <PackageOpen className="w-4 h-4" /> จัดการสต็อก
              </Link>
              <Link href="/admin/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                <Search className="w-4 h-4" /> ค้นหาออร์เดอร์
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                <Settings className="w-4 h-4" /> ตั้งค่าร้านค้า
              </Link>
            </div>
          </div>

          {/* Right Menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
            <form action={logout}>
              <button 
                type="submit"
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}