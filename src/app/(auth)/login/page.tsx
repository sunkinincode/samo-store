import Link from 'next/link'
import { Package } from 'lucide-react'
import { login } from '@/app/actions/auth'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  // รองรับ Next.js 15+ ที่ searchParams เป็น Promise
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-gray-900">
            <Package className="w-8 h-8" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-gray-500">สำหรับ User ทั่วไป และ Admin (samo@store.com)</p>
        </div>

        {params?.message && (
          <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            {params.message}
          </div>
        )}
        {params?.error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {params.error}
          </div>
        )}

        <form className="mt-8 space-y-6" action={login}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="font-semibold text-gray-900 hover:underline">
            สร้างบัญชีใหม่
          </Link>
        </p>
      </div>
    </div>
  )
}