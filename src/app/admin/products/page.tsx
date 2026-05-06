'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Plus, PackageOpen, Image as ImageIcon, Save, Trash2, X, Ruler, Pencil, Palette, Layers, Clock } from 'lucide-react'
import clsx from 'clsx'

type SetItem = {
  id: string
  product_id: string
  quantity: number
}

type Product = {
  id: string
  name: string
  price: number
  cost_price: number | null
  stock_quantity: number
  image_url: string
  image_urls: string[] | null
  category: string
  description: string
  size_info: string | null
  long_sleeve_price: number
  colors: string | null
  is_set: boolean
  set_items: SetItem[] | null
  is_preorder: boolean
}

export default function AdminProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    category: 'shirt',
    size_info: '',
    long_sleeve_price: '',
    colors: ''
  })
  
  const [isSet, setIsSet] = useState(false)
  const [setItems, setSetItems] = useState<SetItem[]>([])
  const [isPreorder, setIsPreorder] = useState(false)

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) console.error("Fetch error:", error)
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const availableProducts = products.filter(p => !p.is_set && (p.stock_quantity > 0 || p.is_preorder))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const resetForm = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', description: '', price: '', cost_price: '', stock_quantity: '', category: 'shirt', size_info: '', long_sleeve_price: '', colors: '' })
    setIsSet(false)
    setSetItems([])
    setIsPreorder(false)
    setImageFiles([])
    setExistingImages([])
  }

  const handleEditClick = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost_price: (product.cost_price ?? '').toString(),
      stock_quantity: product.stock_quantity.toString(),
      category: product.category,
      size_info: product.size_info || '',
      long_sleeve_price: product.long_sleeve_price?.toString() || '0',
      colors: product.colors || ''
    })
    setIsSet(product.is_set || false)
    
    setSetItems(product.set_items?.map(item => ({
      id: item.id || Date.now().toString(),
      product_id: item.product_id || '',
      quantity: item.quantity || 1
    })) || [])
    
    setIsPreorder(product.is_preorder || false)
    
    const prevImages = product.image_urls || (product.image_url ? [product.image_url] : [])
    setExistingImages(prevImages)
    setImageFiles([])
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStockChange = async (id: string, newStock: number) => {
    const { error } = await supabase.from('products').update({ stock_quantity: newStock }).eq('id', id)
    if (error) alert(`ไม่สามารถอัปเดตสต็อกได้: ${error.message}`)
    else setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: newStock } : p))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) alert(`ลบไม่สำเร็จ: ${error.message}`)
    else fetchProducts()
  }

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSetToggle = (checked: boolean) => {
    if (checked && availableProducts.length === 0) {
      alert('ต้องมีสินค้าอย่างน้อย 1 ชิ้นในสต็อกจึงจะสามารถสร้างเซตได้')
      return
    }
    setIsSet(checked)
    // ✅ รีเซ็ตค่าฟอร์มที่ไม่จำเป็นเมื่อสลับเป็นโหมดจัดเซต
    if (checked) {
      setFormData(prev => ({ ...prev, size_info: '', colors: '', long_sleeve_price: '0' }))
    }
  }

  const addSetItem = () => {
    if (availableProducts.length === 0) return
    setSetItems([...setItems, { id: Date.now().toString(), product_id: availableProducts[0].id, quantity: 1 }])
  }
  
  const updateSetItem = (id: string, field: keyof SetItem, value: any) => {
    setSetItems(setItems.map(item => item.id === id ? { ...item, [field]: value } : item))
  }
  
  const removeSetItem = (id: string) => {
    setSetItems(setItems.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSet) {
      if (setItems.length === 0) {
        alert('กรุณาเพิ่มรายการสินค้าในเซตอย่างน้อย 1 ชิ้น')
        return
      }
      if (setItems.some(item => !item.product_id)) {
        alert('กรุณาเลือกสินค้าในเซตให้ครบทุกรายการ')
        return
      }
    }

    setUploading(true)
    
    try {
      let finalImageUrls = [...existingImages]
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file)
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName)
            finalImageUrls.push(urlData.publicUrl)
          }
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        cost_price: Number(formData.cost_price) || 0,
        stock_quantity: isPreorder ? 0 : Number(formData.stock_quantity),
        category: formData.category,
        // ✅ ถ้าเป็นเซต ไม่ต้องบันทึก size, color, long_sleeve_price
        size_info: isSet ? null : (formData.size_info ? formData.size_info.trim() : null),
        long_sleeve_price: isSet ? 0 : Number(formData.long_sleeve_price || 0),
        colors: isSet ? null : (formData.colors ? formData.colors.trim() : null),
        image_urls: finalImageUrls,
        image_url: finalImageUrls.length > 0 ? finalImageUrls[0] : null,
        is_set: isSet,
        set_items: isSet ? setItems : null,
        is_preorder: isPreorder
      }

      if (editingId) {
        const { error: dbError } = await supabase.from('products').update(payload).eq('id', editingId)
        if (dbError) throw new Error(`แก้ไขข้อมูลไม่สำเร็จ: ${dbError.message}`)
        alert('อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว!')
      } else {
        const { error: dbError } = await supabase.from('products').insert(payload)
        if (dbError) throw new Error(`บันทึกข้อมูลไม่สำเร็จ: ${dbError.message}`)
        alert('เพิ่มสินค้าใหม่เรียบร้อยแล้ว!')
      }

      resetForm()
      fetchProducts()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-gray-900 animate-spin" /><p className="mt-4 text-sm text-gray-500 font-medium">กำลังโหลดรายการสินค้า...</p></div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">จัดการสต็อกสินค้า</h1>
          <p className="text-gray-500 mt-1">เพิ่มหรือแก้ไขข้อมูลสินค้าและสต็อกแบบเรียลไทม์</p>
        </div>
        <button
          onClick={() => {
             if(isAdding) resetForm()
             else setIsAdding(true)
          }}
          className={clsx("flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm", isAdding ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800")}
        >
          {isAdding ? <><X className="w-4 h-4" /> ยกเลิก</> : <><Plus className="w-4 h-4" /> เพิ่มสินค้าใหม่</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            {editingId ? <Pencil className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-gray-900" />}
            {editingId ? 'แก้ไขข้อมูลสินค้า' : 'ข้อมูลสินค้าใหม่'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-xl text-purple-700"><Layers className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-purple-900">เปิดใช้งาน "โหมดจัดเซต" (Bundle)</h3>
                  <p className="text-sm text-purple-700 mt-0.5">ระบบจะดึงตัวเลือกสี/ไซซ์จากสินค้าตั้งต้นมาให้อัตโนมัติ</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isSet} onChange={(e) => handleSetToggle(e.target.checked)} className="sr-only peer" />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isSet && (
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">รายการของในเซต</h3>
                <div className="space-y-3 mb-4">
                  {setItems.map((item, index) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <span className="font-bold text-gray-400 w-6">{index + 1}.</span>
                      
                      <select 
                        value={item.product_id || ''} 
                        onChange={(e) => updateSetItem(item.id, 'product_id', e.target.value)} 
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none w-full sm:w-auto"
                      >
                        <option value="" disabled>-- เลือกสินค้าในสต็อก --</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (คงเหลือ: {p.is_preorder ? 'Pre-order' : p.stock_quantity})</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-600 whitespace-nowrap">จำนวน:</label>
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity || 1} 
                          onChange={(e) => updateSetItem(item.id, 'quantity', parseInt(e.target.value) || 1)} 
                          className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none" 
                        />
                      </div>
                      <button type="button" onClick={() => removeSetItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto flex justify-center"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addSetItem} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> เพิ่มสินค้าในเซต
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isSet ? 'ชื่อเซตสินค้า' : 'ชื่อสินค้า'}</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder={isSet ? "เช่น เซตเสื้อคู่ 2 ตัว" : "เช่น เสื้อสโมสร รุ่น 2026"} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">ราคาขาย (บาท)</label>
                    <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder="0" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">ต้นทุน (บาท)</label>
                    <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder="0" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={clsx("block text-sm font-semibold", isPreorder ? "text-gray-400" : "text-gray-700")}>
                        {isSet ? 'จำนวนเซตที่มี' : 'สต็อก'}
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer group">
                        <span className={clsx("text-xs font-bold transition-colors", isPreorder ? "text-green-600" : "text-gray-400 group-hover:text-gray-600")}>
                          พรีออร์เดอร์
                        </span>
                        <div className="relative inline-flex items-center">
                          <input type="checkbox" checked={isPreorder} onChange={(e) => setIsPreorder(e.target.checked)} className="sr-only peer" />
                          <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
                        </div>
                      </label>
                    </div>
                    <input 
                      required={!isPreorder} 
                      disabled={isPreorder} 
                      type="number" 
                      name="stock_quantity" 
                      value={isPreorder ? '' : formData.stock_quantity} 
                      onChange={handleInputChange} 
                      className={clsx(
                        "w-full px-4 py-2.5 rounded-xl outline-none transition-all", 
                        isPreorder ? "bg-green-50 border-green-100 text-green-600 font-bold placeholder-green-400 cursor-not-allowed" : "bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gray-900"
                      )} 
                      placeholder={isPreorder ? "เปิดรับพรีออร์เดอร์" : "100"} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">หมวดหมู่หลัก</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all">
                    <option value="shirt">หมวดหมู่เสื้อ</option>
                    <option value="bag">หมวดหมู่กระเป๋า</option>
                    <option value="notebook">หมวดหมู่สมุด</option>
                  </select>
                </div>

                {/* ✅ ซ่อนกล่องรายละเอียดนี้ หากอยู่ในโหมดจัดเซต (Bundle) */}
                {!isSet && (
                  <div className="space-y-4 border border-gray-100 p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">บวกราคาเพิ่ม ต่อ 1 ตัว หากเลือกแขนยาว (บาท)</label>
                      <input type="number" name="long_sleeve_price" value={formData.long_sleeve_price} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder="0 (ถ้าไม่มีให้ใส่ 0)" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><Ruler className="w-4 h-4" /> ตัวเลือกไซซ์เสื้อ (คั่นด้วยลูกน้ำ)</label>
                      <textarea name="size_info" value={formData.size_info} onChange={handleInputChange} rows={2} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-mono text-sm" placeholder='S: อก 38" ยาว 26", M: อก 40" ยาว 27"' />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><Palette className="w-4 h-4" /> ตัวเลือกสี (คั่นด้วยลูกน้ำ)</label>
                      <input type="text" name="colors" value={formData.colors} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-mono text-sm" placeholder="ขาว, ดำ, กรมท่า" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">รายละเอียด</label>
                  <textarea rows={4} name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder="ระบุรายละเอียดสินค้า..."></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">รูปภาพ (เลือกได้หลายรูป)</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 border-dashed rounded-xl file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-900 file:text-white hover:file:bg-gray-800 cursor-pointer" />
                  
                  {existingImages.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {existingImages.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {imageFiles.length > 0 && <p className="text-sm font-medium text-blue-600 mt-2">เตรียมอัปโหลดไฟล์ใหม่ {imageFiles.length} รูป</p>}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button type="submit" disabled={uploading} className={clsx("flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md", editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800", uploading && "opacity-70 cursor-not-allowed")}>
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {uploading ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลสินค้า')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ตารางแสดงสินค้า (เหมือนเดิม) */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">สินค้า</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">รายละเอียดย่อย</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">ราคา</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">สต็อก</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const totalPiecesInSet = product.set_items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0

                return (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                          {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-4 text-gray-300" />}
                          {product.is_set && <span className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[8px] font-bold text-center py-0.5">BUNDLE</span>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            {product.name} 
                            {product.is_set && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">จัดเซต ({totalPiecesInSet} ชิ้น)</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description || 'ไม่มีรายละเอียด'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase block w-fit mb-1">{product.category}</span>
                      {product.size_info && <p className="text-[10px] text-gray-400 line-clamp-1 max-w-[150px]">ไซซ์: {product.size_info}</p>}
                      {product.colors && <p className="text-[10px] text-gray-400 line-clamp-1 max-w-[150px]">สี: {product.colors}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 text-lg">฿{product.price}</span>
                    </td>
                    <td className="px-6 py-4">
                      {product.is_preorder ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl border border-green-100">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Pre-order</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="number" value={product.stock_quantity} onChange={(e) => handleStockChange(product.id, Number(e.target.value))} className={clsx("w-20 px-2 py-1.5 border-2 rounded-xl font-bold outline-none transition-all focus:border-gray-900 text-sm", product.stock_quantity <= 0 ? "border-red-100 bg-red-50 text-red-600" : "border-gray-100 text-gray-900")} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditClick(product)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="แก้ไขสินค้า"><Pencil className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="ลบสินค้า"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}