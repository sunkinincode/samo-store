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

  // 1. ตรวจสอบสลิปผ่าน Thunder API V2 พร้อมระบบ Timeout
  try {
    const thunderFormData = new FormData()
    thunderFormData.append('image', slipFile)

    // ✅ สร้าง AbortController เพื่อทำ Timeout 10 วินาที
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10000 ms = 10 วินาที

    const thunderRes = await fetch('https://api.thunder.in.th/v2/verify/bank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.THUNDER_API_KEY}`,
      },
      body: thunderFormData,
      signal: controller.signal // ✅ แนบสัญญาณ Abort เข้าไป
    })

    clearTimeout(timeoutId) // เคลียร์ Timeout ถ้า API ตอบกลับมาก่อนเวลา

    const thunderResponse = await thunderRes.json()

    console.log("=== THUNDER RAW RESPONSE ===")
    console.log(thunderResponse)
    console.log("============================")

    if (!thunderResponse.success) {
      const errorMessage = thunderResponse.error?.message || 'ไม่สามารถอ่าน QR Code หรือข้อมูลจากสลิปได้'
      return { error: `[ตรวจสอบไม่ผ่าน] ${errorMessage}` }
    }

    slipData = thunderResponse.data.rawSlip
    slipAmount = slipData.amount?.amount

    if (Number(slipAmount) !== Number(totalAmount)) {
      return { error: `ยอดเงินในสลิป (฿${slipAmount}) ไม่ตรงกับยอดที่ต้องชำระ (฿${totalAmount})` }
    }

  } catch (error: any) {
    // ✅ ดักจับกรณีที่หมดเวลา (Timeout)
    if (error.name === 'AbortError') {
      return { error: 'ใช้เวลาตรวจสอบนานเกินไป กรุณาตรวจสอบว่ารูปภาพคือสลิปที่ถูกต้องหรือไม่' }
    }
    console.error('Thunder API Exception:', error)
    return { error: `ระบบตรวจสอบสลิปขัดข้อง: ${error.message}` }
  }

  // 2. ป้องกันการใช้สลิปซ้ำ
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

  // 3. สร้าง Order ID 8 หลัก
  const orderId = Math.random().toString(36).substring(2, 10).toUpperCase()

  // 4. บันทึกข้อมูล Order
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

  // 5. บันทึกข้อมูลสลิป
  const senderTh = slipData.sender?.account?.name?.th
  const senderEn = slipData.sender?.account?.name?.en
  const receiverTh = slipData.receiver?.account?.name?.th
  const receiverEn = slipData.receiver?.account?.name?.en

  const { error: slipRecordError } = await supabase
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
  
  if (slipRecordError) {
      console.error("Slip Record Error:", slipRecordError)
  }

  // 6. บันทึก Order Items
  const orderItemsData = cart.map(item => ({
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    size: item.size || null,
    price_at_time: item.price
  }))

  await supabase.from('order_items').insert(orderItemsData)

  // 7. ตัดสต็อกสินค้า
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