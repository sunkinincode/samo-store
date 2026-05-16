'use client'

import { useState } from 'react'
import { TrendingUp, Package, CheckCircle2, PiggyBank, ShoppingBag, DollarSign } from 'lucide-react'
import ProfitBreakdownModal from './profit-breakdown-modal'
import type { ProductProfitItem } from '@/lib/admin-utils'

interface Metrics {
  totalItemsSold: number
  totalRevenue: number
  netProfit: number
  profitMargin: number
  fixedInvestment: number
  shirtCost: number
}

interface AdminDashboardClientProps {
  totalOrders: number
  totalSales: number
  pendingOrders: number
  completedOrders: number
  metrics: Metrics
  profitBreakdown: ProductProfitItem[]
}

export default function AdminDashboardClient({
  totalOrders,
  totalSales,
  pendingOrders,
  completedOrders,
  metrics,
  profitBreakdown,
}: AdminDashboardClientProps) {
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false)

  // คำนวณกำไรรวมจากสินค้าที่ขายได้แล้ว (ตัวเลขเดียวกับใน Modal)
  const totalProfitFromSoldItems = profitBreakdown.reduce((sum, item) => sum + item.total_profit, 0)

  // 🌟 ซิงค์ตัวเลขชิ้นสินค้าให้ตรงกับในหน้าต่าง Modal (แยกเสื้อ สมุด กระเป๋า)
  const totalShortSleeve = profitBreakdown.reduce((sum, item) => sum + item.short_sleeve_qty, 0)
  const totalLongSleeve = profitBreakdown.reduce((sum, item) => sum + item.long_sleeve_qty, 0)
  const totalNotebooks = profitBreakdown.reduce((sum, item) => sum + (item.product_name.includes('สมุด') ? item.quantity_sold : 0), 0)
  const totalBags = profitBreakdown.reduce((sum, item) => sum + (item.product_name.includes('กระเป๋า') ? item.quantity_sold : 0), 0)
  
  // ยอดรวมจำนวนชิ้นที่แท้จริง (จะได้ 456 เป๊ะๆ)
  const realTotalItems = totalShortSleeve + totalLongSleeve + totalNotebooks + totalBags

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">ภาพรวมยอดขายและสถานะคำสั่งซื้อทั้งหมด (อัปเดตแบบเรียลไทม์)</p>
      </div>

      {/* --- Profit & Sales Summary --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* กล่องที่ 1: Total Items Sold */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">สินค้าที่ขายทั้งหมด</span>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          {/* ใช้ตัวเลขที่ซิงค์จาก Modal มาโชว์ */}
          <span className="text-4xl font-black text-gray-900 tracking-tight">{realTotalItems.toLocaleString()}</span>
          <p className="text-xs text-gray-400 mt-2">รวมชิ้นสินค้าแยกย่อย (เสื้อ สมุด กระเป๋า)</p>
        </div>

        {/* กล่องที่ 2: กำไรจากสินค้าที่ขายได้แล้ว */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">กำไรจากสินค้าที่ขายได้แล้ว</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-emerald-600 tracking-tight">
            ฿{totalProfitFromSoldItems.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <p className="text-xs text-gray-400 mt-2">กำไรขั้นต้น (ยังไม่หักเงินลงทุนเริ่มต้น)</p>
        </div>

        {/* กล่องที่ 3: Net Profit */}
        <button
          type="button"
          onClick={() => setIsProfitModalOpen(true)}
          className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
            metrics.netProfit >= 0
              ? 'bg-white border-gray-100 hover:border-emerald-200'
              : 'bg-red-50 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <span className={`text-sm font-bold ${
              metrics.netProfit >= 0 ? 'text-gray-500' : 'text-red-500'
            }`}>
              {metrics.netProfit >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนคงค้าง / ต้องแตกEven'}
            </span>
            <div className={`p-2 rounded-xl ${
              metrics.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-100'
            }`}>
              <PiggyBank className={`w-5 h-5 ${
                metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <span className={`text-4xl font-black tracking-tight ${
            metrics.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'
          }`}>฿{metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          
          {/* 🌟 แสดงต้นทุนเสื้อที่นี่ */}
          <p className={`text-xs mt-2 font-bold ${
            metrics.netProfit >= 0 ? 'text-gray-500' : 'text-red-500'
          }`}>หักต้นทุนสั่งเสื้อทั้งหมด: ฿{metrics.shirtCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          
          <p className={`text-[11px] mt-1 ${
            metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-300'
          }`}>คลิกเพื่อดูรายละเอียดแยกตามสินค้า →</p>
          <p className={`text-[10px] mt-2 ${
            metrics.netProfit >= 0 ? 'text-gray-300' : 'text-red-300/60'
          }`}>คำนวณรวมเงินลงทุนเริ่มต้น ฿{metrics.fixedInvestment.toLocaleString()} สำหรับสต็อกและเซิร์ฟเวอร์</p>
        </button>
      </div>

      {/* --- Order Status Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">ยอดขายรวม</span>
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-gray-900 tracking-tight">฿{totalSales.toLocaleString()}</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">ออร์เดอร์ทั้งหมด</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-gray-900 tracking-tight">{totalOrders.toLocaleString()}</span>
        </div>

        <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-200 shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-yellow-800">รอรับสินค้า (จ่ายแล้ว)</span>
            <div className="p-2 bg-yellow-100 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-yellow-700" />
            </div>
          </div>
          <span className="text-4xl font-black text-yellow-900 tracking-tight">{pendingOrders.toLocaleString()}</span>
        </div>

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

      <ProfitBreakdownModal
        isOpen={isProfitModalOpen}
        onClose={() => setIsProfitModalOpen(false)}
      />
    </div>
  )
}