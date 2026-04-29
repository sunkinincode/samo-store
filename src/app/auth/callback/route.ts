import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // ตรวจสอบว่ามีตัวแปร next แนบมาไหม ถ้าไม่มีให้ไปที่ /products เป็นค่าเริ่มต้น
  const next = searchParams.get('next') ?? '/products'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // แลกเปลี่ยนรหัสสำเร็จ พาไปที่หน้า products
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // หากมีปัญหาให้กลับไปหน้าล็อกอินพร้อมข้อความเตือน
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}