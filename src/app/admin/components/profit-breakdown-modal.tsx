'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, PackageCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { ProductProfitItem } from '@/lib/admin-utils'

interface ExtendedProfitItem extends ProductProfitItem {
  short_sleeve_qty: number;
  long_sleeve_qty: number;
  average_cost_price: number; // เพิ่มฟิลด์ต้นทุนเฉลี่ย
}

interface ProfitBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfitBreakdownModal({ isOpen, onClose }: ProfitBreakdownModalProps) {
  const [data, setData] = useState<ExtendedProfitItem[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchProfitBreakdown() {
    setLoading(true)
    try {
      const supabase = createClient()
      const results = await getProductProfitBreakdown(supabase)
      setData(results)
    } catch (error) {
      console.error('Failed to fetch profit breakdown:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchProfitBreakdown()
    }
  }, [isOpen])

  if (!isOpen) return null

  // ==========================================
  // 🧮 คำนวณสรุปยอดรวมสินค้าที่ต้องเตรียมทั้งหมด
  // ==========================================
  const totalShortSleeve = data.reduce((sum, item) => sum + item.short_sleeve_qty, 0)
  const totalLongSleeve = data.reduce((sum, item) => sum + item.long_sleeve_qty, 0)
  const totalShirts = totalShortSleeve + totalLongSleeve 
  const totalNotebooks = data.reduce((sum, item) => sum + (item.product_name.includes('สมุด') ? item.quantity_sold : 0), 0)
  const totalBags = data.reduce((sum, item) => sum + (item.product_name.includes('กระเป๋า') ? item.quantity_sold : 0), 0)
  // ==========================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">รายละเอียดกำไรแยกตามสินค้า (คำนวณตามจริง)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body — Scrollable Area */}
        <div className="overflow-y-auto flex-1 p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">กำลังคำนวณต้นทุนตามไซส์เสื้อ...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-gray-500">ไม่มีข้อมูลกำไร — ยังไม่มีคำสั่งซื้อที่ชำระเงิน</p>
            </div>
          ) : (
            <>
              {/* 📦 กล่องสรุปยอดรวม (Grand Total) */}
              <div className="mb-8 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <PackageCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-900">สรุปยอดรวมสินค้าที่ต้องเตรียม (แยกชิ้น)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">👕 เสื้อรวมทั้งหมด</span>
                    <span className="text-2xl font-black text-rose-600">{totalShirts.toLocaleString()} <span className="text-sm font-normal text-gray-400">ตัว</span></span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">แขนสั้น</span>
                    <span className="text-2xl font-black text-orange-600">{totalShortSleeve.toLocaleString()} <span className="text-sm font-normal text-gray-400">ตัว</span></span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">แขนยาว</span>
                    <span className="text-2xl font-black text-blue-600">{totalLongSleeve.toLocaleString()} <span className="text-sm font-normal text-gray-400">ตัว</span></span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">📒 สมุดเฟรชชี่</span>
                    <span className="text-2xl font-black text-emerald-600">{totalNotebooks.toLocaleString()} <span className="text-sm font-normal text-gray-400">เล่ม</span></span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">👜 กระเป๋าผ้า</span>
                    <span className="text-2xl font-black text-purple-600">{totalBags.toLocaleString()} <span className="text-sm font-normal text-gray-400">ใบ</span></span>
                  </div>
                </div>
              </div>

              {/* ตารางแยกตามโปรดักส์ */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600">สินค้า/เซต</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600">จำนวนออร์เดอร์</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600">ราคาขายเฉลี่ย</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600">ต้นทุนเฉลี่ย/หน่วย</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600">กำไรรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((item, index) => (
                      <tr key={item.product_id} className="hover:bg-gray-50/50 transition-colors bg-white">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.product_name}</div>
                          {/* โชว์ป้ายแขนสั้น/แขนยาว */}
                          {(item.short_sleeve_qty > 0 || item.long_sleeve_qty > 0) && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {item.short_sleeve_qty > 0 && (
                                <span className="inline-flex items-center text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                  แขนสั้น: {item.short_sleeve_qty}
                                </span>
                              )}
                              {item.long_sleeve_qty > 0 && (
                                <span className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  แขนยาว: {item.long_sleeve_qty}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-bold text-base">
                          {item.quantity_sold.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          ฿{item.average_selling_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          ฿{item.average_cost_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${item.total_profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            ฿{item.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer — Summary Row */}
        {data.length > 0 && (
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
            <span className="text-sm font-semibold text-gray-600">กำไรรวมทั้งหมด (จากสินค้าที่ขายได้แล้ว)</span>
            <span className={`text-2xl font-black ${
              data.reduce((sum, item) => sum + item.total_profit, 0) >= 0
                ? 'text-emerald-700'
                : 'text-red-700'
            }`}>
              ฿{data.reduce((sum, item) => sum + item.total_profit, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 🧠 SMART CALCULATOR: คำนวณต้นทุนอ้างอิงจาก Excel
// ==========================================
async function getProductProfitBreakdown(supabase: any): Promise<ExtendedProfitItem[]> {
  // 1. เรทราคาต้นทุนตามจริงจาก Excel
  const COST_SHORT = 150;
  const COST_LONG = 180;
  const COST_NOTEBOOK = 11.3;
  const COST_BAG = 66.34;

  const { data: paidOrderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'paid')

  if (!paidOrderIds || paidOrderIds.length === 0) return []

  const orderIds = (paidOrderIds ?? []).map((item: any) => item.id)

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price_at_time, product_id, size')
    .in('order_id', orderIds)

  if (itemsError) console.error('Order Items Error:', itemsError)
  if (!orderItems || orderItems.length === 0) return []

  // ดึงชื่อสินค้ามาเตรียมไว้ก่อน เพื่อใช้วิเคราะห์เซต
  const productIds = [...new Set(orderItems.map((item: any) => item.product_id))]
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds)

  const productMap = new Map<string, string>()
  if (products) {
    products.forEach((p: any) => productMap.set(p.id, p.name || 'Unknown Product'))
  }

  // ตัวแปรสำหรับรวมยอดแต่ละสินค้า
  const aggregated = new Map<string, { qty: number; totalPriceSum: number; shortSleeveQty: number; longSleeveQty: number; totalActualCost: number }>()
  
  for (const item of orderItems) {
    const existing = aggregated.get(item.product_id) || { qty: 0, totalPriceSum: 0, shortSleeveQty: 0, longSleeveQty: 0, totalActualCost: 0 }
    const price = Number(item.price_at_time) || 0
    const productName = productMap.get(item.product_id) || '';

    // นับสมุดและกระเป๋าจากชื่อสินค้า
    const notebookQty = productName.includes('สมุด') ? item.quantity : 0;
    const bagQty = productName.includes('กระเป๋า') ? item.quantity : 0;

    // นับเสื้อจาก Size
    const sizeStr = item.size || '';
    let shortMatches = (sizeStr.match(/แขนสั้น/g) || []).length;
    let longMatches = (sizeStr.match(/แขนยาว/g) || []).length;

    // กรณีลูกค้าไม่ได้เลือกไซส์ (Fallback) ให้อิงจากชื่อเซตและตีเป็นแขนสั้น (150)
    if (shortMatches === 0 && longMatches === 0 && (productName.includes('เสื้อ') || productName.includes('เซต'))) {
       let shirtCount = 1;
       if (productName.includes('3 ตัว')) shirtCount = 3;
       else if (productName.includes('2 ตัว')) shirtCount = 2;
       shortMatches = shirtCount;
    }

    const shortQty = shortMatches * item.quantity;
    const longQty = longMatches * item.quantity;

    // 🎯 คำนวณต้นทุนจริงของบิลนี้!
    const actualCost = (shortQty * COST_SHORT) + (longQty * COST_LONG) + (notebookQty * COST_NOTEBOOK) + (bagQty * COST_BAG);

    existing.qty += item.quantity
    existing.totalPriceSum += (price * item.quantity)
    existing.shortSleeveQty += shortQty;
    existing.longSleeveQty += longQty;
    existing.totalActualCost += actualCost; // บวกต้นทุนจริงเข้าไป

    aggregated.set(item.product_id, existing)
  }

  const results: ExtendedProfitItem[] = []
  for (const [productId, agg] of aggregated) {
    const productName = productMap.get(productId) || 'Unknown Product';
    
    const quantitySold = agg.qty
    const averageSellingPrice = agg.totalPriceSum / quantitySold
    
    // คำนวณต้นทุนเฉลี่ยของสินค้านี้ (เพื่อรองรับกรณีลูกค้ากดแขนสั้นผสมแขนยาวในเซตเดียวกัน)
    const averageCostPrice = agg.totalActualCost / quantitySold
    const totalProfit = agg.totalPriceSum - agg.totalActualCost
    const profitPerUnit = totalProfit / quantitySold

    results.push({
      product_id: productId,
      product_name: productName,
      quantity_sold: quantitySold,
      average_selling_price: averageSellingPrice,
      cost_price: averageCostPrice, // ใส่เป็น cost เฉลี่ยเพื่อให้ TypeScript ไม่พัง
      average_cost_price: averageCostPrice,
      profit_per_unit: profitPerUnit,
      total_profit: totalProfit,
      short_sleeve_qty: agg.shortSleeveQty,
      long_sleeve_qty: agg.longSleeveQty,
    })
  }

  results.sort((a, b) => b.total_profit - a.total_profit)
  return results
}