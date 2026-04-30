'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Receipt, ChevronRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Order = {
  id: string
  total_amount: number
  status: string
  created_at: string
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMyOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setOrders(data)
      setLoading(false)
    }

    fetchMyOrders()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">รอชำระเงิน</span>
      case 'paid': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">รอรับสินค้า</span>
      case 'completed': return <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">รับสินค้าแล้ว</span>
      case 'cancelled': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">ยกเลิก</span>
      default: return null
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Receipt className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ประวัติการสั่งซื้อ</h1>
            <p className="text-gray-500 text-sm mt-1">รายการสั่งซื้อและบาร์โค้ดรับสินค้าของคุณ</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">ยังไม่มีประวัติการสั่งซื้อ</h3>
            <p className="text-gray-500 mb-6">คุณยังไม่เคยทำรายการสั่งซื้อสินค้าใดๆ</p>
            <Link href="/products" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800">
              ไปเลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link 
                key={order.id} 
                href={`/orders/${order.id}`}
                className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wider">{order.id}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    สั่งซื้อเมื่อ: {new Date(order.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 font-medium mb-1">ยอดสุทธิ</p>
                    <p className="font-bold text-gray-900 text-lg">฿{order.total_amount}</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-gray-900 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}