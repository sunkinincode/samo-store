'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { ProductProfitItem } from '@/lib/admin-utils'

interface ProfitBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfitBreakdownModal({ isOpen, onClose }: ProfitBreakdownModalProps) {
  const [data, setData] = useState<ProductProfitItem[]>([])
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

  // Re-fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfitBreakdown()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">รายละเอียดกำไรแยกตามสินค้า</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body — Scrollable Table */}
        <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-gray-500">ไม่มีข้อมูลกำไร — ยังไม่มีคำสั่งซื้อที่ชำระเงิน</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">สินค้า/เซต</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">จำนวนที่ขายได้</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">ราคาขายเฉลี่ย/หน่วย</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">ต้นทุน/หน่วย</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">กำไร/หน่วย</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-600">กำไรรวม</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={item.product_id}
                    className={`border-t border-gray-100 hover:bg-gray-50/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.product_name}</td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {item.quantity_sold.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      ฿{item.average_selling_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      ฿{item.cost_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        item.profit_per_unit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {item.profit_per_unit >= 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        ฿{item.profit_per_unit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${
                        item.total_profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        ฿{item.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer — Summary Row */}
        {data.length > 0 && (
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">กำไรรวมทั้งหมด</span>
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

// Inline helper for client-side Supabase queries
async function getProductProfitBreakdown(supabase: any): Promise<ProductProfitItem[]> {
  // Step 1:_paid orders
  const { data: paidOrderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'paid')

  if (!paidOrderIds || paidOrderIds.length === 0) return []

  const orderIds = (paidOrderIds ?? []).map((item: any) => item.id)

  // Step 2: order_items
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price_at_time, product_id')
    .in('order_id', orderIds)

  if (itemsError) console.error('Order Items Error:', itemsError)
  if (!orderItems || orderItems.length === 0) return []

  // Step 3: Aggregate by product_id
  const aggregated = new Map<string, { qty: number; totalPriceSum: number }>()
  for (const item of orderItems) {
    const existing = aggregated.get(item.product_id) || { qty: 0, totalPriceSum: 0 }
    const price = Number(item.price_at_time) || 0
    existing.qty += item.quantity
    existing.totalPriceSum += price * item.quantity
    aggregated.set(item.product_id, existing)
  }

  // Step 4: ดึงข้อมูล product (name + cost_price)
  const productIds = [...aggregated.keys()]
  const { data: products } = await supabase
    .from('products')
    .select('id, name, cost_price')
    .in('id', productIds)

  const productMap = new Map<string, { name: string; cost_price: number }>()
  if (products) {
    products.forEach((p: any) => {
      productMap.set(p.id, { name: p.name || 'Unknown Product', cost_price: p.cost_price || 0 })
    })
  }

  // Step 5: Build final result
  const results: ProductProfitItem[] = []
  for (const [productId, agg] of aggregated) {
    const product = productMap.get(productId)
    if (!product) continue

    const quantitySold = agg.qty
    const averageSellingPrice = agg.totalPriceSum / quantitySold
    const costPrice = product.cost_price
    const profitPerUnit = averageSellingPrice - costPrice
    const totalProfit = profitPerUnit * quantitySold

    results.push({
      product_id: productId,
      product_name: product.name,
      quantity_sold: quantitySold,
      average_selling_price: averageSellingPrice,
      cost_price: costPrice,
      profit_per_unit: profitPerUnit,
      total_profit: totalProfit,
    })
  }

  results.sort((a, b) => b.total_profit - a.total_profit)
  return results
}
