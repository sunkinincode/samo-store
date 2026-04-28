import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // --- กฎข้อที่ 1: ป้องกันหน้า Admin ---
  if (url.pathname.startsWith('/admin')) {
    if (!user || user.email !== 'samo@store.com') {
      url.pathname = '/login'
      url.searchParams.set('error', 'เฉพาะแอดมินเท่านั้นที่เข้าหน้านี้ได้')
      return NextResponse.redirect(url)
    }
  }

  // --- กฎข้อที่ 2: ป้องกันหน้าสินค้าและข้อมูลส่วนตัว ---
  const protectedPaths = ['/products', '/orders', '/cart', '/checkout']
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    url.pathname = '/login'
    url.searchParams.set('error', 'กรุณาเข้าสู่ระบบก่อนเลือกซื้อสินค้า')
    return NextResponse.redirect(url)
  }

  // --- กฎข้อที่ 3: ห้ามคนล็อกอินแล้วเข้าหน้า Landing Page และ Login ---
  if (user && (url.pathname === '/' || url.pathname === '/login' || url.pathname === '/register')) {
    if (user.email === 'samo@store.com') {
      url.pathname = '/admin' // แอดมินให้เตะไปหน้า Dashboard
    } else {
      url.pathname = '/products' // User ทั่วไปให้เตะไปหน้าสินค้า
    }
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // เพิ่ม '/' (หน้าแรก) , '/login' และ '/register' เข้าไปให้ Middleware ตรวจสอบด้วย
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