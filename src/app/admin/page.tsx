export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import AdminDashboardClient from './components/admin-dashboard-client'
import { getSalesMetrics, getProductProfitBreakdown } from '@/lib/admin-utils'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // ดึงข้อมูลออร์เดอร์ทั้งหมด
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_amount, status')

  if (error) {
    console.error("Dashboard Error:", error)
  }

  // คำนวณสถิติต่างๆ
  const totalOrders = orders?.length || 0
  const totalSales = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const pendingOrders = orders?.filter(o => o.status === 'paid').length || 0
  const completedOrders = orders?.filter(o => o.status === 'completed').length || 0

  // ดึง profit & sales metrics
  const metrics = await getSalesMetrics()

  // ดึง profit breakdown (used for initial render footer)
  const profitBreakdown = await getProductProfitBreakdown()

  return (
    <AdminDashboardClient
      totalOrders={totalOrders}
      totalSales={totalSales}
      pendingOrders={pendingOrders}
      completedOrders={completedOrders}
      metrics={metrics}
      profitBreakdown={profitBreakdown}
    />
  )
}
