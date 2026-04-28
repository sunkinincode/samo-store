'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/utils/supabase/client'
import { Loader2, AlertCircle, Upload, Clock, CheckCircle2 } from 'lucide-react'
import { processCheckout } from '@/app/actions/checkout'

export default function CheckoutPage() {
  const { checkoutItems, checkoutTotal, clearPurchasedItems } = useCart()
  const router = useRouter()
  const supabase = createClient()
  const formRef = useRef<HTMLFormElement>(null)

  const [promptpayPhone, setPromptpayPhone] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const [storeStatusMsg, setStoreStatusMsg] = useState('')

  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('store_settings').select('promptpay_phone, sale_start, sale_end').eq('id', 1).single()
      if (data) {
        if (data.promptpay_phone) setPromptpayPhone(data.promptpay_phone)
        const now = new Date().getTime()
        const start = data.sale_start ? new Date(data.sale_start).getTime() : null
        const end = data.sale_end ? new Date(data.sale_end).getTime() : null

        if (start && now < start) {
          setIsStoreOpen(false)
          setStoreStatusMsg(`ระบบจะเปิดรับออร์เดอร์ในวันที่ ${new Date(data.sale_start).toLocaleString('th-TH')}`)
        } else if (end && now > end) {
          setIsStoreOpen(false)
          setStoreStatusMsg('หมดเวลารอบการสั่งซื้อแล้ว')
        }
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  // --- ระบบนับถอยหลังที่แก้ไขแล้ว ---
  useEffect(() => {
    if (successOrderId && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (successOrderId && countdown <= 0) {
      router.push(`/orders/${successOrderId}`)
    }
  }, [successOrderId, countdown, router])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkoutItems.length > 0 && !isProcessing && isStoreOpen && !successOrderId) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [checkoutItems, isProcessing, isStoreOpen, successOrderId])

  useEffect(() => {
    if (!loading && checkoutItems.length === 0 && !successOrderId) {
      router.push('/cart')
    }
  }, [checkoutItems, loading, router, successOrderId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await processCheckout(formData, checkoutItems, checkoutTotal)

    if (result.error) {
      setError(result.error)
      setIsProcessing(false)
    } else if (result.success && result.orderId) {
      clearPurchasedItems() 
      setSuccessOrderId(result.orderId) 
    }
  }

  if (loading || (checkoutItems.length === 0 && !successOrderId)) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>

  if (successOrderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">ชำระเงินสำเร็จ!</h1>
          <p className="text-gray-500 mb-8">ขอบคุณสำหรับการสั่งซื้อ ระบบได้รับข้อมูลและสลิปการโอนเงินของคุณเรียบร้อยแล้ว</p>
          <div className="flex items-center gap-3 text-sm font-medium text-gray-900 bg-gray-50 px-6 py-3 rounded-full border border-gray-200">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            กำลังพาไปหน้าบาร์โค้ดใน {countdown} วินาที...
          </div>
        </div>
      </div>
    )
  }

  if (!isStoreOpen) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-50 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="w-10 h-10" /></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">ร้านปิดรับออร์เดอร์</h1>
          <p className="text-lg text-gray-600 mb-8">{storeStatusMsg}</p>
          <button onClick={() => router.push('/products')} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">กลับไปหน้าสินค้า</button>
        </div>
      </>
    )
  }

  const qrUrl = promptpayPhone && promptpayPhone !== '-' ? `https://promptpay.io/${promptpayPhone}/${checkoutTotal}.png` : null

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ชำระเงิน</h1>
          <p className="mt-2 text-red-500 text-sm font-medium">กรุณาอย่าออกจากหน้านี้จนกว่าการชำระเงินจะเสร็จสิ้น</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col items-center justify-center mb-10 pb-10 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-500 mb-2">ยอดที่ต้องชำระ</span>
            <span className="text-4xl font-bold text-gray-900 mb-6">฿{checkoutTotal}</span>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center">
              {qrUrl ? <img src={qrUrl} alt="PromptPay QR Code" className="w-48 h-48 sm:w-64 sm:h-64 object-contain mb-4 bg-white p-2 rounded-xl border border-gray-200" /> : <div className="w-48 h-48 bg-gray-200 flex items-center justify-center mb-4 rounded-xl"><span className="text-gray-500 text-sm">ยังไม่ได้ตั้งค่าเบอร์ PromptPay</span></div>}
              <p className="text-sm font-medium text-gray-600">สแกนเพื่อชำระเงินผ่านแอปธนาคาร</p>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 text-center">อัปโหลดสลิปโอนเงิน</label>
              <div className="relative">
                <input type="file" name="slip" accept="image/jpeg, image/png, image/webp" required onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {previewUrl ? (
                  <div className="w-full h-64 border-2 border-gray-200 rounded-2xl overflow-hidden relative group bg-gray-50 flex items-center justify-center">
                    <img src={previewUrl} alt="Slip Preview" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold flex items-center gap-2"><Upload className="w-4 h-4" /> เปลี่ยนรูปสลิป</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-gray-900">คลิก หรือ ลากไฟล์สลิปมาวางที่นี่</span>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={isProcessing || !previewUrl} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-8 shadow-sm">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังตรวจสอบข้อมูลสลิป...</> : 'ยืนยันการชำระเงิน'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}