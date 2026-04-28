import { type NextRequest } from 'next/server'
    import { updateSession } from '@/utils/supabase/middleware'

    export async function middleware(request: NextRequest) {
      return await updateSession(request)
    }

    export const config = {
      matcher: [
        /*
         * กำหนดให้ Middleware ทำงานทุกเส้นทาง 
         * ยกเว้นพวกไฟล์ระบบ รูปภาพ หรือไฟล์นามสกุลต่างๆ เพื่อไม่ให้เปลืองทรัพยากร
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      ],
    }