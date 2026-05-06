'use client'

import { useState } from 'react'
import { TrendingUp, Package, CheckCircle2, DollarSign, PiggyBank, ShoppingBag } from 'lucide-react'
import ProfitBreakdownModal from './profit-breakdown-modal'
import type { ProductProfitItem } from '@/lib/admin-utils'

interface Metrics {
  totalItemsSold: number
  totalRevenue: number
  netProfit: number
  profitMargin: number
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">ภาพรวมยอดขายและสถานะคำสั่งซื้อทั้งหมด (อัปเดตแบบเรียลไทม์)</p>
      </div>

      {/* --- Profit & Sales Summary --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Items Sold */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">สินค้าที่ขายทั้งหมด</span>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-gray-900 tracking-tight">{metrics.totalItemsSold.toLocaleString()}</span>
          <p className="text-xs text-gray-400 mt-2">ยอดรวมทุกคำสั่งซื้อ ( Paid )</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">รายได้รวมสุทธิ</span>
            <div className="p-2 bg-green-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <span className="text-4xl font-black text-gray-900 tracking-tight">฿{metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <p className="text-xs text-gray-400 mt-2">รายได้จากสินค้าที่ขายได้</p>
        </div>

        {/* Net Profit — clickable to open breakdown modal */}
        <button
          type="button"
          onClick={() => setIsProfitModalOpen(true)}
          className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
            metrics.netProfit >= 0
              ? 'bg-white border-gray-100 hover:border-emerald-200'
              : 'bg-red-50 border-red-200 hover:border-red-300'
          }`}
          aria-label="ดูรายละเอียดกำไรแยกตามสินค้า"
        >
          <div className="flex justify-between items-start mb-4">
            <span className={`text-sm font-bold ${
              metrics.netProfit >= 0 ? 'text-gray-500' : 'text-red-500'
            }`}>กำไรสุทธิ</span>
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
          <p className={`text-xs mt-2 ${
            metrics.netProfit >= 0 ? 'text-gray-400' : 'text-red-400'
          }`}>รายได้ − ต้นทุน ({metrics.profitMargin.toFixed(1)}% margin)</p>
          <p className={`text-[11px] mt-1 ${
            metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-300'
          }`}>คลิกเพื่อดูรายละเอียดแยกตามสินค้า →</p>
        </button>
      </div>

      {/* --- Order Status Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: ยอดขายรวม */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-gray-500">ยอดขายรวม</span>
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
              <CheckCircle2 className="w-5 h-5 text-yellow-700" />
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

      {/* --- Profit Breakdown Modal --- */}
      <ProfitBreakdownModal
        isOpen={isProfitModalOpen}
        onClose={() => setIsProfitModalOpen(false)}
      />
    </div>
  )
}
