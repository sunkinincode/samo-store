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

  // 1. ตรวจสอบสลิปผ่าน Thunder API V2 (โครงสร้างใหม่ล่าสุด)
  try {
    const thunderFormData = new FormData()
    // ตามคู่มือ: ต้องใช้คีย์ชื่อ 'image' สำหรับการอัปโหลดไฟล์
    thunderFormData.append('image', slipFile)

    // ตามคู่มือ: Endpoint ที่ถูกต้องคือ /v2/verify/bank
    const thunderRes = await fetch('https://api.thunder.in.th/v2/verify/bank', {
      method: 'POST',
      headers: {
        // ตามคู่มือ: ต้องใช้ Authorization: Bearer
        'Authorization': `Bearer ${process.env.THUNDER_API_KEY}`,
      },
      body: thunderFormData, 
    })

    const thunderResponse = await thunderRes.json()

    console.log("=== THUNDER RAW RESPONSE ===")
    console.log(thunderResponse)
    console.log("============================")

    // ตามคู่มือ: หาก success เป็น false จะมี object 'error' แนบมาด้วย
    if (!thunderResponse.success) {
      const errorMessage = thunderResponse.error?.message || 'ไม่สามารถอ่าน QR Code หรือข้อมูลจากสลิปได้'
      return { error: `[ตรวจสอบไม่ผ่าน] ${errorMessage}` }
    }

    // ตามคู่มือ: ข้อมูลดิบของสลิปจะอยู่ใน data.rawSlip
    slipData = thunderResponse.data.rawSlip
    
    // ยอดเงินโอนเข้าจะซ้อนอยู่ใน amount.amount
    slipAmount = slipData.amount?.amount

    if (Number(slipAmount) !== Number(totalAmount)) {
      return { error: `ยอดเงินในสลิป (฿${slipAmount}) ไม่ตรงกับยอดที่ต้องชำระ (฿${totalAmount})` }
    }

  } catch (error: any) {
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
      slip_url: null, // เก็บ null ตามเดิมเพราะไม่เก็บรูป
      slip_verified: true,
      status: 'paid'
    })

  if (orderError) return { error: `Database Error (Orders): ${orderError.message}` }

  // 5. บันทึกข้อมูลสลิป
  // อ้างอิง Path ของบัญชีผู้ส่ง/ผู้รับ จากคู่มือ RawSlip ของ Thunder
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