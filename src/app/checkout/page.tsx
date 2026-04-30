'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/utils/supabase/client'
import { Loader2, AlertCircle, Upload, Clock, CheckCircle2 } from 'lucide-react'
import { processCheckout } from '@/app/actions/checkout'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const { checkoutItems, checkoutTotal, clearPurchasedItems } = useCart()
  const router = useRouter()
  const supabase = createClient()
  const formRef = useRef<HTMLFormElement>(null)

  const [displayItems, setDisplayItems] = useState<any[]>([])
  const [localTotal, setLocalTotal] = useState(0)

  const [promptpayPhone, setPromptpayPhone] = useState<string | null>(null)
  const [bankInfo, setBankInfo] = useState<{name: string, no: string, accountName: string} | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const [storeStatusMsg, setStoreStatusMsg] = useState('')

  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null)

  useEffect(() => {
    const fetchSettingsAndProduct = async () => {
      const { data } = await supabase.from('store_settings').select('promptpay_phone, sale_start, sale_end, bank_name, bank_account_no, bank_account_name').eq('id', 1).single()
      
      if (data) {
        // ✅ ปรับให้ดึงข้อมูลมารอไว้ก่อน
        setPromptpayPhone(data.promptpay_phone)
        
        if (data.bank_account_no) {
          setBankInfo({
            name: data.bank_name || 'ไม่ระบุธนาคาร',
            no: data.bank_account_no,
            accountName: data.bank_account_name || 'ไม่ระบุชื่อบัญชี'
          })
        }

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

      const isDirect = searchParams.get('direct') === 'true'

      if (isDirect) {
        const productId = searchParams.get('id')
        const qty = parseInt(searchParams.get('qty') || '1')
        const size = searchParams.get('size') || ''
        const isLongSleeve = searchParams.get('ls') === 'true'

        if (productId) {
          const { data: product } = await supabase.from('products').select('*').eq('id', productId).single()
          if (product) {
            const finalPrice = product.price + (isLongSleeve ? (product.long_sleeve_price || 0) : 0)
            setDisplayItems([{
              product_id: product.id,
              name: product.name,
              price: finalPrice,
              quantity: qty,
              size: size,
              image_url: product.image_url
            }])
            setLocalTotal(finalPrice * qty)
          }
        }
      } else {
        setDisplayItems(checkoutItems)
        setLocalTotal(checkoutTotal)
      }
      
      setLoading(false)
    }
    fetchSettingsAndProduct()
  }, [searchParams, checkoutItems, checkoutTotal, supabase])

  useEffect(() => {
    if (successOrderId && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (successOrderId && countdown <= 0) {
      router.push(`/orders/${successOrderId}`)
    }
  }, [successOrderId, countdown, router])

  useEffect(() => {
    if (timeoutCountdown !== null && timeoutCountdown > 0) {
      const timer = setTimeout(() => setTimeoutCountdown(timeoutCountdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeoutCountdown === 0) {
      window.location.reload()
    }
  }, [timeoutCountdown])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (displayItems.length > 0 && !isProcessing && isStoreOpen && !successOrderId) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [displayItems, isProcessing, isStoreOpen, successOrderId])

  useEffect(() => {
    if (!loading && displayItems.length === 0 && !successOrderId) {
      router.push('/cart')
    }
  }, [displayItems, loading, router, successOrderId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const maxSizeInBytes = 5 * 1024 * 1024 
      if (file.size > maxSizeInBytes) {
        setError('ไฟล์รูปภาพใหญ่เกินไป (จำกัดไม่เกิน 5MB) กรุณาครอปรูปหรือลดขนาดลงครับ')
        e.target.value = '' 
        setPreviewUrl(null)
        return
      }
      setError(null)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)
    setTimeoutCountdown(null)

    const formData = new FormData(e.currentTarget)
    
    // ✅ ตัวจับเวลา 20 วินาทีฝั่งหน้าบ้าน
    let isRequestCompleted = false
    const clientTimeout = setTimeout(() => {
      if (!isRequestCompleted) {
        setError('ระบบหลังบ้านใช้เวลาตรวจสอบสลิปนานเกินไป (เซิร์ฟเวอร์ขัดข้อง)')
        setTimeoutCountdown(5) // เริ่มนับถอยหลังรีเฟรชหน้า
      }
    }, 20000) // 20 วินาที

    try {
      const result = await processCheckout(formData, displayItems, localTotal)
      isRequestCompleted = true
      clearTimeout(clientTimeout) // ยกเลิกการจับเวลาถ้าระบบตอบกลับมาทัน

      if (result.errorType === 'TIMEOUT') {
        setError(result.error)
        setTimeoutCountdown(5)
      } else if (result.error) {
        setError(result.error)
        setIsProcessing(false)
      } else if (result.success && result.orderId) {
        if (searchParams.get('direct') !== 'true') {
          clearPurchasedItems() 
        }
        setSuccessOrderId(result.orderId) 
      }
    } catch (err) {
      isRequestCompleted = true
      clearTimeout(clientTimeout)
      setError('เกิดข้อผิดพลาดโปรดอัพโหลดสลิปใหม่อีกครั้ง')
      setIsProcessing(false)
    }
  }

  if (loading || (displayItems.length === 0 && !successOrderId)) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>

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
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-50 text-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="w-10 h-10" /></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">ร้านปิดรับออร์เดอร์</h1>
          <p className="text-lg text-gray-600 mb-8">{storeStatusMsg}</p>
          <button onClick={() => router.push('/products')} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">กลับไปหน้าสินค้า</button>
        </div>
      </>
    )
  }

  // ✅ เช็คเงื่อนไข QR Code ให้รัดกุมขึ้น กันกรณีเป็นค่าว่างหรือขีด
  const hasValidPromptPay = promptpayPhone && promptpayPhone.trim() !== '' && promptpayPhone !== '-'
  const qrUrl = hasValidPromptPay ? `https://promptpay.io/${promptpayPhone}/${localTotal}.png` : null

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ชำระเงิน</h1>
          <p className="mt-2 text-red-500 text-sm font-medium">กรุณาอย่าออกจากหน้านี้จนกว่าการชำระเงินจะเสร็จสิ้น</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col items-center justify-center mb-10 pb-10 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-500 mb-2">ยอดที่ต้องชำระ</span>
            <span className="text-4xl font-bold text-gray-900 mb-6">฿{localTotal}</span>
            <div className="bg-gray-50 w-full max-w-md p-6 rounded-2xl border border-gray-100 flex flex-col items-center">
              
              {/* ✅ แสดง QR หรือ ข้อความเตือนถ้าไม่มีเบอร์ */}
              {qrUrl ? (
                <img src={qrUrl} alt="PromptPay QR Code" className="w-48 h-48 sm:w-64 sm:h-64 object-contain mb-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm" />
              ) : (
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center mb-4 rounded-xl">
                  <span className="text-gray-500 text-sm font-medium text-center px-4">ยังไม่ได้ตั้งค่า<br/>เบอร์ PromptPay</span>
                </div>
              )}
              <p className="text-sm font-bold text-gray-600 mb-1">สแกนเพื่อชำระเงินผ่านแอปธนาคาร</p>
              
              {bankInfo && (
                <div className="mt-6 pt-6 w-full border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-bold">หรือโอนเข้าบัญชีธนาคาร</p>
                  <div className="bg-white py-3 px-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-bold text-gray-900">{bankInfo.name}</p>
                    <p className="text-lg font-mono text-gray-900 tracking-wider my-1">{bankInfo.no}</p>
                    <p className="text-xs text-gray-500">{bankInfo.accountName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  {timeoutCountdown !== null && (
                    <p className="text-sm text-red-600 mt-1 font-bold">
                      กำลังรีเฟรชหน้านี้ใน {timeoutCountdown} วินาที...
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">รายการสินค้า</h3>
              {displayItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.size || 'ไม่มีไซซ์'} | จำนวน: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-sm">฿{item.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3 text-center">อัปโหลดสลิปโอนเงิน</label>
              <div className="relative">
                <input type="file" name="slip" accept="image/jpeg, image/png, image/webp" required onChange={handleFileChange} disabled={isProcessing || timeoutCountdown !== null} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
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

            <button type="submit" disabled={isProcessing || !previewUrl || timeoutCountdown !== null} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-8 shadow-sm">
              {isProcessing && timeoutCountdown === null ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังตรวจสอบข้อมูลสลิป...</> : 'ยืนยันการชำระเงิน'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}