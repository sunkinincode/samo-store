'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Search, CheckCircle2, AlertCircle, Package, Receipt } from 'lucide-react'

// 1. Type Definitions
type OrderItem = {
  id: string
  quantity: number
  size: string | null
  products: {
    name: string
    image_url: string
  }
}

type Order = {
  id: string
  total_amount: number
  status: string
  created_at: string
}

type SlipRecord = {
  trans_ref: string
  sender_name: string
  sender_bank: string
  trans_date: string
}

export default function AdminOrdersPage() {
  const supabase = createClient()
  
  // States
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [slipRecord, setSlipRecord] = useState<SlipRecord | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // 2. ฟังก์ชันค้นหาออร์เดอร์และสลิป
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setErrorMsg('')
    setOrder(null)
    setItems([])
    setSlipRecord(null)

    const searchId = searchQuery.trim().toUpperCase()

    // 2.1 ค้นหาข้อมูล Order หลัก
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('id', searchId)
      .single()

    if (orderError || !orderData) {
      setErrorMsg('ไม่พบข้อมูลคำสั่งซื้อ (Order ID ไม่ถูกต้อง)')
      setLoading(false)
      return
    }

    // 2.2 ค้นหาข้อมูลสินค้าในออร์เดอร์ (Items)
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('id, quantity, size, products(name, image_url)')
      .eq('order_id', searchId)

    // 2.3 ค้นหาข้อมูลสลิป (Slip Record)
    const { data: slipData } = await supabase
      .from('slip_records')
      .select('trans_ref, sender_name, sender_bank, trans_date')
      .eq('order_id', searchId)
      .single()

    // เซ็ตข้อมูลลง State
    setOrder(orderData)
    if (itemsData) setItems(itemsData as unknown as OrderItem[])
    if (slipData) setSlipRecord(slipData)
    
    setLoading(false)
    setSearchQuery('') // ล้างช่องค้นหาเพื่อรอรับสแกนคิวต่อไป
  }

  // 3. ฟังก์ชันอัปเดตสถานะเมื่อจ่ายของเสร็จ
  const markAsCompleted = async () => {
    if (!order) return
    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id)
    if (!error) {
      setOrder({ ...order, status: 'completed' })
    } else {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">ระบบตรวจสอบออร์เดอร์</h1>
        <p className="text-gray-500 mt-2">พิมพ์ Order ID หรือใช้เครื่องยิงบาร์โค้ดสแกนได้เลย</p>
      </div>

      {/* ช่องค้นหา / รับค่าจาก Barcode Scanner */}
      <form onSubmit={handleSearch} className="mb-10 max-w-xl mx-auto relative group">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-6 h-6 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="สแกนบาร์โค้ด หรือ พิมพ์ Order ID 8 หลัก..."
            className="w-full pl-14 pr-32 py-4 bg-white border-2 border-gray-200 rounded-2xl text-lg font-bold text-gray-900 uppercase tracking-widest focus:outline-none focus:border-gray-900 focus:ring-0 shadow-sm transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !searchQuery}
            className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-6 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ค้นหา'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto animate-in fade-in zoom-in-95">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <p className="font-bold text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* แสดงผลการค้นหาออร์เดอร์ */}
      {order && !loading && (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header Card */}
          <div className="bg-gray-50 border-b border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">รหัสออร์เดอร์</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-[0.2em] text-gray-900">{order.id}</h2>
            </div>
            <div className="flex flex-col items-end">
               {order.status === 'paid' && (
                 <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-4 py-2 rounded-full font-bold text-sm shadow-sm">
                   จ่ายเงินแล้ว (รอรับสินค้า)
                 </span>
               )}
               {order.status === 'completed' && (
                 <span className="bg-green-100 text-green-800 border border-green-200 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> รับสินค้าไปแล้ว
                 </span>
               )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-gray-500" /> สิ่งที่ต้องจ่ายให้ลูกค้า:
            </h3>
            
            <div className="space-y-4 mb-10">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow transition-shadow">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">ไม่มีรูป</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900">{item.products?.name}</h4>
                    {item.size && (
                      <p className="text-gray-500 font-medium mt-1 text-sm">
                        ไซซ์: <strong className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{item.size}</strong>
                      </p>
                    )}
                  </div>
                  <div className="text-3xl font-black text-gray-900 pr-2">
                    x{item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Area: ข้อมูลสลิป & ปุ่มยืนยัน */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end pt-8 border-t border-gray-100 gap-6">
              
              {/* Slip Record Data */}
              <div className="w-full lg:w-auto flex-1">
                {slipRecord ? (
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center gap-2 text-blue-900 font-bold mb-3">
                      <Receipt className="w-4 h-4" /> ข้อมูลการโอนเงิน (ตรวจสอบแล้ว)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                      <div>
                        <span className="text-gray-500">โอนจาก:</span>
                        <p className="font-medium text-gray-900">{slipRecord.sender_name}</p>
                        <p className="text-xs text-gray-500">{slipRecord.sender_bank}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">ข้อมูลอ้างอิง:</span>
                        <p className="font-medium text-gray-900 truncate" title={slipRecord.trans_ref}>{slipRecord.trans_ref}</p>
                        <p className="text-xs text-gray-500">{new Date(slipRecord.trans_date).toLocaleString('th-TH')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-gray-100 text-center lg:text-left">
                    ไม่พบข้อมูลสลิปในระบบ
                  </div>
                )}
              </div>

              {/* Action Button */}
              {order.status === 'paid' ? (
                <button
                  onClick={markAsCompleted}
                  className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-md shrink-0"
                >
                  <CheckCircle2 className="w-6 h-6" /> ยืนยันการจ่ายของ
                </button>
              ) : (
                <div className="w-full lg:w-auto text-gray-500 font-bold bg-gray-50 px-8 py-5 rounded-2xl border border-gray-200 text-center shrink-0">
                  ออร์เดอร์นี้จ่ายของไปแล้ว
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}