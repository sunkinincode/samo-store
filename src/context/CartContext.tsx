'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type CartItem = {
  product_id: string
  name: string
  price: number
  quantity: number
  image_url: string
  size?: string
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (product_id: string, size?: string) => void
  updateQuantity: (product_id: string, quantity: number, size?: string) => void
  
  // ฟีเจอร์เลือกสินค้าเพื่อชำระเงิน
  selectedKeys: string[]
  toggleSelection: (product_id: string, size?: string) => void
  toggleAll: () => void
  checkoutItems: CartItem[]
  checkoutTotal: number
  clearPurchasedItems: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // ฟังก์ชันสร้าง Key เฉพาะตัวให้แต่ละสินค้า+ไซซ์
  const getItemKey = (id: string, size?: string) => `${id}-${size || ''}`

  useEffect(() => {
    const savedCart = localStorage.getItem('samo_cart')
    if (savedCart) {
      try { 
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart) 
        // ค่าเริ่มต้น: เมื่อโหลดตะกร้า ให้ติ๊กเลือกสินค้าทุกชิ้นอัตโนมัติ
        setSelectedKeys(parsedCart.map((item: CartItem) => getItemKey(item.product_id, item.size)))
      } catch (e) { console.error(e) }
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('samo_cart', JSON.stringify(cart))
    }
  }, [cart, isInitialized])

  const addToCart = (product: CartItem) => {
    const key = getItemKey(product.product_id, product.size)
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product_id === product.product_id && item.size === product.size
      )
      if (existingItemIndex >= 0) {
        const newCart = [...prevCart]
        newCart[existingItemIndex].quantity += product.quantity
        return newCart
      } else {
        return [...prevCart, product]
      }
    })
    // เมื่อหยิบของลงตะกร้า ให้ติ๊กเลือกชิ้นนั้นให้เลย
    if (!selectedKeys.includes(key)) setSelectedKeys(prev => [...prev, key])
  }

  const removeFromCart = (product_id: string, size?: string) => {
    const key = getItemKey(product_id, size)
    setCart((prevCart) => prevCart.filter((item) => getItemKey(item.product_id, item.size) !== key))
    setSelectedKeys((prev) => prev.filter((k) => k !== key))
  }

  const updateQuantity = (product_id: string, quantity: number, size?: string) => {
    if (quantity < 1) return
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === product_id && item.size === size ? { ...item, quantity: quantity } : item
      )
    )
  }

  // --- ระบบจัดการ Checkbox ---
  const toggleSelection = (product_id: string, size?: string) => {
    const key = getItemKey(product_id, size)
    setSelectedKeys((prev) => 
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleAll = () => {
    if (selectedKeys.length === cart.length) {
      setSelectedKeys([]) // เอาติ๊กออกทั้งหมด
    } else {
      setSelectedKeys(cart.map((item) => getItemKey(item.product_id, item.size))) // ติ๊กทั้งหมด
    }
  }

  // ตัวแปรสำหรับส่งไปหน้าชำระเงิน (เฉพาะที่ถูกเลือก)
  const checkoutItems = cart.filter((item) => selectedKeys.includes(getItemKey(item.product_id, item.size)))
  const checkoutTotal = checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0)

  // ล้างตะกร้าเฉพาะชิ้นที่ถูกซื้อไปแล้ว
  const clearPurchasedItems = () => {
    setCart((prevCart) => prevCart.filter((item) => !selectedKeys.includes(getItemKey(item.product_id, item.size))))
    setSelectedKeys([])
  }

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, 
      selectedKeys, toggleSelection, toggleAll, checkoutItems, checkoutTotal, clearPurchasedItems 
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) throw new Error('useCart must be used within a CartProvider')
  return context
}