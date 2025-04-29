'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'

export default function DashboardPage() {
    const { isAuthenticated, user } = useAuthStore()
    const router = useRouter()

    // 如果用户未登录，重定向到登录页面
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

            <Card>
                <CardHeader>
                    <CardTitle>欢迎, {user?.username || '用户'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>这是您的仪表盘页面。</p>
                </CardContent>
            </Card>
        </div>
    )
} 