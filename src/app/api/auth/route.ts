import { NextResponse } from 'next/server'
import users from '@/lib/users.json'

// 登录API路由
export async function POST(request: Request) {
    try {
        // 解析请求体
        const body = await request.json()
        const { username, password } = body

        // 验证请求
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: '用户名和密码必填' },
                { status: 400 }
            )
        }

        // 在用户列表中查找
        const user = users.find(u =>
            u.username === username && u.password === password
        )

        // 如果未找到用户
        if (!user) {
            return NextResponse.json(
                { success: false, message: '用户名或密码错误' },
                { status: 401 }
            )
        }

        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        })
    } catch (error) {
        console.error('登录过程发生错误:', error)
        return NextResponse.json(
            { success: false, message: '服务器错误' },
            { status: 500 }
        )
    }
} 