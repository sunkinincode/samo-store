import { createClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

// ==========================================
// Shared Admin Data Fetching Utilities
// Used by both Server Components and Client Components
// ==========================================

// Fixed initial investment (sunk costs): notebook stock + bag stock + server
const FIXED_INVESTMENT = 29690

export interface Metrics {
  totalItemsSold: number
  totalRevenue: number
  netProfit: number
  profitMargin: number
  fixedInvestment: number
  shirtCost: number
}

export interface ProductProfitItem {
  product_id: string
  product_name: string
  quantity_sold: number
  average_selling_price: number
  cost_price: number
  average_cost_price?: number
  profit_per_unit: number
  total_profit: number
  short_sleeve_qty: number
  long_sleeve_qty: number
}

export async function getSalesMetrics(): Promise<Metrics> {
  const supabase = await createClient()

  // เรทราคาต้นทุนเสื้อตามจริง
  const COST_SHORT = 150;
  const COST_LONG = 180;

  // Step 1: ดึง order IDs ที่ status = paid
  const { data: paidOrderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'paid')

  if (!paidOrderIds || paidOrderIds.length === 0) {
    return { totalItemsSold: 0, totalRevenue: 0, netProfit: 0, profitMargin: 0, fixedInvestment: FIXED_INVESTMENT, shirtCost: 0 }
  }

  const orderIds = paidOrderIds.map(o => o.id)

  // Step 2: ดึง order_items (เพิ่มคอลัมน์ size มาเพื่อแกะต้นทุนและจำนวนแยกชิ้น)
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price_at_time, product_id, size')
    .in('order_id', orderIds)

  if (itemsError) console.error('Order Items Error:', itemsError)
  if (!orderItems || orderItems.length === 0) {
    return { totalItemsSold: 0, totalRevenue: 0, netProfit: 0, profitMargin: 0, fixedInvestment: FIXED_INVESTMENT, shirtCost: 0 }
  }

  // ดึงชื่อสินค้ามาเตรียมไว้ (เพื่อเช็คเซต)
  const productIds = [...new Set(orderItems.map(item => item.product_id))]
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds)

  const productMap = new Map<string, string>()
  if (products) {
    products.forEach(p => productMap.set(p.id, p.name || ''))
  }

  // รวมยอดขาย จำนวนชิ้น และ ต้นทุนเสื้อ(shirtCost)
  let totalItemsSold = 0
  let totalRevenue = 0
  let shirtCost = 0

  orderItems.forEach(item => {
    totalRevenue += Number(item.price_at_time) * item.quantity

    const productName = productMap.get(item.product_id) || '';
    const sizeStr = item.size || '';
    
    // นับสมุดและกระเป๋า
    const notebookQty = productName.includes('สมุด') ? item.quantity : 0;
    const bagQty = productName.includes('กระเป๋า') ? item.quantity : 0;

    // นับจำนวนเสื้อในออร์เดอร์นี้
    let shortMatches = (sizeStr.match(/แขนสั้น/g) || []).length;
    let longMatches = (sizeStr.match(/แขนยาว/g) || []).length;

    // กรณีลูกค้าไม่ได้เลือกไซส์ (Fallback) ตีเป็นแขนสั้น
    if (shortMatches === 0 && longMatches === 0 && (productName.includes('เสื้อ') || productName.includes('เซต'))) {
       let shirtCount = 1;
       if (productName.includes('3 ตัว')) shirtCount = 3;
       else if (productName.includes('2 ตัว')) shirtCount = 2;
       shortMatches = shirtCount;
    }

    // 🌟 อัปเดต: คำนวณจำนวนชิ้นสินค้าที่แท้จริง (แยกเสื้อ สมุด กระเป๋า จากในเซต)
    const shirtsInItem = (shortMatches + longMatches) * item.quantity;
    const totalActualItems = shirtsInItem + notebookQty + bagQty;
    
    // หากเป็นสินค้าแปลกๆ ที่ไม่มีคีย์เวิร์ดข้างต้นเลย ให้บวก quantity ปกติ
    totalItemsSold += totalActualItems > 0 ? totalActualItems : item.quantity;

    // คำนวณต้นทุนเฉพาะเสื้อ (สมุดกับกระเป๋าอยู่ใน FIXED_INVESTMENT แล้ว)
    shirtCost += (shortMatches * COST_SHORT * item.quantity) + (longMatches * COST_LONG * item.quantity);
  })

  // Real Net Profit = Total Revenue - Fixed Investment - Shirt Cost
  const netProfit = totalRevenue - FIXED_INVESTMENT - shirtCost
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0

  return {
    totalItemsSold,
    totalRevenue,
    netProfit,
    profitMargin,
    fixedInvestment: FIXED_INVESTMENT,
    shirtCost,
  }
}

