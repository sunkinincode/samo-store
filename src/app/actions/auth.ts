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

  // Next.js บังคับว่าห้ามวางฟังก์ชัน redirect() ไว้ใน try...catch เด็ดขาด
  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect('/')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const supabase = await createClient()
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let errorMessage = ''

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (error) errorMessage = error.message
  } catch (err) {
    console.error("Network Catch Error:", err)
    errorMessage = 'เครือข่ายมีปัญหา ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Timeout)'
  }

  // หากมี Error ไม่ว่าจะจาก Supabase หรือเน็ตหลุด ให้ Redirect กลับไปพร้อมข้อความเตือน
  if (errorMessage) {
    redirect(`/register?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect(`/login?message=${encodeURIComponent('กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี')}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}