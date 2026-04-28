export const dynamic = 'force-dynamic' // คำสั่งสำคัญ: ปิด Cache ดึงข้อมูลสดใหม่เสมอ

import { createClient } from '@/utils/supabase/server'
import { TrendingUp, Package, Clock, CheckCircle2 } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // ดึงข้อมูลออร์เดอร์ทั้งหมด
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_amount, status')

  if (error) {
    console.error("Dashboard Error:", error)
  }

  // คำนวณสถิติต่างๆ
  const totalOrders = orders?.length || 0
  const totalSales = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const pendingOrders = orders?.filter(o => o.status === 'paid').length || 0
  const completedOrders = orders?.filter(o => o.status === 'completed').length || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">ภาพรวมยอดขายและสถานะคำสั่งซื้อทั้งหมด (อัปเดตแบบเรียลไทม์)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: ยอดขายรวม */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">ยอดขายรวมสุทธิ</span>
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-gray-900 tracking-tight">฿{totalSales.toLocaleString()}</span>
        </div>

        {/* Card 2: ออร์เดอร์ทั้งหมด */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">ออร์เดอร์ทั้งหมด</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-gray-900 tracking-tight">{totalOrders.toLocaleString()}</span>
        </div>

        {/* Card 3: รอรับสินค้า */}
        <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-200 shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-yellow-800">รอรับสินค้า (จ่ายแล้ว)</span>
            <div className="p-2 bg-yellow-100 rounded-xl">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
          </div>
          <span className="text-4xl font-black text-yellow-900 tracking-tight">{pendingOrders.toLocaleString()}</span>
        </div>

        {/* Card 4: รับสินค้าแล้ว */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">รับสินค้าแล้ว</span>
            <div className="p-2 bg-gray-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-gray-900 tracking-tight">{completedOrders.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}