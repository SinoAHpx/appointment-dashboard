'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

const registerSchema = z.object({
    username: z.string().min(2, {
        message: '用户名至少需要2个字符',
    }),
    email: z.string().email({
        message: '请输入有效的电子邮箱地址',
    }),
    password: z.string().min(6, {
        message: '密码至少需要6个字符',
    }),
    confirmPassword: z.string().min(6, {
        message: '确认密码至少需要6个字符',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不匹配",
    path: ["confirmPassword"],
})

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuthStore()
    const router = useRouter()

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        setIsLoading(true)

        try {
            // 模拟注册过程，实际项目中替换为API调用
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 注册成功后自动登录
            const success = await login(values.username, values.password)

            if (success) {
                toast('注册成功', {
                    description: `欢迎加入，${values.username}`,
                })
                router.push('/')
            } else {
                toast('登录失败', {
                    description: '注册成功但自动登录失败，请尝试手动登录',
                })
                router.push('/login')
            }
        } catch (error) {
            toast('注册失败', {
                description: '请稍后再试',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/next.svg"
                            alt="Logo"
                            width={120}
                            height={30}
                            className="dark:invert"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">注册账号</CardTitle>
                    <CardDescription className="text-center">
                        创建一个新账号以使用预约系统
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>用户名</FormLabel>
                                        <FormControl>
                                            <Input placeholder="请输入用户名" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>电子邮箱</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="请输入电子邮箱" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>密码</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="请输入密码" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>确认密码</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="请再次输入密码" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? '注册中...' : '注册'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        已有账号？{' '}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            立即登录
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
} 