'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

interface AuthWrapperProps {
    children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const { isAuthenticated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, router])

    // 如果用户未认证，返回空内容（避免闪烁）
    if (!isAuthenticated) {
        return null
    }

    // 已认证的用户，渲染子组件
    return <>{children}</>
} 