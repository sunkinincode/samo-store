import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Package, ArrowRight, ShoppingCart, Leaf, ShieldCheck, Zap, Sparkles } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(4)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-green-200">
      <Navbar />
      
      {/* Hero Section - Glassmorphism & Green Gradient */}
      <section className="relative pt-24 pb-32 px-4 overflow-hidden flex items-center justify-center min-h-[80vh]">
        {/* Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 bg-white/40 backdrop-blur-xl p-12 sm:p-16 rounded-[3rem] border border-white/60 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50/80 border border-green-200 text-green-700 font-bold text-sm mb-4 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>Welcome to Science Student Union</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight">
            Samo <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Store</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            ระบบสั่งซื้อสินค้าที่ระลึก สโมสรนักศึกษาคณะวิทยาศาสตร์ <br className="hidden sm:block" />
            <span className="text-gray-500 text-lg">Low Carbon • High Charity • Green Shopping</span>
          </p>

          <div className="pt-6">
            {!user ? (
              <Link 
                href="/login" 
                className="inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-green-600 transition-all duration-300 shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-1"
              >
                เริ่มต้นใช้งาน <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                href="/products" 
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:from-green-500 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-1"
              >
                ไปช้อปกันเลย <ShoppingCart className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-green-600">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">สะดวกรวดเร็ว</h3>
              <p className="text-gray-500">ระบบสั่งซื้อที่ออกแบบมาให้ใช้งานง่าย เลือกไซซ์ สี และรูปแบบได้อย่างอิสระในไม่กี่คลิก</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-emerald-500">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">ปลอดภัย ตรวจสอบได้</h3>
              <p className="text-gray-500">ระบบแนบสลิปและตรวจสอบบาร์โค้ดรับสินค้า หมดปัญหาของหายหรือรับของซ้ำซ้อน</p>
            </div>

            <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-teal-500">
                <Leaf className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">สนับสนุนกิจกรรม</h3>
              <p className="text-gray-500">รายได้จากการจำหน่ายสินค้า นำไปสนับสนุนกิจกรรมของสโมสรนักศึกษาเพื่อประโยชน์ส่วนรวม</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col sm:flex-row items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-green-600" /> สินค้ามาใหม่ล่าสุด
            </h2>
            <p className="text-gray-500 mt-2 text-lg">อย่าพลาดคอลเลกชันใหม่จากสโมสร</p>
          </div>
          <Link href="/products" className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline transition-colors flex items-center gap-1">
            ดูสินค้าทั้งหมด <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products?.map((product) => (
            <div key={product.id} className="group flex flex-col bg-white rounded-[2rem] p-3 border border-gray-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-100 transition-all duration-500">
              <div className="aspect-square rounded-[1.5rem] bg-gray-50 overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">ไม่มีรูป</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {product.is_set && (
                  <span className="absolute top-4 left-4 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    BUNDLE SET
                  </span>
                )}
              </div>
              
              <div className="mt-5 px-3 pb-3 flex-1 flex flex-col">
                <p className="text-green-600 text-xs font-bold uppercase tracking-wider mb-1">{product.category}</p>
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-green-700 transition-colors">{product.name}</h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">฿{product.price}</span>
                  <Link 
                    href={user ? "/products" : "/login?error=กรุณาเข้าสู่ระบบเพื่อสั่งซื้อสินค้า"}
                    className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-900 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 transform group-hover:-rotate-12"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="border-t border-gray-200 bg-white py-12 text-center text-gray-500 text-sm font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
          <Leaf className="w-6 h-6 text-green-500 mb-2" />
          <p>© 2026 Science Student Union, PSU Hatyai.</p>
          <p>Powered by Next.js & Supabase</p>
        </div>
      </footer>
    </div>
  )
}