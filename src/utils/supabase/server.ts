import { createServerClient } from '@supabase/ssr'
    import { cookies } from 'next/headers'

    export async function createClient() {
      const cookieStore = await cookies()

      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // ข้าม Error นี้ไปเมื่อเรียกจาก Server Component 
                // เพราะ Middleware จะเป็นตัวจัดการอัปเดต Cookie เอง
              }
            },
          },
        }
      )
    }
