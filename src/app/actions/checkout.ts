'use server'

import { createClient } from '@/utils/supabase/server'
import { CartItem } from '@/context/CartContext'

export async function processCheckout(formData: FormData, cart: CartItem[], totalAmount: number) {
  const slipFile = formData.get('slip') as File
  if (!slipFile || slipFile.size === 0) {
    return { error: 'กรุณาอัปโหลดสลิปโอนเงิน' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ' }
  }

  let slipData: any = null
  let slipAmount = 0

  try {
    const thunderFormData = new FormData()
    thunderFormData.append('image', slipFile)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) 

    const thunderRes = await fetch('https://api.thunder.in.th/v2/verify/bank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.THUNDER_API_KEY}`,
      },
      body: thunderFormData,
      signal: controller.signal
    })

    clearTimeout(timeoutId) 

    const thunderResponse = await thunderRes.json()

    if (!thunderResponse.success) {
      const errorMessage = thunderResponse.error?.message || 'ไม่สามารถอ่าน QR Code หรือข้อมูลจากสลิปได้'
      return { error: `[ตรวจสอบไม่ผ่าน] ${errorMessage}` }
    }

    slipData = thunderResponse.data.rawSlip
    slipAmount = slipData.amount?.amount

    if (Number(slipAmount) !== Number(totalAmount)) {
      return { error: `ยอดเงินในสลิป (฿${slipAmount}) ไม่ตรงกับยอดที่ต้องชำระ (฿${totalAmount})` }
    }

    // ==========================================
    // 🛡️ ระบบรักษาความปลอดภัย: ตรวจสอบบัญชีปลายทาง (อัปเกรดขั้นสุด)
    // ==========================================
    const { data: settings } = await supabase
      .from('store_settings')
      .select('promptpay_phone, bank_account_no')
      .eq('id', 1)
      .single()

    if (settings) {
      // ดึงข้อมูลปลายทางจากสลิป (กวาดมาให้หมดทั้ง proxy และ account)
      const receiverProxy = slipData.receiver?.proxy?.value || slipData.receiver?.proxy?.account || ''
      const receiverAccount = slipData.receiver?.account?.bankAccount || slipData.receiver?.account?.value || ''

      const adminPP = settings.promptpay_phone?.replace(/[^0-9]/g, '') || ''
      const adminBank = settings.bank_account_no?.replace(/[^0-9]/g, '') || ''
      
      const cleanProxy = receiverProxy.replace(/[^0-9]/g, '')
      const cleanAccount = receiverAccount.replace(/[^0-9]/g, '')

      let isDestinationValid = false

      // รวมตัวเลขที่แกะได้จากสลิป (เอาเฉพาะที่มี 4 หลักขึ้นไป)
      const receiverNumbers = [cleanProxy, cleanAccount].filter(n => n.length >= 4)

      // นำตัวเลขจากสลิปทุกตัว มาเช็คกับ "พร้อมเพย์" และ "เลขบัญชี" ของแอดมินแบบไขว้กัน
      for (const num of receiverNumbers) {
        // เช็คกับพร้อมเพย์
        if (adminPP && (adminPP.includes(num) || num.includes(adminPP.slice(-9)))) {
          isDestinationValid = true
          break
        }
        // เช็คกับเลขบัญชี
        if (adminBank && (adminBank.includes(num) || num.includes(adminBank.slice(-6)))) {
          isDestinationValid = true
          break
        }
      }

      if (!isDestinationValid) {
        return { error: 'บัญชีผู้รับเงินไม่ถูกต้อง! กรุณาโอนเงินเข้าบัญชีของสโมสรนักศึกษาที่ระบุไว้เท่านั้น' }
      }
    }
    // ==========================================

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { errorType: 'TIMEOUT', error: 'ระบบใช้เวลาตรวจสอบสลิปนานเกินไป (เกิน 15 วินาที)' }
    }
    console.error('Thunder API Exception:', error)
    return { error: `ระบบตรวจสอบสลิปขัดข้อง: ${error.message}` }
  }

  const transRef = slipData.transRef
  if (!transRef) {
      return { error: 'ไม่พบรหัสอ้างอิง (transRef) ในสลิปนี้' }
  }

  const { data: existingSlip } = await supabase
    .from('slip_records')
    .select('id')
    .eq('trans_ref', transRef)
    .single()

  if (existingSlip) {
    return { error: 'สลิปนี้ถูกใช้งานไปแล้วในระบบ กรุณาใช้สลิปใหม่' }
  }

  const orderId = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: user.id,
      total_amount: totalAmount,
      slip_url: null,
      slip_verified: true,
      status: 'paid'
    })

  if (orderError) return { error: `Database Error (Orders): ${orderError.message}` }

  const senderTh = slipData.sender?.account?.name?.th
  const senderEn = slipData.sender?.account?.name?.en
  const receiverTh = slipData.receiver?.account?.name?.th
  const receiverEn = slipData.receiver?.account?.name?.en

  await supabase
    .from('slip_records')
    .insert({
      order_id: orderId,
      trans_ref: transRef,
      sender_name: senderTh || senderEn || 'ไม่ระบุ',
      sender_bank: slipData.sender?.bank?.short || slipData.sender?.bank?.name || 'ไม่ระบุ',
      receiver_name: receiverTh || receiverEn || 'ไม่ระบุ',
      receiver_bank: slipData.receiver?.bank?.short || slipData.receiver?.bank?.name || 'ไม่ระบุ',
      amount: slipAmount,
      trans_date: slipData.date ? new Date(slipData.date).toISOString() : new Date().toISOString()
    })

  const orderItemsData = cart.map(item => ({
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    size: item.size || null,
    price_at_time: item.price
  }))

  await supabase.from('order_items').insert(orderItemsData)

  for (const item of cart) {
    const { data: productData } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    if (productData) {
      await supabase
        .from('products')
        .update({ stock_quantity: productData.stock_quantity - item.quantity })
        .eq('id', item.product_id)
    }
  }

  return { success: true, orderId }
}