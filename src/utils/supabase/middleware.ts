import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ดึงข้อมูล User ปัจจุบัน (อ่านจากคุกกี้)
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const currentPath = url.pathname

  // --- 1. Logic สำหรับ Admin ---
  const isAdminRoute = currentPath.startsWith('/admin')
  if (isAdminRoute) {
    if (!user || user.email !== 'samo@store.com') {
      url.pathname = '/login'
      url.searchParams.set('error', 'เฉพาะแอดมินเท่านั้นที่เข้าหน้านี้ได้')
      return NextResponse.redirect(url)
    }
  }

  // --- 2. Logic สำหรับ User ทั่วไป (ป้องกันหน้าซื้อของ) ---
  const protectedRoutes = ['/products', '/cart', '/checkout', '/orders']
  const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))

  if (isProtectedRoute && !user) {
    url.pathname = '/login'
    url.searchParams.set('error', 'กรุณาเข้าสู่ระบบก่อนเลือกซื้อสินค้า')
    return NextResponse.redirect(url)
  }

  // --- 3. ป้องกันคนล็อกอินแล้วกลับไปหน้า Landing หรือ Login ---
  const isAuthRoute = currentPath === '/login' || currentPath === '/register'
  if ((currentPath === '/' || isAuthRoute) && user) {
    if (user.email === 'samo@store.com') {
      url.pathname = '/admin' // Admin ไป Dashboard
    } else {
      url.pathname = '/products' // User ไปหน้าสินค้า
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}