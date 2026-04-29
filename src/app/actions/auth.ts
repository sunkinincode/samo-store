'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  let errorMessage = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  } catch (err) {
    errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้'
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  // ล็อกอิน Admin สำเร็จ ให้ไปหน้า /products
  redirect('/products')
}

export async function loginWithGoogle() {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samostore.koravit.workers.dev'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // เมื่อ Google ตรวจสอบเสร็จ ให้กลับมาที่เว็บเราแล้วส่งตัวแปร next=/products ไปด้วย
      redirectTo: `${siteUrl}/auth/callback?next=/products`,
    },
  })

  if (data?.url) {
    redirect(data.url)
  } else if (error) {
    redirect(`/login?error=${encodeURIComponent('ไม่สามารถเชื่อมต่อกับ Google ได้')}`)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}