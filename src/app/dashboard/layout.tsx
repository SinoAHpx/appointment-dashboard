'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import {
    Calendar,
    Users,
    Briefcase,
    Car,
    FileSearch,
    Home
} from 'lucide-react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { logout } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = () => {
        logout()
        toast('已退出登录')
        router.push('/login')
    }

    const navItems = [
        { name: '仪表盘', path: '/dashboard', icon: Home },
        { name: '预约管理', path: '/dashboard/appointments', icon: Calendar },
        { name: '用户管理', path: '/dashboard/users', icon: Users },
        { name: '人员管理', path: '/dashboard/staff', icon: Briefcase },
        { name: '车辆管理', path: '/dashboard/vehicles', icon: Car },
        { name: '数据查询', path: '/dashboard/reports', icon: FileSearch },
    ]

    return (
        <div className="flex min-h-screen flex-col">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold">预约管理系统</h1>
                    <Button variant="outline" onClick={handleLogout}>退出登录</Button>
                </div>
            </header>
            <div className="flex flex-1">
                <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.path
                                return (
                                    <li key={item.path}>
                                        <Link
                                            href={item.path}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>
                </aside>
                <main className="flex-1 bg-gray-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
} 