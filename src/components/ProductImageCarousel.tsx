// src/components/ProductImageCarousel.tsx
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import clsx from 'clsx'

export default function ProductImageCarousel({ images, alt }: { images: string[], alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // ฟังก์ชันกดเลื่อนภาพถัดไป
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault() // ป้องกันไม่ให้ทะลุไปกด Link หลัก
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  // ฟังก์ชันกดเลื่อนภาพย้อนกลับ
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // เลื่อนรูปอัตโนมัติเมื่อเอาเมาส์ชี้ (Auto Slide)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }, 1500) // สลับรูปทุกๆ 1.5 วินาที
    }
    return () => clearInterval(interval)
  }, [isHovered, images.length])

  // กรณีไม่มีรูป
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 font-medium bg-gray-50">
        <ImageOff className="w-8 h-8 mb-2 opacity-30" />
        <span className="text-sm">ไม่มีรูปภาพ</span>
      </div>
    )
  }

  // กรณีมีรูปเดียว (ไม่ต้องมีปุ่มเลื่อน)
  if (images.length === 1) {
    return (
      <img 
        src={images[0]} 
        alt={alt} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
      />
    )
  }

  // กรณีมีหลายรูป (Carousel)
  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-gray-50 group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container สำหรับสไลด์ */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <img 
            key={idx} 
            src={img} 
            alt={`${alt} - รูปที่ ${idx + 1}`} 
            className="w-full h-full flex-shrink-0 object-cover" 
          />
        ))}
      </div>

      {/* ปุ่มซ้าย/ขวา (จะโผล่มาแค่ตอน Hover) */}
      <button 
        onClick={prevImage} 
        className={clsx(
          "absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-900 p-1.5 rounded-full shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white z-10",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button 
        onClick={nextImage} 
        className={clsx(
          "absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-900 p-1.5 rounded-full shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white z-10",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* จุดบอกตำแหน่ง (Dots) */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
        {images.map((_, idx) => (
          <div 
            key={idx} 
            className={clsx(
              "h-1.5 rounded-full transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.5)]", 
              currentIndex === idx ? "w-4 bg-white" : "w-1.5 bg-white/60"
            )} 
          />
        ))}
      </div>
    </div>
  )
}