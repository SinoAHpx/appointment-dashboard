'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        toast('已退出登录')
        router.push('/login')
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold">预约管理系统</h1>
                    <Button variant="outline" onClick={handleLogout}>退出登录</Button>
                </div>
            </header>
            <main className="flex-1 bg-gray-50">
                {children}
            </main>
        </div>
    )
} 