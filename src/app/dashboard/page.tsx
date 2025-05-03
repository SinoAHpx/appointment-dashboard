'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { CalendarDays, Users, Car, UserCircle, BarChart3, Clock } from 'lucide-react'

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

    const isAdmin = user?.role === 'admin'

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">欢迎回来, {user?.username || '用户'}</h1>
                <p className="text-muted-foreground">查看并管理您的预约系统</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总预约数</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                        <p className="text-xs text-muted-foreground">
                            较上周增长 +12%
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今日预约</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">
                            其中 2 个待确认
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">工作人员</CardTitle>
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">
                            平均评分 4.8/5
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">车辆</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">
                            可用 20 辆
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>预约管理</CardTitle>
                        <CardDescription>
                            管理您的预约记录
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <span>今日预约</span>
                                <span className="font-medium">8</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>待确认预约</span>
                                <span className="font-medium">3</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>即将到期预约</span>
                                <span className="font-medium">5</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/dashboard/appointments">
                                查看所有预约
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>

                {isAdmin && (
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>客户管理</CardTitle>
                            <CardDescription>
                                管理您的客户信息
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>总客户数</span>
                                    <span className="font-medium">86</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>本月新客户</span>
                                    <span className="font-medium">12</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>活跃客户</span>
                                    <span className="font-medium">42</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/dashboard/users">
                                    查看所有客户
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {isAdmin && (
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>人员管理</CardTitle>
                            <CardDescription>
                                管理您的员工信息
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>总员工数</span>
                                    <span className="font-medium">12</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>当前在线</span>
                                    <span className="font-medium">8</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>本周休假</span>
                                    <span className="font-medium">2</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/dashboard/staff">
                                    查看所有员工
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>

            {isAdmin && (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>车辆管理</CardTitle>
                            <CardDescription>
                                管理您的车辆信息
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>总车辆数</span>
                                    <span className="font-medium">24</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>可用车辆</span>
                                    <span className="font-medium">20</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>维修中</span>
                                    <span className="font-medium">4</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/dashboard/vehicles">
                                    查看所有车辆
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>数据报表</CardTitle>
                            <CardDescription>
                                查看分析报表和统计数据
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>本月预约数</span>
                                    <span className="font-medium">128</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>客户满意度</span>
                                    <span className="font-medium">4.7/5</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>月度收益</span>
                                    <span className="font-medium">¥42,580</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/dashboard/reports">
                                    查看所有报表
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    )
} 