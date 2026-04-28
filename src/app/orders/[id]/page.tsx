'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/client'
import { Loader2, ArrowLeft, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type OrderItem = {
  id: string
  quantity: number
  size: string | null
  price_at_time: number
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

export default function OrderBarcodePage() {
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrderDetails = async () => {
      // 1. ดึงข้อมูล Order (RLS จะช่วยบล็อกถ้าไม่ใช่ของ User คนนี้)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !orderData) {
        setError('ไม่พบข้อมูลคำสั่งซื้อ หรือคุณไม่มีสิทธิ์เข้าถึง')
        setLoading(false)
        return
      }

      // 2. ดึงรายการสินค้า
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('id, quantity, size, price_at_time, products(name, image_url)')
        .eq('order_id', orderId)

      setOrder(orderData)
      if (itemsData) setItems(itemsData as unknown as OrderItem[])
      setLoading(false)
    }

    fetchOrderDetails()
  }, [orderId])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบคำสั่งซื้อ</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/orders" className="text-gray-900 font-medium hover:underline flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> กลับไปหน้าประวัติการสั่งซื้อ
          </Link>
        </div>
      </>
    )
  }

  // ใช้ API สร้างบาร์โค้ดแบบ Code128 อัตโนมัติจาก Order ID
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${order.id}&scale=3&height=10&includetext`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        
        <Link href="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">กลับไปหน้าประวัติ</span>
        </Link>

        {/* คูปองรับสินค้า */}
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
          
          {/* ส่วนหัวคูปอง */}
          <div className="bg-gray-900 p-8 text-center text-white relative">
            <h2 className="text-xl font-medium text-gray-400 mb-1">รหัสออร์เดอร์ของคุณ</h2>
            <p className="text-4xl font-black tracking-[0.2em]">{order.id}</p>
            
            {/* รอยปะและวงกลมเจาะรูแบบคูปอง */}
            <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-[-12px]">
              <div className="w-6 h-6 bg-gray-50 rounded-full absolute -left-3"></div>
              <div className="w-6 h-6 bg-gray-50 rounded-full absolute -right-3"></div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-200"></div>

          {/* ส่วนแสดงบาร์โค้ด */}
          <div className="p-8 flex flex-col items-center border-b border-gray-100">
            {order.status === 'completed' ? (
              <div className="flex flex-col items-center text-green-600 py-6">
                <CheckCircle2 className="w-16 h-16 mb-3" />
                <h3 className="text-2xl font-bold">รับสินค้าเรียบร้อยแล้ว</h3>
                <p className="text-sm mt-1 text-gray-500">ขอบคุณที่อุดหนุนสโมสรนักศึกษา</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">สแกนเพื่อรับสินค้า</p>
                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 inline-block">
                  <img src={barcodeUrl} alt={`Barcode for ${order.id}`} className="max-w-full h-24 object-contain" />
                </div>
                <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-4 py-2 rounded-full text-sm font-bold">
                  <Package className="w-4 h-4" /> จ่ายเงินแล้ว รอรับสินค้า
                </div>
              </>
            )}
          </div>

          {/* ส่วนรายละเอียดสินค้า */}
          <div className="p-8 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">รายการสินค้า</h3>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {item.products?.image_url ? (
                        <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">ไม่มีรูป</div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.products?.name}</p>
                      {item.size && <p className="text-xs font-medium text-gray-500">ไซซ์: {item.size}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">x{item.quantity}</p>
                    <p className="text-xs text-gray-500">฿{item.price_at_time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="font-bold text-gray-500">ยอดสุทธิ</span>
              <span className="text-2xl font-black text-gray-900">฿{order.total_amount}</span>
            </div>
            <p className="text-xs text-gray-400 text-center mt-6">
              สั่งซื้อเมื่อ {new Date(order.created_at).toLocaleString('th-TH')}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}