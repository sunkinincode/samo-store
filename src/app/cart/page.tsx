'use client'

import Navbar from '@/components/Navbar'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { ShoppingBag, ArrowRight, Trash2, Minus, Plus } from 'lucide-react'
import clsx from 'clsx'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, selectedKeys, toggleSelection, toggleAll, checkoutTotal, checkoutItems } = useCart()

  const isAllSelected = cart.length > 0 && selectedKeys.length === cart.length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ตะกร้าสินค้า</h1>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">ตะกร้าของคุณยังว่างเปล่า</h2>
            <p className="text-gray-500 mb-8">ลองไปเลือกดูสินค้าที่ระลึกของสโมสรดูก่อนสิครับ</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-full font-medium hover:bg-gray-800 transition-all shadow-sm">
              ไปเลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            
            {/* เมนู "เลือกทั้งหมด" */}
            <div className="bg-gray-50/80 p-4 sm:px-8 border-b border-gray-100 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={isAllSelected} onChange={toggleAll} className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer peer" />
                </div>
                <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors">เลือกทั้งหมด</span>
              </label>
              <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                เลือกแล้ว {selectedKeys.length} รายการ
              </span>
            </div>

            {/* รายการสินค้า */}
            <div className="p-4 sm:p-8 space-y-6">
              {cart.map((item, index) => {
                const itemKey = `${item.product_id}-${item.size || ''}`
                const isSelected = selectedKeys.includes(itemKey)

                return (
                  <div key={itemKey} className={clsx("flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0 transition-opacity duration-200", !isSelected && "opacity-60")}>
                    
                    {/* Checkbox */}
                    <div className="pt-2 sm:pt-0 pl-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(item.product_id, item.size)}
                        className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer" 
                      />
                    </div>

                    {/* รูปสินค้า */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium">ไม่มีรูป</div>}
                    </div>

                    {/* รายละเอียด */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
                        <button onClick={() => removeFromCart(item.product_id, item.size)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 -mt-2 -mr-2" title="ลบออกจากตะกร้า">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {item.size && (
                        <p className="text-sm font-medium text-gray-500 mb-3">ไซซ์: <strong className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{item.size}</strong></p>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <span className="font-black text-gray-900 text-xl">฿{item.price}</span>
                        
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
                          <button onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.size)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm"><Minus className="w-4 h-4" /></button>
                          <span className="w-10 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.size)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ส่วนสรุปยอดและปุ่มจ่ายเงิน */}
            <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-100">
              <div className="flex justify-between items-end mb-6">
                <span className="text-gray-500 font-bold">ยอดรวมที่ต้องชำระ (เฉพาะที่เลือก)</span>
                <span className="text-4xl font-black text-gray-900 tracking-tight">฿{checkoutTotal}</span>
              </div>
              <Link 
                href={checkoutItems.length > 0 ? "/checkout" : "#"}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 py-4 sm:py-5 rounded-2xl font-bold text-lg transition-all",
                  checkoutItems.length > 0 
                    ? "bg-gray-900 text-white hover:bg-gray-800 shadow-md transform hover:-translate-y-0.5 cursor-pointer" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                ดำเนินการชำระเงิน <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}