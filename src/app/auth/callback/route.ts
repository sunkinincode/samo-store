import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // จุดที่แก้ไข: เปลี่ยนจาก '/' เป็น '/products'
  const next = searchParams.get('next') ?? '/products'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // หากลิงก์หมดอายุหรือมีปัญหา ให้ส่งกลับไปหน้าล็อกอินพร้อมแจ้งเตือน
  return NextResponse.redirect(`${origin}/login?error=Invalid or expired verification link`)
}