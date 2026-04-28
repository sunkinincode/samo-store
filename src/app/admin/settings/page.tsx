'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'

// ฟังก์ชันแปลงวันที่จาก Database ให้อยู่ในฟอร์แมต YYYY-MM-DDTHH:mm สำหรับ input[type="datetime-local"]
const formatForInput = (dateString: string | null) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  // ปรับให้อยู่ใน Timezone ท้องถิ่น (ประเทศไทย)
  const tzOffset = d.getTimezoneOffset() * 60000 
  const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16)
  return localISOTime
}

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    bank_account_no: '',
    promptpay_phone: '',
    sale_start: '',
    sale_end: '',
  })

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single()
      if (data) {
        setFormData({
          bank_account_no: data.bank_account_no || '',
          promptpay_phone: data.promptpay_phone || '',
          sale_start: formatForInput(data.sale_start),
          sale_end: formatForInput(data.sale_end),
        })
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')

    // แปลงกลับเป็น ISO String (UTC) ก่อนบันทึกลง Database
    const startUTC = formData.sale_start ? new Date(formData.sale_start).toISOString() : null
    const endUTC = formData.sale_end ? new Date(formData.sale_end).toISOString() : null

    const { error } = await supabase
      .from('store_settings')
      .update({
        bank_account_no: formData.bank_account_no,
        promptpay_phone: formData.promptpay_phone,
        sale_start: startUTC,
        sale_end: endUTC,
      })
      .eq('id', 1)

    setSaving(false)
    if (!error) {
      setSuccessMsg('บันทึกการตั้งค่าเรียบร้อยแล้ว')
      setTimeout(() => setSuccessMsg(''), 3000)
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าร้านค้า</h1>
        <p className="text-gray-500 mt-2">จัดการช่องทางการชำระเงินและรอบเวลาการขาย</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section: Payment */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">การชำระเงิน</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์พร้อมเพย์ (PromptPay)</label>
                <input
                  type="text"
                  name="promptpay_phone"
                  value={formData.promptpay_phone}
                  onChange={handleChange}
                  placeholder="0812345678"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">สำหรับสร้าง QR Code อัตโนมัติ</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เลขที่บัญชี (สำรอง)</label>
                <input
                  type="text"
                  name="bank_account_no"
                  value={formData.bank_account_no}
                  onChange={handleChange}
                  placeholder="กสิกรไทย 123-4-56789-0"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Section: Timing */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">รอบการจำหน่ายสินค้า</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เวลาเปิดรับออร์เดอร์</label>
                <input
                  type="datetime-local"
                  name="sale_start"
                  value={formData.sale_start}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เวลาปิดรับออร์เดอร์</label>
                <input
                  type="datetime-local"
                  name="sale_end"
                  value={formData.sale_end}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-gray-100">
            <div className="h-6">
              {successMsg && (
                <span className="flex items-center gap-2 text-sm text-green-600 font-medium animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}