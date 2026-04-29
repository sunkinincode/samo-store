'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('อีเมลหรือรหัสผ่านไม่ถูกต้อง')}`)
  }

  revalidatePath('/', 'layout') // ล้างแคชเพื่อให้ Navbar แสดงชื่อใหม่
  redirect('/products')
}

export async function loginWithGoogle() {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samostore.koravit.workers.dev'

  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/products`,
    },
  })

  if (data?.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}