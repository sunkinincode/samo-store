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
    // 🛡️ ระบบรักษาความปลอดภัย: ตรวจสอบจากชื่อบัญชีผู้รับ (V.5 จบปัญหาเซ็นเซอร์เลขบัญชี)
    // ==========================================
    // ดึงเฉพาะชื่อบัญชีจากฐานข้อมูลมาเทียบ
    const { data: settings } = await supabase
      .from('store_settings')
      .select('bank_account_name')
      .eq('id', 1)
      .single()

    if (settings && settings.bank_account_name) {
      const receiverTh = slipData.receiver?.account?.name?.th || ''
      const receiverEn = slipData.receiver?.account?.name?.en || ''

      // ฟังก์ชันทำความสะอาดชื่อ: ลบช่องว่างและคำนำหน้า เพื่อไม่ให้เกิด Error จากการเว้นวรรค
      const cleanName = (name: string) => {
        return name
          .replace(/นาย|นางสาว|นาง|น\.ส\.|Mr\.|Mrs\.|Ms\./g, '') // ลบคำนำหน้า
          .replace(/\s+/g, '') // ลบช่องว่างทั้งหมด
          .toLowerCase() // ปรับเป็นพิมพ์เล็ก (กรณีชื่อภาษาอังกฤษ)
      }

      const adminNameCleaned = cleanName(settings.bank_account_name)
      const slipNameThCleaned = cleanName(receiverTh)
      const slipNameEnCleaned = cleanName(receiverEn)

      let isDestinationValid = false

      // ตรวจสอบว่าชื่อในสลิป (ไทยหรืออังกฤษ) ตรงกับชื่อแอดมินในระบบหรือไม่
      // ใช้ .includes() เผื่อกรณีสลิปมาแค่ชื่อจริง แต่นามสกุลโดนตัด
      if (adminNameCleaned && slipNameThCleaned && (adminNameCleaned.includes(slipNameThCleaned) || slipNameThCleaned.includes(adminNameCleaned))) {
        isDestinationValid = true
      }
      if (adminNameCleaned && slipNameEnCleaned && (adminNameCleaned.includes(slipNameEnCleaned) || slipNameEnCleaned.includes(adminNameCleaned))) {
        isDestinationValid = true
      }

      if (!isDestinationValid) {
        // แจ้งเตือนโดยบอกด้วยว่าโอนไปชื่อใคร เพื่อให้ลูกค้ารู้ตัว
        const foundName = receiverTh || receiverEn || 'ไม่ทราบชื่อ'
        return { error: `ชื่อบัญชีผู้รับเงินไม่ถูกต้อง! (ตรวจพบ: ${foundName}) กรุณาโอนเงินเข้าบัญชีของสโมสรนักศึกษาที่ระบุไว้เท่านั้น` }
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