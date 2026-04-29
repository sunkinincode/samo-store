import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // ใส่ || 'https://dummy...' เพื่อกัน Next.js แครชตอน Build บน Cloudflare
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}