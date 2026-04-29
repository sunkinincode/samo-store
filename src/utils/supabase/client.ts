import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // ลบ dummy ออก เพื่อให้ใช้ URL ของจริงเท่านั้น
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}