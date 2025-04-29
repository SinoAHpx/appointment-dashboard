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

const loginSchema = z.object({
    username: z.string().min(2, {
        message: '用户名至少需要2个字符',
    }),
    password: z.string().min(6, {
        message: '密码至少需要6个字符',
    }),
})

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuthStore()
    const router = useRouter()

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true)

        try {
            const success = await login(values.username, values.password)

            if (success) {
                toast('登录成功', {
                    description: `欢迎回来，${values.username}`,
                })
                router.push('/')
            } else {
                toast("登录失败", {
                    description: '用户名或密码不正确',
                })
            }
        } catch (error) {
            toast(`登录失败：${error}`, {

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
                    <CardTitle className="text-2xl font-bold text-center">欢迎登录</CardTitle>
                    <CardDescription className="text-center">
                        请输入您的用户名和密码
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
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? '登录中...' : '登录'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        还没有账号？{' '}
                        <Link href="/register" className="font-medium text-primary hover:underline">
                            立即注册
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
} 