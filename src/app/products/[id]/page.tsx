'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/client'
import { useCart } from '@/context/CartContext'
import { Loader2, ArrowLeft, ShoppingBag, Ruler, AlertCircle, Minus, Plus, CreditCard, CheckCircle2, ChevronLeft, ChevronRight, Palette } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

type Product = {
  id: string
  name: string
  price: number
  stock_quantity: number
  image_url: string
  image_urls: string[] | null // รองรับหลายรูป
  category: string
  description: string
  size_info: string | null
  long_sleeve_price: number
  colors: string | null // รองรับหลายสี
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()
  const { addToCart } = useCart()
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  
  // State สำหรับตัวเลือกสินค้า
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isLongSleeve, setIsLongSleeve] = useState(false)
  const [addedSuccess, setAddedSuccess] = useState(false) 

  // State สำหรับ Image Slider
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  // เตรียมข้อมูลตัวเลือก
  const availableSizes = product?.size_info ? product.size_info.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
  const availableColors = product?.colors ? product.colors.split(',').map(c => c.trim()).filter(c => c.length > 0) : []
  
  // รวมรูปทั้งหมด (ถ้าระบบเก่ามีแค่ image_url ก็เอามาใช้เป็น array ช่องแรก)
  const allImages = product?.image_urls?.length 
    ? product.image_urls 
    : (product?.image_url ? [product.image_url] : [])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>

    const fetchProductAndSubscribe = async () => {
      // 1. ดึงข้อมูลสินค้าเริ่มต้น
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single()
      if (data) setProduct(data)
      setLoading(false)

      // 2. สมัครรับข้อมูล Realtime (เปิดท่อรอฟังการอัปเดตสต๊อก)
      channel = supabase
        .channel(`product-${productId}`)
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'products',
            filter: `id=eq.${productId}` 
          },
          (payload) => {
            console.log('🔄 สต๊อกอัปเดตแบบเรียลไทม์:', payload.new.stock_quantity)
            // อัปเดตเฉพาะค่าสต๊อกใน State ทันที
            setProduct((prev) => prev ? { ...prev, stock_quantity: payload.new.stock_quantity } : null)
          }
        )
        .subscribe()
    }

    fetchProductAndSubscribe()

    // 3. ปิดท่อการเชื่อมต่อเมื่อผู้ใช้ออกจากหน้านี้ (กันเมมโมรี่บวม)
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [productId, supabase])

  const finalUnitPrice = product ? product.price + (isLongSleeve ? (product.long_sleeve_price || 0) : 0) : 0

  // ฟังก์ชันเลื่อนรูป
  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % allImages.length)
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length)

  const handleAction = (shouldRedirectToCheckout: boolean) => {
    if (!product) return

    if (availableSizes.length > 0 && !selectedSize) {
      alert('กรุณาเลือกไซซ์ก่อนครับ')
      return
    }
    if (availableColors.length > 0 && !selectedColor) {
      alert('กรุณาเลือกสีก่อนครับ')
      return
    }

    // รวมข้อความ ไซซ์ แขน และสี เข้าด้วยกัน เพื่อส่งไปให้ตะกร้า
    let finalSizeText = selectedSize
    if (product.category === 'shirt') {
      finalSizeText = `${selectedSize} ${isLongSleeve ? '(แขนยาว)' : '(แขนสั้น)'}`
    }
    if (selectedColor) {
      finalSizeText = finalSizeText ? `${finalSizeText} - สี${selectedColor}` : `สี${selectedColor}`
    }

    if (shouldRedirectToCheckout) {
      // ✅ วิธีแก้บั๊กซื้อเลย: ส่งข้อมูลเฉพาะชิ้นนี้ผ่าน URL ไปที่หน้า Checkout
      const params = new URLSearchParams({
        direct: 'true',
        id: product.id,
        qty: quantity.toString(),
        size: finalSizeText || '',
        ls: isLongSleeve.toString() // ส่งค่าแขนยาวไปคำนวณราคาใหม่ด้วย
      })
      router.push(`/checkout?${params.toString()}`)
    } else {
      addToCart({
        product_id: product.id,
        name: product.name,
        price: finalUnitPrice,
        quantity: quantity,
        image_url: allImages[0] || '', // ใช้รูปแรกเป็นรูปในตะกร้า
        size: finalSizeText || undefined
      })
      setAddedSuccess(true)
      setTimeout(() => setAddedSuccess(false), 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>

  if (!product) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบสินค้านี้</h1>
      <p className="text-gray-500 mb-6">สินค้าอาจถูกลบออกไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
      <Link href="/products" className="text-gray-900 font-medium hover:underline flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> กลับไปหน้าสินค้า</Link>
    </div>
  )

  const isOutOfStock = product.stock_quantity <= 0
  const isShirt = product.category === 'shirt'
  const isReadyToBuy = !isOutOfStock && 
                       (availableSizes.length === 0 || selectedSize) && 
                       (availableColors.length === 0 || selectedColor)

  return (
    <div className="min-h-screen bg-white pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span className="font-medium">กลับ</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          {/* ส่วนแกลลอรีรูปภาพ (Image Slider) - ✅ เอา sticky top-24 ออกแก้รูปลอยทับ */}
          <div className="space-y-4">
            {/* รูปหลัก */}
            <div className="aspect-[4/5] md:aspect-square bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden relative group">
              {allImages.length > 0 ? (
                <img src={allImages[currentImageIdx]} alt={`${product.name} - ${currentImageIdx + 1}`} className="w-full h-full object-cover transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-medium">ไม่มีรูปภาพ</div>
              )}
              
              {/* ป้าย Sold Out */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <span className="bg-red-500 text-white px-8 py-3 rounded-full text-xl font-black tracking-widest uppercase transform -rotate-12 shadow-lg">Sold Out</span>
                </div>
              )}

              {/* ปุ่มเลื่อนซ้าย-ขวา (แสดงเฉพาะเมื่อมีมากกว่า 1 รูป) */}
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"><ChevronRight className="w-6 h-6" /></button>
                </>
              )}
            </div>

            {/* รูปย่อ (Thumbnails) */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentImageIdx(idx)}
                    className={clsx(
                      "w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                      currentImageIdx === idx ? "border-gray-900 shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ส่วนรายละเอียดสินค้า */}
          <div className="flex flex-col h-full space-y-8">
            <div>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                {product.category}
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-3 mb-6">
                <p className="text-4xl font-black text-gray-900">฿{finalUnitPrice}</p>
                {isLongSleeve && product.long_sleeve_price > 0 && (
                  <span className="text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">รวมค่าแขนยาวแล้ว</span>
                )}
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'ไม่มีรายละเอียดสินค้า'}
              </p>
            </div>

            {/* ระบบเลือกสี */}
            {availableColors.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4" /> เลือกสี
                  </h3>
                  <span className="text-sm text-gray-500 font-medium">{selectedColor || 'ยังไม่ได้เลือก'}</span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color, idx) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={clsx(
                          "px-5 py-2.5 rounded-full border-2 font-bold transition-all duration-200",
                          isSelected 
                            ? "border-gray-900 bg-gray-900 text-white shadow-md transform scale-105" 
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900"
                        )}
                      >
                        {color}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ระบบเลือกไซซ์ */}
            {availableSizes.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> เลือกขนาด (Size)
                  </h3>
                  <span className="text-sm text-gray-500 font-medium">{selectedSize ? selectedSize.split(':')[0] : 'ยังไม่ได้เลือก'}</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableSizes.map((sizeOption, idx) => {
                    const isSelected = selectedSize === sizeOption;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(sizeOption)}
                        className={clsx(
                          "px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200 group",
                          isSelected ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-900"
                        )}
                      >
                        <div className="font-bold text-lg leading-none">{sizeOption.split(':')[0]}</div>
                        {sizeOption.split(':')[1] && (
                          <div className={clsx("text-xs font-medium mt-1", isSelected ? "text-gray-300" : "text-gray-400 group-hover:text-gray-500")}>
                            {sizeOption.split(':')[1].trim()}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ระบบเลือกรูปแบบแขนเสื้อ (เฉพาะหมวดเสื้อ) */}
            {isShirt && (
              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">รูปแบบแขนเสื้อ</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsLongSleeve(false)} 
                    className={clsx("px-4 py-4 rounded-2xl border-2 text-center font-bold transition-all", !isLongSleeve ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-900")}
                  >
                    แขนสั้น <span className="block text-xs font-medium opacity-70 mt-1">ราคาปกติ</span>
                  </button>
                  <button 
                    onClick={() => setIsLongSleeve(true)} 
                    className={clsx("px-4 py-4 rounded-2xl border-2 text-center font-bold transition-all", isLongSleeve ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-900")}
                  >
                    แขนยาว <span className="block text-xs font-medium opacity-70 mt-1">{product.long_sleeve_price > 0 ? `+฿${product.long_sleeve_price}` : 'ฟรี'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ระบบเลือกจำนวนชิ้น */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">จำนวน</h3>
              <div className="flex items-center w-fit bg-gray-50 border border-gray-200 rounded-2xl p-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-colors shadow-sm"><Minus className="w-5 h-5" /></button>
                <span className="w-16 text-center font-black text-gray-900 text-xl">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-colors shadow-sm"><Plus className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-6">
                <span>สถานะสินค้า</span>
                <span className={clsx(isOutOfStock ? "text-red-500" : "text-green-600")}>
                  {isOutOfStock ? 'สินค้าหมด' : `มีสินค้า (${product.stock_quantity} ชิ้น)`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction(false)}
                  disabled={!isReadyToBuy}
                  className={clsx(
                    "w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all border-2",
                    !isReadyToBuy 
                      ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed" 
                      : addedSuccess
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-white text-gray-900 border-gray-900 hover:bg-gray-50"
                  )}
                >
                  {addedSuccess ? <CheckCircle2 className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                  {addedSuccess ? 'เพิ่มสำเร็จ!' : 'หยิบใส่ตะกร้า'}
                </button>

                <button
                  onClick={() => handleAction(true)}
                  disabled={!isReadyToBuy}
                  className={clsx(
                    "w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all shadow-sm",
                    !isReadyToBuy
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                      : "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md transform hover:-translate-y-0.5"
                  )}
                >
                  <CreditCard className="w-6 h-6" />
                  ซื้อสินค้าเลย
                </button>
              </div>
              
              {/* คำเตือนถ้ายังเลือกไม่ครบ */}
              {!isReadyToBuy && !isOutOfStock && (
                <p className="text-red-500 text-sm font-medium mt-4 text-center">กรุณาเลือกรูปแบบสินค้าให้ครบถ้วนก่อนทำรายการ</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}