export async function getProductProfitBreakdown(): Promise<ProductProfitItem[]> {
  const supabase = await createClient()

  // เรทราคาต้นทุนตามจริงจาก Excel
  const COST_SHORT = 150;
  const COST_LONG = 180;
  const COST_NOTEBOOK = 11.3;
  const COST_BAG = 66.34;

  const { data: paidOrderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'paid')

  if (!paidOrderIds || paidOrderIds.length === 0) return []

  const orderIds = paidOrderIds.map(o => o.id)

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('quantity, price_at_time, product_id, size')
    .in('order_id', orderIds)

  if (itemsError) console.error('Order Items Error:', itemsError)
  if (!orderItems || orderItems.length === 0) return []

  const productIds = [...new Set(orderItems.map(item => item.product_id))]
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds)

  const productMap = new Map<string, string>()
  if (products) {
    products.forEach((p: any) => productMap.set(p.id, p.name || 'Unknown Product'))
  }

  const aggregated = new Map<string, { qty: number; totalPriceSum: number; shortSleeveQty: number; longSleeveQty: number; totalActualCost: number }>()
  
  for (const item of orderItems) {
    const existing = aggregated.get(item.product_id) || { qty: 0, totalPriceSum: 0, shortSleeveQty: 0, longSleeveQty: 0, totalActualCost: 0 }
    const price = Number(item.price_at_time) || 0
    const productName = productMap.get(item.product_id) || '';

    const notebookQty = productName.includes('สมุด') ? item.quantity : 0;
    const bagQty = productName.includes('กระเป๋า') ? item.quantity : 0;

    const sizeStr = item.size || '';
    let shortMatches = (sizeStr.match(/แขนสั้น/g) || []).length;
    let longMatches = (sizeStr.match(/แขนยาว/g) || []).length;

    if (shortMatches === 0 && longMatches === 0 && (productName.includes('เสื้อ') || productName.includes('เซต'))) {
       let shirtCount = 1;
       if (productName.includes('3 ตัว')) shirtCount = 3;
       else if (productName.includes('2 ตัว')) shirtCount = 2;
       shortMatches = shirtCount;
    }

    const shortQty = shortMatches * item.quantity;
    const longQty = longMatches * item.quantity;

    const actualCost = (shortQty * COST_SHORT) + (longQty * COST_LONG) + (notebookQty * COST_NOTEBOOK) + (bagQty * COST_BAG);

    existing.qty += item.quantity
    existing.totalPriceSum += (price * item.quantity)
    existing.shortSleeveQty += shortQty;
    existing.longSleeveQty += longQty;
    existing.totalActualCost += actualCost;

    aggregated.set(item.product_id, existing)
  }

  const results: ProductProfitItem[] = []
  for (const [productId, agg] of aggregated) {
    const productName = productMap.get(productId) || 'Unknown Product';
    
    const quantitySold = agg.qty
    const averageSellingPrice = agg.totalPriceSum / quantitySold
    const averageCostPrice = agg.totalActualCost / quantitySold
    const totalProfit = agg.totalPriceSum - agg.totalActualCost
    const profitPerUnit = totalProfit / quantitySold

    results.push({
      product_id: productId,
      product_name: productName,
      quantity_sold: quantitySold,
      average_selling_price: averageSellingPrice,
      cost_price: averageCostPrice,
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