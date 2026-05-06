export const dynamic = 'force-dynamic'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Package, Clock, Megaphone, ShoppingCart } from 'lucide-react'
import ProductImageCarousel from '@/components/ProductImageCarousel' // ✅ Import Component ใหม่

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: products }, { data: settings }] = await Promise.all([
    supabase.from('products').select('id,name,price,stock_quantity,image_url,image_urls,category,description,size_info,long_sleeve_price,colors,is_set,set_items,is_preorder').order('created_at', { ascending: false }),
    supabase.from('store_settings').select('sale_start, sale_end').eq('id', 1).single()
  ])

  const now = new Date().getTime()
  const start = settings?.sale_start ? new Date(settings.sale_start).getTime() : null
  const end = settings?.sale_end ? new Date(settings.sale_end).getTime() : null

  let announcement = null
  let isStoreClosed = false

  if (start && now < start) {
    const startTimeStr = new Date(settings!.sale_start).toLocaleString('th-TH', { 
      timeZone: 'Asia/Bangkok', 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    })
    announcement = `ระบบจะเปิดรับออร์เดอร์ในวันที่ ${startTimeStr} น.`
    isStoreClosed = true
  } else if (end && now > end) {
    announcement = 'หมดเวลารอบการสั่งซื้อแล้ว ขอบคุณที่ให้ความสนใจครับ'
    isStoreClosed = true
  }

  const displayName = user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {user && (
        <header className="bg-white border-b border-gray-100 py-6 px-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900">
              ยินดีต้อนรับ, <span className="text-blue-600">{displayName}</span> 👋
            </h2>
            <p className="text-gray-500 mt-1 text-sm">เลือกชมและสั่งซื้อสินค้าที่คุณสนใจได้เลยครับ</p>
          </div>
        </header>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-gray-900" />
            สินค้าทั้งหมด
          </h1>
          <p className="text-gray-500 mt-2 text-lg">เลือกซื้อสินค้าของสโมสรนักศึกษาได้ที่นี่</p>
        </div>

        {announcement && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
              <div className="bg-yellow-100 p-3 rounded-full shrink-0">
                <Megaphone className="w-8 h-8 text-yellow-700" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold text-yellow-900">ประกาศจากสโมสร</h3>
                <p className="text-yellow-800 font-medium mt-1">{announcement}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product) => {
            const isOutOfStock = !product.is_preorder && product.stock_quantity <= 0

            // ✅ รวบรวมรูปภาพทั้งหมด (ทั้งแบบ array และรูปเดี่ยว)
            const allImages = product.image_urls?.length > 0 
              ? product.image_urls 
              : (product.image_url ? [product.image_url] : [])

            return (
              <div key={product.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
                
                {user && !isStoreClosed ? (
                  <Link href={`/products/${product.id}`} className="aspect-square bg-gray-50 relative overflow-hidden block">
                    {/* ✅ เรียกใช้ Carousel ใหม่ */}
                    <ProductImageCarousel images={allImages} alt={product.name} />
                    <ProductBadges isOutOfStock={isOutOfStock} isStoreClosed={isStoreClosed} isPreorder={product.is_preorder} />
                  </Link>
                ) : (
                  <div className="aspect-square bg-gray-50 relative overflow-hidden block cursor-pointer" 
                       title={!user ? "กรุณาเข้าสู่ระบบ" : isStoreClosed ? "ยังไม่เปิดรับออร์เดอร์" : ""}>
                    {/* ✅ เรียกใช้ Carousel ใหม่ */}
                    <ProductImageCarousel images={allImages} alt={product.name} />
                    <ProductBadges isOutOfStock={isOutOfStock} isStoreClosed={isStoreClosed} isPreorder={product.is_preorder} />
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4 flex-1">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-400 mt-1 capitalize">{product.category}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <span className="text-2xl font-black text-gray-900">฿{product.price}</span>
                    
                    {!user ? (
                      <Link href="/login?error=กรุณาเข้าสู่ระบบก่อนสั่งซื้อสินค้า" className="p-3 rounded-2xl bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white shadow-sm transition-all">
                        <ShoppingCart className="w-5 h-5" />
                      </Link>
                    ) : isStoreClosed || isOutOfStock ? (
                      <div className="p-3 rounded-2xl bg-gray-100 text-gray-400 cursor-not-allowed">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                    ) : (
                      <Link href={`/products/${product.id}`} className="p-3 rounded-2xl bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white shadow-sm transition-all">
                        <ShoppingCart className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {products?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">ยังไม่มีสินค้าจำหน่าย</h3>
            <p className="text-gray-500">ทางสโมสรกำลังเตรียมสินค้าใหม่ โปรดติดตามเร็วๆ นี้</p>
          </div>
        )}
      </main>
    </div>
  )
}

// ฟังก์ชันป้ายกำกับสินค้า
function ProductBadges({ isOutOfStock, isStoreClosed, isPreorder }: { isOutOfStock: boolean, isStoreClosed: boolean, isPreorder: boolean }) {
  if (isOutOfStock) {
    return <div className="absolute top-4 right-4 z-20 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">Sold Out</div>
  }
  if (isPreorder) {
    return <div className="absolute top-4 right-4 z-20 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">Pre-Order</div>
  }
  if (isStoreClosed) {
    return <div className="absolute top-4 right-4 z-20 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"><Clock className="w-3 h-3" /> ยังไม่เปิดขาย</div>
  }
  return null
}