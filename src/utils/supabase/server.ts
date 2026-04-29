import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // ใส่ || 'https://dummy...' เหมือนฝั่ง Client เพื่อป้องกันการแครชตอน Build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // การเรียก set cookie จาก Server Component จะทำให้เกิด error
            // แต่เราสามารถเพิกเฉยได้หากมี middleware คอยจัดการเรื่องการรีเฟรช session อยู่แล้ว
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // การเรียก remove cookie จาก Server Component จะทำให้เกิด error เช่นกัน
          }
        },
      },
    }
  )
}