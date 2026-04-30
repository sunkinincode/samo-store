'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/client'
import { useCart } from '@/context/CartContext'
import { Loader2, ArrowLeft, ShoppingBag, Ruler, AlertCircle, Minus, Plus, CreditCard, CheckCircle2, ChevronLeft, ChevronRight, Palette, Package } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

type SetItem = {
  id: string
  product_id: string
  quantity: number
}

type Product = {
  id: string
  name: string
  price: number
  stock_quantity: number
  image_url: string
  image_urls: string[] | null
  category: string
  description: string
  size_info: string | null
  long_sleeve_price: number
  colors: string | null
  is_preorder: boolean
  is_set: boolean
  set_items: SetItem[] | null
}

type Selection = {
  product_id: string
  name: string
  category: string
  size: string
  color: string
  isLongSleeve: boolean
  // ✅ เพิ่มฟิลด์สำหรับเก็บตัวเลือกสี/ไซซ์ ของสินค้านั้นๆ เอง
  availableSizes: string[] 
  availableColors: string[]
  longSleevePrice: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()
  const { addToCart } = useCart()
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState<Selection[]>([])
  const [quantity, setQuantity] = useState(1) 
  const [addedSuccess, setAddedSuccess] = useState(false) 
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  
  const allImages = product?.image_urls?.length 
    ? product.image_urls 
    : (product?.image_url ? [product.image_url] : [])

  const totalPieces = product?.is_set && product.set_items
    ? product.set_items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 1

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>

    const fetchProductAndSubscribe = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single()
      if (data) {
        setProduct(data)
        
        let initialSelections: Selection[] = []

        if (data.is_set && data.set_items) {
          const subProductIds = data.set_items.map((item: any) => item.product_id)
          // ✅ ดึงข้อมูล colors, size_info, long_sleeve_price ของสินค้าย่อยมาด้วย
          const { data: subProducts } = await supabase.from('products').select('id, name, category, colors, size_info, long_sleeve_price').in('id', subProductIds)
          
          const subProductsMap: Record<string, any> = {}
          if (subProducts) {
            subProducts.forEach(sp => { subProductsMap[sp.id] = sp })
          }

          data.set_items.forEach((item: any) => {
            const sp = subProductsMap[item.product_id] || { name: 'สินค้า', category: 'shirt', colors: null, size_info: null, long_sleeve_price: 0 }
            
            // แยก string ให้เป็น array
            const availSizes = sp.size_info ? sp.size_info.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []
            const availColors = sp.colors ? sp.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0) : []

            for (let i = 0; i < (item.quantity || 1); i++) {
              initialSelections.push({
                product_id: item.product_id,
                name: sp.name,
                category: sp.category,
                size: '',
                color: '',
                isLongSleeve: false,
                availableSizes: availSizes,
                availableColors: availColors,
                longSleevePrice: sp.long_sleeve_price || 0
              })
            }
          })
        } else {
          // ถ้าเป็นสินค้าเดี่ยว ก็ดึงจากตัวมันเอง
          const availSizes = data.size_info ? data.size_info.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []
          const availColors = data.colors ? data.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0) : []

          initialSelections.push({
            product_id: data.id,
            name: data.name,
            category: data.category,
            size: '',
            color: '',
            isLongSleeve: false,
            availableSizes: availSizes,
            availableColors: availColors,
            longSleevePrice: data.long_sleeve_price || 0
          })
        }
        
        setSelections(initialSelections)
      }
      setLoading(false)

      channel = supabase.channel(`product-${productId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${productId}` }, (payload) => {
            setProduct((prev) => prev ? { ...prev, stock_quantity: payload.new.stock_quantity } : null)
          }
        ).subscribe()
    }

    fetchProductAndSubscribe()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [productId, supabase])

  const updateSelection = (index: number, field: keyof Selection, value: string | boolean) => {
    setSelections(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // ✅ คิดราคาแขนยาว โดยอ้างอิงจาก longSleevePrice ของสินค้าชิ้นนั้นๆ เอง
  const sleeveAddonCount = selections.filter(s => s.isLongSleeve).length
  const totalSleevePrice = selections.reduce((sum, s) => sum + (s.isLongSleeve ? s.longSleevePrice : 0), 0)
  const finalUnitPrice = product ? product.price + totalSleevePrice : 0

  const nextImage = () => setCurrentImageIdx((prev) => (prev + 1) % allImages.length)
  const prevImage = () => setCurrentImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length)

  const handleAction = (shouldRedirectToCheckout: boolean) => {
    if (!product) return

    for (const s of selections) {
      if (s.availableSizes.length > 0 && !s.size) {
        alert(`กรุณาเลือกไซซ์สำหรับ: ${s.name}`)
        return
      }
      if (s.availableColors.length > 0 && !s.color) {
        alert(`กรุณาเลือกสีสำหรับ: ${s.name}`)
        return
      }
    }

    let finalSizeText = ''
    if (totalPieces === 1) {
      const s = selections[0]
      if (s.availableSizes.length === 0 && s.availableColors.length === 0 && !s.longSleevePrice) {
        finalSizeText = ''
      } else {
        if (s.availableSizes.length > 0) finalSizeText = `${s.size} ${s.isLongSleeve ? '(แขนยาว)' : '(แขนสั้น)'}`
        if (s.availableColors.length > 0) finalSizeText = finalSizeText ? `${finalSizeText} - สี${s.color}` : `สี${s.color}`
      }
    } else {
      finalSizeText = selections.map((s, idx) => {
        if (s.availableSizes.length === 0 && s.availableColors.length === 0 && !s.longSleevePrice) return `${s.name} (ชิ้นที่ ${idx + 1}): -`

        let textParts = []
        if (s.availableSizes.length > 0) textParts.push(`${s.size || ''} ${s.isLongSleeve ? '(แขนยาว)' : '(แขนสั้น)'}`)
        if (s.availableColors.length > 0) textParts.push(`สี${s.color}`)

        return `${s.name} (ชิ้นที่ ${idx + 1}): ${textParts.join(' - ') || '-'}`
      }).join(' | ')
    }

    if (shouldRedirectToCheckout) {
      const params = new URLSearchParams({
        direct: 'true',
        id: product.id,
        qty: quantity.toString(),
        size: finalSizeText || '',
        ls: (sleeveAddonCount > 0).toString() 
      })
      router.push(`/checkout?${params.toString()}`)
    } else {
      addToCart({
        product_id: product.id,
        name: product.name,
        price: finalUnitPrice,
        quantity: quantity,
        image_url: allImages[0] || '',
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
      <Link href="/products" className="text-gray-900 font-medium hover:underline flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> กลับไปหน้าสินค้า</Link>
    </div>
  )

  const isOutOfStock = !product.is_preorder && product.stock_quantity <= 0
  
  const isReadyToBuy = !isOutOfStock && selections.length > 0 && selections.every(s => {
    const sizeOk = s.availableSizes.length === 0 || s.size !== ''
    const colorOk = s.availableColors.length === 0 || s.color !== ''
    return sizeOk && colorOk
  })

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span className="font-medium">กลับ</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          <div className="space-y-4 md:sticky md:top-24">
            <div className="aspect-[4/5] md:aspect-square bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden relative group">
              {allImages.length > 0 ? (
                <img src={allImages[currentImageIdx]} alt={`${product.name} - ${currentImageIdx + 1}`} className="w-full h-full object-cover transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-medium">ไม่มีรูปภาพ</div>
              )}
              
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <span className="bg-red-500 text-white px-8 py-3 rounded-full text-xl font-black tracking-widest uppercase transform -rotate-12 shadow-lg">Sold Out</span>
                </div>
              )}
              
              {!isOutOfStock && product.is_preorder && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest shadow-md">Pre-Order</span>
                </div>
              )}

              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"><ChevronRight className="w-6 h-6" /></button>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIdx(idx)} className={clsx("w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all", currentImageIdx === idx ? "border-gray-900 shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col h-full space-y-8">
            <div>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                {product.is_set ? 'เซตสินค้า (Bundle)' : product.category}
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-3 mb-6">
                <p className="text-4xl font-black text-gray-900">฿{finalUnitPrice}</p>
                {totalSleevePrice > 0 && (
                  <span className="text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                    บวกค่าแขนยาว ฿{totalSleevePrice}
                  </span>
                )}
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'ไม่มีรายละเอียดสินค้า'}
              </p>
            </div>

            <div className="flex flex-col gap-6 pt-4 border-t border-gray-100">
              {selections.map((selection, idx) => {
                
                // ✅ ถ้าสินค้าชิ้นนี้ไม่มีสี ไม่มีไซซ์ ให้ข้ามไปเลย
                if (selection.availableSizes.length === 0 && selection.availableColors.length === 0 && !selection.longSleevePrice) {
                  return (
                    <div key={idx} className={clsx("transition-all", totalPieces > 1 ? "p-4 sm:p-6 bg-gray-50 rounded-3xl border border-gray-200" : "")}>
                      {totalPieces > 1 && (
                        <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                          <Package className="w-5 h-5 text-purple-600" /> ชิ้นที่ {idx + 1}: {selection.name}
                        </h3>
                      )}
                      {totalPieces > 1 && <p className="text-sm text-gray-500 mt-2">ไม่ต้องระบุตัวเลือกเพิ่มเติม</p>}
                    </div>
                  )
                }

                return (
                  <div key={idx} className={clsx("transition-all", totalPieces > 1 ? "p-4 sm:p-6 bg-gray-50 rounded-3xl border border-gray-200" : "")}>
                    
                    {totalPieces > 1 && (
                      <h3 className="text-base sm:text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" /> ชิ้นที่ {idx + 1}: {selection.name}
                      </h3>
                    )}

                    <div className="space-y-6">
                      
                      {/* ✅ แสดงกล่องเลือกสี เฉพาะถ้ามีให้เลือก */}
                      {selection.availableColors.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <Palette className="w-4 h-4" /> เลือกสี
                            </h4>
                            <span className="text-sm text-gray-500 font-medium">{selection.color || 'ยังไม่ได้เลือก'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {selection.availableColors.map((color, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => updateSelection(idx, 'color', color)}
                                className={clsx(
                                  "px-4 py-2 rounded-full border-2 font-bold transition-all duration-200 text-sm sm:text-base",
                                  selection.color === color ? "border-gray-900 bg-gray-900 text-white shadow-md transform scale-105" : "border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900"
                                )}
                              >
                                {color}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ✅ แสดงกล่องเลือกไซซ์ เฉพาะถ้ามีให้เลือก */}
                      {selection.availableSizes.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <Ruler className="w-4 h-4" /> เลือกขนาด (Size)
                            </h4>
                            <span className="text-sm text-gray-500 font-medium">{selection.size ? selection.size.split(':')[0] : 'ยังไม่ได้เลือก'}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {selection.availableSizes.map((sizeOption, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => updateSelection(idx, 'size', sizeOption)}
                                className={clsx(
                                  "px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border-2 text-left transition-all duration-200 group",
                                  selection.size === sizeOption ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-900"
                                )}
                              >
                                <div className="font-bold text-base sm:text-lg leading-none">{sizeOption.split(':')[0]}</div>
                                {sizeOption.split(':')[1] && (
                                  <div className={clsx("text-[10px] sm:text-xs font-medium mt-1", selection.size === sizeOption ? "text-gray-300" : "text-gray-400 group-hover:text-gray-500")}>
                                    {sizeOption.split(':')[1].trim()}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ✅ แสดงกล่องเลือกแขนเสื้อ เฉพาะถ้ามีการตั้งค่าราคาแขนยาวไว้ */}
                      {selection.longSleevePrice > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">รูปแบบแขนเสื้อ</h4>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button 
                              onClick={() => updateSelection(idx, 'isLongSleeve', false)} 
                              className={clsx("px-3 py-3 sm:px-4 sm:py-4 rounded-2xl border-2 text-center font-bold transition-all text-sm sm:text-base", !selection.isLongSleeve ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-900")}
                            >
                              แขนสั้น <span className="block text-[10px] sm:text-xs font-medium opacity-70 mt-1">ราคาปกติ</span>
                            </button>
                            <button 
                              onClick={() => updateSelection(idx, 'isLongSleeve', true)} 
                              className={clsx("px-3 py-3 sm:px-4 sm:py-4 rounded-2xl border-2 text-center font-bold transition-all text-sm sm:text-base", selection.isLongSleeve ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-900")}
                            >
                              แขนยาว <span className="block text-[10px] sm:text-xs font-medium opacity-70 mt-1">+฿{selection.longSleevePrice}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>

            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">จำนวน{product.is_set ? 'เซต' : 'ชิ้น'}</h3>
              <div className="flex items-center w-fit bg-gray-50 border border-gray-200 rounded-2xl p-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-colors shadow-sm"><Minus className="w-5 h-5" /></button>
                <span className="w-16 text-center font-black text-gray-900 text-xl">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-white rounded-xl transition-colors shadow-sm"><Plus className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-6">
                <span>สถานะสินค้า</span>
                <span className={clsx(isOutOfStock ? "text-red-500" : "text-green-600")}>
                  {isOutOfStock ? 'สินค้าหมด' : product.is_preorder ? 'เปิดรับพรีออร์เดอร์' : `มีสินค้า (${product.stock_quantity} ${product.is_set ? 'เซต' : 'ชิ้น'})`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => handleAction(false)} disabled={!isReadyToBuy} className={clsx("w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all border-2", !isReadyToBuy ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed" : addedSuccess ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-900 border-gray-900 hover:bg-gray-50")}>
                  {addedSuccess ? <CheckCircle2 className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                  {addedSuccess ? 'เพิ่มสำเร็จ!' : 'หยิบใส่ตะกร้า'}
                </button>

                <button onClick={() => handleAction(true)} disabled={!isReadyToBuy} className={clsx("w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg transition-all shadow-sm", !isReadyToBuy ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200" : "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md transform hover:-translate-y-0.5")}>
                  <CreditCard className="w-6 h-6" /> ซื้อสินค้าเลย
                </button>
              </div>
              
              {!isReadyToBuy && !isOutOfStock && (
                <p className="text-red-500 text-sm font-medium mt-4 text-center animate-pulse">กรุณาระบุตัวเลือกให้ครบทุกชิ้นก่อนสั่งซื้อ</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}