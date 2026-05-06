import { createClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

// ==========================================
// Shared Admin Data Fetching Utilities
// Used by both Server Components and Client Components
// ==========================================

export async function getSalesMetrics() {
  const supabase = await createClient()

  // Step 1: ดึง order IDs ที่ status = paid
  const { data: paidOrderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'paid')

  if (!paidOrderIds || paidOrderIds.length === 0) {
    return { totalItemsSold: 0, totalRevenue: 0, netProfit: 0, profitMargin: 0 }
  }

  const orderIds = paidOrderIds.map(o => o.id)

  // Step 2: ดึง order_items ของคำสั่งซื้อที่ paid พร้อม price และ product_id
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price_at_time, product_id')
    .in('order_id', orderIds)

  if (itemsError) console.error('Order Items Error:', itemsError)
  if (!orderItems || orderItems.length === 0) {
    return { totalItemsSold: 0, totalRevenue: 0, netProfit: 0, profitMargin: 0 }
  }

  // รวมยอดขายและจำนวนชิ้น
  const totalItemsSold = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalRevenue = orderItems.reduce((sum, item) => sum + Number(item.price_at_time) * item.quantity, 0)

  // ดึงต้นทุนจาก products table เพื่อคำนวณกำไร
  const productIds = [...new Set(orderItems.map(item => item.product_id))]
  const { data: products } = await supabase
    .from('products')
    .select('id, cost_price')
    .in('id', productIds)

  const costMap = new Map<string, number>()
  if (products) {
    products.forEach(p => costMap.set(p.id, p.cost_price || 0))
  }

  // คำนวณต้นทุนรวมและกำไรสุทธิ
  const totalCost = orderItems.reduce((sum, item) => {
    const cost = costMap.get(item.product_id) || 0
    return sum + cost * item.quantity
  }, 0)

  const netProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0

  return {
    totalItemsSold,
    totalRevenue,
    netProfit,
    profitMargin,
  }
}

export interface ProductProfitItem {
  product_id: string
  product_name: string
  quantity_sold: number
  average_selling_price: number
  cost_price: number
  profit_per_unit: number
  total_profit: number
}

export async function getProductProfitBreakdown(): Promise<ProductProfitItem[]> {
  const supabase = await createClient()

  // Step 1: ดึง order IDs ที่ status = paid
  const { data: paidOrderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'paid')

  if (!paidOrderIds || paidOrderIds.length === 0) return []

  const orderIds = paidOrderIds.map(o => o.id)

  // Step 2: ดึง order_items ของคำสั่งซื้อที่ paid พร้อม product_id
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price_at_time, product_id')
    .in('order_id', orderIds)

  if (itemsError) console.error('Order Items Error:', itemsError)
  if (!orderItems || orderItems.length === 0) return []

  // Step 3: Aggregate by product_id → { qty, avg_selling_price }
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
    products.forEach(p => {
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

  // Sort by total_profit descending
  results.sort((a, b) => b.total_profit - a.total_profit)

  return results
}
