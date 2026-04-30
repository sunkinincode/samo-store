import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // ✅ เรียกใช้ฟังก์ชันอัปเดต Session และป้องกันหน้าเว็บ จากไฟล์ utils แทน
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/admin/:path*', 
    '/orders/:path*', 
    '/cart/:path*', 
    '/checkout/:path*', 
    '/products/:path*'
  ],
}