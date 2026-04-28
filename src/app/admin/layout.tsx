import AdminNavbar from '@/components/AdminNavbar'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Samo Store | Admin Management',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}