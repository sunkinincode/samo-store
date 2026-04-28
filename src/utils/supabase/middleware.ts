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
              cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

      // ดึงข้อมูล User ปัจจุบัน
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const currentPath = request.nextUrl.pathname

      // 1. Logic สำหรับ Admin
      const isAdminRoute = currentPath.startsWith('/admin')
      if (isAdminRoute) {
        if (!user) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
        // ตรวจสอบว่าเป็น Admin หรือไม่ (ล็อกอีเมล)
        if (user.email !== 'samo@store.com') {
          return NextResponse.redirect(new URL('/products', request.url)) 
        }
      }

      // 2. Logic สำหรับ User ทั่วไป (ป้องกันหน้าขายของ)
      const protectedRoutes = ['/products', '/cart', '/checkout', '/orders']
      const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))

      if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/', request.url)) // เตะกลับหน้า Landing Page
      }

      // 3. ป้องกันคนล็อกอินแล้วกลับไปหน้า Landing หรือ Login
      const isAuthRoute = currentPath === '/login' || currentPath === '/register'
      if ((currentPath === '/' || isAuthRoute) && user) {
        if (user.email === 'samo@store.com') {
          return NextResponse.redirect(new URL('/admin', request.url)) // Admin ไป Dashboard
        }
        return NextResponse.redirect(new URL('/products', request.url)) // User ไปหน้าสินค้า
      }

      return supabaseResponse
    }